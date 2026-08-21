import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProjectBeacon } from "@/components/public/project-beacon";
import { getDb } from "@/lib/db";
import { projectUrl } from "@/lib/host";
import { limitsFor } from "@/lib/plans";
import { getPublishedProject, getQuestions, type Project } from "@/lib/projects";
import { TemplatePage } from "@/templates/render";

export const dynamic = "force-dynamic";

async function load(slug: string): Promise<Project | null> {
	try {
		return await getPublishedProject(await getDb(), slug);
	} catch (error) {
		console.error("loading published project failed", error);
		return null;
	}
}

async function brandingFor(project: Project): Promise<boolean> {
	try {
		const db = await getDb();
		const owner = await db
			.prepare("SELECT plan FROM users WHERE id = ?")
			.bind(project.user_id)
			.first<{ plan: string }>();
		return limitsFor(owner?.plan).branding;
	} catch {
		return true;
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const project = await load(slug);
	if (!project) return { title: "Not found", robots: { index: false } };

	const host = (await headers()).get("host");
	const url = projectUrl(project.slug, host);
	const title = project.content.headline
		? `${project.name} — ${project.content.headline}`
		: project.name;
	const description = project.content.subheadline || project.description;

	return {
		metadataBase: new URL(url),
		title,
		description,
		alternates: { canonical: url },
		openGraph: {
			type: "website",
			url,
			siteName: project.name,
			title,
			description,
		},
		twitter: { card: "summary_large_image", title, description },
	};
}

export default async function PublishedPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const project = await load(slug);
	if (!project) notFound();

	const [questions, branding] = await Promise.all([
		getQuestions(await getDb(), project.id),
		brandingFor(project),
	]);

	return (
		<div lang={project.lang}>
			<ProjectBeacon slug={project.slug} />
			<TemplatePage
				project={{
					name: project.name,
					slug: project.slug,
					lang: project.lang,
					templateId: project.template_id,
					theme: project.theme,
					accent: project.accent,
					font: project.font,
					branding,
				}}
				content={project.content}
				sections={project.sections}
				questions={questions}
			/>
		</div>
	);
}
