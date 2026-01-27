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

const EventTypeMap = {
	story: "Normal",
	versus: "VS Live",
	mission_live: "Mission Live",
	challenge: "Challenge Live",
	live_try: "Live Goals",
	medley: "Medley Live",
	festival: "Team Live Festival",
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
