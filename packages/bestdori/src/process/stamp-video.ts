import { fileResponse, getOutputFile } from "../utilities";
import { STAMP_VIDEO_FORMAT } from "./constants";

export const createStampVideo = async (
	name: string,
	image: Bun.BunFile,
	audio: Bun.BunFile,
) => {
	const outputFile = await getOutputFile({
		script: "stamp-video",
		version: "20260416",
		name,
		extension: STAMP_VIDEO_FORMAT,
	});

	const alreadyExists = await outputFile.exists();
	if (alreadyExists) return fileResponse(outputFile);

	const { default: sharp } = await import("sharp");
	const imageWithBackground = await sharp(image.name)
		.flatten({ background: "#FFF" })
		.toBuffer();

	const ffmpeg = Bun.spawn(
		[
			"ffmpeg",
			"-y",
			"-loop",
			"1",
			"-i",
			"pipe:0",
			"-i",
			audio.name!,
			"-c:v",
			"libx264",
			"-vf",
			"scale=trunc(iw/2)*2:trunc(ih/2)*2",
			"-c:a",
			"copy",
			"-pix_fmt",
			"yuv420p",
			"-shortest",
			"-f",
			STAMP_VIDEO_FORMAT,
			outputFile.name!,
		],
		{ stdin: imageWithBackground, stdout: "ignore", stderr: "pipe" },
	);

	const exitCode = await ffmpeg.exited;
	if (exitCode !== 0) {
		const error = await ffmpeg.stderr.text();
		throw new Error(`failed to create stamp-video (${name})\n${error}`);
	}

	return fileResponse(outputFile);
};
