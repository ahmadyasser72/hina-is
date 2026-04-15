export interface PageMetadata {
	title: string;
	description: string;
	path: `/${string}`;
	route: string;
}

export const pageList = [
	{
		path: "/" as const,
		title: "Homepage",
		description:
			"A fan site for BanG Dream! Girls Band Party!. Explore game events, stamps, and character birthdays.",
	},
	{
		path: "/page/events" as const,
		title: "Event Schedule",
		description:
			"View upcoming and past event schedules for BanG Dream! Girls Band Party!.",
	},
	{
		path: "/page/stamps" as const,
		title: "Stamp List",
		description:
			"Browse the collection of stamps from BanG Dream! Girls Band Party!, including voiced stamps.",
	},
	{
		path: "/page/birthday" as const,
		title: "Birthday Tracker",
		description:
			"Keep track of upcoming character birthdays in BanG Dream! Girls Band Party!.",
	},
	{
		path: "/page/character-sorter" as const,
		title: "Character Sorter",
		description:
			"Rank your favorite characters from BanG Dream! Girls Band Party!.",
	},
].map((page) => ({
	...page,
	route: page.path.slice(1) || "index",
})) satisfies PageMetadata[];

export const pages = Object.fromEntries(
	pageList.map((page) => [page.path, page]),
);
