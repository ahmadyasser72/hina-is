import { isEqual } from "es-toolkit";
import z from "zod";

import { bestdoriJSON } from "..";
import { Id, SongDifficulty } from "./constants";
import { asRegionTuple, dateTimestamp, parseRegionTuple } from "./helpers";

// /api/songs/$id.json
export const Song = z
	.object({
		bgmId: z.string(),
		tag: z.enum(["normal", "anime", "tie_up"]),
		bandId: Id,
		jacketImage: z.array(z.string().toLowerCase()),
		musicTitle: z.string().apply(parseRegionTuple),
		publishedAt: dateTimestamp.apply(parseRegionTuple),
		difficulty: z
			.record(
				z.string(),
				z.object({
					playLevel: z.number().positive(),
					publishedAt: z.string().apply(asRegionTuple).optional(),
				}),
			)
			.pipe(
				z.transform((difficultyMap) =>
					Object.fromEntries(
						Object.entries(difficultyMap).map(
							([difficulty, { playLevel: level, publishedAt }]) => [
								SongDifficulty.parse(difficulty),
								z
									.object({
										level: z.number().positive(),
										publishedAt: dateTimestamp
											.apply(parseRegionTuple)
											.optional(),
									})
									.parse({ level, publishedAt }),
							],
						),
					),
				),
			),
	})
	.transform(({ musicTitle: title, ...entry }) => ({ title, ...entry }));

// /api/songs/all.5.json
export const Songs = z
	.record(
		z.string(),
		z.object({
			musicTitle: z.string().apply(asRegionTuple),
			publishedAt: z.string().apply(asRegionTuple),
			difficulty: z.record(
				z.string(),
				z.object({
					playLevel: z.number().positive(),
					publishedAt: z.string().apply(asRegionTuple).optional(),
				}),
			),
		}),
	)
	.pipe(
		z.transform(async (songs) => {
			const entries = await Promise.all(
				Object.entries(songs)
					.filter(([, { musicTitle }]) => !!musicTitle[0])
					.map(
						async ([id, { musicTitle, publishedAt, difficulty }]) =>
							[
								id,
								await bestdoriJSON<z.input<typeof Song>>(
									`/api/songs/${id}.json`,
									(latest) => {
										const latestDifficulty = Object.fromEntries(
											Object.entries(latest.difficulty).map(
												([id, { playLevel, publishedAt }]) => [
													id,
													publishedAt
														? { playLevel, publishedAt }
														: { playLevel },
												],
											),
										);

										return (
											isEqual(musicTitle, latest.musicTitle) &&
											isEqual(publishedAt, latest.publishedAt) &&
											isEqual(difficulty, latestDifficulty)
										);
									},
								),
							] as const,
					),
			);

			return z.map(Id, Song).parse(new Map(entries));
		}),
	);

export type Songs = z.infer<typeof Songs>;
export type Song = z.infer<typeof Song>;
