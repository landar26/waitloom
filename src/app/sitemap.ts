import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { localesOf } from "@/lib/content";
import { getDb } from "@/lib/db";
import { projectLocaleUrl, slugFromHost } from "@/lib/host";
import { getPublishedProject } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

// Served on every host the Worker answers to, and a published page's entries
// depend on which languages its founder wrote.
export const dynamic = "force-dynamic";

/** A published page is one URL per language it offers, all cross-referenced. */
async function projectSitemap(
	slug: string,
	host: string | null,
): Promise<MetadataRoute.Sitemap> {
	let project;
	try {
		project = await getPublishedProject(await getDb(), slug);
	} catch (error) {
		console.error("building a project sitemap failed", error);
		return [];
	}
	if (!project) return [];

	const locales = localesOf(project);
	const languages = Object.fromEntries(
		locales.map((code) => [
			code,
			projectLocaleUrl(project.slug, code, project.lang, host),
		]),
	);
	const lastModified = new Date(project.updated_at);

	return locales.map((code) => ({
		url: projectLocaleUrl(project.slug, code, project.lang, host),
		lastModified,
		alternates: { languages },
	}));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const host = (await headers()).get("host");

	const slug = slugFromHost(host);
	if (slug) return projectSitemap(slug, host);

	const lastModified = new Date();
	return [
		{
			url: `${SITE_URL}/`,
			lastModified,
			alternates: { languages: { en: `${SITE_URL}/`, zh: `${SITE_URL}/zh` } },
		},
		{
			url: `${SITE_URL}/zh`,
			lastModified,
			alternates: { languages: { en: `${SITE_URL}/`, zh: `${SITE_URL}/zh` } },
		},
	];
}
