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

const resolveAssets = (type: AssetType, entries: DataForAsset<AssetType>[]) => {
	return entries.flatMap((entry) => {
		const assets = Object.entries(getAsset(type, entry));

		return assets
			.map(([filename, detail]) => ({
				filename,
				pathname: typeof detail === "object" ? detail.path : detail,
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

	const assetTypes = ["cards", "events", "stamps"] satisfies AssetType[];
	const assets = assetTypes.flatMap((type) =>
		resolveAssets(type, Object.values(data[type])),
	);

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
