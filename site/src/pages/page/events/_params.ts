import z from "zod";

import { alwaysArray } from "~/lib/schema";

export const schema = z
	.object({
		list: z.enum(["future", "past"]).catch("future"),
		filter_band: z.enum(["any", "single-band", "mixed-band"]).catch("any"),
		filter_character: z
			.enum(["event-bonus", "event-cards", "event-focus", "event-stamp"])
			.catch("event-bonus"),
		attribute: z.string().apply(alwaysArray),
		event_type: z.string().apply(alwaysArray),
		band: z.string().apply(alwaysArray),
		character: z.string().apply(alwaysArray),
	})
	.partial({ attribute: true, event_type: true, band: true, character: true });
