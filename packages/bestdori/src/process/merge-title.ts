import { IMAGE_FORMAT, IMAGE_FORMAT_MIME } from "../constants";
import { fileResponse, getOutputFile } from "../utilities";

export const mergeTitleImages = async (
	name: string,
	baseImage: Bun.BunFile,
	...layers: Bun.BunFile[]
) => {
	if (layers.length === 0) return fileResponse(baseImage);

	const outputFile = await getOutputFile({
		script: "title",
		version: "20260501",
		name,
		extension: IMAGE_FORMAT,
	});

	const alreadyExists = await outputFile.exists();
	if (alreadyExists) return fileResponse(outputFile);

	const { default: sharp } = await import("sharp");
	const merged = await sharp(await baseImage.arrayBuffer())
		.composite(
			(
				await Promise.all(
					layers.map((layer) => layer.arrayBuffer().then(Buffer.from)),
				)
			).map((buffer) => ({ input: buffer, left: 0, top: 0 })),
		)
		[IMAGE_FORMAT]()
		.toBuffer();
	outputFile.write(merged);

	return new Response(merged as Buffer<ArrayBuffer>, {
		headers: {
			"content-type": IMAGE_FORMAT_MIME,
			"content-length": merged.byteLength.toString(),
		},
	});
};
