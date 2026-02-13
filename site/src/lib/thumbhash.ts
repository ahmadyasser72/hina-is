import type { APIContext } from "astro";

export const generateThumbhash = async (
	buffer: Buffer<ArrayBuffer>,
): Promise<string> => {
	const { rgbaToThumbHash } = await import("thumbhash");
	const { default: sharp } = await import("sharp");

	const image = sharp(buffer).resize(100, 100, { fit: "inside" });
	const { data, info } = await image
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	const binaryThumbHash = rgbaToThumbHash(info.width, info.height, data);
	return Buffer.from(binaryThumbHash).toString("base64");
};

export const fetchThumbhashMap = async ({
	locals,
	url,
}: Pick<APIContext, "locals" | "url">): Promise<{
	get: (id: string) => string | undefined;
}> => {
	if (import.meta.env.DEV)
		return { get: (_) => "pCeGEoYPRQcki3alV2+v2DcmiXiAlxg=" };

	const thumbhashEntries = await locals.runtime.env.ASSETS.fetch(
		new URL("/thumbhash.json", url),
	).then((response) => response.json<[string, string][]>());
	return new Map(thumbhashEntries);
};
