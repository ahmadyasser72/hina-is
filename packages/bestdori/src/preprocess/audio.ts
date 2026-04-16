import { fileResponse, getOutputFile } from "../utilities";
import { AUDIO_BITRATE, AUDIO_FORMAT } from "./constants";

export const compressAudio = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = await getOutputFile({
		script: import.meta.filename,
		version: "20260416",
		name,
		extension: AUDIO_FORMAT,
	});

	const alreadyExists = await outputFile.exists();
	if (alreadyExists) return fileResponse(outputFile);

	const ffmpeg = Bun.spawn(
		[
			"ffmpeg",
			"-y",
			"-i",
			"pipe:0",
			"-c:a",
			"libopus",
			"-b:a",
			AUDIO_BITRATE,
			"-f",
			AUDIO_FORMAT,
			outputFile.name!,
		],
		{ stdin: buffer, stdout: "ignore", stderr: "pipe" },
	);

	const exitCode = await ffmpeg.exited;
	if (exitCode !== 0) {
		const error = await ffmpeg.stderr.text();
		throw new Error(`failed to compress audio (${name})\n${error}`);
	}

	return fileResponse(outputFile);
};
