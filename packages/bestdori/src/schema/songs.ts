import { deepEqual } from "fast-equals";
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
				z.preprocess(
					(difficultyMap) =>
						Object.fromEntries(
							Object.entries(difficultyMap).map(
								([difficulty, { playLevel: level, publishedAt }]) => [
									difficulty,
									{ level, publishedAt },
								],
							),
						),
					z.record(
						SongDifficulty,
						z.object({
							level: z.number().positive(),
							publishedAt: dateTimestamp.apply(parseRegionTuple).optional(),
						}),
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
		z.preprocess(
			async (songs) => {
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
												deepEqual(musicTitle, latest.musicTitle) &&
												deepEqual(publishedAt, latest.publishedAt) &&
												deepEqual(difficulty, latestDifficulty)
											);
										},
									),
								] as const,
						),
				);

				return new Map(entries);
			},
			z.map(Id, Song),
		),
	);

export type Songs = z.infer<typeof Songs>;
export type Song = z.infer<typeof Song>;
