import { writeFile } from "node:fs/promises";
import path from "node:path";

import * as devalue from "devalue";
import type { z } from "zod";

import { bestdoriJSON } from ".";
import { getSlug } from "./assets";
import { Bands } from "./schema/bands";
import { Cards } from "./schema/cards";
import { Characters } from "./schema/characters";
import { CardAttribute } from "./schema/constants";
import { Events } from "./schema/events";
import { StampImages, StampVoices } from "./schema/extras/stamps";
import { unwrap } from "./utilities";

console.time("everything");

const time = async <T>(
	message: string,
	it: Promise<T> | (() => T),
): Promise<T> => {
	console.time(message);
	const result = it instanceof Promise ? await it : it();
	console.timeEnd(message);
	return result;
};

const SCHEMAS = {
	bands: Bands,
	cards: Cards,
	characters: Characters,
	events: Events,
	stampImages: StampImages,
	stampVoices: StampVoices,
} as const;

const get = async <K extends keyof typeof SCHEMAS>(
	key: K,
	pathname: string,
): Promise<z.infer<(typeof SCHEMAS)[K]>> => {
	const json = await time(
		`get ${key} (${pathname})`,
		bestdoriJSON(pathname, false),
	);

	return time(`get ${key} entries`, SCHEMAS[key].parseAsync(json) as never);
};

const all = await (async () => {
	const [
		bands,
		cards,
		characters,
		events,
		jpStampImages,
		enStampImages,
		jpStampVoices,
		enStampVoices,
	] = await Promise.all([
		get("bands", "/api/bands/main.1.json"),
		get("cards", "/api/cards/all.5.json"),
		get("characters", "/api/characters/main.3.json"),
		get("events", "/api/events/all.5.json"),
		get("stampImages", "/api/explorer/jp/assets/stamp/01.json"),
		get("stampImages", "/api/explorer/en/assets/stamp/01.json"),
		get("stampVoices", "/api/explorer/jp/assets/sound/voice_stamp.json"),
		get("stampVoices", "/api/explorer/en/assets/sound/voice_stamp.json"),
	]);

	return {
		get attributes() {
			const colors = {
				happy: "#ff6600",
				powerful: "#ff345a",
				pure: "#44c527",
				cool: "#4057e3",
			};

			return new Map(
				CardAttribute.options.map((name) => [
					name,
					{ name, color: colors[name], slug: name },
				]),
			);
		},

		get bands() {
			const colors: Record<string, string> = {
				1: "#ff3377",
				2: "#d23341",
				3: "#f4b600",
				4: "#33ddaa",
				5: "#3344aa",
				18: "#22cccc",
				21: "#2dc1f8",
				45: "#2273a5",
			};

			return new Map(
				[...bands.entries()].map(([id, { name }]) => [
					id,
					{
						name: unwrap(name),
						color: colors[id] ?? null,
						slug: getSlug(id, unwrap(name)),
					},
				]),
			);
		},
		get bandsBySlug() {
			return new Map(
				[...all.bands.entries()].map(([, entry]) => [entry.slug, entry]),
			);
		},

		get characters() {
			return new Map(
				[...characters.entries()].map(
					([id, { bandId, nickname, name, ...entry }]) => [
						id,
						{
							get band() {
								return { id: bandId, ...all.bands.get(bandId)! };
							},
							...entry,

							name: unwrap(nickname) ?? unwrap(name),
							slug: getSlug(id, unwrap(nickname) ?? unwrap(name)),
						},
					],
				),
			);
		},
		get charactersBySlug() {
			return new Map(
				[...all.characters.entries()].map(([, entry]) => [entry.slug, entry]),
			);
		},

		get cards() {
			return new Map(
				[...cards.entries()].map(
					([id, { characterId, name, attribute, stat, ...entry }]) => [
						id,
						{
							get character() {
								return { id: characterId, ...all.characters.get(characterId)! };
							},
							get attribute() {
								return all.attributes.get(attribute)!;
							},
							...entry,

							name: unwrap(name),
							get slug() {
								const character = all.characters.get(characterId)!;
								return getSlug(id, `${character.name}-${unwrap(name)}`);
							},
							get trainingState() {
								if (stat.training === undefined) {
									return "no-trained" as const;
								} else if (
									stat.training.levelLimit === 0 ||
									entry.type === "others"
								) {
									return "only-trained" as const;
								} else {
									return "both" as const;
								}
							},
						},
					],
				),
			);
		},

		get events() {
			return new Map(
				[...events.entries()].map(
					([id, { attribute, characters, cards, name, ...entry }]) => [
						id,
						{
							get attribute() {
								return all.attributes.get(attribute)!;
							},
							get band() {
								const first = {
									id: characters[0]!,
									...all.characters.get(characters[0]!)!,
								};
								const theRest = characters
									.slice(1)
									.map((id) => ({ id, ...all.characters.get(id)! }));

								return theRest.every(({ band }) => band.id === first.band.id)
									? first.band
									: Object.values(
											Object.groupBy(
												[first, ...theRest],
												({ band }) => band.id,
											),
										).map((characters) => {
											const id = characters?.[0]?.band.id!;
											const band = all.bands.get(id)!;
											return { id, characters: characters!, ...band };
										});
							},
							get characters() {
								return characters.map((id) => ({
									id,
									...all.characters.get(id)!,
								}));
							},
							get cards() {
								return cards.map((id) => ({ id, ...all.cards.get(id)! }));
							},
							...entry,

							name: unwrap(name),
							slug: getSlug(id, unwrap(name)),
						},
					],
				),
			);
		},

		get stamps() {
			const stampsMap = [
				{ region: "en" as const, stamps: enStampImages, voices: enStampVoices },
				{ region: "jp" as const, stamps: jpStampImages, voices: jpStampVoices },
			]
				.flatMap(({ region, stamps, voices }) =>
					stamps.map((id) => ({ id, region, voiced: voices.includes(id) })),
				)
				.reduce((map, stamp) => {
					const existing = map.get(stamp.id);
					if (!existing || (!existing.voiced && stamp.voiced))
						map.set(stamp.id, stamp);

					return map;
				}, new Map<string, { id: string; region: "jp" | "en"; voiced: boolean }>());

			return new Map(
				[...stampsMap.values()]
					.sort(
						(a, b) => Number(a.id.split("_")[1]) - Number(b.id.split("_")[1]),
					)
					.sort((a, b) => Number(b.voiced) - Number(a.voiced))
					.map(({ id, region, voiced }) => [
						id,
						{ region, voiced, slug: getSlug(id, region) },
					]),
			);
		},
	};
})();

const { ...data } = all;
export type Data = typeof data;

const keys = Object.keys(data).join(", ");
const content = await time("uneval data", () => devalue.uneval(data));
await time(
	"write data.js",
	writeFile(
		path.join(import.meta.dirname, "data.js"),
		`export const { ${keys} } = ${content};`,
	),
);

console.timeEnd("everything");
