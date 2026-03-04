import type { APIRoute } from "astro";

import { pages } from "~/lib/metadata";

export const GET: APIRoute = ({ url }) =>
	new Response(
		Object.keys(pages)
			.map((path) => new URL(path === "index" ? "" : path, url.origin).href)
			.join("\n"),
		{ headers: { "content-type": "text/plain" } },
	);
