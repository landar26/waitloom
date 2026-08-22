import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { SERIES_DAYS, getStats, listSubscribers, type DayPoint } from "@/lib/waitlist";
import { PROJECT_ID, getTraffic, type Traffic } from "@/lib/analytics";
import { getProductStats } from "@/lib/product";
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

/** Percent of a whole, or an em dash when there is no whole to divide by. */
function pct(part: number, whole: number): string {
	return whole ? `${Math.round((part / whole) * 100)}%` : "—";
}

function wow(last7: number, prev7: number): string {
	if (!prev7) return "no prior week";
	const delta = Math.round(((last7 - prev7) / prev7) * 100);
	return `${last7 >= prev7 ? "+" : "−"}${Math.abs(delta)}% vs prior 7`;
}

export default async function AdminPage() {
	const db = await getDb();
	const [stats, traffic, subscribers, product] = await Promise.all([
		getStats(db),
		getTraffic(db, PROJECT_ID, SERIES_DAYS),
		listSubscribers(db, 500),
		getProductStats(db),
	]);

	const conversionNote = `${stats.sources.length} source${
		stats.sources.length === 1 ? "" : "s"
	}`;

	const answerRate = stats.total
		? Math.round((stats.answered.building / stats.total) * 100)
		: 0;

	const weekOverWeek = wow(stats.last7, stats.prev7);

	const signups30 = stats.series.reduce((n, d) => n + d.count, 0);
	const conversion = traffic.visitors
		? `${((signups30 / traffic.visitors) * 100).toFixed(1)}%`
		: "—";

	const u = product.users;
	const paid = product.plans
		.filter((p) => p.label !== "free")
		.reduce((n, p) => n + p.count, 0);
	const activatedPct = pct(product.funnel.activated, u.total);
	const publisherPct = pct(product.funnel.publishers, u.total);
	const perUser = u.total ? (product.projects.total / u.total).toFixed(1) : "—";

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

			<div className="mt-14 border-t border-line pt-10">
				<h2 className="text-2xl font-semibold tracking-tight">Product</h2>
				<p className="mt-1 text-[13.5px] text-dim">
					{u.total} registered · {product.projects.total} project
					{product.projects.total === 1 ? "" : "s"} · days in UTC+8
				</p>

				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Stat
						label="Registered"
						value={u.total}
						hint={paid ? `${paid} on a paid plan` : "all on free"}
					/>
					<Stat
						label="Today"
						value={`+${u.today}`}
						hint={`yesterday +${u.yesterday}`}
					/>
					<Stat
						label="Last 7 days"
						value={`+${u.last7}`}
						hint={wow(u.last7, u.prev7)}
					/>
					<Stat
						label="Active (30d)"
						value={product.funnel.active30}
						hint={`${product.funnel.active7} in last 7 · edited a project`}
					/>
				</div>

				<div className="mt-4 grid gap-4 sm:grid-cols-3">
					<Stat
						label="Activated"
						value={activatedPct}
						hint={`${product.funnel.activated} of ${u.total} created a project`}
					/>
					<Stat
						label="Published"
						value={publisherPct}
						hint={`${product.funnel.publishers} of ${u.total} users · ${product.projects.published} projects live`}
					/>
					<Stat
						label="Projects / user"
						value={perUser}
						hint={`${product.projects.drafts} still draft`}
					/>
				</div>

				<div className="mt-4 grid gap-4 lg:grid-cols-2">
					<Sparkbars
						title="Registrations · last 30 days"
						points={u.series}
						empty="No signups in the last 30 days."
					/>
					<Sparkbars
						title="Projects created · last 30 days"
						points={product.projects.series}
						tone="bg-brand-2"
						empty="No projects created in the last 30 days."
					/>
				</div>

				{product.plans.length > 1 && (
					<div className="mt-4 grid gap-4 lg:grid-cols-2">
						<Bars title="Plans" rows={product.plans} />
					</div>
				)}
			</div>
		</div>
	);
}
