import { deepEqual } from "fast-equals";
import z from "zod";

import { bestdoriJSON } from "..";
import { CardAttribute, CardRarity, CardType, Id } from "./constants";
import { asRegionTuple, dateTimestamp, parseRegionTuple } from "./helpers";

// /api/cards/$id.json
export const Card = z
	.object({
		characterId: Id,
		rarity: CardRarity,
		attribute: CardAttribute,
		type: CardType,
		resourceSetName: z.string(),
		prefix: z.string().apply(parseRegionTuple),
		releasedAt: dateTimestamp.apply(parseRegionTuple),

		stat: z.object({
			training: z.object({ levelLimit: z.number().nonnegative() }).optional(),
		}),
	})
	.transform(({ prefix: name, ...entry }) => ({
		name: { jp: name.jp!, en: name.en },
		...entry,
	}));

// /api/cards/all.5.json
export const Cards = z
	.record(
		z.string(),
		z.object({
			prefix: z.string().apply(asRegionTuple),
			releasedAt: z.string().apply(asRegionTuple),
		}),
	)
	.pipe(
		z.preprocess(
			async (cards) => {
				const entries = await Promise.all(
					Object.entries(cards)
						.filter(([, { prefix }]) => !!prefix[0])
						.map(
							async ([id, { prefix, releasedAt }]) =>
								[
									id,
									await bestdoriJSON<z.input<typeof Card>>(
										`/api/cards/${id}.json`,
										(latest) =>
											deepEqual(prefix, latest.prefix) &&
											deepEqual(releasedAt, latest.releasedAt),
									),
								] as const,
						),
				);

				return new Map(entries);
			},
			z.map(Id, Card),
		),
	);

export type Cards = z.infer<typeof Cards>;
export type Card = z.infer<typeof Card>;
