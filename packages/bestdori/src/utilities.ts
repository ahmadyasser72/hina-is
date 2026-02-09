import { capitalCase } from "text-case";
import type z from "zod";

import type { EventType } from "./schema/constants";

export const toArray = <T>(it: T | T[]) => (Array.isArray(it) ? it : [it]);
export const unwrap = <T>({ jp, en }: { jp: T; en: T | null }) => (en ?? jp)!;

export const formatEventType = (type: z.infer<typeof EventType>) => {
	if (type === "vs-live") return "VS Live";
	else return capitalCase(type);
};
