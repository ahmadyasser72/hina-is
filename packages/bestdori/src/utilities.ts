import { createHash, type BinaryLike } from "node:crypto";
import path from "node:path";

import { memoize } from "es-toolkit";

import { CACHE_DIR } from ".";

export const unwrap = <T>({ jp, en }: { jp: T; en: T | null }) => (en ?? jp)!;

export const getOutputFile = async ({
	script,
	name,
	extension,
}: {
	script: string;
	name: string;
	extension: string;
}) => {
	const scriptHash = await hashFile(script);
	return Bun.file(
		path.join(CACHE_DIR, [name, scriptHash, extension].join(".")),
	);
};

export const hashFile = memoize(
	(filename: string) =>
		Bun.file(filename)
			.text()
			.then((text) => hashBuffer(text)),
	{ getCacheKey: (filename) => path.basename(filename) },
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
