import z from "zod";

import { alwaysArray } from "~/lib/schema";

export const schema = z
	.object({
		voice_stamp: z.stringbool().catch(false),
		sort: z.enum(["default", "event-release"]).catch("default"),
		band: z.string().apply(alwaysArray),
		character: z.string().apply(alwaysArray),
	})
	.partial({ band: true, character: true });
