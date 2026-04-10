import z from "zod";

export const StampId = z.templateLiteral(["stamp_", z.number()]);
