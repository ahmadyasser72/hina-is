import z from "zod";

export const asRegionTuple = <T extends z.ZodType>(schema: T) => {
	const nullable = schema.nullable();
	return z.tuple([nullable, nullable, nullable, nullable, nullable]);
};

export const parseRegionTuple = <T extends z.ZodType>(schema: T) => {
	const nullable = schema.nullable();
	const tuple = z.tuple([schema, nullable, nullable, nullable, nullable]);

	return tuple.pipe(
		z.preprocess(
			([jp, en]) => ({ jp, en }),
			z.strictObject({ jp: schema, en: nullable }),
		),
	);
};

export const dateTimestamp = z.coerce.number().transform((it) => new Date(it));
