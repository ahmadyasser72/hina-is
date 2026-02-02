import { exists, mkdir } from "node:fs/promises";
import path from "node:path";
import { BASE_CACHE_DIR } from "@hina-is/bestdori";

export const CACHE_DIR = await (async () => {
	const cacheDir = path.join(BASE_CACHE_DIR, "compressed");

	const cacheDirExists = await exists(cacheDir);
	if (!cacheDirExists) await mkdir(cacheDir);
	return cacheDir;
})();

export const MAX_IMAGE_WIDTH = 600;
export const IMAGE_FORMAT = "avif";

export const AUDIO_BITRATE = "64k";
export const AUDIO_FORMAT = "opus";
