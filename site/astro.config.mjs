// @ts-check
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({ imageService: "passthrough" }),
	output: "server",
	build: { concurrency: 4 },

	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: [
				"sharp",
				"node:child_process",
				"node:crypto",
				"node:fs/promises",
				"node:path",
			],
		},
	},

	devToolbar: { enabled: false },
});
