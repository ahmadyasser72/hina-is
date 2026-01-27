import z from "zod";

import { parseRegionTuple } from "./helpers";

// /api/bands/main.1.json
export const Bands = z
	.record(
		z.string(),
		z.object({ bandName: z.string().apply(parseRegionTuple) }),
	)
	.transform((bands) => {
		const entries = Object.entries(bands)
			.filter(([, { bandName }]) => !!bandName.jp)
			.map(([id, { bandName: name }]) => [Number(id), { name }] as const);

		return new Map(entries);
	});

export type Bands = z.infer<typeof Bands>;
