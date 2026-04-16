// @ts-check
import { exec } from "node:child_process";

import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField, fontProviders } from "astro/config";

const GITHUB_URL = await new Promise((resolve, reject) => {
	exec("git config --get remote.origin.url", (error, stdout) =>
		error ? reject(error) : resolve(stdout.trim().replace(/.git$/, "/")),
	);
});

// https://astro.build/config
export default defineConfig({
	site: "https://hina-is.notsweet.workers.dev/",
	adapter: cloudflare({ imageService: "passthrough" }),
	integrations: [preact()],
	output: "server",
	build: { concurrency: 4 },

	env: {
		schema: {
			SITE_NAME: envField.string({
				access: "public",
				context: "client",
				optional: true,
				default: "hina is ♥",
			}),
			GOATCOUNTER_ENDPOINT: envField.string({
				access: "public",
				context: "server",
				optional: true,
				url: true,
			}),

			UPSTASH_REDIS_REST_URL: envField.string({
				access: "secret",
				context: "server",
			}),
			UPSTASH_REDIS_REST_TOKEN: envField.string({
				access: "secret",
				context: "server",
			}),

			GEMINI_API_KEY: envField.string({
				access: "secret",
				context: "server",
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

		define: {
			__BUILD_DATE__: JSON.stringify(Date.now()),
			__GITHUB_URL__: JSON.stringify(GITHUB_URL),
		},

		server: { allowedHosts: [".lhr.life"] },
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
