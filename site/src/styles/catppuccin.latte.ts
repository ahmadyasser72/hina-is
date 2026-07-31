import { createCatppuccinPlugin } from "@catppuccin/daisyui";

export default createCatppuccinPlugin(
	"latte",
	{
		"--radius-box": "1rem",
		"--radius-field": "0.5rem",
		"--radius-selector": "1rem",
	},
	{ default: true },
);
