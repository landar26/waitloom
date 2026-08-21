import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublishPanel } from "@/components/dash/publish-panel";
import { Stat } from "@/components/dash/stats";
import { getAppDict } from "@/i18n/app";
import { getTraffic } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { projectUrl } from "@/lib/host";
import { appLang } from "@/lib/lang";
import { getOwnedProject } from "@/lib/projects";
import { SERIES_DAYS, getStats, listSubscribers } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireUser();
	const { id } = await params;
	const db = await getDb();

	const project = await getOwnedProject(db, id, user.id);
	if (!project) notFound();

	const [lang, host, stats, traffic, recent] = await Promise.all([
		appLang(),
		headers().then((h) => h.get("host")),
		getStats(db, project.id),
		getTraffic(db, project.id, SERIES_DAYS),
		listSubscribers(db, project.id, 8),
	]);

	const dict = getAppDict(lang);
	const t = dict.overview;

	const signups30 = stats.series.reduce((n, d) => n + d.count, 0);
	const conversion = traffic.visitors
		? `${((signups30 / traffic.visitors) * 100).toFixed(1)}%`
		: "—";

	return (
		<main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
			<PublishPanel
				projectId={project.id}
				url={projectUrl(project.slug, host)}
				initialPublished={project.status === "published"}
				dict={dict}
			/>

			<div className="mt-4 grid gap-4 sm:grid-cols-3">
				<Stat label={t.visitors} value={traffic.visitors} hint={t.last30} />
				<Stat label={t.subscribers} value={stats.total} hint={`+${stats.last7} · 7d`} />
				<Stat label={t.conversion} value={conversion} hint={t.last30} />
			</div>

			<div className="mt-4 rounded-xl border border-line bg-ink-2 p-5">
				<div className="flex items-center justify-between gap-3">
					<p className="text-[12px] uppercase tracking-[0.12em] text-dim">{t.recent}</p>
					<a
						href={`/dashboard/p/${project.id}/edit`}
						className="text-[13px] text-muted transition-colors hover:text-fg"
					>
						{t.editPage} →
					</a>
				</div>

				{recent.length === 0 ? (
					<p className="mt-4 text-[13px] text-dim">{t.noSignups}</p>
				) : (
					<ul className="mt-4 divide-y divide-line-soft">
						{recent.map((row) => (
							<li key={row.id} className="flex items-center justify-between gap-4 py-2.5">
								<span className="truncate text-[13.5px]">{row.email}</span>
								<span className="shrink-0 font-mono text-[12px] text-dim">
									{new Date(row.created_at).toISOString().slice(0, 10)}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</main>
	);
}
