// @ts-check
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({ imageService: "passthrough" }),
	output: "server",

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
