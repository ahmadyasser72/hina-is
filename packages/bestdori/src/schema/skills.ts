import z from "zod";

import { CardAttribute } from "./constants";
import { asRegionTuple, parseRegionTuple } from "./helpers";

const SkillMultiplier = z.object({
	activateEffectValue: z.number().nonnegative().apply(asRegionTuple),
	activateEffectValueType: z.enum(["rate", "real_value"]),
	activateCondition: z.enum(["none", "bad", "great", "good", "perfect"]),
});

// /api/skills/all.10.json
export const Skills = z
	.record(
		z.string(),
		z.object({
			duration: z.array(z.number().positive()).min(5).max(5),
			description: z.string().apply(parseRegionTuple),
			activationEffect: z.object({
				unificationActivateEffectValue: z.number().positive().optional(),
				unificationActivateConditionBandId: z.number().positive().optional(),
				unificationActivateConditionType: z
					.string()
					.pipe(z.preprocess((it) => it.toLowerCase(), CardAttribute))
					.optional(),

				activateEffectTypes: z
					.looseRecord(z.string(), SkillMultiplier.optional())
					.pipe(
						z.preprocess(
							({
								score,
								score_over_life,
								score_under_life,
								score_under_great_half,
								score_continued_note_judge,
								score_only_perfect,
							}) => ({
								best:
									score_only_perfect ??
									score_continued_note_judge ??
									score_over_life ??
									score ??
									score_under_great_half ??
									score_under_life,
							}),
							z.strictObject({
								best: SkillMultiplier.extend({
									activateEffectValue: z
										.number()
										.positive()
										.apply(parseRegionTuple),
								}).optional(),
							}),
						),
					),
			}),
			onceEffect: z
				.object({
					onceEffectType: z.literal("life"),
					onceEffectValueType: z.literal("real_value"),
					onceEffectValue: z.array(z.number().positive()).min(5).max(5),
				})
				.optional(),
		}),
	)
	.transform((skills) => {
		const entries = Object.entries(skills).map(
			([id, entry]) => [Number(id), entry] as const,
		);

		return new Map(entries);
	});

export type Skills = z.infer<typeof Skills>;
