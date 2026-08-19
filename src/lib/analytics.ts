import { DAY_MS, dayKey, recentDays } from "./day";

/**
 * The pre-launch site counts as its own project. When the MVP grows real
 * projects, this constant is the only thing that has to become a lookup.
 */
export const PROJECT_ID = "waitloom";

export type HitInput = {
	projectId: string;
	day: string;
	source: string;
	ipHash: string | null;
};

/** Records one pageview, and one visitor if this is their first view today. */
export async function recordHit(
	db: D1Database,
	input: HitInput,
): Promise<void> {
	// Without an IP we cannot dedupe, so count the view as a visitor rather than
	// silently under-report. On Workers cf-connecting-ip is always present; this
	// only bites in local dev.
	let isNewVisitor = true;

	if (input.ipHash) {
		const seen = await db
			.prepare(
				"INSERT OR IGNORE INTO visitor_days (project_id, day, ip_hash) VALUES (?, ?, ?)",
			)
			.bind(input.projectId, input.day, input.ipHash)
			.run();
		isNewVisitor = (seen.meta.changes ?? 0) > 0;
	}

	await db
		.prepare(
			`INSERT INTO page_stats (project_id, day, source, views, visitors)
			 VALUES (?, ?, ?, 1, ?)
			 ON CONFLICT (project_id, day, source) DO UPDATE SET
				views    = views + 1,
				visitors = visitors + excluded.visitors`,
		)
		.bind(input.projectId, input.day, input.source, isNewVisitor ? 1 : 0)
		.run();
}

export type TrafficDay = { day: string; views: number; visitors: number };
export type SourceTraffic = { label: string; views: number; visitors: number };

export type Traffic = {
	/** Totals over the window, not all time. */
	views: number;
	visitors: number;
	/** Oldest to newest, gap-filled, `days` long. */
	series: TrafficDay[];
	sources: SourceTraffic[];
	/** True once anything has ever been recorded, so the UI can stay quiet until then. */
	tracking: boolean;
	/**
	 * False when the traffic queries failed outright — a missing migration, a
	 * D1 outage. Distinct from `tracking: false`, which means "working, nothing
	 * counted yet". Traffic is a side panel; it must never take the subscriber
	 * list down with it.
	 */
	available: boolean;
};

type TrafficRow = { day?: string; label?: string; views: number; visitors: number };

export async function getTraffic(
	db: D1Database,
	projectId: string,
	days: number,
): Promise<Traffic> {
	const window = recentDays(days);

	try {
		return await queryTraffic(db, projectId, window);
	} catch (error) {
		console.error("getTraffic failed", error);
		return {
			views: 0,
			visitors: 0,
			series: window.map((day) => ({ day, views: 0, visitors: 0 })),
			sources: [],
			tracking: false,
			available: false,
		};
	}
}

async function queryTraffic(
	db: D1Database,
	projectId: string,
	window: string[],
): Promise<Traffic> {
	const from = window[0];

	const [dayRows, sourceRows, everRow] = await db.batch<Record<string, unknown>>(
		[
			db
				.prepare(
					`SELECT day, SUM(views) AS views, SUM(visitors) AS visitors
					 FROM page_stats WHERE project_id = ? AND day >= ?
					 GROUP BY day ORDER BY day`,
				)
				.bind(projectId, from),
			db
				.prepare(
					`SELECT source AS label, SUM(views) AS views, SUM(visitors) AS visitors
					 FROM page_stats WHERE project_id = ? AND day >= ?
					 GROUP BY source ORDER BY visitors DESC, views DESC`,
				)
				.bind(projectId, from),
			db
				.prepare("SELECT COUNT(*) AS n FROM page_stats WHERE project_id = ?")
				.bind(projectId),
		],
	);

	const byDay = new Map<string, TrafficRow>();
	for (const row of (dayRows.results ?? []) as TrafficRow[]) {
		if (row.day) byDay.set(row.day, row);
	}

	const series: TrafficDay[] = window.map((day) => ({
		day,
		views: Number(byDay.get(day)?.views ?? 0),
		visitors: Number(byDay.get(day)?.visitors ?? 0),
	}));

	const sources = ((sourceRows.results ?? []) as TrafficRow[]).map((row) => ({
		label: String(row.label),
		views: Number(row.views),
		visitors: Number(row.visitors),
	}));

	return {
		views: series.reduce((n, d) => n + d.views, 0),
		visitors: series.reduce((n, d) => n + d.visitors, 0),
		series,
		sources,
		tracking: Number((everRow.results?.[0] as { n?: number })?.n ?? 0) > 0,
		available: true,
	};
}

/** Drops visitor dedupe rows older than the reporting window. */
export async function pruneVisitorDays(
	db: D1Database,
	keepDays: number,
): Promise<void> {
	await db
		.prepare("DELETE FROM visitor_days WHERE day < ?")
		.bind(dayKey(Date.now() - keepDays * DAY_MS))
		.run();
}
