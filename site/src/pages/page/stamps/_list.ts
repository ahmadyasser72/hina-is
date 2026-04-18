import { IMAGE_FORMAT } from "@hina-is/bestdori/constants";
import type { Bandori } from "@hina-is/bestdori/data";
import * as data from "@hina-is/bestdori/data";

import { create, insertMultiple, search } from "@orama/orama";
import type z from "zod";

import type { schema } from "./_params";

const UNKNOWN = "unknown";

export const filterStamps = async (
	{ voice_stamp, sort, query, ...params }: z.infer<typeof schema>,
	stamps: Bandori.Stamp[],
) => {
	const db = (() => {
		const stampDB = create({
			schema: { band: "enum", character: "enum", text: "string[]" },
		});

		const items = voice_stamp ? stamps.filter(({ voiced }) => voiced) : stamps;
		if (sort === "event-release")
			items.sort(
				(a, b) => (b.eventRelease ?? -Infinity) - (a.eventRelease ?? -Infinity),
			);

		insertMultiple(
			stampDB,
			items.map(({ id, character, text }) => ({
				id,
				band: character?.band.slug ?? UNKNOWN,
				character: character?.slug ?? UNKNOWN,
				text:
					typeof text === "string"
						? [text]
						: [text.english ?? text.translate, text.romaji],
			})),
		);

		return stampDB;
	})();

	const filter = {
		band: {
			band: { in: params.band ?? [...Object.keys(data.bands), UNKNOWN] },
		},
		character: {
			character: {
				in: params.character ?? [...Object.keys(data.characters), UNKNOWN],
			},
		},
	};

	const options = {
		term: query,
		tolerance: 1,
		limit: stamps.length,
	};

	const [main, { facets: bandFacet }, { facets: characterFacet }] =
		await Promise.all([
			search(db, { ...options, where: { and: Object.values(filter) } }),
			search(db, { ...options, facets: { band: {} }, where: filter.character }),
			search(db, { ...options, facets: { character: {} }, where: filter.band }),
		]);

	const selectedBands = new Set(params.band);
	const selectedCharacterBands = new Set(
		params.character?.map((slug) =>
			slug === UNKNOWN ? UNKNOWN : data.characters[slug].band.slug,
		),
	);

	const facets = {
		band: Object.entries(bandFacet!.band.values).filter(([slug, count]) =>
			selectedCharacterBands.size > 0
				? selectedCharacterBands.has(slug)
				: count > 0,
		),
		character: Object.entries(characterFacet!.character.values).filter(
			([slug, count]) =>
				selectedBands.size > 0
					? selectedBands.has(data.characters[slug]?.band.slug ?? UNKNOWN)
					: count > 0,
		),
	} satisfies Record<keyof typeof params, [string, number][]>;

	const getFacets = <T extends keyof typeof params>(
		name: T,
		getIcon?: (name: string) => string | undefined,
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
		filtered: stamps.filter(({ id }) => hits.has(id)),
		facets: {
			band: getFacets(
				"band",
				(slug) => (slug === UNKNOWN ? undefined : `/assets/bands/${slug}.svg`),
				(slug) => (slug === UNKNOWN ? "Unknown" : data.bands[slug].name),
			),
			character: getFacets(
				"character",
				(slug) =>
					slug === UNKNOWN
						? undefined
						: `/assets/characters/${slug}.${IMAGE_FORMAT}`,
				(slug) => (slug === UNKNOWN ? "Unknown" : data.characters[slug].name),
			),
		},
	};
};

export const getStamps = () => Object.values(data.stamps);
