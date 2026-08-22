import { PRODUCT_TYPES, type ProductType } from "@/i18n/dictionaries";
import { clampText } from "./validation";
import { TZ_OFFSET_MS } from "./day";
import {
	countRows,
	edges,
	fillSeries,
	seriesStart,
	toShare,
	type CountRow,
	type DayPoint,
	type Share,
} from "./series";

export const QUESTION_KEYS = ["building", "pain"] as const;
export type QuestionKey = (typeof QUESTION_KEYS)[number];

export type JoinInput = {
	email: string;
	lang: string;
	source: string;
	referrer: string | null;
	utm_source: string | null;
	utm_medium: string | null;
	utm_campaign: string | null;
	ipHash: string | null;
};

export type SubscriberRow = {
	id: string;
	email: string;
	lang: string;
	source: string | null;
	created_at: number;
	building: string | null;
	pain: string | null;
};

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

export const SERIES_DAYS = 30;

export async function isRateLimited(
	db: D1Database,
	ipHash: string | null,
): Promise<boolean> {
	if (!ipHash) return false;
	const row = await db
		.prepare(
			"SELECT COUNT(*) AS n FROM subscribers WHERE ip_hash = ? AND created_at > ?",
		)
		.bind(ipHash, Date.now() - RATE_WINDOW_MS)
		.first<{ n: number }>();
	return (row?.n ?? 0) >= RATE_LIMIT;
}

/** Position in the queue, counted by insertion order rather than timestamp. */
async function positionOf(db: D1Database, id: string): Promise<number> {
	const row = await db
		.prepare(
			"SELECT COUNT(*) AS n FROM subscribers WHERE rowid <= (SELECT rowid FROM subscribers WHERE id = ?)",
		)
		.bind(id)
		.first<{ n: number }>();
	return row?.n ?? 1;
}

