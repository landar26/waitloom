/**
 * Waitloom's own product metrics, for /admin only: how many people signed up
 * for the *tool*, and how many of them got as far as a published page.
 *
 * Deliberately separate from lib/waitlist.ts, which counts the marketing
 * landing page's email list. Those are different funnels and conflating them
 * was the reason /admin could not answer "how many users do we have".
 */
import { DAY_MS, TZ_OFFSET_MS, startOfToday } from "./day";
import {
	countRows,
	edges,
	fillSeries,
	seriesStart,
	toShare,
	type DayPoint,
	type Share,
} from "./series";

export const SERIES_DAYS = 30;

export type ProductStats = {
	users: {
		total: number;
		today: number;
		yesterday: number;
		last7: number;
		prev7: number;
		/** Oldest to newest, gap-filled, SERIES_DAYS long. */
		series: DayPoint[];
	};
	projects: {
		total: number;
		published: number;
		drafts: number;
		series: DayPoint[];
	};
	funnel: {
		/** Users with at least one project. */
		activated: number;
		/** Users with at least one published project. */
		publishers: number;
		active7: number;
		active30: number;
	};
	plans: Share[];
};

/**
 * "Active" means *edited a project* in the window, not "logged in". The
 * sessions table cannot answer the latter: lib/auth.ts deletes sessions on
 * logout and prunes them once expired, so it holds no login history at all.
 * projects.updated_at is the only durable activity signal in the schema today;
 * a real retention curve needs an events table, which we do not have.
 */
export async function getProductStats(db: D1Database): Promise<ProductStats> {
	const windowStart = seriesStart(SERIES_DAYS);
	const midnight = startOfToday();
	const day7 = midnight - 6 * DAY_MS;
	const day30 = midnight - 29 * DAY_MS;

	const [
		userTotalRow,
		userSeriesRows,
		projectStatusRows,
		projectSeriesRows,
		reachRow,
		activeRow,
		planRows,
	] = await db.batch<Record<string, unknown>>([
		db.prepare("SELECT COUNT(*) AS n FROM users"),
		db
			.prepare(
				`SELECT strftime('%Y-%m-%d', CAST((created_at + ?) / 1000 AS INTEGER), 'unixepoch') AS label,
					COUNT(*) AS n
				 FROM users
				 WHERE created_at >= ?
				 GROUP BY label
				 ORDER BY label`,
			)
			.bind(TZ_OFFSET_MS, windowStart),
		db.prepare(
			"SELECT status AS label, COUNT(*) AS n FROM projects GROUP BY label",
		),
		db
			.prepare(
				`SELECT strftime('%Y-%m-%d', CAST((created_at + ?) / 1000 AS INTEGER), 'unixepoch') AS label,
					COUNT(*) AS n
				 FROM projects
				 WHERE created_at >= ?
				 GROUP BY label
				 ORDER BY label`,
			)
			.bind(TZ_OFFSET_MS, windowStart),
		db.prepare(
			`SELECT COUNT(DISTINCT user_id) AS activated,
				COUNT(DISTINCT CASE WHEN status = 'published' THEN user_id END) AS publishers
			 FROM projects`,
		),
		db
			.prepare(
				`SELECT COUNT(DISTINCT CASE WHEN updated_at >= ? THEN user_id END) AS active7,
					COUNT(DISTINCT CASE WHEN updated_at >= ? THEN user_id END) AS active30
				 FROM projects`,
			)
			.bind(day7, day30),
		db.prepare(
			"SELECT plan AS label, COUNT(*) AS n FROM users GROUP BY label ORDER BY n DESC",
		),
	]);

	const total = Number((userTotalRow.results?.[0] as { n?: number })?.n ?? 0);
	const userSeries = fillSeries(countRows(userSeriesRows), SERIES_DAYS);

	const byStatus = new Map<string, number>();
	for (const row of countRows(projectStatusRows)) {
		byStatus.set(row.label, Number(row.n));
	}
	const published = byStatus.get("published") ?? 0;
	const projectTotal = [...byStatus.values()].reduce((n, c) => n + c, 0);

	const reach = (reachRow.results?.[0] ?? {}) as {
		activated?: number;
		publishers?: number;
	};
	const active = (activeRow.results?.[0] ?? {}) as {
		active7?: number;
		active30?: number;
	};

	return {
		users: { total, ...edges(userSeries), series: userSeries },
		projects: {
			total: projectTotal,
			published,
			drafts: projectTotal - published,
			series: fillSeries(countRows(projectSeriesRows), SERIES_DAYS),
		},
		funnel: {
			activated: Number(reach.activated ?? 0),
			publishers: Number(reach.publishers ?? 0),
			active7: Number(active.active7 ?? 0),
			active30: Number(active.active30 ?? 0),
		},
		plans: toShare(countRows(planRows), total),
	};
}
