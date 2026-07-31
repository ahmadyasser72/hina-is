import { createCatppuccinPlugin } from "@catppuccin/daisyui";

export default createCatppuccinPlugin(
	"mocha",
	{
		"--radius-box": "1rem",
		"--radius-field": "0.5rem",
		"--radius-selector": "1rem",
	},
	{ prefersdark: true },
);
