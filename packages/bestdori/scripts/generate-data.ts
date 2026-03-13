import { writeFile } from "node:fs/promises";
import path from "node:path";

import * as devalue from "devalue";
import { deburr, groupBy } from "es-toolkit";
import { findValue } from "es-toolkit/map";
import type { z } from "zod";

import { bestdoriJSON, GIT_ROOT_PATH } from "~/index";
import { Bands } from "~/schema/bands";
import { Cards } from "~/schema/cards";
import { Characters } from "~/schema/characters";
import { CardAttribute } from "~/schema/constants";
import { Events } from "~/schema/events";
import { StampImages, StampVoices } from "~/schema/extras/stamps";
import { RecentNews } from "~/schema/recent-news";
import { Skills } from "~/schema/skills";
import { Stamps } from "~/schema/stamps";
import { unwrap } from "~/utilities";

console.time("everything");

const createSlug = (...parts: (string | number)[]) =>
	deburr(parts.join(" "))
		.toLowerCase()
		.replace(/[^a-zA-Z0-9\s-]/g, "")
		.replace(/\s+/g, "-");

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
	stamps: Stamps,
	skills: Skills,
	stampImages: StampImages,
	stampVoices: StampVoices,
	recentNews: RecentNews,
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

const data = await (async () => {
	const [
		bands,
		cards,
		characters,
		events,
		stamps,
		skills,
		jpStampImages,
		enStampImages,
		jpStampVoices,
		enStampVoices,
		recentNews,
	] = await Promise.all([
		get("bands", "/api/bands/main.1.json"),
		get("cards", "/api/cards/all.5.json"),
		get("characters", "/api/characters/main.3.json"),
		get("events", "/api/events/all.5.json"),
		get("stamps", "/api/stamps/all.2.json"),
		get("skills", "/api/skills/all.10.json"),
		get("stampImages", "/api/explorer/jp/assets/stamp/01.json"),
		get("stampImages", "/api/explorer/en/assets/stamp/01.json"),
		get("stampVoices", "/api/explorer/jp/assets/sound/voice_stamp.json"),
		get("stampVoices", "/api/explorer/en/assets/sound/voice_stamp.json"),
		get("recentNews", "/api/news/dynamic/recent.json"),
	]);

	const gachaTypeList = await time(
		"fetch gachaTypeList",
		Promise.all(
			["birthdayspin", "limitedspin", "operationspin", "spin"].map((type) =>
				bestdoriJSON<string[]>(
					`api/explorer/jp/assets/sound/voice/gacha/${type}.json`,
					false,
				).then((entries) => ({
					type,
					entries: entries
						.filter((it) => it.endsWith("mp3"))
						.map((it) => it.replace(".mp3", "")),
				})),
			),
		),
	);

	return {
		get attributes() {
			const colors = {
				happy: "#ff6600",
				powerful: "#ff345a",
				pure: "#44c527",
				cool: "#4057e3",
			};

			return new Map(
				CardAttribute.options.map((slug) => [
					slug,
					{ id: slug, name: slug.toUpperCase(), color: colors[slug], slug },
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
				[...bands.entries()].map(([id, { name }]) => {
					const slug = createSlug(id, unwrap(name));
					return [
						slug,
						{
							id,
							slug,
							name: unwrap(name),
							color: colors[id] ?? null,
						},
					];
				}),
			);
		},

		get characters() {
			return new Map(
				[...characters.entries()].map(
					([id, { bandId, nickname, name, colorCode, ...entry }]) => {
						const displayName = unwrap(nickname) ?? unwrap(name);
						const slug = createSlug(id, displayName);
						return [
							slug,
							{
								id,
								slug,
								get band() {
									return findValue(data.bands, ({ id }) => id === bandId)!;
								},
								...entry,

								color: colorCode,
								name: displayName,
							},
						];
					},
				),
			);
		},

		get cards() {
			return new Map(
				[...cards.entries()].map(
					([
						id,
						{
							characterId,
							type,
							name,
							gachaText,
							attribute,
							skillId,
							skillName,
							stat,
							...entry
						},
					]) => {
						const character = characters.get(characterId)!;
						const characterName =
							unwrap(character.nickname) ?? unwrap(character.name);
						const slug = createSlug(id, characterName, unwrap(name));
						return [
							slug,
							{
								id,
								slug,
								get character() {
									return findValue(
										data.characters,
										({ id }) => id === characterId,
									)!;
								},
								get attribute() {
									return data.attributes.get(attribute)!;
								},
								type: type.toUpperCase(),
								...entry,

								name: unwrap(name),
								gachaText: unwrap(gachaText),
								get gachaType() {
									if (!unwrap(gachaText)) return null;

									return (
										gachaTypeList.find(({ entries }) =>
											entries.includes(entry.resourceSetName),
										)?.type ?? null
									);
								},
								get skill() {
									const {
										duration,
										description,
										activationEffect,
										onceEffect,
									} = skills.get(skillId)!;

									const template = unwrap(description);
									return {
										name: unwrap(skillName),
										get description() {
											const durations = duration.join("/");

											return onceEffect
												? template
														.replace(
															"{0}",
															`(${onceEffect.onceEffectValue.join("/")})`,
														)
														.replace("{1}", `(${durations})`)
												: template.replace("{0}", `(${durations})`);
										},
										multiplier:
											(activationEffect.unificationActivateEffectValue ??
												unwrap(
													activationEffect.activateEffectTypes.best
														?.activateEffectValue ?? { jp: 0, en: 0 },
												)) + "%",
									};
								},
								get trainingState() {
									if (stat.training === undefined) {
										return "no-trained" as const;
									} else if (
										stat.training.levelLimit === 0 ||
										type === "others"
									) {
										return "only-trained" as const;
									} else {
										return "both" as const;
									}
								},
							},
						];
					},
				),
			);
		},
		get cardsByCharacter() {
			const cards = [...data.cards.values()].filter(
				({ trainingState }) => trainingState === "both",
			);

			return new Map(
				[...data.characters.values()].map((character) => [
					character.slug,
					cards.filter((card) => card.character.slug === character.slug),
				]),
			);
		},

		get events() {
			return new Map(
				[...events.entries()].map(
					([
						id,
						{
							attribute,
							characters,
							cards,
							name,
							pointRewards,
							rankingRewards,
							...entry
						},
					]) => {
						const slug = createSlug(id, unwrap(name));
						return [
							slug,
							{
								id,
								slug,
								get attribute() {
									return data.attributes.get(attribute)!;
								},
								get band() {
									const [first, ...theRest] = characters.map(
										(characterId) =>
											findValue(
												data.characters,
												({ id }) => id === characterId,
											)!,
									);

									return theRest.every(({ band }) => band.id === first.band.id)
										? first.band
										: Object.values(
												groupBy([first, ...theRest], ({ band }) => band.slug),
											).map((characters) => ({
												characters,
												...characters[0].band,
											}));
								},
								get characters() {
									return characters.map(
										(characterId) =>
											findValue(
												data.characters,
												({ id }) => id === characterId,
											)!,
									);
								},
								get cards() {
									return cards.map(
										(cardId) =>
											findValue(data.cards, ({ id }) => id === cardId)!,
									);
								},
								get stamp() {
									const id = unwrap(pointRewards).find(
										({ rewardId, rewardType }) =>
											rewardType === "stamp" && rewardId,
									)!.rewardId!;

									const stampId = stamps.get(id)!.imageName;
									return findValue(data.stamps, ({ id }) => id === stampId)!;
								},
								...entry,

								name: unwrap(name),
							},
						];
					},
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
					.map(({ id, region, voiced }) => {
						const slug = createSlug(...id.split("_"));
						return [
							slug,
							{
								id,
								slug,
								get character() {
									const characterId = Number(id.split("_")[1]!.slice(0, 3));
									const character = findValue(
										data.characters,
										({ id }) => id === characterId,
									);
									if (!character) return null;

									return character;
								},
								region,
								voiced,
							},
						];
					}),
			);
		},

		get recentNews() {
			const { events } = recentNews;

			return {
				events: events.map(
					(eventId) => findValue(data.events, ({ id }) => id === eventId)!,
				),
			};
		},
	};
})();

export type Data = typeof data;

const lines = await time(
	"uneval all",
	Promise.all(
		Object.entries(data).map(async ([key, map]) => {
			const out = await time(`uneval ${key}`, () => devalue.uneval(map));
			return `export const ${key} = ${out}`;
		}),
	),
);

await time(
	"write data.js",
	writeFile(
		path.join(GIT_ROOT_PATH, "packages/bestdori/src/data.js"),
		lines.join(";"),
	),
);

console.timeEnd("everything");
