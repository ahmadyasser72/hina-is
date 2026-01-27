import { defineMiddleware } from "astro:middleware";

import { dayjs } from "~/lib/date";

export const onRequest = defineMiddleware(
	({ isPrerendered, request, cookies }, next) => {
		if (isPrerendered) return next();

		const cookieTimezone = cookies.get("timezone")?.value;
		const timezone = request.headers.get("x-timezone") ?? cookieTimezone;
		dayjs.tz.setDefault(timezone);
		if (timezone && cookieTimezone !== timezone) {
			cookies.set("timezone", timezone);
		}

		return next();
	},
);
