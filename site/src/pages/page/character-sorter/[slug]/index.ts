import type { APIRoute } from "astro";

export const GET: APIRoute = ({ params, rewrite }) =>
	rewrite(`/page/character-sorter?slug=${params.slug}`);
