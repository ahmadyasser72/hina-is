import { SITE_NAME } from "astro:env/client";

import { IMAGE_FORMAT, STAMP_VIDEO_FORMAT } from "@hina-is/bestdori/constants";
import { stamps } from "@hina-is/bestdori/data";

import type { APIRoute } from "astro";
import { findKey } from "es-toolkit";

export const GET: APIRoute = ({ params, site }) => {
	const slug = params.slug!.replace("stamp", "");
	const key = findKey(
		stamps,
		(stamp) => stamp.slug.replaceAll("-", "") === slug,
	);
	if (!key) return new Response(null, { status: 404 });

	const stamp = stamps[key];
	const characterIcon = stamp.character
		? new URL(
				`/assets/characters/${stamp.character.slug}.${IMAGE_FORMAT}`,
				site,
			)
		: null;

	const pageUrl = new URL("/page/stamps", site);
	const image = new URL(
		`/assets/stamps/${stamp.slug}-image.${IMAGE_FORMAT}`,
		site,
	);
	const video = new URL(
		`/assets/stamps/${stamp.slug}.${STAMP_VIDEO_FORMAT}`,
		site,
	);

	const json = {
		id: slug,
		url: pageUrl,
		uri: pageUrl,
		created_at: null,
		edited_at: null,
		reblog: null,
		language: "en",
		content:
			typeof stamp.text === "string"
				? stamp.text
				: [
						stamp.text.translate,
						`<blockquote>${stamp.text.japanese}<br>(${stamp.text.romaji})</blockquote>`,
					].join("<br><br>"),
		spoiler_text: "",
		visibility: "public",
		application: { name: SITE_NAME, website: null },
		media_attachments: [
			{
				id: "114163769487684704",
				...(stamp.voiced
					? { type: "video", url: video, preview_url: image }
					: { type: "image", url: image, preview_url: null }),
				remote_url: null,
				preview_remote_url: null,
				text_url: null,
				description: null,
				meta: { original: { width: 200, height: 164 } },
			},
		],
		account: {
			id: "0",
			display_name: "",
			username: "",
			acct: "",
			url: site,
			uri: site,
			created_at: null,
			locked: false,
			bot: false,
			discoverable: true,
			indexable: false,
			group: false,
			avatar: characterIcon,
			avatar_static: characterIcon,
			header: null,
			header_static: null,
			followers_count: 0,
			following_count: 0,
			statuses_count: 0,
			hide_collections: false,
			noindex: false,
			emojis: [],
			roles: [],
			fields: [],
		},
		mentions: [],
		tags: [],
		emojis: [],
		card: null,
		poll: null,
	};

	const body = JSON.stringify(json);
	const encoder = new TextEncoder();

	return new Response(body, {
		headers: {
			"content-length": encoder.encode(body).length.toString(),
			"content-type": "application/json",
		},
	});
};
