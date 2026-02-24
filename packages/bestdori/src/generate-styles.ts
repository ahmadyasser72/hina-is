import { colord } from "colord";

import { attributes, bands, characters } from "./data";

const rules: string[] = [];
const groups = [
	{ data: attributes, name: "attribute" },
	{ data: bands, name: "band" },
	{ data: characters, name: "character" },
];

for (const { data, name } of groups) {
	for (const { slug, color } of data.values()) {
		if (!color) continue;

		const selector = `[data-${name}="${slug}"]`;
		const content = colord(color).brightness() < 0.67 ? "#fff" : "#000";

		rules.push(`
${selector},
${selector} & {
  --${name}: ${color};
	--${name}-content: ${content};
}
`);
	}
}

rules.push(`
@theme inline {${groups
	.map(
		({ name }) => `
	--color-${name}: var(--${name});
	--color-${name}-content: var(--${name}-content);`,
	)
	.join("")}
}`);

for (const { name } of groups) {
	rules.push(`
@utility badge-${name} {
	@layer daisyui.l1.l2 {
		--badge-color: var(--${name});
		--badge-fg: var(--${name}-content);
	}
}

@utility btn-${name} {
	@layer daisyui.l1.l2.l3 {
		--btn-color: var(--${name});
		--btn-fg: var(--${name}-content);
	}
}

@utility tooltip-${name} {
	@layer daisyui.l1.l2 {
		--tt-bg: var(--${name});

		> .tooltip-content,
		&[data-tip]:before {
			color: var(--${name}-content);
		}
	}
}
`);
}

console.log(rules.map((rule) => rule.trim()).join("\n\n"));
