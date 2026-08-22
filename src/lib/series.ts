/**
 * The counting primitives every stats module shares: D1 row unwrapping, share
 * percentages, and gap-filled day series. Extracted because lib/waitlist.ts
 * (Waitloom's own marketing list), lib/subscribers.ts (a founder's project
 * list) and lib/product.ts (accounts and projects) all count the same shapes
 * out of different tables.
 */
import { DAY_MS, dayKey, startOfToday } from "@/lib/day";

export type DayPoint = { day: string; count: number };
export type Share = { label: string; count: number; pct: number };
export type CountRow = { label: string; n: number };

export function countRows(result: { results?: unknown[] }): CountRow[] {
	return (result.results ?? []) as CountRow[];
}

export function toShare(rows: CountRow[], denominator: number): Share[] {
	return rows.map((r) => ({
		label: r.label,
		count: Number(r.n),
		pct: denominator ? Math.round((Number(r.n) / denominator) * 100) : 0,
	}));
}

/**
 * SQL only returns days that had rows; fill the rest with zeroes so the bars
 * always span the full window. Oldest to newest, `days` long, in UTC+8.
 */
export function fillSeries(rows: CountRow[], days: number): DayPoint[] {
	const midnight = startOfToday();

	const byDay = new Map<string, number>();
	for (const row of rows) byDay.set(row.label, Number(row.n));

	const series: DayPoint[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const day = dayKey(midnight - i * DAY_MS);
		series.push({ day, count: byDay.get(day) ?? 0 });
	}
	return series;
}

export function sumPoints(points: DayPoint[]): number {
	return points.reduce((n, p) => n + p.count, 0);
}

/** The start instant of a `days`-long window ending with today, in UTC+8. */
export function seriesStart(days: number): number {
	return startOfToday() - (days - 1) * DAY_MS;
}

/** The four headline numbers every series produces the same way. */
export function edges(series: DayPoint[]) {
	return {
		today: series[series.length - 1]?.count ?? 0,
		yesterday: series[series.length - 2]?.count ?? 0,
		last7: sumPoints(series.slice(-7)),
		prev7: sumPoints(series.slice(-14, -7)),
	};
}
