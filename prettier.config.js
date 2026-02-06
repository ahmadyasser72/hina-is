/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
	trailingComma: "all",
	semi: true,
	singleQuote: false,
	useTabs: true,

	plugins: [
		"prettier-plugin-astro",
		"@ianvs/prettier-plugin-sort-imports",
		"prettier-plugin-tailwindcss",
		"@xeonlink/prettier-plugin-organize-attributes",
	],
	overrides: [{ files: "*.astro", options: { parser: "astro" } }],

	importOrder: [
		"^@hina-is/(.*)$",
		"",
		"<THIRD_PARTY_MODULES>",
		"",
		"^~/(.*)$",
		"^[./]",
	],

	attributeGroups: ["^hx-(get|post|trigger)$", "$CODE_GUIDE", "^hx-"],
	attributeSort: "ASC",
};

export default config;
