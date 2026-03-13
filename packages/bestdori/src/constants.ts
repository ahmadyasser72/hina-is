import { attributes, bands, characters } from "./data";
import { EventTypeMap } from "./schema/constants";

export const ATTRIBUTES = [...attributes.keys()];
export const EVENT_TYPES = Object.values(EventTypeMap);

export const BANDS = [...bands.keys()];
export const CHARACTERS = [...characters.keys()];
