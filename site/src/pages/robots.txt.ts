import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
	const sitemap = new URL("/sitemap.txt", site);

	return new Response(
		["User-agent: *", "Disallow: ", `Sitemap: ${sitemap.href}`].join("\n"),
		{ headers: { "content-type": "text/plain" } },
	);
};
