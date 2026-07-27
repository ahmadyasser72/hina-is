import { writeFile } from "fs/promises";

import { exists } from "..";
import { fileResponse, getOutputFile } from "../utilities";
import { IMAGE_FORMAT, MAX_IMAGE_WIDTH } from "./constants";

export const compressImage = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputPath = await getOutputFile({
		script: "image",
		version: "20260416",
		name,
		extension: IMAGE_FORMAT,
	});

	const alreadyExists = await exists(outputPath);
	if (alreadyExists) return fileResponse(outputPath);

	const { default: sharp } = await import("sharp");
	const compressed = await sharp(buffer)
		.resize({
			width: MAX_IMAGE_WIDTH,
			withoutEnlargement: true,
			kernel: "mks2021",
		})
		[IMAGE_FORMAT]({ quality: 67, effort: 6 })
		.toBuffer();
	await writeFile(outputPath, compressed);

	return fileResponse(outputPath);
};
