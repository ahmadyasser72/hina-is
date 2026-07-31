import { createHash, type BinaryLike } from "node:crypto";
import { openAsBlob } from "node:fs";
import path from "node:path";

import mime from "mime-types";

import { CACHE_DIR } from ".";

export const unwrap = <T>({ jp, en }: { jp: T; en: T | null }) => (en ?? jp)!;
export const unwrapTuple = <T>([jp, en, , cn]: (T | null)[]) =>
	(en ?? jp ?? cn)!;

export const getOutputFile = async ({
	script,
	version,
	name,
	extension,
}: Record<"script" | "version" | "name" | "extension", string>) =>
	path.join(CACHE_DIR, [name, `${script}@${version}`, extension].join("."));

export const hashBuffer = (...buffers: (BinaryLike | ArrayBuffer)[]) =>
	buffers
		.reduce(
			(hash, next) =>
				hash.update(next instanceof ArrayBuffer ? Buffer.from(next) : next),
			createHash("sha512"),
		)
		.digest("hex")
		.slice(0, 6);

export const fileResponse = async (path: string): Promise<Response> => {
	const blob = await openAsBlob(path);
	return new Response(blob, {
		headers: {
			"content-type": mime.lookup(path) || "application/octet-stream",
			"content-length": blob.size.toString(),
		},
	});
};
