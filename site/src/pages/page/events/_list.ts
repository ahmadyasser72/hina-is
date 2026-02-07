import {
	ATTRIBUTES,
	BANDS,
	CHARACTERS,
	EVENT_TYPES,
} from "@hina-is/bestdori/constants";
import {
	bands,
	characters,
	events,
	type Bandori,
} from "@hina-is/bestdori/data";
import { toArray } from "@hina-is/bestdori/utilities";

import type z from "zod";

import { IMAGE_FORMAT } from "~/lib/compressor/constants";
import { dayjs } from "~/lib/date";
import type { schema } from "./_params";

export const filterEvents = (
	{ list, ...filter }: z.infer<typeof schema>,
	events: (Bandori.Event & { id: number })[],
) => {
	const createMapByKeys = <K>(keys: K[]) =>
		new Map(keys.map((key): [K, number] => [key, 0]));

	const all = [] as typeof events;
	const byAttribute = createMapByKeys(ATTRIBUTES);
	const byEventType = createMapByKeys(EVENT_TYPES);
	const byBand = createMapByKeys(BANDS);
	const byCharacter = createMapByKeys(CHARACTERS);

	const add = <K>(map: Map<K, number>, key: K) => {
		const existing = map.get(key);
		if (typeof existing === "number") map.set(key, existing + 1);
		else throw new Error(`Unrecognized key: ${key}`);
	};

	const filterBand =
		filter.band?.length && filter.character?.length
			? Array.from(
					new Set([
						...filter.band,
						...events.flatMap((e) =>
							e.characters
								.filter((c) => filter.character!.includes(c.id))
								.map((c) => c.band.id),
						),
					]),
				)
			: filter.band;

	for (const event of events) {
		const bands = toArray(event.band);
		if (
			filterBand?.length &&
			!filterBand.every((id) => bands.some((b) => b.id === id))
		)
			continue;

		if (!filter.event_type?.length || filter.event_type.includes(event.type)) {
			add(byAttribute, event.attribute.name);
		}

		if (
			!filter.attribute?.length ||
			filter.attribute.includes(event.attribute.name)
		) {
			add(byEventType, event.type);
		}

		const scopedCharacters = filterBand?.length
			? event.characters.filter((c) => filterBand.includes(c.band.id))
			: event.characters;
		const scopedBands = filter.character?.length
			? bands.filter((b) =>
					scopedCharacters.some(
						(c) => filter.character!.includes(c.id) && c.band.id === b.id,
					),
				)
			: bands;

		if (
			(filter.attribute?.length &&
				!filter.attribute.includes(event.attribute.name)) ||
			(filter.event_type?.length && !filter.event_type.includes(event.type)) ||
			(filter.character?.length &&
				!filter.character.every((id) =>
					scopedCharacters.some((c) => c.id === id),
				))
		)
			continue;

		for (const band of scopedBands) {
			add(byBand, band.id);
		}

		for (const character of scopedCharacters) {
			add(byCharacter, character.id);
		}

		all.push(event);
	}

	const buildFilters = <K, T extends keyof (typeof schema)["shape"]>(
		map: Map<K, number>,
		name: T,
		getIcon?: (id: K) => string,
		getLabel?: (id: K) => string,
	) => ({
		name,
		values: [...map.entries()]
			.filter(([, count]) => count > 0)
			.map(([value, count], idx) => ({
				id: `${name}_${idx}`,
				value,
				count,
				label: getLabel?.(value) ?? value,
				icon: getIcon?.(value),
			})),
	});

	return {
		filtered: all,
		facets: [
			buildFilters(
				byAttribute,
				"attribute",
				(id) => `/assets/attributes/${id}.svg`,
				(id) => id.toUpperCase(),
			),
			buildFilters(byEventType, "event_type"),
			buildFilters(
				byBand,
				"band",
				(id) => `/assets/bands/${bands.get(id)!.slug}.svg`,
				(id) => bands.get(id)!.name,
			),
			buildFilters(
				byCharacter,
				"character",
				(id) =>
					`/assets/characters/${characters.get(id)!.slug}.${IMAGE_FORMAT}`,
				(id) => characters.get(id)!.name,
			),
		],
	};
};

export const getEvents = ({ list }: z.infer<typeof schema>) => {
	const active = [] as number[];
	const past = [] as number[];
	const future = [] as number[];

	const now = dayjs();
	let lastEndAt: dayjs.Dayjs;
	for (const [id, { startAt, endAt }] of [...events.entries()]) {
		if (!startAt.en || !endAt.en) {
			future.push(id);
			continue;
		} else if (
			now.isBefore(startAt.en) ||
			now.isBetween(startAt.en, endAt.en)
		) {
			active.push(id);
		} else {
			past.push(id);
		}

		lastEndAt = dayjs(endAt.en);
	}

	return {
		active: active.map((id) => ({ id, ...events.get(id)! })),
		list:
			list === "past"
				? past.reverse().map((id) => ({ id, ...events.get(id)! }))
				: future.map((id) => {
						const { startAt, endAt, ...event } = events.get(id)!;

						const eventDuration = dayjs(endAt.jp).diff(startAt.jp);
						const startAtEn = lastEndAt
							.utc()
							.startOf("hours")
							.add(2, "days")
							.set("hours", 1);
						const endAtEn = startAtEn.add(eventDuration);
						lastEndAt = endAtEn;

						return {
							id,
							startAt: { ...startAt, en: startAtEn.toDate() },
							endAt: { ...endAt, en: endAtEn.toDate() },
							...event,
						};
					}),
	};
};
