import type { APIRoute } from "astro";

import { pages } from "~/lib/page";

export const prerender = true;

export const GET: APIRoute = ({ site }) =>
	new Response(
		Object.keys(pages)
			.map((path) => new URL(path, site).href)
			.join("\n"),
		{ headers: { "content-type": "text/plain" } },
	);
