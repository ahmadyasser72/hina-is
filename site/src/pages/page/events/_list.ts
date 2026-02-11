import {
	ATTRIBUTES,
	BANDS,
	CHARACTERS,
	EVENT_TYPES,
} from "@hina-is/bestdori/constants";
import * as data from "@hina-is/bestdori/data";
import { type Bandori } from "@hina-is/bestdori/data";
import { formatEventType, toArray } from "@hina-is/bestdori/utilities";

import { create, insertMultiple, search } from "@orama/orama";
import type z from "zod";

import { IMAGE_FORMAT } from "~/lib/compressor/constants";
import { dayjs } from "~/lib/date";
import type { schema } from "./_params";

export const filterEvents = async (
	{
		list,
		band_type,
		filter_stamp,
		filter_stamp_voice,
		...params
	}: z.infer<typeof schema>,
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
			(filter_stamp_voice
				? events.filter(({ stamp }) => stamp.voiced)
				: events
			).map(({ id, attribute, type, band, characters, stamp }) => {
				let bands: Bandori.Band[];
				if (band_type === "any") bands = toArray(band);
				else if (band_type === "mixed-band")
					bands = Array.isArray(band) ? band : [];
				else bands = Array.isArray(band) ? [] : [band];

				return {
					id: id.toString(),
					attribute: attribute.name,
					event_type: type,
					band: filter_stamp
						? [stamp.character.band.slug]
						: bands.map(({ slug }) => slug),
					character: filter_stamp
						? [stamp.character.slug]
						: characters.map(({ slug }) => slug),
				};
			}),
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

	const limit = events.length;
	const [main, { facets: attributeFacet }, { facets: eventTypeFacet }] =
		await Promise.all([
			search(db, {
				limit,
				facets: { band: {}, character: {} },
				where: { ...filter.attribute, ...filter.event_type, ...baseFilter },
			}),
			search(db, {
				limit,
				facets: { attribute: {} },
				where: { ...filter.event_type, ...baseFilter },
			}),
			search(db, {
				limit,
				facets: { event_type: {} },
				where: { ...filter.attribute, ...baseFilter },
			}),
		]);

	const selectedBands = new Set(params.band);
	const selectedCharacterBands = new Set(
		params.character?.map((slug) => data.charactersBySlug.get(slug)!.band.slug),
	);

	const facets = {
		attribute: Object.entries(attributeFacet!.attribute.values),
		event_type: Object.entries(eventTypeFacet!.event_type.values),
		band: Object.entries(main.facets!.band.values).filter(([slug, count]) =>
			selectedCharacterBands.size > 0
				? selectedCharacterBands.has(slug)
				: count > 0,
		),
		character: Object.entries(main.facets!.character.values).filter(
			([slug, count]) =>
				selectedBands.size > 0
					? selectedBands.has(data.charactersBySlug.get(slug)!.band.slug)
					: count > 0,
		),
	} satisfies Record<keyof typeof params, [string, number][]>;

	const getFacets = <T extends keyof typeof params>(
		name: T,
		getIcon?: (name: string) => string,
		getLabel?: (name: string) => string,
	) =>
		facets[name]
			.sort(([aValue, aCount], [bValue, bCount]) => {
				const order =
					bCount - aCount ||
					aValue.localeCompare(bValue, undefined, { numeric: true });
				if (params[name]) {
					const hasA = params[name].includes(aValue);
					const hasB = params[name].includes(bValue);
					return Number(hasB) - Number(hasA) || order;
				}

				return order;
			})
			.map(([value, count], idx) => ({
				id: `${name}_${idx}`,
				value,
				count,
				label: getLabel?.(value) ?? value,
				icon: getIcon?.(value),
			}));

	const hits = new Set(main.hits.map(({ id }) => Number(id)));
	return {
		filtered: events.filter(({ id }) => hits.has(id)),
		facets: {
			attribute: getFacets(
				"attribute",
				(id) => `/assets/attributes/${id}.svg`,
				(id) => id.toUpperCase(),
			),
			event_type: getFacets("event_type", undefined, (type) =>
				formatEventType(type as never),
			),
			band: getFacets(
				"band",
				(slug) => `/assets/bands/${slug}.svg`,
				(slug) => data.bandsBySlug.get(slug)!.name,
			),
			character: getFacets(
				"character",
				(slug) => `/assets/characters/${slug}.${IMAGE_FORMAT}`,
				(slug) => data.charactersBySlug.get(slug)!.name,
			),
		},
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
