interface PageMetadata {
	title: string;
	description: string;
	ogTitle?: string;
}

export const pages = {
	index: {
		title: "Home",
		description:
			"A fan site for BanG Dream! Girls Band Party!. Explore game events, stamps, and character birthdays.",
		ogTitle: "hina-is",
	},
	"page/events": {
		title: "Event Schedule",
		description:
			"View upcoming and past event schedules for BanG Dream! Girls Band Party!.",
	},
	"page/stamps": {
		title: "Stamp List",
		description:
			"Browse the collection of stamps from BanG Dream! Girls Band Party!, including voiced stamps.",
	},
	"page/birthday": {
		title: "Birthday Tracker",
		description:
			"Keep track of upcoming character birthdays in BanG Dream! Girls Band Party!.",
	},
	"page/sorter": {
		title: "Character Sorter",
		description:
			"Rank your favorite characters from BanG Dream! Girls Band Party!.",
	},
} satisfies Record<string, PageMetadata>;
