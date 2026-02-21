import { createHash } from "node:crypto";
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
	let pathname: string;
	let invalidateCache = false;
	if (typeof props.pathname === "object") {
		const { path, invalidate } = props.pathname;
		pathname = path;
		invalidateCache = invalidate;
	} else {
		pathname = props.pathname;
	}

	const response = await bestdori(pathname, !invalidateCache);
	if (props.kind === "raw") return response;

	const cacheName =
		[
			params.type,
			createHash("md5").update(response.url).digest("hex").slice(0, 10),
		].join("__") + extname(params.filename);

	const buffer = Buffer.from(await response.arrayBuffer());
	switch (props.kind) {
		case "audio":
			return compressAudio(cacheName, buffer);

		case "image":
			return compressImage(cacheName, buffer, invalidateCache);
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
				const path = typeof pathname === "object" ? pathname.path : pathname;

				let kind: "audio" | "image" | "raw" = "raw";
				if (path.endsWith("mp3")) kind = "audio";
				else if (path.endsWith("png")) kind = "image";

				let format = extname(path).slice(1);
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
