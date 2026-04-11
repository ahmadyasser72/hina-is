import path from "path";

import { CACHE_DIR } from "..";
import { AUDIO_BITRATE } from "../preprocess/constants";
import { STAMP_VIDEO_FORMAT, STAMP_VIDEO_FORMAT_MIME } from "./constants";

export const createStampVideo = async (
	name: string,
	image: Bun.BunFile,
	audio: Bun.BunFile,
) => {
	const outputFile = Bun.file(
		path.join(CACHE_DIR, [name, STAMP_VIDEO_FORMAT].join(".")),
	);

	const alreadyCompressed = await outputFile.exists();
	if (alreadyCompressed) {
		return new Response(outputFile, {
			headers: {
				"content-type": STAMP_VIDEO_FORMAT_MIME,
				"content-length": outputFile.size.toString(),
			},
		});
	}

	const ffmpeg = Bun.spawn(
		[
			"ffmpeg",
			"-loop",
			"1",
			"-i",
			image.name!,
			"-i",
			audio.name!,
			"-c:v",
			"libx264",
			"-tune",
			"stillimage",
			"-vf",
			"scale=trunc(iw/2)*2:trunc(ih/2)*2",
			"-c:a",
			"libopus",
			"-b:a",
			AUDIO_BITRATE,
			"-pix_fmt",
			"yuv420p",
			"-movflags",
			"frag_keyframe+empty_moov",
			"-shortest",
			"-f",
			STAMP_VIDEO_FORMAT,
			"pipe:1",
		],
		{ stdout: "pipe", stderr: "ignore" },
	);

	const exitCode = await ffmpeg.exited;
	if (exitCode !== 0) throw new Error(`failed to create stamp-video (${name})`);

	const created = await new Response(ffmpeg.stdout).arrayBuffer();
	await outputFile.write(created);

	return new Response(created, {
		headers: {
			"content-type": STAMP_VIDEO_FORMAT_MIME,
			"content-length": created.byteLength.toString(),
		},
	});
};
