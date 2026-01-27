import type { APIContext } from "astro";
import z from "zod";

interface PaginateProps<T> {
	items: T[];
	context: APIContext;
	size: number;
	extraProps: Record<string, string>;
}

const PageSchema = z.coerce.number().positive().catch(1);
export const paginate = <T>({
	items,
	context,
	size,
	extraProps,
}: PaginateProps<T>) => {
	const current = PageSchema.parse(context.url.searchParams.get("page"));
	const offset = (current - 1) * size;

	const pageItems = items.slice(offset, offset + size);
	const isLastElement = (idx: number) => idx === size - 1;
	const out = { current, isLastElement, items: pageItems };

	const hasNextPage = offset + size < items.length;
	if (!hasNextPage) return { ...out, props: {} };

	const url = new URL(context.url);
	url.search = "";
	url.searchParams.set("page", (current + 1).toString());
	return {
		...out,
		props: {
			"hx-get": url.href,
			"hx-trigger": "intersect once",
			...extraProps,
		},
	};
};
