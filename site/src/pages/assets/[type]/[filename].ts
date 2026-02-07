import { extname } from "node:path";
import { bestdori } from "@hina-is/bestdori";
import {
	getAsset,
	type AssetType,
	type DataForAsset,
} from "@hina-is/bestdori/assets";
import * as data from "@hina-is/bestdori/data";

import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";

import { compressAudio } from "~/lib/compressor/audio";
import { AUDIO_FORMAT, IMAGE_FORMAT } from "~/lib/compressor/constants";
import { compressImage } from "~/lib/compressor/image";

export const prerender = true;

export const GET: APIRoute<Props, Params> = async ({ props, params }) => {
	const response = await bestdori(props.pathname, true);

	const filename = [params.type, params.filename].join("__");
	const buffer = Buffer.from(await response.arrayBuffer());
	switch (props.kind) {
		case "audio":
			return compressAudio(filename, buffer);

		case "image":
			return compressImage(filename, buffer);

		case "raw":
			return new Response(buffer);
	}
};

export const getStaticPaths = (() => {
	const resolveAssets = (
		type: AssetType,
		entries: [number | string, DataForAsset<AssetType>][],
	) => {
		return entries.flatMap(([id, entry]) => {
			const assets = Object.entries(getAsset(type, { id, ...entry }));

			return assets.map(([filename, pathname]) => {
				let kind: "audio" | "image" | "raw" = "raw";
				if (pathname.endsWith("mp3")) kind = "audio";
				else if (pathname.endsWith("png")) kind = "image";

				let format = extname(pathname).slice(1);
				if (kind === "audio") format = AUDIO_FORMAT;
				else if (kind === "image") format = IMAGE_FORMAT;

				return {
					params: { type, filename: `${filename}.${format}` },
					props: { kind, pathname },
				};
			});
		});
	};

	const assetTypes = [
		"attributes",
		"bands",
		"characters",
		"events",
		"stamps",
	] satisfies AssetType[];

	return [
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
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
