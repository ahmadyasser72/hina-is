import { OGImageRoute } from "astro-og-canvas";

import { pages } from "~/lib/metadata";

export const prerender = true;

export const { getStaticPaths, GET } = await OGImageRoute({
	param: "route",
	pages,

	getImageOptions: (_path, page) => ({
		title: "ogTitle" in page ? page.ogTitle : page.title,
		description: page.description,
		bgGradient: [[24, 24, 27]],
		border: { color: [85, 221, 238], width: 20 },
		padding: 80,
		logo: { path: "./public/apple-touch-icon.png" },
	}),
});
