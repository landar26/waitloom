import { apiUser, isResponse, jsonBody, notFound, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getOwnedProject, setPublished } from "@/lib/projects";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	const body = await jsonBody<{ published?: unknown }>(request);
	const published = body?.published !== false;

	try {
		const db = await getDb();
		const { id } = await params;
		const project = await getOwnedProject(db, id, user.id);
		if (!project) return notFound();

		await setPublished(db, project.id, published);
		return Response.json({ status: published ? "published" : "draft", slug: project.slug });
	} catch (error) {
		console.error("publishing failed", error);
		return serverError();
	}
}
