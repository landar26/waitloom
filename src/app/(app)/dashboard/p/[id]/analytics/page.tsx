import { notFound } from "next/navigation";
import {
	Bars,
	Panel,
	SourceTable,
	Sparkbars,
	Stat,
	mergeSources,
} from "@/components/dash/stats";
import { getAppDict } from "@/i18n/app";
import { getTraffic } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appLang } from "@/lib/lang";
import { getOwnedProject, getQuestions } from "@/lib/projects";
import { SERIES_DAYS, getAnswerBreakdown, getStats } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireUser();
	const { id } = await params;
	const db = await getDb();

	const project = await getOwnedProject(db, id, user.id);
	if (!project) notFound();

	const [stats, traffic, questions, lang] = await Promise.all([
		getStats(db, project.id),
		getTraffic(db, project.id, SERIES_DAYS),
		getQuestions(db, project.id),
		appLang(),
	]);

	const breakdown = await getAnswerBreakdown(db, project.id, questions);
	const t = getAppDict(lang).analytics;

	const signups30 = stats.series.reduce((n, d) => n + d.count, 0);
	const conversion = traffic.visitors
		? `${((signups30 / traffic.visitors) * 100).toFixed(1)}%`
		: "—";

	return (
		<main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Stat label={t.visitors} value={traffic.visitors} hint={t.last30} />
				<Stat label={t.views} value={traffic.views} hint={t.last30} />
				<Stat label={t.signups} value={signups30} hint={t.last30} />
				<Stat label={t.conversion} value={conversion} hint={t.last30} />
			</div>

			{!traffic.tracking && (
				<p className="mt-4 rounded-xl border border-line bg-ink-2 px-5 py-4 text-[13px] text-dim">
					{traffic.available ? t.notTracking : t.unavailable}
				</p>
			)}

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				{traffic.available && (
					<Sparkbars
						title={`${t.visitors} · ${t.last30}`}
						points={traffic.series.map((d) => ({ day: d.day, count: d.visitors }))}
						tone="bg-brand-2"
						empty={t.noData}
					/>
				)}
				<Sparkbars
					title={`${t.signups} · ${t.last30}`}
					points={stats.series}
					empty={t.noData}
				/>
			</div>

			<div className="mt-4">
				<SourceTable
					rows={mergeSources(traffic, stats.sources)}
					tracking={traffic.available && traffic.tracking}
					labels={{
						title: t.sources,
						source: t.source,
						visitors: t.visitors,
						signups: t.signups,
						conv: t.conv,
					}}
					empty={t.noData}
				/>
			</div>

			{breakdown.length > 0 && (
				<div className="mt-4 grid gap-4 lg:grid-cols-2">
					{breakdown.map((item) =>
						item.question.type === "short_text" ? (
							<Panel key={item.question.id} title={item.question.title}>
								{item.texts.length === 0 ? (
									<p className="text-[13px] text-dim">{t.noData}</p>
								) : (
									<ul className="max-h-72 space-y-2 overflow-y-auto">
										{item.texts.map((text, i) => (
											<li
												key={i}
												className="rounded-lg border border-line-soft bg-ink px-3 py-2 text-[13px] text-muted"
											>
												{text}
											</li>
										))}
									</ul>
								)}
							</Panel>
						) : (
							<Bars
								key={item.question.id}
								title={item.question.title}
								rows={item.options}
								empty={t.noData}
							/>
						),
					)}
				</div>
			)}

			{stats.utmCampaign.length > 0 && (
				<div className="mt-4">
					<Bars title="Campaigns" rows={stats.utmCampaign} empty={t.noData} />
				</div>
			)}
		</main>
	);
}
