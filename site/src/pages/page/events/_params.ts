import z from "zod";

import { alwaysArray } from "~/lib/schema";

export const schema = z
	.object({
		list: z.enum(["future", "past"]).catch("future"),
		attribute: z.string(),
		event_type: z.string(),
		band: z.coerce.number().apply(alwaysArray),
		character: z.coerce.number().apply(alwaysArray),
	})
	.partial({ attribute: true, event_type: true, band: true, character: true });
