import z from "zod";


import { parseRegionTuple } from "./helpers";

// /api/stamps/all.2.json
export const Stamps = z
	.record(
		z.string(),
		z.object({
			imageName: z.string().apply(parseRegionTuple),
		}),
	)
	.transform((stamps) => {
		const entries = Object.entries(stamps).map(
			([id, entry]) => [Number(id), entry] as const,
		);

		return new Map(entries);
	});

export type Stamps = z.infer<typeof Stamps>;
