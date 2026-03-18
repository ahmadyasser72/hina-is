import { type Bandori } from "@hina-is/bestdori/data";
import * as data from "@hina-is/bestdori/data";

import { create, insertMultiple, search } from "@orama/orama";
import type z from "zod";

import type { schema } from "./_params";

export const filterCharacters = async (
	{ query }: z.infer<typeof schema>,
	characters: Bandori.Character[],
) => {
	const db = (() => {
		const characterDB = create({
			schema: { band: "string", character: "string" },
		});

		insertMultiple(
			characterDB,
			characters.map(({ slug, name, band }) => ({
				id: slug,
				character: name,
				band: band.name,
			})),
		);

		return characterDB;
	})();

	const hits = new Set(
		(await search(db, { term: query, limit: characters.length })).hits.map(
			({ id }) => id,
		),
	);

	return { filtered: characters.filter(({ slug }) => hits.has(slug)) };
};

export const getCharacters = () => Object.values(data.characters);
