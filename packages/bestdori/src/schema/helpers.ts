import z from "zod";

export const asRegionTuple = <T extends z.ZodType>(schema: T) => {
	const nullable = schema.nullable();
	return z.tuple([nullable, nullable, nullable, nullable, nullable]);
};

export const parseRegionTuple = <T extends z.ZodType>(schema: T) => {
	const nullable = schema.nullable();
	const tuple = z.tuple([schema, nullable, nullable, nullable, nullable]);

	return tuple.transform(([jp, en]) => ({ jp, en }));
};

export const dateTimestamp = z.coerce.number();
