import { defineAction } from "astro:actions";
import z from "astro/zod";
import hashObject from "hash-object/async";

import type { ResultData } from "~/components/preact/character-sorter/state";

export const createShareLink = defineAction({
	input: z.object({
		done: z.boolean(),
		step: z.number(),
		rankings: z.array(
			z.object({
				rank: z.number(),
				character: z.object({
					name: z.string(),
					slug: z.string(),
					card: z.string(),
				}),
			}),
		),
	}),
	handler: async (data: Omit<ResultData, "slug">, { locals }) => {
		const hash = await hashObject(data);
		const slug = hash.slice(0, 6);

		const payload = { slug, ...data } satisfies ResultData;
		await locals.redis.set(`character-sorter:${slug}`, payload);

		return { slug };
	},
});
