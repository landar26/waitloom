import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { SERIES_DAYS, getStats, listSubscribers, type DayPoint } from "@/lib/waitlist";
import { PROJECT_ID, getTraffic, type Traffic } from "@/lib/analytics";
import { en } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Waitloom admin",
	robots: { index: false, follow: false },
};

const PRODUCT_LABELS = en.productTypes as Record<string, string>;
const LANG_LABELS: Record<string, string> = { en: "English", zh: "中文" };

function Stat({
	label,
	value,
	hint,
}: {
	label: string;
	value: string | number;
	hint?: string;
}) {
	return (
		<div className="rounded-xl border border-line bg-ink-2 p-5">
			<p className="text-[12px] uppercase tracking-[0.12em] text-dim">
				{label}
			</p>
			<p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
			{hint && <p className="mt-1 text-[12.5px] text-dim">{hint}</p>}
		</div>
	);
}

function Bars({
	title,
	rows,
	labels,
}: {
	title: string;
	rows: Array<{ label: string; count: number; pct: number }>;
	labels?: Record<string, string>;
}) {
	return (
		<div className="rounded-xl border border-line bg-ink-2 p-5">
			<p className="text-[12px] uppercase tracking-[0.12em] text-dim">
				{title}
			</p>
			<div className="mt-4 space-y-2.5">
				{rows.length === 0 && (
					<p className="text-[13px] text-dim">No data yet.</p>
				)}
				{rows.map((row) => (
					<div key={row.label} className="flex items-center gap-3">
						<span className="w-32 shrink-0 truncate text-[13px] text-muted">
							{labels?.[row.label] ?? row.label}
						</span>
						<span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-3">
							<span
								className="block h-full rounded-full bg-brand"
								style={{ width: `${Math.max(row.pct, 2)}%` }}
							/>
						</span>
						<span className="w-16 shrink-0 text-right font-mono text-[12px] text-dim">
							{row.pct}% · {row.count}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function Sparkbars({
	title,
	points,
	tone = "bg-brand",
}: {
	title: string;
	points: DayPoint[];
	tone?: string;
}) {
	const max = points.reduce((n, p) => Math.max(n, p.count), 0);

	return (
		<div className="rounded-xl border border-line bg-ink-2 p-5">
			<p className="text-[12px] uppercase tracking-[0.12em] text-dim">
				{title}
			</p>
			{max === 0 ? (
				<p className="mt-4 text-[13px] text-dim">Nothing in the last 30 days.</p>
			) : (
				<>
					<div className="mt-4 flex h-24 items-end gap-[3px]">
						{points.map((point) => (
							<span
								key={point.day}
								title={`${point.day} · ${point.count}`}
								className={`flex-1 rounded-t-sm ${tone}`}
								style={{ height: `${Math.max((point.count / max) * 100, 2)}%` }}
							/>
						))}
					</div>
					<div className="mt-2 flex justify-between font-mono text-[11px] text-dim">
						<span>{points[0]?.day}</span>
						<span>{points[points.length - 1]?.day}</span>
					</div>
				</>
			)}
		</div>
	);
}

type SourceRow = {
	label: string;
	visitors: number;
	signups: number;
};

/** Sources are only interesting next to what they converted into. */
function SourceTable({ rows, tracking }: { rows: SourceRow[]; tracking: boolean }) {
	return (
		<div className="rounded-xl border border-line bg-ink-2 p-5">
			<p className="text-[12px] uppercase tracking-[0.12em] text-dim">Sources</p>
			<table className="mt-4 w-full border-collapse text-[13px]">
				<thead className="text-[11px] uppercase tracking-[0.1em] text-dim">
					<tr>
						<th className="pb-2 text-left font-medium">Source</th>
						<th className="pb-2 text-right font-medium">Visitors</th>
						<th className="pb-2 text-right font-medium">Signups</th>
						<th className="pb-2 text-right font-medium">Conv.</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 && (
						<tr>
							<td className="py-2 text-dim" colSpan={4}>
								No data yet.
							</td>
						</tr>
					)}
					{rows.map((row) => (
						<tr key={row.label} className="border-t border-line-soft">
							<td className="py-2 pr-2 text-muted">{row.label}</td>
							<td className="py-2 text-right font-mono text-[12.5px]">
								{tracking ? row.visitors : "—"}
							</td>
							<td className="py-2 text-right font-mono text-[12.5px]">
								{row.signups}
							</td>
							<td className="py-2 text-right font-mono text-[12.5px] text-brand-2">
								{row.visitors > 0
									? `${Math.round((row.signups / row.visitors) * 100)}%`
									: "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/** Union of the sources people came from and the sources they signed up from. */
function mergeSources(traffic: Traffic, signups: Array<{ label: string; count: number }>) {
	const rows = new Map<string, SourceRow>();
	for (const s of traffic.sources)
		rows.set(s.label, { label: s.label, visitors: s.visitors, signups: 0 });
	for (const s of signups) {
		const row = rows.get(s.label);
		if (row) row.signups = s.count;
		else rows.set(s.label, { label: s.label, visitors: 0, signups: s.count });
	}
	return [...rows.values()].sort(
		(a, b) => b.visitors - a.visitors || b.signups - a.signups,
	);
}

export default async function AdminPage() {
	const db = await getDb();
	const [stats, traffic, subscribers] = await Promise.all([
		getStats(db),
		getTraffic(db, PROJECT_ID, SERIES_DAYS),
		listSubscribers(db, 500),
	]);

	const conversionNote = `${stats.sources.length} source${
		stats.sources.length === 1 ? "" : "s"
	}`;

	const answerRate = stats.total
		? Math.round((stats.answered.building / stats.total) * 100)
		: 0;

	const weekOverWeek = stats.prev7
		? `${stats.last7 >= stats.prev7 ? "+" : "−"}${Math.abs(
				Math.round(((stats.last7 - stats.prev7) / stats.prev7) * 100),
			)}% vs prior 7`
		: "no prior week";

	const signups30 = stats.series.reduce((n, d) => n + d.count, 0);
	const conversion = traffic.visitors
		? `${((signups30 / traffic.visitors) * 100).toFixed(1)}%`
		: "—";

	// Campaigns are the finer cut; fall back to medium until campaigns are tagged.
	const hasCampaigns = stats.utmCampaign.length > 0;
	const utmRows = hasCampaigns ? stats.utmCampaign : stats.utmMedium;

	return (
		<div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Waitlist</h1>
					<p className="mt-1 text-[13.5px] text-dim">
						{stats.total} subscribers · {conversionNote} · days in UTC+8
					</p>
				</div>
				<a
					href="/api/admin/export"
					className="rounded-full border border-line bg-ink-2 px-4 py-2 text-[13.5px] transition-colors hover:border-dim"
				>
					Export CSV
				</a>
			</div>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Stat label="Subscribers" value={stats.total} />
				<Stat
					label="Today"
					value={`+${stats.today}`}
					hint={`yesterday +${stats.yesterday}`}
				/>
				<Stat
					label="Last 7 days"
					value={`+${stats.last7}`}
					hint={weekOverWeek}
				/>
				<Stat
					label="Answered"
					value={`${answerRate}%`}
					hint={`${stats.answered.building} building · ${stats.answered.pain} pain`}
				/>
			</div>

			{traffic.tracking ? (
				<div className="mt-4 grid gap-4 sm:grid-cols-3">
					<Stat
						label="Visitors"
						value={traffic.visitors}
						hint={`${traffic.views} views · last 30 days`}
					/>
					<Stat
						label="Signups"
						value={signups30}
						hint="last 30 days"
					/>
					<Stat label="Conversion" value={conversion} hint="signups / visitors" />
				</div>
			) : (
				<p className="mt-4 rounded-xl border border-line bg-ink-2 px-5 py-4 text-[13px] text-dim">
					{traffic.available
						? "No pageviews recorded yet — traffic starts counting on the next visit to the landing page."
						: "Traffic is unavailable right now — the rest of this page is unaffected. Check the Worker logs; a missing page_stats table means migration 0002 has not been applied."}
				</p>
			)}

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				{traffic.available && (
					<Sparkbars
						title="Visitors · last 30 days"
						points={traffic.series.map((d) => ({ day: d.day, count: d.visitors }))}
						tone="bg-brand-2"
					/>
				)}
				<Sparkbars title="Signups · last 30 days" points={stats.series} />
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<SourceTable
					rows={mergeSources(traffic, stats.sources)}
					tracking={traffic.available && traffic.tracking}
				/>
				<Bars
					title="What they're building"
					rows={stats.audience}
					labels={PRODUCT_LABELS}
				/>
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<Bars title="Language" rows={stats.langs} labels={LANG_LABELS} />
				{utmRows.length > 0 && (
					<Bars
						title={hasCampaigns ? "Campaigns" : "UTM medium"}
						rows={utmRows}
					/>
				)}
			</div>

			<div className="mt-8 overflow-hidden rounded-xl border border-line">
				<table className="w-full border-collapse text-left text-[13.5px]">
					<thead className="bg-ink-2 text-[12px] uppercase tracking-[0.1em] text-dim">
						<tr>
							<th className="px-4 py-3 font-medium">Email</th>
							<th className="px-4 py-3 font-medium">Source</th>
							<th className="px-4 py-3 font-medium">Building</th>
							<th className="hidden px-4 py-3 font-medium md:table-cell">
								Hardest part
							</th>
							<th className="px-4 py-3 font-medium">Joined</th>
						</tr>
					</thead>
					<tbody>
						{subscribers.length === 0 && (
							<tr>
								<td className="px-4 py-6 text-dim" colSpan={5}>
									No signups yet.
								</td>
							</tr>
						)}
						{subscribers.map((row) => (
							<tr key={row.id} className="border-t border-line-soft">
								<td className="px-4 py-3">{row.email}</td>
								<td className="px-4 py-3 text-muted">{row.source ?? "—"}</td>
								<td className="px-4 py-3 text-muted">
									{row.building ? PRODUCT_LABELS[row.building] ?? row.building : "—"}
								</td>
								<td className="hidden max-w-xs truncate px-4 py-3 text-muted md:table-cell">
									{row.pain ?? "—"}
								</td>
								<td className="px-4 py-3 font-mono text-[12.5px] text-dim">
									{new Date(row.created_at).toISOString().slice(0, 10)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
