import { exec } from "node:child_process";
import { exists, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { limitFunction } from "p-limit";

const getGitRootPath = () =>
	new Promise<string>((resolve, reject) => {
		exec("git rev-parse --show-toplevel", (error, stdout) =>
			error ? reject(error) : resolve(stdout.trim()),
		);
	});

const CACHE_DIRNAME = ".bestdori-cache";
export const BASE_CACHE_DIR = await (async () => {
	const gitRoot = await getGitRootPath();
	const baseDir = path.join(gitRoot, CACHE_DIRNAME);

	const baseDirExists = await exists(baseDir);
	if (!baseDirExists) await mkdir(baseDir);
	return baseDir;
})();

const CACHE_DIR = await (async () => {
	const cacheDir = path.join(BASE_CACHE_DIR, "responses");

	const cacheDirExists = await exists(cacheDir);
	if (!cacheDirExists) await mkdir(cacheDir);
	return cacheDir;
})();

const fetch = limitFunction(globalThis.fetch, { concurrency: 4 });

export const bestdori = async <T = never>(
	pathname: string,
	skipFetch: ((cached: T) => boolean) | boolean,
): Promise<Response> => {
	const url = new URL(pathname, "https://bestdori.com");

	const cachePath = path.join(CACHE_DIR, pathname.replaceAll("/", "_"));
	const alreadyCached = await exists(cachePath);
	if (skipFetch !== false && alreadyCached) {
		const cached = await readFile(cachePath);
		if (skipFetch === true || skipFetch(JSON.parse(cached.toString())))
			return new Response(cached);
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
	await writeFile(cachePath, Buffer.from(data));

	return response;
};

export const bestdoriJSON = <T = unknown>(
	...args: Parameters<typeof bestdori<T>>
) => bestdori(...args).then((response) => response.json() as Promise<T>);
