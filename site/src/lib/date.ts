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

	const days = Math.floor(totalMinutes / (60 * 24));
	const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
	const minutes = totalMinutes % 60;

	const parts: string[] = [];
	if (days) parts.push(`${days}d`);
	if (hours) parts.push(`${hours}h`);
	if (minutes) parts.push(`${minutes}m`);

	return parts.join(" ");
};
