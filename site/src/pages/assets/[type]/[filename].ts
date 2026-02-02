import { bestdori } from "@hina-is/bestdori";
import {
	attributes,
	bands,
	characters,
	events,
	stamps,
} from "@hina-is/bestdori/data";

import type {
	APIRoute,
	GetStaticPaths,
	GetStaticPathsResult,
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

		default:
			throw new Error(`invalid route ${JSON.stringify({ props, params })}`);
	}
};

export const getStaticPaths = (() => {
	const attributeAssets = [...attributes.values()].map(({ name, assets }) => ({
		params: { type: "attribute", filename: `${name}.svg` },
		props: { kind: "image" as const, pathname: assets.icon },
	})) satisfies GetStaticPathsResult;
	const bandAssets = [...bands.entries()]
		.filter(([, { assets }]) => !!assets.icon)
		.map(([id, { assets }]) => ({
			params: { type: "band", filename: `${id}.svg` },
			props: { kind: "image" as const, pathname: assets.icon! },
		})) satisfies GetStaticPathsResult;
	const characterAssets = [...characters.entries()].map(([id, { assets }]) => ({
		params: { type: "character", filename: `${id}.${IMAGE_FORMAT}` },
		props: { kind: "image" as const, pathname: assets.icon },
	})) satisfies GetStaticPathsResult;

	const eventAssets = [...events.entries()].flatMap(([id, { assets }]) =>
		(["banner", "background"] as const).map((variant) => ({
			params: {
				type: "event",
				filename: [id, variant].join("_") + `.${IMAGE_FORMAT}`,
			},
			props: { kind: "image" as const, pathname: assets[variant] },
		})),
	) satisfies GetStaticPathsResult;

	const stampAssets = [...stamps.entries()].flatMap(
		([id, { image, voice }]) => {
			const imageAsset = {
				params: { type: "stamp", filename: `${id}.${IMAGE_FORMAT}` },
				props: { kind: "image" as const, pathname: image },
			};

			return voice === null
				? imageAsset
				: [
						imageAsset,
						{
							params: { type: "stamp", filename: `${id}.${AUDIO_FORMAT}` },
							props: { kind: "audio" as const, pathname: voice },
						},
					];
		},
	) satisfies GetStaticPathsResult;

	return [
		...attributeAssets,
		...bandAssets,
		...characterAssets,
		...eventAssets,
		...stampAssets,
	] as const;
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
