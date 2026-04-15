import path from "node:path";

import { CACHE_DIR } from "..";
import { AUDIO_BITRATE } from "../preprocess/constants";
import { fileResponse } from "../utilities";
import { STAMP_VIDEO_FORMAT, STAMP_VIDEO_FORMAT_MIME } from "./constants";

export const createStampVideo = async (
	name: string,
	image: Bun.BunFile,
	audio: Bun.BunFile,
) => {
	const outputFile = Bun.file(
		path.join(CACHE_DIR, [name, STAMP_VIDEO_FORMAT].join(".")),
	);

	const alreadyExists = await outputFile.exists();
	if (alreadyExists) return fileResponse(outputFile);

	const { default: sharp } = await import("sharp");
	const imageWithBackground = await sharp(image.name)
		.flatten({ background: "#FFF" })
		.toBuffer();

	const ffmpeg = Bun.spawn(
		[
			"ffmpeg",
			"-loop",
			"1",
			"-i",
			"pipe:0",
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
		{ stdin: imageWithBackground, stdout: "pipe", stderr: "pipe" },
	);

	const exitCode = await ffmpeg.exited;
	if (exitCode !== 0) {
		const error = await ffmpeg.stderr.text();
		throw new Error(`failed to create stamp-video (${name})\n${error}`);
	}

	const created = await new Response(ffmpeg.stdout).arrayBuffer();
	await outputFile.write(created);

	return new Response(created, {
		headers: {
			"content-type": STAMP_VIDEO_FORMAT_MIME,
			"content-length": created.byteLength.toString(),
		},
	});
};
