import { type Lang } from "@/i18n/dictionaries";
import { contentFor, localesOf } from "@/lib/content";
import { getDb } from "@/lib/db";
import { projectOgImageResponse } from "@/lib/og-image";
import { limitsFor } from "@/lib/plans";
import { getPublishedProject } from "@/lib/projects";
import { getTemplate } from "@/templates/registry";
import { accentColor, isTheme } from "@/templates/style";

export const dynamic = "force-dynamic";

/**
 * The share card, one per language. A route handler rather than the
 * `opengraph-image` file convention because that one is handed only `params`,
 * and a card in the wrong language is worse than no card at all.
 *
 * Deliberately not under /api: robots.txt disallows that prefix on a published
 * page's host, and Twitterbot honours it.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;
	const db = await getDb();
	const project = await getPublishedProject(db, slug);

	if (!project) {
		return projectOgImageResponse({
			name: "Waitloom",
			headline: "This page isn't live yet",
			accent: "#ff8a3d",
			dark: true,
			branding: false,
		});
	}

	const locales = localesOf(project);
	const requested = new URL(request.url).searchParams.get("lang");
	const lang = locales.includes(requested as Lang) ? (requested as Lang) : locales[0];
	const content = contentFor(project, lang);

	const spec = getTemplate(project.template_id);
	const theme = isTheme(project.theme) ? project.theme : spec.defaults.theme;
	const owner = await db
		.prepare("SELECT plan FROM users WHERE id = ?")
		.bind(project.user_id)
		.first<{ plan: string }>();

	return projectOgImageResponse({
		name: project.name,
		headline: content.headline || project.description || project.name,
		accent: accentColor(project.accent),
		dark: theme === "dark",
		branding: limitsFor(owner?.plan).branding,
	});
}
