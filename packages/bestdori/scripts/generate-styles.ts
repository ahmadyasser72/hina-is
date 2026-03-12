import { join } from "node:path";

import { colord } from "colord";

import { attributes, bands, characters } from "~/data";
import { getGitRootPath } from "~/utilities";

console.time("everything");

console.time("generating CSS rules");

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
	--${name}: ${color.toLowerCase()};
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

console.timeEnd("generating CSS rules");

const styles = rules.map((rule) => rule.trim()).join("\n\n");
const gitRoot = await getGitRootPath();
const target = join(gitRoot, "site/src/styles/bandori.css");

console.time(`writing styles to ${target}`);
await Bun.write(target, styles + "\n");
console.timeEnd(`writing styles to ${target}`);

console.timeEnd("everything");
