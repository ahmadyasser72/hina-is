import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };

export const formatDuration = (from: dayjs.Dayjs, to: dayjs.Dayjs) => {
	const totalMinutes = to.diff(from, "minutes");
	if (totalMinutes < 1) return "less than a minute";

	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours && minutes) return `${hours}h ${minutes}m`;
	else if (hours) return `${hours}h`;
	else return `${minutes}m`;
};
