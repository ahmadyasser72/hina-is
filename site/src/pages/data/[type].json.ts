import { type AssetType } from "@hina-is/bestdori/assets";
import * as data from "@hina-is/bestdori/data";

import type {
	APIRoute,
	GetStaticPaths,
	InferGetStaticParamsType,
	InferGetStaticPropsType,
} from "astro";

export const prerender = true;

export const GET: APIRoute<Props, Params> = ({ props }) =>
	new Response(JSON.stringify(props), {
		headers: { "content-type": "application/json; charset=utf-8" },
	});

export const getStaticPaths = (() =>
	(
		[
			"attributes",
			"bands",
			"characters",
			"cards",
			"events",
			"stamps",
		] satisfies AssetType[]
	).map((type) => ({
		params: { type },
		props: { keys: Object.keys(data[type]) },
	}))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
type Params = InferGetStaticParamsType<typeof getStaticPaths>;
