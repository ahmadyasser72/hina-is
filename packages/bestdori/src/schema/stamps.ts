import z from "zod";

// /api/stamps/all.2.json
export const Stamps = z
	.record(
		z.string(),
		z.object({
			imageName: z.templateLiteral([z.literal("stamp_"), z.string()]),
		}),
	)
	.transform((stamps) => {
		const entries = Object.entries(stamps).map(
			([id, entry]) => [Number(id), entry] as const,
		);

		return new Map(entries);
	});

export type Stamps = z.infer<typeof Stamps>;
