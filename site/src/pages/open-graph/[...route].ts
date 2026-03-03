import { OGImageRoute } from "astro-og-canvas";

export const prerender = true;

export const { getStaticPaths, GET } = await OGImageRoute({
	param: "route",

	pages: {
		index: {
			title: "hina-is",
			description:
				"A fan site for BanG Dream! Girls Band Party!. Explore game events, stamps, and character birthdays.",
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
	},

	getImageOptions: (_path, page) => ({
		title: page.title,
		description: page.description,
		bgGradient: [[24, 24, 27]],
		border: { color: [85, 221, 238], width: 20 },
		padding: 80,
		logo: { path: "./public/apple-touch-icon.png" },
	}),
});
