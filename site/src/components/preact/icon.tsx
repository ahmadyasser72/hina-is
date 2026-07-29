import clsx from "clsx";

import type { IconName } from "../shared/icon.astro";

export const Icon = (props: { name: IconName; class?: string }) => (
	<span class={clsx("iconify", props.name, props.class)}></span>
);
