import { bestdori } from "@hina-is/bestdori";
import { IMAGE_FORMAT } from "@hina-is/bestdori/constants";
import * as data from "@hina-is/bestdori/data";
import { mergeTitleImages } from "@hina-is/bestdori/process";

import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";

export const prerender = true;

export const GET: APIRoute<Props, Params> = async ({ props }) => {
	const [baseImage, ...layers] = (
		await Promise.all(props.images.map((path) => bestdori(path, true)))
	).map(({ file }) => file);

	return mergeTitleImages(props.slug, baseImage, ...layers);
};

export const getStaticPaths = (() => {
	const degrees = Object.values(data.events).map(({ titles, startAt }) => ({
		startAt,
		titles: Object.values(titles)
			.filter((it) => Array.isArray(it))
			.flatMap((items) => items),
	}));

	return degrees.flatMap(({ startAt, titles }) => {
		const region = startAt.en !== null ? "en" : "jp";
		const basePath = `/assets/${region}/thumb/degree_rip`;
		return titles.map(
			({ slug, degreeType, iconImageName, baseImageName, rank }) => {
				const images = [`${basePath}/${baseImageName}.png`];
				if (rank !== null && rank !== "none") {
					images.push(`${basePath}/${degreeType}_${rank}.png`);

					if (iconImageName !== null && iconImageName !== "none") {
						images.push(`${basePath}/${iconImageName}_${rank}.png`);
					}
				}

				return {
					params: { filename: [slug, IMAGE_FORMAT].join(".") },
					props: { slug, images },
				};
			},
		);
	});
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
