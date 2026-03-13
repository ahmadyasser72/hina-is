import path from "node:path";
import { BASE_CACHE_DIR, createDirectoryIfNotExists } from "@hina-is/bestdori";

export const CACHE_DIR = await createDirectoryIfNotExists(
	path.join(BASE_CACHE_DIR, "compressed"),
);
