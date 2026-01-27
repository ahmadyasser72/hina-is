import z from "zod";

import { Id } from "./constants";
import { parseRegionTuple } from "./helpers";

// /api/characters/main.3.json
export const Characters = z
	.record(
		z.string(),
		z.object({
			characterType: z.literal("unique"),
			characterName: z.string().apply(parseRegionTuple),
			nickname: z.string().nullable().apply(parseRegionTuple),
			bandId: Id,
			colorCode: z.templateLiteral(["#", z.hex()]),
		}),
	)
	.transform((characters) => {
		const entries = Object.entries(characters).map(
			([id, { characterName: name, characterType: type, ...entry }]) =>
				[Number(id), { name, type, ...entry }] as const,
		);

		return new Map(entries);
	});

export type Characters = z.infer<typeof Characters>;
