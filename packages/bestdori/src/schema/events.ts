import { deepEqual } from "fast-equals";
import z from "zod";

import { bestdoriJSON } from "..";
import { CardAttribute, EventType, Id } from "./constants";
import { asRegionTuple, dateTimestamp, parseRegionTuple } from "./helpers";

const EventReward = z.object({
	rewardType: z.string(),
	rewardId: z.coerce.number().optional(),
});

// /api/events/$id.json
export const Event = z
	.object({
		eventType: EventType,
		eventName: z.string().apply(parseRegionTuple),
		startAt: dateTimestamp.apply(parseRegionTuple),
		endAt: dateTimestamp.apply(parseRegionTuple),

		assetBundleName: z.string().nonempty(),
		bannerAssetBundleName: z.string().nonempty(),
		bgmAssetBundleName: z.string().nonempty(),
		bgmFileName: z.string().nonempty(),

		attributes: z.tuple([z.object({ attribute: CardAttribute })]),
		characters: z.array(z.object({ characterId: Id })),
		members: z.array(z.object({ situationId: Id })),

		pointRewards: z.array(EventReward).apply(parseRegionTuple),
		rankingRewards: z.array(EventReward).apply(parseRegionTuple),
	})
	.transform(
		({
			eventName: name,
			eventType: type,
			attributes: [{ attribute }],
			characters,
			members,
			...entry
		}) => ({
			name: { jp: name.jp!, en: name.en },
			type,
			attribute,
			characters: characters.map(({ characterId }) => characterId),
			cards: members.map(({ situationId }) => situationId),
			...entry,
		}),
	);

// /api/events/all.5.json
export const Events = z
	.record(
		z.string(),
		z.object({
			eventName: z.string().apply(asRegionTuple),
			startAt: z.string().apply(asRegionTuple),
			endAt: z.string().apply(asRegionTuple),
		}),
	)
	.pipe(
		z.preprocess(
			async (events) => {
				const entries = await Promise.all(
					Object.entries(events)
						.filter(([, { eventName }]) => !!eventName[0])
						.map(
							async ([id, { eventName, startAt, endAt }]) =>
								[
									id,
									await bestdoriJSON<z.input<typeof Event>>(
										`/api/events/${id}.json`,
										(latest) =>
											deepEqual(eventName, latest.eventName) &&
											deepEqual(startAt, latest.startAt) &&
											deepEqual(endAt, latest.endAt),
									),
								] as const,
						),
				);

				return new Map(entries);
			},
			z.map(Id, Event),
		),
	);

export type Events = z.infer<typeof Events>;
export type Event = z.infer<typeof Event>;
