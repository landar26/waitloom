import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { SERIES_DAYS, getStats, listSubscribers, type DayPoint } from "@/lib/waitlist";
import { PROJECT_ID, getTraffic, type Traffic } from "@/lib/analytics";
import {
	Bars,
	SourceTable,
	Sparkbars,
	Stat,
	mergeSources,
} from "@/components/dash/stats";
import { en } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Waitloom admin",
	robots: { index: false, follow: false },
};

const PRODUCT_LABELS = en.productTypes as Record<string, string>;
const LANG_LABELS: Record<string, string> = { en: "English", zh: "中文" };

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
				<Sparkbars
						title="Signups · last 30 days"
						points={stats.series}
						empty="Nothing in the last 30 days."
					/>
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
				<Bars
						title="Language"
						rows={stats.langs}
						labels={LANG_LABELS}
						empty="No data yet."
					/>
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
