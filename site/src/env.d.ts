declare namespace App {
	interface Locals {
		redis: import("@upstash/redis").Redis;

		clientTimezone?: string;

		parseQuery: <S extends import("zod").ZodType>(
			schema: S,
		) => import("zod").output<S>;

		useThumbhash: (id: string) => { "data-thumbhash": string } | undefined;

		prng: import("random").Random;
	}
}
