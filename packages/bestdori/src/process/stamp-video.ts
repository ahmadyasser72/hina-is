import { spawnSync } from "node:child_process";

import { exists } from "..";
import { fileResponse, getOutputFile } from "../utilities";
import { STAMP_VIDEO_FORMAT } from "./constants";

export const createStampVideo = async (
	name: string,
	image: string,
	audio: string,
) => {
	const outputPath = await getOutputFile({
		script: "stamp-video",
		version: "20260416",
		name,
		extension: STAMP_VIDEO_FORMAT,
	});

	const alreadyExists = await exists(outputPath);
	if (alreadyExists) return fileResponse(outputPath);

	const { default: sharp } = await import("sharp");
	const imageWithBackground = await sharp(image)
		.flatten({ background: "#FFF" })
		.toBuffer();

	const ffmpeg = spawnSync(
		"ffmpeg",
		[
			"-y",
			"-loop",
			"1",
			"-i",
			"pipe:0",
			"-i",
			audio,
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
			outputPath,
		],
		{ input: imageWithBackground },
	);
	if (ffmpeg.status !== 0) {
		const error = ffmpeg.stderr.toString();
		throw new Error(`failed to create stamp-video (${name})\n${error}`);
	}

	return fileResponse(outputPath);
};
