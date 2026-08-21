import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewProject } from "@/components/dash/new-project";
import { getAppDict } from "@/i18n/app";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appLang } from "@/lib/lang";
import { MAX_PROJECTS } from "@/lib/plans";
import { countProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "New project — Waitloom",
	robots: { index: false, follow: false },
};

export default async function NewProjectPage() {
	const user = await requireUser();
	const [lang, db] = await Promise.all([appLang(), getDb()]);

	// The API is the real backstop; this just keeps a capped account from
	// walking both steps of the flow only to fail on the last click.
	if ((await countProjects(db, user.id)) >= MAX_PROJECTS) redirect("/dashboard");

	return (
		<main className="px-5 py-10 sm:px-8 sm:py-14">
			<NewProject dict={getAppDict(lang)} lang={lang} />
		</main>
	);
}
