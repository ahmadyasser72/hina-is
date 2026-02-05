import { defineMiddleware } from "astro:middleware";
import z from "zod";

import { dayjs } from "~/lib/date";
import { maybeArray } from "./lib/schema";

export const onRequest = defineMiddleware(
	({ isPrerendered, request, cookies, locals, url }, next) => {
		if (isPrerendered) return next();

		const cookieTimezone = cookies.get("timezone")?.value;
		locals.clientTimezone = request.headers.get("x-timezone") ?? cookieTimezone;
		dayjs.tz.setDefault(locals.clientTimezone);
		if (locals.clientTimezone && cookieTimezone !== locals.clientTimezone) {
			cookies.set("timezone", locals.clientTimezone, { path: "/" });
		}

		const cookieClientId = cookies.get("client-id")?.value;
		locals.clientId = cookieClientId ?? crypto.randomUUID();
		if (!cookieClientId) {
			cookies.set("client-id", locals.clientId, { path: "/" });
		}

		locals.parseQuery = (schema) => {
			const querySchema = z
				.instanceof(URLSearchParams)
				.pipe(
					z.preprocess(
						(searchParams) =>
							[...searchParams.entries()].reduce<
								Record<string, string | string[]>
							>((acc, [key, value]) => {
								if (!value) return acc;

								if (!(key in acc)) acc[key] = value;
								else if (Array.isArray(acc[key])) acc[key].push(value);
								else acc[key] = [acc[key], value];

								return acc;
							}, {}),
						z.record(z.string(), z.string().nonempty().apply(maybeArray)),
					),
				)
				.transform((query) => {
					for (const [key, value] of Object.entries(query)) {
						if (value === "reset" || value.includes("reset")) delete query[key];
					}

					return query;
				});

			const query = querySchema.parse(url.searchParams);
			return schema.parse(query);
		};

		return next();
	},
);
