import path from "node:path";

import { CACHE_DIR } from "..";
import { IMAGE_FORMAT, IMAGE_FORMAT_MIME, MAX_IMAGE_WIDTH } from "./constants";

export const compressImage = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = Bun.file(
		path.join(CACHE_DIR, [name, IMAGE_FORMAT].join(".")),
	);

	const alreadyCompressed = await outputFile.exists();
	if (alreadyCompressed) {
		return new Response(outputFile, {
			headers: {
				"content-type": IMAGE_FORMAT_MIME,
				"content-length": outputFile.size.toString(),
			},
		});
	}

	const { default: sharp } = await import("sharp");
	const compressed = await sharp(buffer)
		.resize({
			width: MAX_IMAGE_WIDTH,
			withoutEnlargement: true,
			kernel: "mks2021",
		})
		[IMAGE_FORMAT]({ quality: 67, effort: 6 })
		.toBuffer();
	outputFile.write(compressed);

	return new Response(compressed as Buffer<ArrayBuffer>, {
		headers: {
			"content-type": IMAGE_FORMAT_MIME,
			"content-length": compressed.byteLength.toString(),
		},
	});
};
