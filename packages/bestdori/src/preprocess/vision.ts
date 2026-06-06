import { fileResponse, getOutputFile } from "../utilities";
import { MAX_IMAGE_WIDTH } from "./constants";

export const optimizeForVisionAPI = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = await getOutputFile({
		script: "vision-optimize",
		version: "20260606",
		name,
		extension: "jpg",
	});

	const alreadyExists = await outputFile.exists();
	if (alreadyExists) return fileResponse(outputFile);

	const { default: sharp } = await import("sharp");
	const optimized = await sharp(buffer)
		.flatten({ background: { r: 255, g: 255, b: 255 } })
		.resize({
			width: MAX_IMAGE_WIDTH,
			height: MAX_IMAGE_WIDTH,
			fit: "inside",
			withoutEnlargement: true,
			kernel: "mks2021",
		})
		.jpeg({ quality: 80, effort: 6, progressive: true })
		.toBuffer();

	outputFile.write(optimized);

	return new Response(optimized as Buffer<ArrayBuffer>, {
		headers: {
			"content-type": "image/jpeg",
			"content-length": optimized.byteLength.toString(),
		},
	});
};