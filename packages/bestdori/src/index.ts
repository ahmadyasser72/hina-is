import { exec } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { limitAsync } from "es-toolkit";

export const createDirectoryIfNotExists = async (path: string) =>
	mkdir(path, { recursive: true }).then(() => path);

export const GIT_ROOT_PATH = await new Promise<string>((resolve, reject) => {
	exec("git rev-parse --show-toplevel", (error, stdout) =>
		error ? reject(error) : resolve(stdout.trim()),
	);
});

export const BASE_CACHE_DIR = await createDirectoryIfNotExists(
	path.join(GIT_ROOT_PATH, ".bestdori-cache"),
);

const CACHE_DIR = await createDirectoryIfNotExists(
	path.join(BASE_CACHE_DIR, "responses"),
);

const fetch = limitAsync(globalThis.fetch, 4);

export const bestdori = async <T = never>(
	pathname: string,
	skipFetch: ((cached: T) => boolean) | boolean,
): Promise<Response> => {
	const url = new URL(pathname, "https://bestdori.com");

	const outputFile = Bun.file(
		path.join(CACHE_DIR, pathname.replaceAll("/", "_")),
	);
	const alreadyCached = await outputFile.exists();
	if (
		alreadyCached &&
		(skipFetch === true ||
			(typeof skipFetch === "function" && skipFetch(await outputFile.json())))
	) {
		const response = new Response(outputFile);
		Object.defineProperty(response, "url", { value: url.href });
		return response;
	}

	const response = await fetch(url);
	const isHTML = response.headers.get("content-type") === "text/html";
	if (!response.ok || isHTML) {
		if (pathname.startsWith("/assets/en/"))
			return bestdori(pathname.replace("en", "jp"), skipFetch);
		else if (pathname.startsWith("/assets/jp"))
			return bestdori(pathname.replace("jp", "cn"), skipFetch);

		throw new Error(`request to ${url.href} failed`);
	}

	const data = await response.clone().arrayBuffer();
	await outputFile.write(data);

	return response;
};

export const bestdoriJSON = <T = unknown>(
	...args: Parameters<typeof bestdori<T>>
) => bestdori(...args).then((response) => response.json() as Promise<T>);
