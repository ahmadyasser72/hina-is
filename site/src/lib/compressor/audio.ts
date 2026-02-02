import path from "node:path";

import { AUDIO_BITRATE, AUDIO_FORMAT, CACHE_DIR } from "./config";

export const compressAudio = async (
	filename: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = Bun.file(path.join(CACHE_DIR, filename));

	const alreadyCompressed = await outputFile.exists();
	if (alreadyCompressed) return new Response(await outputFile.arrayBuffer());

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
		{ stdin: buffer, stdout: "pipe", stderr: "ignore" },
	);

	const exitCode = await ffmpeg.exited;
	if (exitCode !== 0) throw new Error(`failed to compress audio (${filename})`);

	const compressed = await new Response(ffmpeg.stdout).arrayBuffer();
	await outputFile.write(compressed);

	return new Response(compressed, {
		headers: { "content-type": "audio/ogg" },
	});
};
