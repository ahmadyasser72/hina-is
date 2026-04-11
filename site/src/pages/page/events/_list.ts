import { IMAGE_FORMAT } from "@hina-is/bestdori/constants";
import * as data from "@hina-is/bestdori/data";
import { type Bandori } from "@hina-is/bestdori/data";
import { formatEventType, toArray } from "@hina-is/bestdori/utilities";

import { create, insertMultiple, search } from "@orama/orama";
import { uniq } from "es-toolkit";
import type z from "zod";

import { dayjs } from "~/lib/date";
import type { schema } from "./_params";

export const filterEvents = async (
	{ list, filter_band, filter_character, ...params }: z.infer<typeof schema>,
	events: Bandori.Event[],
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
			events.map((event) => {
				let bands: Bandori.Band[];
				switch (filter_band) {
					case "mixed-band":
						bands = Array.isArray(event.band) ? event.band : [];
						break;

					case "single-band":
						bands = Array.isArray(event.band) ? [] : [event.band];
						break;

					case "any":
					default:
						bands = toArray(event.band);
						break;
				}

				let band: string[];
				let character: string[];
				switch (filter_character) {
					case "event-cards":
						band = event.cards.map(({ character }) => character.band.slug);
						character = event.cards.map(({ character }) => character.slug);
						break;

					case "event-stamp":
						band = [event.stamp.character!.band.slug];
						character = [event.stamp.character!.slug];
						break;

					case "event-bonus":
					default:
						band = bands.map(({ slug }) => slug);
						character = event.characters.map(({ slug }) => slug);
						break;
				}

				return {
					id: event.id.toString(),
					attribute: event.attribute.slug,
					event_type: event.type,
					band,
					character,
				};
			}),
		);

		return eventDB;
	})();

	const baseFilter = {
		band: params.band
			? { containsAll: params.band }
			: { containsAny: Object.keys(data.bands) },
		character: params.character
			? { containsAll: params.character }
			: { containsAny: Object.keys(data.characters) },
	};
	const filter = {
		attribute: {
			attribute: { in: params.attribute ?? Object.keys(data.attributes) },
		},
		event_type: {
			event_type: {
				in: params.event_type ?? uniq(events.map(({ type }) => type)),
			},
		},
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
		params.character?.map((slug) => data.characters[slug].band.slug),
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
					? selectedBands.has(data.characters[slug].band.slug)
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

	const hits = new Set(main.hits.map(({ id }) => id));
	return {
		filtered: events.filter(({ id }) => hits.has(id)),
		facets: {
			attribute: getFacets(
				"attribute",
				(id) => `/assets/attributes/${id}.svg`,
				(id) => data.attributes[id as keyof typeof data.attributes].name,
			),
			event_type: getFacets("event_type", undefined, (type) =>
				formatEventType(type as never),
			),
			band: getFacets(
				"band",
				(slug) => `/assets/bands/${slug}.svg`,
				(slug) => data.bands[slug].name,
			),
			character: getFacets(
				"character",
				(slug) => `/assets/characters/${slug}.${IMAGE_FORMAT}`,
				(slug) => data.characters[slug].name,
			),
		},
	};
};

export const getEvents = ({ list }: z.infer<typeof schema>) => {
	const available = [] as Bandori.Event[];
	const past = [] as Bandori.Event[];
	const future = [] as Bandori.Event[];

	const now = dayjs();
	let lastEndAt: dayjs.Dayjs;
	for (const event of Object.values(data.events)) {
		const { startAt, endAt } = event;
		if (!startAt.en || !endAt.en) {
			future.push(event);
			continue;
		} else if (
			now.isBefore(startAt.en) ||
			now.isBetween(startAt.en, endAt.en)
		) {
			available.push(event);
		} else {
			past.push(event);
		}

		lastEndAt = dayjs(endAt.en);
	}

	return {
		available,
		list:
			list === "past"
				? past.reverse()
				: future.map(({ startAt, endAt, ...event }) => {
						const eventDuration = dayjs(endAt.jp).diff(startAt.jp);
						const startAtEn = lastEndAt
							.utc()
							.startOf("hours")
							.add(2, "days")
							.set("hours", 1);
						const endAtEn = startAtEn.add(eventDuration);
						lastEndAt = endAtEn;

						return {
							startAt: { ...startAt, en: startAtEn.valueOf() },
							endAt: { ...endAt, en: endAtEn.valueOf() },
							...event,
						};
					}),
	};
};
