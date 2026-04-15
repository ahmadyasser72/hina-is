import { fileResponse, getOutputFile } from "../utilities";
import { AUDIO_BITRATE, AUDIO_FORMAT, AUDIO_FORMAT_MIME } from "./constants";

export const compressAudio = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = await getOutputFile({
		script: import.meta.filename,
		name,
		extension: AUDIO_FORMAT,
	});

	const alreadyExists = await outputFile.exists();
	if (alreadyExists) return fileResponse(outputFile);

	const ffmpeg = Bun.spawn(
		[
			"ffmpeg",
			"-i",
			"pipe:0",
			"-c:a",
			"libopus",
			"-b:a",
			AUDIO_BITRATE,
			"-f",
			AUDIO_FORMAT,
			"pipe:1",
		],
		{ stdin: buffer, stdout: "pipe", stderr: "pipe" },
	);

	const exitCode = await ffmpeg.exited;
	if (exitCode !== 0) {
		const error = await ffmpeg.stderr.text();
		throw new Error(`failed to compress audio (${name})\n${error}`);
	}

	const compressed = await new Response(ffmpeg.stdout).arrayBuffer();
	await outputFile.write(compressed);

	return new Response(compressed, {
		headers: {
			"content-type": AUDIO_FORMAT_MIME,
			"content-length": compressed.byteLength.toString(),
		},
	});
};
