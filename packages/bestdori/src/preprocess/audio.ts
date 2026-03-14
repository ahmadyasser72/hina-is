import path from "node:path";

import { CACHE_DIR } from "..";
import { AUDIO_BITRATE, AUDIO_FORMAT, AUDIO_FORMAT_MIME } from "./constants";

export const compressAudio = async (
	name: string,
	buffer: Buffer<ArrayBuffer>,
): Promise<Response> => {
	const outputFile = Bun.file(
		path.join(CACHE_DIR, [name, AUDIO_FORMAT].join(".")),
	);

	const alreadyCompressed = await outputFile.exists();
	if (alreadyCompressed) {
		return new Response(outputFile, {
			headers: {
				"content-type": AUDIO_FORMAT_MIME,
				"content-length": outputFile.size.toString(),
			},
		});
	}

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
	if (exitCode !== 0) throw new Error(`failed to compress audio (${name})`);

	const compressed = await new Response(ffmpeg.stdout).arrayBuffer();
	await outputFile.write(compressed);

	return new Response(compressed, {
		headers: {
			"content-type": AUDIO_FORMAT_MIME,
			"content-length": compressed.byteLength.toString(),
		},
	});
};
