import type { Bandori } from "@hina-is/bestdori/data";

import { dayjs } from "~/lib/date";

export const sortLatestBirthday = (characters: Bandori.Character[]) => {
	const now = dayjs();
	const thisYear = now.year();

	return characters
		.map(({ birthday, ...entry }) => {
			const birthdayThisYear = dayjs(birthday)
				.tz()
				.add(1, "days")
				.startOf("days")
				.set("years", thisYear);
			const nextBirthday = now.isBefore(birthdayThisYear)
				? birthdayThisYear
				: birthdayThisYear.add(1, "year");
			const untilNextBirthday = nextBirthday.diff(now);

			return {
				...entry,
				nextBirthday,
				untilNextBirthday,
				id: entry.slug.split("-").slice(1).join("-"),
			};
		})
		.sort((a, b) => a.untilNextBirthday - b.untilNextBirthday);
};
