import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";

import { createOgImage } from "~/components/preact/og-image";
import { pageList } from "~/lib/page";

export const prerender = true;

export const GET: APIRoute<Props, Params> = ({ props, site }) =>
	createOgImage(props.page.title, new URL(props.page.path, site));

export const getStaticPaths = (() =>
	pageList.map((page) => ({
		params: { route: `${page.route}.webp` },
		props: { page },
	}))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
