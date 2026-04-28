import z from "zod";

import { alwaysArray } from "~/lib/schema";

export const schema = z
	.object({
		voice_stamp: z.stringbool().catch(false),
		sort: z.enum(["default", "event-release"]).catch("event-release"),
		band: z.string().apply(alwaysArray),
		character: z.string().apply(alwaysArray),
		query: z.string().toLowerCase().optional(),
	})
	.partial({ band: true, character: true });
