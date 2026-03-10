import z from "zod";

import { alwaysArray } from "~/lib/schema";

export const schema = z
	.object({
		band: z.string().apply(alwaysArray),
		continue: z.stringbool(),
	})
	.partial();
