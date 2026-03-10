// @ts-check
import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({ imageService: "passthrough" }),
	integrations: [preact()],
	output: "server",
	build: { concurrency: 4 },

	env: {
		schema: {
			GOATCOUNTER_ENDPOINT: envField.string({
				access: "public",
				context: "server",
				optional: true,
				url: true,
			}),
		},
	},

	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			exclude: ["@takumi-rs/core"],
		},
		ssr: {
			external: [
				"@takumi-rs/image-response",
				"sharp",
				"node:child_process",
				"node:crypto",
				"node:fs/promises",
				"node:path",
			],
		},
	},

	experimental: {
		fonts: [
			{
				provider: fontProviders.fontsource(),
				name: "Nunito Sans",
				cssVariable: "--font-nunito-sans",
				weights: ["400 600"],
			},
		],
	},

	devToolbar: { enabled: false },
});
