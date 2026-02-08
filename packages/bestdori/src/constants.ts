import { attributes, bandsByName, charactersByName } from "./data";
import { EventTypeMap } from "./schema/constants";

export const ATTRIBUTES = [...attributes.keys()];
export const EVENT_TYPES = Object.values(EventTypeMap);

export const BANDS = [...bandsByName.keys()];
export const CHARACTERS = [...charactersByName.keys()];
