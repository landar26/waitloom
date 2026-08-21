import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProjectBeacon } from "@/components/public/project-beacon";
import { LANG_SHORT, type Lang } from "@/i18n/dictionaries";
import { contentFor, localesOf } from "@/lib/content";
import { getDb } from "@/lib/db";
import { negotiateLang } from "@/lib/lang";
import { projectLocaleUrl, projectUrl } from "@/lib/host";
import { limitsFor } from "@/lib/plans";
import {
	getPublishedProject,
	getQuestions,
	questionFor,
	type Project,
} from "@/lib/projects";
import { TemplatePage } from "@/templates/render";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

/**
 * Which language to serve. An explicit `/zh` — which middleware hands over as
 * `?lang=zh` — wins, then whatever the visitor's browser asks for, and finally
 * the language the founder wrote the page in.
 */
async function resolveLang(
	searchParams: SearchParams,
	locales: Lang[],
): Promise<Lang> {
	const requested = (await searchParams).lang;
	if (typeof requested === "string" && locales.includes(requested as Lang)) {
		return requested as Lang;
	}
	return negotiateLang((await headers()).get("accept-language"), locales, locales[0]);
}

export async function generateMetadata({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: SearchParams;
}): Promise<Metadata> {
	const { slug } = await params;
	const project = await load(slug);
	if (!project) return { title: "Not found", robots: { index: false } };

	const host = (await headers()).get("host");
	const locales = localesOf(project);
	const lang = await resolveLang(searchParams, locales);
	const content = contentFor(project, lang);

	const url = projectLocaleUrl(project.slug, lang, project.lang, host);
	const title = content.headline
		? `${project.name} — ${content.headline}`
		: project.name;
	const description = content.subheadline || project.description;

	// Every language points at every other, and the bare URL is what a crawler
	// with no language preference should land on.
	const languages: Record<string, string> = { "x-default": projectUrl(project.slug, host) };
	for (const code of locales) {
		languages[code] = projectLocaleUrl(project.slug, code, project.lang, host);
	}

	return {
		metadataBase: new URL(projectUrl(project.slug, host)),
		title,
		description,
		alternates: { canonical: url, languages },
		openGraph: {
			type: "website",
			url,
			siteName: project.name,
			title,
			description,
			locale: lang,
			// Absolute, because metadataBase is the path form of the page in local
			// development and a root-relative URL would drop the /s/<slug> part.
			images: [`${projectUrl(project.slug, host)}/og?lang=${lang}`],
		},
		twitter: { card: "summary_large_image", title, description },
	};
}

export default async function PublishedPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: SearchParams;
}) {
	const { slug } = await params;
	const project = await load(slug);
	if (!project) notFound();

	const [questions, branding, host] = await Promise.all([
		getQuestions(await getDb(), project.id),
		brandingFor(project),
		headers().then((h) => h.get("host")),
	]);

	const locales = localesOf(project);
	const lang = await resolveLang(searchParams, locales);

	return (
		<div lang={lang}>
			<ProjectBeacon slug={project.slug} />
			<TemplatePage
				project={{
					name: project.name,
					slug: project.slug,
					lang,
					locales: locales.map((code) => ({
						code,
						label: LANG_SHORT[code],
						href: projectLocaleUrl(project.slug, code, project.lang, host),
					})),
					templateId: project.template_id,
					theme: project.theme,
					accent: project.accent,
					font: project.font,
					branding,
				}}
				content={contentFor(project, lang)}
				sections={project.sections}
				questions={questions.map((question) => questionFor(question, lang, project.lang))}
			/>
		</div>
	);
}
