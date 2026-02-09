import { attributes, bandsBySlug, charactersBySlug } from "./data";
import { EventTypeMap } from "./schema/constants";

export const ATTRIBUTES = [...attributes.keys()];
export const EVENT_TYPES = Object.values(EventTypeMap);

export const BANDS = [...bandsBySlug.keys()];
export const CHARACTERS = [...charactersBySlug.keys()];
