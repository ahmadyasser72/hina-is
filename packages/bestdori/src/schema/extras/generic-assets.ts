import z from "zod";

export const GenericAssets = <T extends z.ZodType = z.ZodString>(
	extension: string,
	item: T,
) =>
	z
		.array(z.string())
		.nonempty()
		.pipe(
			z.preprocess(
				(items) =>
					items
						.filter((it) => it.endsWith(`.${extension}`))
						.map((it) => it.replace(`.${extension}`, "")),
				z.array(item),
			),
		);
