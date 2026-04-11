import { createHash } from "node:crypto";

import { startCase } from "es-toolkit";
import type z from "zod";

import type { EventType } from "./schema/constants";

export const toArray = <T>(it: T | T[]) => (Array.isArray(it) ? it : [it]);
export const unwrap = <T>({ jp, en }: { jp: T; en: T | null }) => (en ?? jp)!;

export const hashBuffer = (...buffers: ArrayBuffer[]) =>
	buffers
		.reduce(
			(hash, next) => hash.update(Buffer.from(next)),
			createHash("sha512"),
		)
		.digest("hex")
		.slice(0, 6);

export const formatEventType = (type: z.infer<typeof EventType>) => {
	if (type === "vs-live") return "VS Live";
	else return startCase(type);
};
