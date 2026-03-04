import z from "zod";

export const schema = z.object({ query: z.string().toLowerCase().optional() });
