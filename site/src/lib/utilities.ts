import type { Bandori } from "@hina-is/bestdori/data";

import { startCase } from "es-toolkit";

export const toArray = <T>(it: T | T[]) => (Array.isArray(it) ? it : [it]);

export const formatEventType = (type: Bandori.Event["type"]) => {
	if (type === "vs-live") return "VS Live";
	else return startCase(type);
};
