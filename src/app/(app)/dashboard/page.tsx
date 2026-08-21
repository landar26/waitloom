import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTotals } from "@/lib/analytics";
import { isLinkCta } from "@/lib/content";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { projectUrl } from "@/lib/host";
import { appLang } from "@/lib/lang";
import { MAX_PROJECTS } from "@/lib/plans";
import { listProjects } from "@/lib/projects";
import { countByProject, SERIES_DAYS } from "@/lib/subscribers";
import { getAppDict } from "@/i18n/app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Projects — Waitloom",
	robots: { index: false, follow: false },
};

export default async function DashboardPage() {
	const user = await requireUser();
	const [lang, db, host] = await Promise.all([
		appLang(),
		getDb(),
		headers().then((h) => h.get("host")),
	]);
	const t = getAppDict(lang).dashboard;

	const projects = await listProjects(db, user.id);
	const atLimit = projects.length >= MAX_PROJECTS;
	const ids = projects.map((p) => p.id);
	const [subscribers, traffic] = await Promise.all([
		countByProject(db, ids),
		getTotals(db, ids, SERIES_DAYS),
	]);

	return (
		<main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
				{atLimit ? (
					<span className="text-[13.5px] text-dim">{t.atLimit}</span>
				) : (
					projects.length > 0 && (
						<a
							href="/dashboard/new"
							className="rounded-full bg-brand px-4 py-2 text-[13.5px] font-medium text-[#1a0d05] transition-opacity hover:opacity-90"
						>
							{t.create}
						</a>
					)
				)}
			</div>

			{projects.length === 0 ? (
				<div className="mt-10 rounded-2xl border border-line bg-ink-2 px-6 py-16 text-center">
					<p className="text-lg font-semibold tracking-tight">{t.empty.title}</p>
					<p className="mx-auto mt-2.5 max-w-md text-[14.5px] leading-relaxed text-muted">
						{t.empty.body}
					</p>
					<a
						href="/dashboard/new"
						className="mt-7 inline-flex rounded-full bg-brand px-5 py-2.5 text-[14px] font-medium text-[#1a0d05] transition-opacity hover:opacity-90"
					>
						{t.empty.cta}
					</a>
				</div>
			) : (
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => {
						const visitors = traffic.get(project.id)?.visitors ?? 0;
						// A link-CTA page counts clicks where a waitlist page counts signups.
						const linkCta = isLinkCta(project.content.cta);
						const signups = linkCta
							? (traffic.get(project.id)?.clicks ?? 0)
							: (subscribers.get(project.id) ?? 0);
						const live = project.status === "published";

						return (
							<a
								key={project.id}
								href={`/dashboard/p/${project.id}`}
								className="group rounded-xl border border-line bg-ink-2 p-5 transition-colors hover:border-dim"
							>
								<div className="flex items-start justify-between gap-3">
									<p className="text-[16px] font-semibold tracking-tight">
										{project.name}
									</p>
									<span
										className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
											live
												? "bg-brand-dim text-brand-2"
												: "border border-line text-dim"
										}`}
									>
										{live ? t.live : t.draft}
									</span>
								</div>

								<p className="mt-1.5 truncate font-mono text-[12px] text-dim">
									{live
										? projectUrl(project.slug, host).replace(/^https?:\/\//, "")
										: t.notPublished}
								</p>

								<div className="mt-5 grid grid-cols-3 gap-2 border-t border-line-soft pt-4">
									<Metric label={t.views} value={visitors} />
									<Metric
										label={linkCta ? t.clicks : t.subscribers}
										value={signups}
									/>
									<Metric
										label={linkCta ? t.clickRate : t.conversion}
										value={
											visitors > 0 ? `${((signups / visitors) * 100).toFixed(1)}%` : "—"
										}
									/>
								</div>
							</a>
						);
					})}
				</div>
			)}
		</main>
	);
}

function Metric({ label, value }: { label: string; value: string | number }) {
	return (
		<div>
			<p className="text-[11px] uppercase tracking-[0.1em] text-dim">{label}</p>
			<p className="mt-1 font-mono text-[15px]">{value}</p>
		</div>
	);
}
