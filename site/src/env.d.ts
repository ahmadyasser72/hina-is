declare namespace App {
	interface Locals {
		clientId: string;
		clientTimezone?: string;

		parseQuery: <S extends import("zod").ZodType>(
			schema: S,
		) => import("zod").output<S>;
	}
}
