import path from "node:path";

import { CACHE_DIR } from "./config";
import { AUDIO_BITRATE, AUDIO_FORMAT } from "./constants";

export const compressAudio = async (
	cacheName: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = Bun.file(path.join(CACHE_DIR, cacheName));

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
	if (exitCode !== 0)
		throw new Error(`failed to compress audio (${cacheName})`);

	const compressed = await new Response(ffmpeg.stdout).arrayBuffer();
	await outputFile.write(compressed);

	return new Response(compressed, {
		headers: { "content-type": "audio/ogg" },
	});
};
