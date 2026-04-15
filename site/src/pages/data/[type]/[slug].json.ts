import * as path from "node:path";

import {
	getAsset,
	type AssetType,
	type DataForAsset,
} from "@hina-is/bestdori/assets";
import { AUDIO_FORMAT, IMAGE_FORMAT } from "@hina-is/bestdori/constants";
import * as data from "@hina-is/bestdori/data";

import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";
import { groupBy, mapValues, omit } from "es-toolkit";

export const prerender = true;

export const GET: APIRoute<Props, Params> = ({ site, props }) => {
	const { assets, ...data } = props.json;

	return new Response(
		JSON.stringify({
			data,
			assets: mapValues(assets, (path) => new URL(path, site)),
		}),
		{ headers: { "content-type": "application/json; charset=utf-8" } },
	);
};

export const getStaticPaths = (() => {
	const getEntries = <T extends AssetType, O extends object>(
		type: T,
		transform?: (entry: DataForAsset<T>) => O,
	) => {
		const entries = Object.values(data[type]) as DataForAsset<T>[];
		return entries.map((entry) => {
			const data = transform?.(entry) ?? entry;
			const { slug } = entry as DataForAsset<AssetType>;

			const assets = Object.entries(getAsset(type, entry)).map(
				([filename, detail]) => {
					const { pathname, identifier } = detail;

					let kind: "audio" | "image" | "other";
					if (pathname.endsWith("mp3")) kind = "audio";
					else if (pathname.endsWith("png")) kind = "image";
					else kind = "other";

					let format: string;
					if (kind === "audio") format = AUDIO_FORMAT;
					else if (kind === "image") format = IMAGE_FORMAT;
					else format = path.extname(pathname).slice(1);

					return { filename, identifier, format };
				},
			);

			return {
				params: { type, slug },
				props: {
					json: {
						...data,
						slug,
						assets: mapValues(
							groupBy(assets, ({ identifier }) => identifier),
							([{ filename, format }]) =>
								`/assets/${type}/${filename}.${format}`,
						),
					},
				},
			};
		});
	};

	return [
		getEntries("attributes"),
		getEntries("bands"),
		getEntries("characters"),
		getEntries("cards", (entry) =>
			omit(entry, ["resourceSetName", "trainingState", "gachaType"]),
		),
		getEntries("events", (entry) =>
			omit(entry, [
				"assetBundleName",
				"bannerAssetBundleName",
				"bgmAssetBundleName",
				"bgmFileName",
			]),
		),
		getEntries("stamps", (entry) => omit(entry, ["region"])),
	].flat();
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
