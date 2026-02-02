import path from "node:path";

import { CACHE_DIR, IMAGE_FORMAT, MAX_IMAGE_WIDTH } from "./config";

export const compressImage = async (
	filename: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const ext = path.extname(filename);
	if (ext === ".svg")
		return new Response(buffer, {
			headers: { "content-type": "image/svg+xml" },
		});

	const outputFile = Bun.file(path.join(CACHE_DIR, filename));

	const alreadyCompressed = await outputFile.exists();
	if (alreadyCompressed) return new Response(await outputFile.arrayBuffer());

	const { default: sharp } = await import("sharp");
	const compressed = await sharp(buffer)
		.resize({
			width: MAX_IMAGE_WIDTH,
			withoutEnlargement: true,
			kernel: "mks2021",
		})
		[IMAGE_FORMAT]({ quality: 67, effort: 4 })
		.toBuffer();
	outputFile.write(compressed);

	return new Response(compressed as Buffer<ArrayBuffer>, {
		headers: { "content-type": "image/avif" },
	});
};
