import z from "zod";

export const Id = z.coerce.number().positive();

export const CardAttribute = z.enum(["powerful", "cool", "pure", "happy"]);
export const CardRarity = z.number().min(1).max(5);
export const CardType = z.enum([
	"initial",
	"campaign",
	"event",
	"others",
	"special",
	"permanent",
	"limited",
	"dreamfes",
	"birthday",
	"kirafes",
]);
export const GachaType = z.enum([
	"free",
	"miracle",
	"special",
	"permanent",
	"limited",
	"dreamfes",
	"birthday",
	"kirafes",
]);

export const EventTypeMap = {
	story: "normal",
	versus: "vs-live",
	mission_live: "mission-live",
	challenge: "challenge-live",
	live_try: "live-goals",
	medley: "medley-live",
	festival: "team-live-festival",
} as const;
export const EventType = z
	.enum([
		"story",
		"versus",
		"mission_live",
		"challenge",
		"live_try",
		"medley",
		"festival",
	])
	.transform((type) => EventTypeMap[type]);

const SongDifficulties = [
	"easy",
	"normal",
	"hard",
	"expert",
	"special",
] as const;
export const SongDifficulty = z.coerce
	.number()
	.min(0)
	.max(4)
	.transform((it) => SongDifficulties[it]!);