export async function joinWaitlist(
	db: D1Database,
	input: JoinInput,
): Promise<{ id: string; position: number; existed: boolean }> {
	const existing = await db
		.prepare("SELECT id FROM subscribers WHERE email = ?")
		.bind(input.email)
		.first<{ id: string }>();

	if (existing) {
		return {
			id: existing.id,
			position: await positionOf(db, existing.id),
			existed: true,
		};
	}

	const id = crypto.randomUUID();
	await db
		.prepare(
			`INSERT INTO subscribers
				(id, email, lang, source, referrer, utm_source, utm_medium, utm_campaign, ip_hash, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			id,
			input.email,
			input.lang,
			input.source,
			input.referrer,
			input.utm_source,
			input.utm_medium,
			input.utm_campaign,
			input.ipHash,
			Date.now(),
		)
		.run();

	return { id, position: await positionOf(db, id), existed: false };
}

export async function saveAnswers(
	db: D1Database,
	subscriberId: string,
	answers: { building?: unknown; pain?: unknown },
): Promise<boolean> {
	const subscriber = await db
		.prepare("SELECT id FROM subscribers WHERE id = ?")
		.bind(subscriberId)
		.first<{ id: string }>();
	if (!subscriber) return false;

	const values: Array<{ key: QuestionKey; value: string }> = [];

	if (
		typeof answers.building === "string" &&
		(PRODUCT_TYPES as readonly string[]).includes(answers.building)
	) {
		values.push({ key: "building", value: answers.building as ProductType });
	}

	const pain = clampText(answers.pain);
	if (pain) values.push({ key: "pain", value: pain });

	if (values.length === 0) return true;

	const statements = values.flatMap(({ key, value }) => [
		db
			.prepare(
				"DELETE FROM answers WHERE subscriber_id = ? AND question_key = ?",
			)
			.bind(subscriberId, key),
		db
			.prepare(
				"INSERT INTO answers (id, subscriber_id, question_key, value) VALUES (?, ?, ?, ?)",
			)
			.bind(crypto.randomUUID(), subscriberId, key, value),
	]);

	await db.batch(statements);
	return true;
}

export async function listSubscribers(
	db: D1Database,
	limit = 500,
): Promise<SubscriberRow[]> {
	const { results } = await db
		.prepare(
			`SELECT s.id, s.email, s.lang, s.source, s.created_at,
				MAX(CASE WHEN a.question_key = 'building' THEN a.value END) AS building,
				MAX(CASE WHEN a.question_key = 'pain' THEN a.value END) AS pain
			 FROM subscribers s
			 LEFT JOIN answers a ON a.subscriber_id = s.id
			 GROUP BY s.id
			 ORDER BY s.created_at DESC
			 LIMIT ?`,
		)
		.bind(limit)
		.all<SubscriberRow>();
	return results ?? [];
}

// Re-exported so existing importers (admin page, dashboard) keep one source.
export type { DayPoint, Share };

export type Stats = {
	total: number;
	today: number;
	yesterday: number;
	last7: number;
	prev7: number;
	/** Oldest to newest, gap-filled, SERIES_DAYS long. */
	series: DayPoint[];
	sources: Share[];
	audience: Share[];
	answered: { building: number; pain: number };
	langs: Share[];
	utmMedium: Share[];
	utmCampaign: Share[];
};

export async function getStats(db: D1Database): Promise<Stats> {
	const windowStart = seriesStart(SERIES_DAYS);

	const [
		totalRow,
		seriesRows,
		sourceRows,
		audienceRows,
		answeredRows,
		langRows,
		utmRows,
	] = await db.batch<Record<string, unknown>>([
		db.prepare("SELECT COUNT(*) AS n FROM subscribers"),
		db
			.prepare(
				`SELECT strftime('%Y-%m-%d', CAST((created_at + ?) / 1000 AS INTEGER), 'unixepoch') AS label,
					COUNT(*) AS n
				 FROM subscribers
				 WHERE created_at >= ?
				 GROUP BY label
				 ORDER BY label`,
			)
			.bind(TZ_OFFSET_MS, windowStart),
		db.prepare(
			"SELECT COALESCE(source, 'direct') AS label, COUNT(*) AS n FROM subscribers GROUP BY label ORDER BY n DESC",
		),
		db.prepare(
			"SELECT value AS label, COUNT(*) AS n FROM answers WHERE question_key = 'building' GROUP BY value ORDER BY n DESC",
		),
		db.prepare(
			"SELECT question_key AS label, COUNT(DISTINCT subscriber_id) AS n FROM answers GROUP BY question_key",
		),
		db.prepare(
			"SELECT lang AS label, COUNT(*) AS n FROM subscribers GROUP BY label ORDER BY n DESC",
		),
		db.prepare(
			`SELECT 'medium' AS kind, utm_medium AS label, COUNT(*) AS n
			   FROM subscribers WHERE utm_medium IS NOT NULL AND utm_medium <> ''
			   GROUP BY label
			 UNION ALL
			 SELECT 'campaign', utm_campaign, COUNT(*)
			   FROM subscribers WHERE utm_campaign IS NOT NULL AND utm_campaign <> ''
			   GROUP BY utm_campaign`,
		),
	]);

	const total = Number((totalRow.results?.[0] as { n?: number })?.n ?? 0);

	const series = fillSeries(countRows(seriesRows), SERIES_DAYS);

	const answeredBy = new Map<string, number>();
	for (const row of countRows(answeredRows))
		answeredBy.set(row.label, Number(row.n));

	const audienceRaw = countRows(audienceRows);
	const audienceTotal = audienceRaw.reduce((s, r) => s + Number(r.n), 0);

	const utmRaw = (utmRows.results ?? []) as Array<CountRow & { kind: string }>;
	const utmOf = (kind: string): Share[] => {
		const rows = utmRaw
			.filter((r) => r.kind === kind)
			.sort((a, b) => Number(b.n) - Number(a.n));
		const subtotal = rows.reduce((s, r) => s + Number(r.n), 0);
		return toShare(rows.slice(0, 8), subtotal);
	};

	return {
		total,
		...edges(series),
		series,
		sources: toShare(countRows(sourceRows), total),
		audience: toShare(audienceRaw, audienceTotal),
		answered: {
			building: answeredBy.get("building") ?? 0,
			pain: answeredBy.get("pain") ?? 0,
		},
		langs: toShare(countRows(langRows), total),
		utmMedium: utmOf("medium"),
		utmCampaign: utmOf("campaign"),
	};
}

function csvCell(value: unknown): string {
	const s = value === null || value === undefined ? "" : String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: SubscriberRow[]): string {
	const header = ["email", "joined", "lang", "source", "building", "pain"];
	const lines = rows.map((r) =>
		[
			r.email,
			new Date(r.created_at).toISOString(),
			r.lang,
			r.source ?? "",
			r.building ?? "",
			r.pain ?? "",
		]
			.map(csvCell)
			.join(","),
	);
	// BOM so Excel opens the CJK answers without mangling them.
	return `﻿${header.join(",")}\n${lines.join("\n")}\n`;
}
