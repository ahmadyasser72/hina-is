// @ts-check
import { exec } from "node:child_process";

import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
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
	build: { concurrency: 4 },

	adapter: cloudflare({
		imageService: "passthrough",
		prerenderEnvironment: "node",
	}),
	output: "server",
	trailingSlash: "never",
	cache: { provider: cacheCloudflare() },
	session: {
		driver: {
			entrypoint: "unstorage/drivers/null",
		},
	},

	integrations: [preact()],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Cause",
			cssVariable: "--font-cause",
			subsets: ["latin"],
			weights: ["100 900"],
			fallbacks: [],
		},
		{
			provider: fontProviders.google(),
			name: "Kosugi Maru",
			cssVariable: "--font-kosugi-maru",
			subsets: ["japanese", "latin-ext"],
			formats: ["ttf"],
		},
	],

	env: {
		schema: {
			SITE_NAME: envField.string({
				access: "public",
				context: "client",
				optional: true,
				default: "hina is ♥",
			}),
			UMAMI_SITE_ID: envField.string({
				access: "public",
				context: "server",
				optional: true,
			}),

			UPSTASH_REDIS_REST_URL: envField.string({
				access: "secret",
				context: "server",
				optional: true,
			}),
			UPSTASH_REDIS_REST_TOKEN: envField.string({
				access: "secret",
				context: "server",
				optional: true,
			}),

			GEMINI_API_KEY: envField.string({
				access: "secret",
				context: "server",
				optional: true,
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
	devToolbar: { enabled: false },
});
