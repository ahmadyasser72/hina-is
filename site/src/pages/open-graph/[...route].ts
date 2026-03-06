import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";

import { createOgImage } from "~/lib/og-image";
import { pages } from "~/lib/page";

export const prerender = true;

const icon = await Bun.file("./public/apple-touch-icon.png").arrayBuffer();

export const GET: APIRoute<Props, Params> = ({ props }) =>
	createOgImage({
		title: "ogTitle" in props.page ? props.page.ogTitle : props.page.title,
		description: props.page.description,
		persistentImages: [{ src: "icon", data: icon }],
	});

export const getStaticPaths = (() =>
	Object.entries(pages).map(([route, page]) => ({
		params: { route: `${route}.webp` },
		props: { page },
	}))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
