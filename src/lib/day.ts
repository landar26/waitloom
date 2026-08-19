/**
 * One definition of "a day" for the whole app: Beijing time, because local time
 * on Workers is UTC and a founder in UTC+8 reading "today" means their today.
 */
export const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** epoch ms -> YYYY-MM-DD in Beijing time */
export function dayKey(ms: number): string {
	return new Date(ms + TZ_OFFSET_MS).toISOString().slice(0, 10);
}

/** Beijing midnight today, back as an epoch ms instant. */
export function startOfToday(now: number = Date.now()): number {
	return Date.parse(`${dayKey(now)}T00:00:00Z`) - TZ_OFFSET_MS;
}

/** The last `count` day keys, oldest to newest, ending today. */
export function recentDays(count: number, now: number = Date.now()): string[] {
	const start = startOfToday(now);
	return Array.from({ length: count }, (_, i) =>
		dayKey(start - (count - 1 - i) * DAY_MS),
	);
}
