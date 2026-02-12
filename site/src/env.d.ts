declare namespace App {
	interface Locals {
		clientTimezone?: string;

		parseQuery: <S extends import("zod").ZodType>(
			schema: S,
		) => import("zod").output<S>;
	}
}
