import z from "zod";

import { alwaysArray } from "~/lib/schema";

export const schema = z
	.object({
		list: z.enum(["future", "past"]).catch("future"),
		attribute: z.string().apply(alwaysArray),
		event_type: z.string().apply(alwaysArray),
		band: z.string().apply(alwaysArray),
		character: z.string().apply(alwaysArray),
	})
	.partial({ attribute: true, event_type: true, band: true, character: true });
