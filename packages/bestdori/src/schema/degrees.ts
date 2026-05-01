import z from "zod";

import { Id } from "./constants";
import { asRegionTuple } from "./helpers";

// /api/degrees/all.3.json
export const Degrees = z
	.record(
		Id,
		z.strictObject({
			degreeType: z
				.enum(["event_point", "score_ranking", "try_clear", "normal"])
				.apply(asRegionTuple),

			iconImageName: z
				.enum(["none", "event_point_icon", "opening_1", "opening_2"])
				.or(z.templateLiteral(["medley_", z.coerce.number()]))
				.apply(asRegionTuple),
			baseImageName: z.string().apply(asRegionTuple),
			rank: z
				.union([
					z.coerce.number().positive(),
					z.enum([
						"none",
						"normal",
						"extra",
						"grade_silver",
						"grade_gold",
						"grade_platinum",
					]),
				])
				.apply(asRegionTuple),

			degreeName: z.string().apply(asRegionTuple),
		}),
	)
	.transform((degrees) => {
		const entries = Object.entries(degrees).map(
			([id, entry]) => [Number(id), entry] as const,
		);

		return new Map(entries);
	});

export type Degrees = z.infer<typeof Degrees>;
