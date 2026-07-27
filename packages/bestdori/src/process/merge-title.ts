import { writeFile } from "fs/promises";

import { exists } from "..";
import { IMAGE_FORMAT } from "../constants";
import { fileResponse, getOutputFile } from "../utilities";

export const mergeTitleImages = async (
	name: string,
	baseImage: string,
	...layers: string[]
) => {
	if (layers.length === 0) return fileResponse(baseImage);

	const outputPath = await getOutputFile({
		script: "title",
		version: "20260501",
		name,
		extension: IMAGE_FORMAT,
	});

	const alreadyExists = await exists(outputPath);
	if (alreadyExists) return fileResponse(outputPath);

	const { default: sharp } = await import("sharp");
	const merged = await sharp(baseImage)
		.composite(layers.map((path) => ({ input: path, left: 0, top: 0 })))
		[IMAGE_FORMAT]()
		.toBuffer();
	await writeFile(outputPath, merged);

	return fileResponse(outputPath);
};
