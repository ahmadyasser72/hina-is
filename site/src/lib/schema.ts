import z from "zod";

export const maybeArray = <T extends z.ZodType>(schema: T) =>
	z.union([z.array(schema).nonempty(), schema]);
export const alwaysArray = <T extends z.ZodType>(schema: T) =>
	schema.apply(maybeArray).transform((it) => (Array.isArray(it) ? it : [it]));
