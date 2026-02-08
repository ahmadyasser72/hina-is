import {
	ATTRIBUTES,
	BANDS,
	CHARACTERS,
	EVENT_TYPES,
} from "@hina-is/bestdori/constants";
import * as data from "@hina-is/bestdori/data";
import { type Bandori } from "@hina-is/bestdori/data";
import { toArray } from "@hina-is/bestdori/utilities";

import { create, insertMultiple, search } from "@orama/orama";
import type z from "zod";

import { IMAGE_FORMAT } from "~/lib/compressor/constants";
import { dayjs } from "~/lib/date";
import type { schema } from "./_params";

export const filterEvents = async (
	{ list, ...params }: z.infer<typeof schema>,
	events: (Bandori.Event & { id: number })[],
) => {
	const db = (() => {
		const eventDB = create({
			schema: {
				attribute: "enum",
				event_type: "enum",
				band: "enum[]",
				character: "enum[]",
			},
		});

		insertMultiple(
			eventDB,
			events.map(({ id, attribute, type, band, characters }) => ({
				id: id.toString(),
				attribute: attribute.name,
				event_type: type,
				band: toArray(band).map(({ name }) => name),
				character: characters.map(({ name }) => name),
			})),
		);

		return eventDB;
	})();

	const baseFilter = {
		band: params.band ? { containsAll: params.band } : { containsAny: BANDS },
		character: params.character
			? { containsAll: params.character }
			: { containsAny: CHARACTERS },
	};
	const filter = {
		attribute: { attribute: { in: params.attribute ?? ATTRIBUTES } },
		event_type: { event_type: { in: params.event_type ?? EVENT_TYPES } },
	};

	const [main, { facets: attributeFacet }, { facets: eventTypeFacet }] =
		await Promise.all([
			search(db, {
				facets: { band: {}, character: {} },
				where: { ...filter.attribute, ...filter.event_type, ...baseFilter },
			}),
			search(db, {
				facets: { attribute: {} },
				where: { ...filter.event_type, ...baseFilter },
			}),
			search(db, {
				facets: { event_type: {} },
				where: { ...filter.attribute, ...baseFilter },
			}),
		]);

	const selectedBands = new Set(params.band);
	const selectedCharacterBands = new Set(
		params.character?.map((name) => data.charactersByName.get(name)!.band.name),
	);

	const facets = {
		attribute: Object.entries(attributeFacet!.attribute.values),
		event_type: Object.entries(eventTypeFacet!.event_type.values),
		band: Object.entries(main.facets!.band.values).filter(([name, count]) =>
			selectedCharacterBands.size > 0
				? selectedCharacterBands.has(name)
				: count > 0,
		),
		character: Object.entries(main.facets!.character.values).filter(
			([name, count]) =>
				selectedBands.size > 0
					? selectedBands.has(data.charactersByName.get(name)!.band.name)
					: count > 0,
		),
	} satisfies Record<keyof typeof params, [string, number][]>;

	const getFacets = <T extends keyof typeof params>(
		name: T,
		getIcon?: (name: string) => string,
		getLabel?: (name: string) => string,
	) => ({
		name,
		values: facets[name]
			.sort(([, a], [, b]) => b - a)
			.map(([value, count], idx) => ({
				id: `${name}_${idx}`,
				value,
				count,
				label: getLabel?.(value) ?? value,
				icon: getIcon?.(value),
			})),
	});

	const hits = new Set(main.hits.map(({ id }) => Number(id)));
	return {
		filtered: events.filter(({ id }) => hits.has(id)),
		facets: [
			getFacets(
				"attribute",
				(id) => `/assets/attributes/${id}.svg`,
				(id) => id.toUpperCase(),
			),
			getFacets("event_type"),
			getFacets(
				"band",
				(name) => `/assets/bands/${data.bandsByName.get(name)!.slug}.svg`,
				(name) => data.bandsByName.get(name)!.name,
			),
			getFacets(
				"character",
				(name) =>
					`/assets/characters/${data.charactersByName.get(name)!.slug}.${IMAGE_FORMAT}`,
				(name) => data.charactersByName.get(name)!.name,
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
	for (const [id, { startAt, endAt }] of [...data.events.entries()]) {
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
		active: active.map((id) => ({ id, ...data.events.get(id)! })),
		list:
			list === "past"
				? past.reverse().map((id) => ({ id, ...data.events.get(id)! }))
				: future.map((id) => {
						const { startAt, endAt, ...event } = data.events.get(id)!;

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
