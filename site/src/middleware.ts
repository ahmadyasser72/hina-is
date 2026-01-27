import { defineMiddleware } from "astro:middleware";

import { dayjs } from "~/lib/date";

export const onRequest = defineMiddleware(
	({ isPrerendered, request, cookies, locals }, next) => {
		if (isPrerendered) return next();

		const cookieTimezone = cookies.get("timezone")?.value;
		locals.clientTimezone = request.headers.get("x-timezone") ?? cookieTimezone;
		dayjs.tz.setDefault(locals.clientTimezone);
		if (locals.clientTimezone && cookieTimezone !== locals.clientTimezone) {
			cookies.set("timezone", locals.clientTimezone, { path: "/" });
		}

		return next();
	},
);
