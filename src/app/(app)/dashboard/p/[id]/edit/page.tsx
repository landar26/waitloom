import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/editor";
import { getAppDict } from "@/i18n/app";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appLang } from "@/lib/lang";
import { limitsFor } from "@/lib/plans";
import { getOwnedProject, getQuestions } from "@/lib/projects";
import type { Lang } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function EditPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireUser();
	const { id } = await params;
	const db = await getDb();

	const project = await getOwnedProject(db, id, user.id);
	if (!project) notFound();

	const [questions, lang] = await Promise.all([
		getQuestions(db, project.id),
		appLang(),
	]);

	return (
		<Editor
			projectId={project.id}
			slug={project.slug}
			branding={limitsFor(user.plan).branding}
			initialDraft={{
				name: project.name,
				templateId: project.template_id,
				theme: project.theme,
				accent: project.accent,
				font: project.font,
				lang: project.lang as Lang,
				content: project.content,
				sections: project.sections,
			}}
			initialQuestions={questions}
			dict={getAppDict(lang)}
		/>
	);
}
