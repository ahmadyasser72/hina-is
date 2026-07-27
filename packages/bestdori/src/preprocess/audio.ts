import { spawnSync } from "node:child_process";

import { exists } from "..";
import { fileResponse, getOutputFile } from "../utilities";
import { AUDIO_BITRATE, AUDIO_FORMAT } from "./constants";

export const compressAudio = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputPath = await getOutputFile({
		script: "audio",
		version: "20260416",
		name,
		extension: AUDIO_FORMAT,
	});

	const alreadyExists = await exists(outputPath);
	if (alreadyExists) return fileResponse(outputPath);

	const ffmpeg = spawnSync(
		"ffmpeg",
		[
			"-y",
			"-i",
			"pipe:0",
			"-c:a",
			"libopus",
			"-b:a",
			AUDIO_BITRATE,
			"-f",
			AUDIO_FORMAT,
			outputPath,
		],
		{ input: buffer },
	);

	if (ffmpeg.status !== 0) {
		const error = ffmpeg.stderr.toString();
		throw new Error(`failed to compress audio (${name})\n${error}`);
	}

	return fileResponse(outputPath);
};
