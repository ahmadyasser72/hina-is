import * as path from "node:path";
import { bestdori } from "@hina-is/bestdori";
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

export const prerender = true;

export const GET: APIRoute<Props, Params> = async ({ props }) =>
	bestdori(props.pathname, !props.redownload);

export const getStaticPaths = (() => {
	const resolveAssets = (
		type: AssetType,
		entries: DataForAsset<AssetType>[],
	) => {
		return entries.flatMap((entry) => {
			const assets = Object.entries(getAsset(type, entry));

			return assets.map(([filename, detail]) => {
				const { pathname, redownload = false } =
					typeof detail === "object" ? detail : { pathname: detail };

				let kind: "audio" | "image" | "other";
				if (pathname.endsWith("mp3")) kind = "audio";
				else if (pathname.endsWith("png")) kind = "image";
				else kind = "other";

				let format: string;
				if (kind === "audio") format = AUDIO_FORMAT;
				else if (kind === "image") format = IMAGE_FORMAT;
				else format = path.extname(pathname).slice(1);

				return {
					params: { type, filename: [filename, format].join(".") },
					props: { pathname, redownload },
				};
			});
		});
	};

	const assetTypes = [
		"attributes",
		"bands",
		"characters",
		"cards",
		"events",
		"stamps",
	] satisfies AssetType[];

	return assetTypes.flatMap((type) =>
		resolveAssets(type, Object.values(data[type])),
	);
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
