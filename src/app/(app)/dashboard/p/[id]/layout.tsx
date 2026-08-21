import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getAppDict } from "@/i18n/app";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appLang } from "@/lib/lang";
import { getOwnedProject } from "@/lib/projects";

const TABS = [
	{ segment: "", key: "overview" },
	{ segment: "/edit", key: "page" },
	{ segment: "/waitlist", key: "waitlist" },
	{ segment: "/analytics", key: "analytics" },
	{ segment: "/settings", key: "settings" },
] as const;

export default async function ProjectLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}) {
	const user = await requireUser();
	const { id } = await params;

	const [project, lang, pathname] = await Promise.all([
		getOwnedProject(await getDb(), id, user.id),
		appLang(),
		headers().then((h) => h.get("x-pathname") ?? ""),
	]);

	if (!project) notFound();

	const t = getAppDict(lang).project;
	const base = `/dashboard/p/${project.id}`;

	return (
		<div>
			<div className="border-b border-line-soft">
				<div className="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
					<a
						href="/dashboard"
						className="text-[13px] text-dim transition-colors hover:text-fg"
					>
						← {t.backToProjects}
					</a>
					<h1 className="mt-2 text-xl font-semibold tracking-tight">{project.name}</h1>

					<nav className="mt-4 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						{TABS.map((tab) => {
							const href = `${base}${tab.segment}`;
							const active = tab.segment
								? pathname.startsWith(href)
								: pathname === base;

							return (
								<a
									key={tab.key}
									href={href}
									aria-current={active ? "page" : undefined}
									className={`shrink-0 border-b-2 px-3.5 pb-3 text-[13.5px] transition-colors ${
										active
											? "border-brand text-fg"
											: "border-transparent text-muted hover:text-fg"
									}`}
								>
									{t[tab.key]}
								</a>
							);
						})}
					</nav>
				</div>
			</div>

			{children}
		</div>
	);
}
