import { TZ_OFFSET_MS } from "./day";
import {
	countRows,
	edges,
	fillSeries,
	seriesStart,
	toShare,
	type DayPoint,
	type Share,
} from "./series";
import { clampText } from "./validation";
import type { Question } from "./projects";

/**
 * Per-project waitlists. The marketing site's own list lives in lib/waitlist.ts
 * against its own tables; this is the same shape of query, scoped to a project
 * and answering questions the founder wrote rather than two fixed ones.
 */

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;

export const SERIES_DAYS = 30;

export type SubscriberRow = {
	id: string;
	email: string;
	source: string | null;
	referrer: string | null;
	utm_source: string | null;
	utm_medium: string | null;
	utm_campaign: string | null;
	created_at: number;
};

export type Subscriber = SubscriberRow & {
	/** question_id -> the answer, choices joined with ", ". */
	answers: Record<string, string>;
};

export type JoinInput = {
	projectId: string;
	email: string;
	source: string;
	referrer: string | null;
	utm_source: string | null;
	utm_medium: string | null;
	utm_campaign: string | null;
	ipHash: string | null;
};

/** Signup flood control, counted across every project one address touched. */
export async function isRateLimited(
	db: D1Database,
	ipHash: string | null,
): Promise<boolean> {
	if (!ipHash) return false;
	const row = await db
		.prepare(
			"SELECT COUNT(*) AS n FROM project_subscribers WHERE ip_hash = ? AND created_at > ?",
		)
		.bind(ipHash, Date.now() - RATE_WINDOW_MS)
		.first<{ n: number }>();
	return (row?.n ?? 0) >= RATE_LIMIT;
}

export async function countSubscribers(
	db: D1Database,
	projectId: string,
): Promise<number> {
	const row = await db
		.prepare("SELECT COUNT(*) AS n FROM project_subscribers WHERE project_id = ?")
		.bind(projectId)
		.first<{ n: number }>();
	return Number(row?.n ?? 0);
}

/** Position in the queue, by insertion order rather than timestamp. */
async function positionOf(
	db: D1Database,
	projectId: string,
	id: string,
): Promise<number> {
	const row = await db
		.prepare(
			`SELECT COUNT(*) AS n FROM project_subscribers
			 WHERE project_id = ?
			   AND rowid <= (SELECT rowid FROM project_subscribers WHERE id = ?)`,
		)
		.bind(projectId, id)
		.first<{ n: number }>();
	return row?.n ?? 1;
}

