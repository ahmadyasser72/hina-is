import z from "zod";

import { bestdoriJSON } from "..";
import { Id } from "./constants";
import { dateTimestamp, parseRegionTuple } from "./helpers";

// /api/characters/$id.json
export const Character = z
	.object({
		characterName: z.string().apply(parseRegionTuple),
		nickname: z.string().nullable().apply(parseRegionTuple),
		bandId: Id,
		colorCode: z.templateLiteral(["#", z.hex()]),

		profile: z.object({ birthday: dateTimestamp }),
	})
	.transform(({ characterName: name, profile, ...entry }) => ({
		name,
		...entry,
		...profile,
	}));

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
	.pipe(
		z.preprocess(
			async (characters) => {
				const entries = await Promise.all(
					Object.keys(characters).map(
						async (id) =>
							[
								Number(id),
								await bestdoriJSON<z.input<typeof Character>>(
									`/api/characters/${id}.json`,
									true,
								),
							] as const,
					),
				);

				return new Map(entries);
			},
			z.map(Id, Character),
		),
	);

export type Characters = z.infer<typeof Characters>;
export type Character = z.infer<typeof Character>;
