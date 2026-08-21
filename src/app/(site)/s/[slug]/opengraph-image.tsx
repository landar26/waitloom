import { ogContentType, ogSize, projectOgImageResponse } from "@/lib/og-image";
import { getDb } from "@/lib/db";
import { limitsFor } from "@/lib/plans";
import { getPublishedProject } from "@/lib/projects";
import { getTemplate } from "@/templates/registry";
import { accentColor, isTheme } from "@/templates/style";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Pre-launch page";

export default async function OpengraphImage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
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

	const spec = getTemplate(project.template_id);
	const theme = isTheme(project.theme) ? project.theme : spec.defaults.theme;
	const owner = await db
		.prepare("SELECT plan FROM users WHERE id = ?")
		.bind(project.user_id)
		.first<{ plan: string }>();

	return projectOgImageResponse({
		name: project.name,
		headline: project.content.headline || project.description || project.name,
		accent: accentColor(project.accent),
		dark: theme === "dark",
		branding: limitsFor(owner?.plan).branding,
	});
}
