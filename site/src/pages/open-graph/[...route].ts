import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";

import { createOgImage } from "~/components/preact/og-image";
import { pages } from "~/lib/page";

export const prerender = true;

export const GET: APIRoute<Props, Params> = ({ props, site }) =>
	createOgImage(props.page.title, new URL(props.path, site));

export const getStaticPaths = (() =>
	Object.entries(pages).map(([route, page]) => ({
		params: { route: `${route}.webp` },
		props: { page, path: route },
	}))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
