import { exec } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { limitAsync, retry } from "es-toolkit";

import { compressAudio } from "./preprocess/audio";
import {
	AUDIO_FORMAT_ORIGINAL,
	IMAGE_FORMAT_ORIGINAL,
} from "./preprocess/constants";
import { compressImage } from "./preprocess/image";
import { fileResponse, hashBuffer } from "./utilities";

export const createDirectoryIfNotExists = async (path: string) =>
	mkdir(path, { recursive: true }).then(() => path);

export const GIT_ROOT_PATH = await new Promise<string>((resolve, reject) => {
	exec("git rev-parse --show-toplevel", (error, stdout) =>
		error ? reject(error) : resolve(stdout.trim()),
	);
});

export const CACHE_DIR = await createDirectoryIfNotExists(
	path.join(GIT_ROOT_PATH, ".bestdori-cache"),
);

type BestdoriErrorKind = "rate-limit" | "not-found";
class BestdoriError extends Error {
	kind: BestdoriErrorKind;

	constructor(kind: BestdoriErrorKind, response: Response) {
		super(
			`error fetching bestdori: ${new URL(response.url).pathname} -> ${kind} (${response.status} ${response.statusText})`,
		);
		this.kind = kind;
	}
}

const fetchBestdori: (
	pathname: string,
	isFallback?: boolean,
) => Promise<Response> = limitAsync(async (pathname, isFallback = false) => {
	const url = new URL(pathname, "https://bestdori.com");
	return retry(
		async () => {
			const response = await fetch(url);
			if (!response.ok) throw new BestdoriError("rate-limit", response);

			const isHTML = response.headers.get("content-type") === "text/html";
			if (!isHTML) return response;

			const pathname = url.pathname;
			if (!isFallback && pathname.startsWith("/assets/en/"))
				return fetchBestdori(pathname.replace("en", "jp"), true);
			else if (!isFallback && pathname.startsWith("/assets/jp"))
				return fetchBestdori(pathname.replace("jp", "en"), true);

			throw new BestdoriError("not-found", response);
		},
		{
			retries: 4,
			delay: (attempts) => 2 ** (Math.max(attempts, 2) + Math.random()) * 1000,
			shouldRetry: (error) =>
				error instanceof BestdoriError && error.kind === "rate-limit",
		},
	);
}, 4);

export const bestdori = async <T = never>(
	pathname: string,
	useCachedIf: ((cached: T) => boolean) | boolean,
) => {
	const cacheName = pathname.slice(1).replaceAll("/", "_");
	const cacheFile = Bun.file(path.join(CACHE_DIR, cacheName));

	const cacheExists = await cacheFile.exists();
	const useCache =
		cacheExists &&
		(useCachedIf === true ||
			(typeof useCachedIf === "function" &&
				useCachedIf(await cacheFile.json())));

	let response: Response;
	if (useCache) {
		response = fileResponse(cacheFile);
	} else {
		response = await fetchBestdori(pathname);
	}

	const data = await response.arrayBuffer();
	if (!useCache) await cacheFile.write(data);

	let preprocess: typeof compressAudio | typeof compressImage;
	const extension = path.extname(pathname).slice(1);
	if (extension === AUDIO_FORMAT_ORIGINAL) preprocess = compressAudio;
	else if (extension === IMAGE_FORMAT_ORIGINAL) preprocess = compressImage;
	else {
		return {
			file: cacheFile,
			response: new Response(data, {
				headers: {
					"content-type": response.headers.get("content-type")!,
					"content-length": data.byteLength.toString(),
				},
			}),
		};
	}

	const hash = hashBuffer(data);
	return {
		file: cacheFile,
		response: await preprocess(
			[cacheName.replace(path.extname(cacheName), ""), hash].join("."),
			Buffer.from(data),
		),
	};
};

export const bestdoriJSON = <T = unknown>(
	...args: Parameters<typeof bestdori<T>>
) => bestdori(...args).then(({ response }) => response.json() as Promise<T>);
