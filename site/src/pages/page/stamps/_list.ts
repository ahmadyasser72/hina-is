import { BANDS, CHARACTERS } from "@hina-is/bestdori/constants";
import type { Bandori } from "@hina-is/bestdori/data";
import * as data from "@hina-is/bestdori/data";

import { create, insertMultiple, search } from "@orama/orama";
import { titleCase } from "text-case";
import type z from "zod";

import { IMAGE_FORMAT } from "~/lib/compressor/constants";
import type { schema } from "./_params";

const UNKNOWN = "unknown";

export const filterStamps = async (
	params: z.infer<typeof schema>,
	stamps: (Bandori.Stamp & { id: string })[],
) => {
	const db = (() => {
		const stampDB = create({ schema: { band: "enum", character: "enum" } });

		insertMultiple(
			stampDB,
			stamps.map(({ id, character }) => ({
				id,
				band: character?.band.slug ?? UNKNOWN,
				character: character?.slug ?? UNKNOWN,
			})),
		);

		return stampDB;
	})();

	const filter = {
		band: { band: { in: params.band ?? [...BANDS, UNKNOWN] } },
		character: {
			character: { in: params.character ?? [...CHARACTERS, UNKNOWN] },
		},
	};

	const limit = stamps.length;
	const [main, { facets: bandFacet }, { facets: characterFacet }] =
		await Promise.all([
			search(db, { limit, where: { and: Object.values(filter) } }),
			search(db, { limit, facets: { band: {} }, where: filter.character }),
			search(db, { limit, facets: { character: {} }, where: filter.band }),
		]);

	const selectedBands = new Set(params.band);
	const selectedCharacterBands = new Set(
		params.character?.map((slug) =>
			slug === UNKNOWN ? UNKNOWN : data.charactersBySlug.get(slug)!.band.slug,
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
					? selectedBands.has(
							data.charactersBySlug.get(slug)?.band.slug ?? UNKNOWN,
						)
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
				(slug) => data.bandsBySlug.get(slug)?.name ?? titleCase(slug),
			),
			character: getFacets(
				"character",
				(slug) =>
					slug === UNKNOWN
						? undefined
						: `/assets/characters/${slug}.${IMAGE_FORMAT}`,
				(slug) => data.charactersBySlug.get(slug)?.name ?? titleCase(slug),
			),
		},
	};
};

export const getStamps = () =>
	[...data.stamps.entries()].map(([id, entry]) => ({ id, ...entry }));
