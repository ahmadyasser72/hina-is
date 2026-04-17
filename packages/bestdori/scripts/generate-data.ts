import { appendFile, writeFile } from "node:fs/promises";
import path from "node:path";

import * as devalue from "devalue";
import { chunk, deburr, groupBy, limitAsync, omit, pick } from "es-toolkit";
import { findKey } from "es-toolkit/object";
import yoctoSpinner from "yocto-spinner";
import { z } from "zod";

import { bestdoriJSON, GIT_ROOT_PATH } from "~/index";
import { doStampOcr } from "~/process/stamp-ocr";
import { Bands } from "~/schema/bands";
import { Cards } from "~/schema/cards";
import { Characters } from "~/schema/characters";
import { CardAttribute } from "~/schema/constants";
import { Events } from "~/schema/events";
import { GenericAssets } from "~/schema/extras/generic-assets";
import { StampId } from "~/schema/extras/stamps";
import { RecentNews } from "~/schema/recent-news";
import { Skills } from "~/schema/skills";
import { Stamps } from "~/schema/stamps";
import { unwrap } from "~/utilities";

const createSpinner = (text: string) => yoctoSpinner({ text }).start();

const createSlug = (placeholder: string, ...parts: (string | number)[]) =>
	deburr(parts.join(" "))
		.toLowerCase()
		.replace(/[^a-zA-Z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-$/, "-" + placeholder);

const findValue = <T extends Record<any, any>>(
	obj: T,
	predicate: (value: T[keyof T], key: keyof T, obj: T) => boolean,
): T[keyof T] | undefined => obj[findKey(obj, predicate)];

const data = await (async () => {
	const spinner = createSpinner("fetch data");

	const SCHEMAS = {
		bands: Bands,
		cards: Cards,
		characters: Characters,
		events: Events,
		stamps: Stamps,
		skills: Skills,
		stampImages: GenericAssets("png", StampId),
		stampVoices: GenericAssets("mp3", StampId),
		recentNews: RecentNews,
		gachaTypeVoiceList: GenericAssets("mp3", z.string()),
	} as const;

	const get = limitAsync(
		async <K extends keyof typeof SCHEMAS>(
			key: K,
			pathname: string,
		): Promise<z.infer<(typeof SCHEMAS)[K]>> => {
			spinner.text = `fetching ${key} (${pathname})`;
			const json = await bestdoriJSON(pathname, false);
			const output = (await SCHEMAS[key].parseAsync(json)) as never;

			return output;
		},
		1,
	);

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

	const gachaTypeVoiceList = await Promise.all(
		["birthdayspin", "limitedspin", "operationspin", "spin"].map((type) =>
			get(
				"gachaTypeVoiceList",
				`/api/explorer/jp/assets/sound/voice/gacha/${type}.json`,
			).then((entries) => ({ type, entries })),
		),
	);

	spinner.success("done fetching");

	return {
		get attributes() {
			const colors = {
				happy: "#ff6600",
				powerful: "#ff345a",
				pure: "#44c527",
				cool: "#4057e3",
			};

			return Object.fromEntries(
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

			return Object.fromEntries(
				[...bands.entries()].map(([id, { name }]) => {
					const slug = createSlug("band", id, unwrap(name));
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
			return Object.fromEntries(
				[...characters.entries()].map(
					([id, { bandId, nickname, name, colorCode, ...entry }]) => {
						const displayName = unwrap(nickname) ?? unwrap(name);
						const slug = createSlug("character", id, displayName);
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
			return Object.fromEntries(
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
						const slug = createSlug("card", id, characterName, unwrap(name));
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
									return data.attributes[attribute];
								},
								type: type.toUpperCase(),
								...entry,

								name: unwrap(name),
								gachaText: unwrap(gachaText),
								get gachaType() {
									if (!unwrap(gachaText)) return null;

									return (
										gachaTypeVoiceList.find(({ entries }) =>
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
			const cards = Object.values(data.cards).filter(
				({ trainingState }) => trainingState === "both",
			);

			return Object.fromEntries(
				Object.values(data.characters).map((character) => [
					character.slug,
					cards.filter((card) => card.character.slug === character.slug),
				]),
			);
		},

		get events() {
			return Object.fromEntries(
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
						const slug = createSlug("event", id, unwrap(name));
						return [
							slug,
							{
								id,
								slug,
								get attribute() {
									return data.attributes[attribute];
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

			const characters = { ...data.characters };
			return Object.fromEntries(
				[...stampsMap.values()]
					.sort(
						(a, b) => Number(a.id.split("_")[1]) - Number(b.id.split("_")[1]),
					)
					.sort((a, b) => Number(b.voiced) - Number(a.voiced))
					.map(({ id, region, voiced }) => {
						const n = id.split("_")[1]!;
						const [characterId, stampId] = [Number(n.slice(0, 3)), n.slice(3)];
						const character =
							findValue(characters, ({ id }) => Number(id) === characterId) ??
							null;

						const slug = createSlug(
							"stamp",
							character?.slug ?? `${characterId}-unknown`,
							stampId,
						);

						return [
							slug,
							{
								id,
								slug,
								character,
								get eventRelease() {
									const event = findValue(
										Object.fromEntries([...events.entries()]),
										({ pointRewards }) => {
											const stampId = unwrap(pointRewards).find(
												({ rewardId, rewardType }) =>
													rewardType === "stamp" && rewardId,
											)!.rewardId!;

											return stamps.get(stampId)!.imageName === id;
										},
									);

									return event?.startAt.jp ?? null;
								},
								region,
								voiced,
								text: "PLACEHOLDER" as
									| string
									| Record<"japanese" | "romaji" | "translate", string>,
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

const unevalObject = (o: object) => {
	const entries = Object.entries(o);
	const keys = entries.map(([key]) => key).join(", ");

	const spinner = createSpinner(`uneval (${keys})`);
	const lines = entries.map(([key, value]) => {
		spinner.text = `uneval ${key}`;
		const out = devalue.uneval(value);
		return `export const ${key} = ${out};`;
	});

	spinner.success(`done uneval (${keys})`);
	return { keys, lines };
};

const DATA_FILE = path.join(GIT_ROOT_PATH, "packages/bestdori/src/data.js");

{
	const output = unevalObject(omit(data, ["events", "stamps"]));
	const spinner = createSpinner(`write data.js (${output.keys})`);
	await writeFile(DATA_FILE, output.lines.join(""));
	spinner.success(`data.js written (${output.keys})`);
}

{
	const { getAsset } = await import("~/assets");
	const spinner = createSpinner("extract text from stamps");

	const stamps: typeof data.stamps = {};
	const batches = chunk(Object.entries(data.stamps), 5);
	for (const batch of batches) {
		const keys = batch.map(([key]) => key);
		const assets = batch.map(
			([_, stamp]) => getAsset("stamps", stamp)[`${stamp.slug}-image`],
		);

		spinner.text = `extracting text from stamps (${keys.join(", ")})`;
		const texts = await doStampOcr(assets);
		batch.forEach(([key, stamp], subIndex) => {
			stamps[key] = { ...stamp, text: texts[subIndex] };
		});
	}

	Object.defineProperty(data, "stamps", { get: () => stamps });
	spinner.success("done extracting text");
}

{
	const output = unevalObject(pick(data, ["events", "stamps"]));
	const spinner = createSpinner(`write data.js (${output.keys})`);
	await appendFile(DATA_FILE, output.lines.join(""));
	spinner.success(`data.js appended (${output.keys})`);
}
