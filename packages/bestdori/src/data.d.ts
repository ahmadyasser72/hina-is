import type { Data } from "@scripts/generate-data";

export const {
	attributes,
	bands,
	characters,
	cards,
	cardsByCharacter,
	events,
	stamps,
	recentNews,
}: Data;

type ObjectValue<T> = T[keyof T];

namespace Bandori {
	type Attribute = ObjectValue<typeof attributes>;
	type Band = ObjectValue<typeof bands>;
	type Card = ObjectValue<typeof cards>;
	type Character = ObjectValue<typeof characters>;
	type Event = ObjectValue<typeof events>;
	type Stamp = ObjectValue<typeof stamps>;

	type GameRegion = "jp" | "en";
}
