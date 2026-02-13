type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {
		clientTimezone?: string;

		parseQuery: <S extends import("zod").ZodType>(
			schema: S,
		) => import("zod").output<S>;

		useThumbhash: (id: string) => { "data-thumbhash": string } | undefined;
	}
}
