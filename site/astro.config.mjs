// @ts-check
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({ imageService: "passthrough" }),
	output: "server",

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
				"node:fs/promises",
				"node:path",
			],
		},
	},

	devToolbar: { enabled: false },
});
