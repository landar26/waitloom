import { notFound } from "next/navigation";
import { SubscriberTable } from "@/components/dash/subscriber-table";
import { getAppDict } from "@/i18n/app";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appLang } from "@/lib/lang";
import { getOwnedProject, getQuestions } from "@/lib/projects";
import { listSubscribers } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export default async function WaitlistPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireUser();
	const { id } = await params;
	const db = await getDb();

	const project = await getOwnedProject(db, id, user.id);
	if (!project) notFound();

	const [rows, questions, lang] = await Promise.all([
		listSubscribers(db, project.id, 1000),
		getQuestions(db, project.id),
		appLang(),
	]);

	return (
		<main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
			<SubscriberTable
				projectId={project.id}
				initialRows={rows}
				questions={questions}
				dict={getAppDict(lang)}
			/>
		</main>
	);
}
