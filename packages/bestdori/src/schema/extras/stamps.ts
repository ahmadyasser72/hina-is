import z from "zod";

const StampId = z.templateLiteral(["stamp_", z.number()]);

// /api/explorer/$REGION/assets/stamp/01.json
export const StampImages = z
	.array(z.string())
	.nonempty()
	.pipe(
		z.preprocess(
			(items) =>
				items
					.filter((it) => it.endsWith(".png"))
					.map((it) => it.replace(".png", "")),
			z.array(StampId),
		),
	);

// /api/explorer/$REGION/assets/sound/voice_stamp.json
export const StampVoices = z
	.array(z.string())
	.nonempty()
	.pipe(
		z.preprocess(
			(items) =>
				items
					.filter((it) => it.endsWith(".mp3"))
					.map((it) => it.replace(".mp3", "")),
			z.array(StampId),
		),
	);
