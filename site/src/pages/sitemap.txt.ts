import type { APIRoute } from "astro";

import { pages } from "~/lib/page";

export const GET: APIRoute = ({ url }) =>
	new Response(
		Object.keys(pages)
			.map((path) => new URL(path === "index" ? "" : path, url.origin).href)
			.join("\n"),
		{ headers: { "content-type": "text/plain" } },
	);
