import { SITE_NAME } from "astro:env/client";

import { ImageResponse } from "@takumi-rs/image-response";

const iconBuffer = await Bun.file(
	"./public/apple-touch-icon.png",
).arrayBuffer();
const nunitoSansBuffer = await fetch(
	"https://cdn.jsdelivr.net/fontsource/fonts/nunito-sans:vf@latest/latin-wght-normal.woff2",
).then((response) => response.arrayBuffer());

export const createOgImage = async (title: string, link: URL) =>
	new ImageResponse(
		<div class="flex size-full flex-col gap-12 bg-linear-to-br from-[#55DDEE] to-[#261B25] px-24 py-12 text-white">
			<div class="flex flex-1 flex-col items-center justify-center">
				<h1 class="text-7xl font-bold">{title}</h1>
				<span class="-mt-12 text-lg text-white/50 underline decoration-1">
					{link.href}
				</span>
			</div>

			<div class="flex items-end justify-between">
				<div class="flex items-end gap-4">
					<img class="size-20 rounded-lg" src="icon" />
					<span class="text-4xl font-semibold">{SITE_NAME}</span>
				</div>

				<div class="rounded-full bg-[#00AABB] px-8 py-2 text-2xl font-medium">
					Fan Site for BanG Dream!
				</div>
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
			format: "webp",

			persistentImages: [{ data: iconBuffer, src: "icon" }],
			fonts: [{ name: "Nunito Sans Variable", data: nunitoSansBuffer }],
			emoji: "noto",
			jsx: { tailwindClassesProperty: "class" },
		},
	);
