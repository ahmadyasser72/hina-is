import { createHash, type BinaryLike } from "node:crypto";
import path from "node:path";

import { CACHE_DIR } from ".";

export const unwrap = <T>({ jp, en }: { jp: T; en: T | null }) => (en ?? jp)!;
export const unwrapTuple = <T>([jp, en]: (T | null)[]) => (jp ?? en)!;

export const getOutputFile = async ({
	script,
	version,
	name,
	extension,
}: Record<"script" | "version" | "name" | "extension", string>) =>
	Bun.file(
		path.join(CACHE_DIR, [name, `${script}@${version}`, extension].join(".")),
	);

export const hashBuffer = (...buffers: (BinaryLike | ArrayBuffer)[]) =>
	buffers
		.reduce(
			(hash, next) =>
				hash.update(next instanceof ArrayBuffer ? Buffer.from(next) : next),
			createHash("sha512"),
		)
		.digest("hex")
		.slice(0, 6);

export const fileResponse = (file: Bun.BunFile) =>
	new Response(file, {
		headers: {
			"content-type": file.type,
			"content-length": file.size.toString(),
		},
	});
