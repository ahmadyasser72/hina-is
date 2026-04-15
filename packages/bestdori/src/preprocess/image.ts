import { fileResponse, getOutputFile } from "../utilities";
import { IMAGE_FORMAT, IMAGE_FORMAT_MIME, MAX_IMAGE_WIDTH } from "./constants";

export const compressImage = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = await getOutputFile({
		script: import.meta.filename,
		name,
		extension: IMAGE_FORMAT,
	});

	const alreadyExists = await outputFile.exists();
	if (alreadyExists) return fileResponse(outputFile);

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
