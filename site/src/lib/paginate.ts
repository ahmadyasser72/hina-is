import type { APIContext } from "astro";
import z from "zod";

interface PaginateProps<T> {
	items: T[];
	context: APIContext;
	size: number;
	extraProps: Record<string, string>;
	params?: Record<string, any>;
}

const PageSchema = z.coerce.number().positive().catch(1);
export const paginate = <T>({
	items,
	context,
	size,
	extraProps,
	params,
}: PaginateProps<T>) => {
	const current = PageSchema.parse(context.url.searchParams.get("page"));
	const offset = (current - 1) * size;

	const hasNextPage = offset + size < items.length;
	return {
		current,
		items: items.slice(offset, offset + size),
		isLastElement: (idx: number) => idx === size - 1,
		props: hasNextPage && {
			"hx-get": context.url.pathname,
			"hx-trigger": "intersect once",
			...extraProps,
			"hx-vals": JSON.stringify({ ...params, page: current + 1 }),
		},
	};
};
