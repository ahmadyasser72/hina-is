import path from "node:path";
import { BASE_CACHE_DIR } from "@hina-is/bestdori";
import { createDirectoryIfNotExists } from "@hina-is/bestdori/utilities";

export const CACHE_DIR = await createDirectoryIfNotExists(
	path.join(BASE_CACHE_DIR, "compressed"),
);