export async function joinWaitlist(
	db: D1Database,
	input: JoinInput,
): Promise<{ id: string; position: number; existed: boolean }> {
	const existing = await db
		.prepare("SELECT id FROM project_subscribers WHERE project_id = ? AND email = ?")
		.bind(input.projectId, input.email)
		.first<{ id: string }>();

	if (existing) {
		return {
			id: existing.id,
			position: await positionOf(db, input.projectId, existing.id),
			existed: true,
		};
	}

	const id = crypto.randomUUID();
	await db
		.prepare(
			`INSERT INTO project_subscribers
				(id, project_id, email, source, referrer, utm_source, utm_medium, utm_campaign, ip_hash, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			id,
			input.projectId,
			input.email,
			input.source,
			input.referrer,
			input.utm_source,
			input.utm_medium,
			input.utm_campaign,
			input.ipHash,
			Date.now(),
		)
		.run();

	return { id, position: await positionOf(db, input.projectId, id), existed: false };
}

/**
 * Stores answers to this project's own questions. Anything referencing a
 * question the project does not own is dropped rather than trusted.
 */
export async function saveAnswers(
	db: D1Database,
	projectId: string,
	subscriberId: string,
	raw: unknown,
	questions: Question[],
): Promise<boolean> {
	const subscriber = await db
		.prepare("SELECT id FROM project_subscribers WHERE id = ? AND project_id = ?")
		.bind(subscriberId, projectId)
		.first<{ id: string }>();
	if (!subscriber) return false;

	const answers = (raw ?? {}) as Record<string, unknown>;
	const byId = new Map(questions.map((q) => [q.id, q]));
	const values: Array<{ questionId: string; value: string }> = [];

	for (const [questionId, given] of Object.entries(answers)) {
		const question = byId.get(questionId);
		if (!question) continue;

		const list = (Array.isArray(given) ? given : [given])
			.map((v) => clampText(v, 300))
			.filter((v): v is string => Boolean(v));

		const allowed =
			question.type === "short_text"
				? list.slice(0, 1)
				: list.filter((v) => question.options.includes(v)).slice(
						0,
						question.type === "single_choice" ? 1 : question.options.length,
					);

		if (allowed.length === 0) continue;
		values.push({ questionId, value: allowed.join(", ") });
	}

	if (values.length === 0) return true;

	await db.batch(
		values.flatMap(({ questionId, value }) => [
			db
				.prepare(
					"DELETE FROM project_answers WHERE subscriber_id = ? AND question_id = ?",
				)
				.bind(subscriberId, questionId),
			db
				.prepare(
					"INSERT INTO project_answers (id, subscriber_id, question_id, value) VALUES (?, ?, ?, ?)",
				)
				.bind(crypto.randomUUID(), subscriberId, questionId, value),
		]),
	);

	return true;
}

export async function listSubscribers(
	db: D1Database,
	projectId: string,
	limit = 500,
): Promise<Subscriber[]> {
	const [subs, answers] = await db.batch<Record<string, unknown>>([
		db
			.prepare(
				`SELECT id, email, source, referrer, utm_source, utm_medium, utm_campaign, created_at
				 FROM project_subscribers WHERE project_id = ?
				 ORDER BY created_at DESC LIMIT ?`,
			)
			.bind(projectId, limit),
		db
			.prepare(
				`SELECT a.subscriber_id, a.question_id, a.value
				 FROM project_answers a
				 JOIN project_subscribers s ON s.id = a.subscriber_id
				 WHERE s.project_id = ?`,
			)
			.bind(projectId),
	]);

	const bySubscriber = new Map<string, Record<string, string>>();
	for (const row of (answers.results ?? []) as Array<{
		subscriber_id: string;
		question_id: string;
		value: string;
	}>) {
		const bucket = bySubscriber.get(row.subscriber_id) ?? {};
		bucket[row.question_id] = row.value;
		bySubscriber.set(row.subscriber_id, bucket);
	}

	return ((subs.results ?? []) as SubscriberRow[]).map((row) => ({
		...row,
		answers: bySubscriber.get(row.id) ?? {},
	}));
}

export async function deleteSubscriber(
	db: D1Database,
	projectId: string,
	id: string,
): Promise<boolean> {
	const result = await db
		.prepare("DELETE FROM project_subscribers WHERE id = ? AND project_id = ?")
		.bind(id, projectId)
		.run();
	return (result.meta.changes ?? 0) > 0;
}

// Re-exported so existing importers (the dashboard pages) keep one source.
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
	utmCampaign: Share[];
};

export async function getStats(
	db: D1Database,
	projectId: string,
): Promise<Stats> {
	const windowStart = seriesStart(SERIES_DAYS);

	const [totalRow, seriesRows, sourceRows, campaignRows] = await db.batch<
		Record<string, unknown>
	>([
		db
			.prepare("SELECT COUNT(*) AS n FROM project_subscribers WHERE project_id = ?")
			.bind(projectId),
		db
			.prepare(
				`SELECT strftime('%Y-%m-%d', CAST((created_at + ?) / 1000 AS INTEGER), 'unixepoch') AS label,
					COUNT(*) AS n
				 FROM project_subscribers
				 WHERE project_id = ? AND created_at >= ?
				 GROUP BY label ORDER BY label`,
			)
			.bind(TZ_OFFSET_MS, projectId, windowStart),
		db
			.prepare(
				`SELECT COALESCE(source, 'direct') AS label, COUNT(*) AS n
				 FROM project_subscribers WHERE project_id = ?
				 GROUP BY label ORDER BY n DESC`,
			)
			.bind(projectId),
		db
			.prepare(
				`SELECT utm_campaign AS label, COUNT(*) AS n
				 FROM project_subscribers
				 WHERE project_id = ? AND utm_campaign IS NOT NULL AND utm_campaign <> ''
				 GROUP BY label ORDER BY n DESC LIMIT 8`,
			)
			.bind(projectId),
	]);

	const total = Number((totalRow.results?.[0] as { n?: number })?.n ?? 0);

	const series = fillSeries(countRows(seriesRows), SERIES_DAYS);

	return {
		total,
		...edges(series),
		series,
		sources: toShare(countRows(sourceRows), total),
		utmCampaign: toShare(countRows(campaignRows), total),
	};
}

export type AnswerBreakdown = {
	question: Question;
	answered: number;
	options: Share[];
	/** Free-text replies, newest first. Empty for choice questions. */
	texts: string[];
};

/** "47% Indie Developer" — the payoff of asking validation questions at all. */
export async function getAnswerBreakdown(
	db: D1Database,
	projectId: string,
	questions: Question[],
): Promise<AnswerBreakdown[]> {
	if (questions.length === 0) return [];

	const { results } = await db
		.prepare(
			`SELECT a.question_id, a.value, s.created_at
			 FROM project_answers a
			 JOIN project_subscribers s ON s.id = a.subscriber_id
			 WHERE s.project_id = ?
			 ORDER BY s.created_at DESC`,
		)
		.bind(projectId)
		.all<{ question_id: string; value: string; created_at: number }>();

	const rows = results ?? [];

	return questions.map((question) => {
		const mine = rows.filter((r) => r.question_id === question.id);

		if (question.type === "short_text") {
			return {
				question,
				answered: mine.length,
				options: [],
				texts: mine.map((r) => r.value).slice(0, 200),
			};
		}

		// A multi-choice answer is stored as one joined string; count each choice.
		const counts = new Map<string, number>();
		for (const row of mine) {
			for (const choice of row.value.split(", ")) {
				if (question.options.includes(choice)) {
					counts.set(choice, (counts.get(choice) ?? 0) + 1);
				}
			}
		}

		const total = [...counts.values()].reduce((n, c) => n + c, 0);
		const options = question.options
			.map((label) => ({ label, n: counts.get(label) ?? 0 }))
			.sort((a, b) => b.n - a.n);

		return {
			question,
			answered: mine.length,
			options: toShare(options, total),
			texts: [],
		};
	});
}

function csvCell(value: unknown): string {
	const s = value === null || value === undefined ? "" : String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Subscriber[], questions: Question[]): string {
	const header = [
		"email",
		"joined",
		"source",
		"referrer",
		"utm_source",
		"utm_medium",
		"utm_campaign",
		...questions.map((q) => q.title),
	];

	const lines = rows.map((row) =>
		[
			row.email,
			new Date(row.created_at).toISOString(),
			row.source ?? "",
			row.referrer ?? "",
			row.utm_source ?? "",
			row.utm_medium ?? "",
			row.utm_campaign ?? "",
			...questions.map((q) => row.answers[q.id] ?? ""),
		]
			.map(csvCell)
			.join(","),
	);

	// BOM so Excel opens non-ASCII answers without mangling them.
	return `﻿${header.map(csvCell).join(",")}\n${lines.join("\n")}\n`;
}

/** Subscriber counts for several projects at once, for the dashboard list. */
export async function countByProject(
	db: D1Database,
	projectIds: string[],
): Promise<Map<string, number>> {
	const counts = new Map<string, number>();
	if (projectIds.length === 0) return counts;

	const placeholders = projectIds.map(() => "?").join(", ");
	const { results } = await db
		.prepare(
			`SELECT project_id, COUNT(*) AS n FROM project_subscribers
			 WHERE project_id IN (${placeholders}) GROUP BY project_id`,
		)
		.bind(...projectIds)
		.all<{ project_id: string; n: number }>();

	for (const row of results ?? []) counts.set(row.project_id, Number(row.n));
	return counts;
}
