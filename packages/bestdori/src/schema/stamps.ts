import z from "zod";

import { asRegionTuple } from "./helpers";

// /api/stamps/all.2.json
export const Stamps = z
	.record(
		z.string(),
		z.strictObject({
			imageName: z.string().apply(asRegionTuple),
		}),
	)
	.transform((stamps) => {
		const entries = Object.entries(stamps).map(
			([id, entry]) => [Number(id), entry] as const,
		);

		return new Map(entries);
	});

export type Stamps = z.infer<typeof Stamps>;
