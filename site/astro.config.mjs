// @ts-check
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({ imageService: "passthrough" }),
	output: "server",
	build: { concurrency: 4 },

	env: {
		schema: {
			UPSTASH_REDIS_REST_URL: envField.string({
				access: "secret",
				context: "server",
			}),
			UPSTASH_REDIS_REST_TOKEN: envField.string({
				access: "secret",
				context: "server",
			}),
		},
	},

	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: [
				"sharp",
				"node:child_process",
				"node:events",
				"node:fs/promises",
				"node:http",
				"node:http2",
				"node:path",
				"node:stream",
				"node:timers",
			],
		},
	},

	devToolbar: { enabled: false },
});
