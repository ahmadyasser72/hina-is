import { bestdori } from "@hina-is/bestdori";
import {
	getAsset,
	type AssetType,
	type DataForAsset,
} from "@hina-is/bestdori/assets";
import * as data from "@hina-is/bestdori/data";

import type { APIRoute } from "astro";

import { generateThumbhash } from "~/lib/thumbhash";

export const prerender = true;

const resolveAssets = (
	type: AssetType,
	entries: [number | string, DataForAsset<AssetType>][],
) => {
	return entries.flatMap(([id, entry]) => {
		const assets = Object.entries(getAsset(type, { id, ...entry }));

		return assets
			.map(([filename, pathname]) => ({
				filename,
				pathname: typeof pathname === "object" ? pathname.path : pathname,
			}))
			.filter(({ pathname }) => pathname.endsWith("png"));
	});
};

export const GET: APIRoute = async () => {
	if (import.meta.env.DEV) {
		return new Response("Route not supported during development.", {
			status: 403,
		});
	}

	const assetTypes = ["events", "stamps"] satisfies AssetType[];
	const assets = [
		...assetTypes.flatMap((type) =>
			resolveAssets(type, [...data[type].entries()]),
		),
		...resolveAssets(
			"cards",
			[...data.events.values()]
				.flatMap(({ cards }) => cards)
				.map(({ id, ...data }): [number, typeof data] => [id, data]),
		),
	];

	const hashEntries = await Promise.all(
		assets.map(async ({ filename, pathname }) => {
			const response = await bestdori(pathname, true);
			const buffer = Buffer.from(await response.arrayBuffer());
			const hash = await generateThumbhash(buffer);

			return [filename, hash];
		}),
	);

	return new Response(JSON.stringify(hashEntries), {
		headers: { "content-type": "application/json; charset=utf-8" },
	});
};
