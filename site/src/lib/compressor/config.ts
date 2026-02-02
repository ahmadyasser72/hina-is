import { exists, mkdir } from "node:fs/promises";
import path from "node:path";
import { BASE_CACHE_DIR } from "@hina-is/bestdori";

export const CACHE_DIR = await (async () => {
	const cacheDir = path.join(BASE_CACHE_DIR, "compressed");

	const cacheDirExists = await exists(cacheDir);
	if (!cacheDirExists) await mkdir(cacheDir);
	return cacheDir;
})();
