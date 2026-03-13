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

type MapValue<T> = T extends Map<any, infer V> ? V : never;

namespace Bandori {
	type Attribute = MapValue<typeof attributes>;
	type Band = MapValue<typeof bands>;
	type Card = MapValue<typeof cards>;
	type Character = MapValue<typeof characters>;
	type Event = MapValue<typeof events>;
	type Stamp = MapValue<typeof stamps>;

	type GameRegion = "jp" | "en";
}
