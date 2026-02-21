import z from "zod";

import { parseRegionTuple } from "./helpers";

// /api/news/dynamic/recent.json
export const RecentNews = z.object({
	events: z
		.record(
			z.string(),
			z.object({
				eventName: z.string().apply(parseRegionTuple),
				startAt: z.string().apply(parseRegionTuple),
				endAt: z.string().apply(parseRegionTuple),
			}),
		)
		.pipe(
			z.preprocess(
				(events) =>
					Object.entries(events)
						.filter(
							([, { eventName, startAt, endAt }]) =>
								eventName.en && startAt.en && endAt.en,
						)
						.map(([id]) => Number(id)),
				z.array(z.number()),
			),
		),
});
