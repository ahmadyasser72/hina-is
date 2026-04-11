import { bestdori } from "@hina-is/bestdori";
import { getAsset } from "@hina-is/bestdori/assets";
import { STAMP_VIDEO_FORMAT } from "@hina-is/bestdori/constants";
import * as data from "@hina-is/bestdori/data";
import { createStampVideo } from "@hina-is/bestdori/process";
import { hashBuffer } from "@hina-is/bestdori/utilities";

import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";

export const prerender = true;

export const GET: APIRoute<Props, Params> = async ({ props }) => {
	const image = await bestdori(props.image.pathname, !props.image.redownload);
	const audio = await bestdori(props.audio.pathname, !props.audio.redownload);
	const hash = hashBuffer(
		await image.file.arrayBuffer(),
		await audio.file.arrayBuffer(),
	);

	return createStampVideo(
		[props.stamp.slug, hash, STAMP_VIDEO_FORMAT].join("."),
		image.file,
		audio.file,
	);
};

export const getStaticPaths = (() =>
	Object.values(data.stamps)
		.filter(({ voiced }) => voiced)
		.map((stamp) => {
			const [image, audio] = Object.values(getAsset("stamps", stamp));
			return {
				params: { filename: [stamp.slug, STAMP_VIDEO_FORMAT].join(".") },
				props: { stamp, image, audio },
			};
		})) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
