import { notFound } from "next/navigation";
import { ProjectSettings } from "@/components/dash/project-settings";
import { getAppDict } from "@/i18n/app";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ROOT_HOST } from "@/lib/host";
import { appLang } from "@/lib/lang";
import { getOwnedProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireUser();
	const { id } = await params;

	const project = await getOwnedProject(await getDb(), id, user.id);
	if (!project) notFound();

	const lang = await appLang();

	return (
		<main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
			<ProjectSettings
				projectId={project.id}
				name={project.name}
				initialSlug={project.slug}
				initialLang={project.lang}
				rootHost={ROOT_HOST}
				dict={getAppDict(lang)}
			/>
		</main>
	);
}
