import {
	apiUser,
	badRequest,
	isResponse,
	jsonBody,
	notFound,
	serverError,
} from "@/lib/api";
import { getDb } from "@/lib/db";
import { deleteProject, getOwnedProject, updateProject, type PatchInput } from "@/lib/projects";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	const body = await jsonBody<PatchInput>(request);
	if (!body) return badRequest();

	try {
		const db = await getDb();
		const { id } = await params;
		const project = await getOwnedProject(db, id, user.id);
		if (!project) return notFound();

		const result = await updateProject(db, project, body);
		if ("error" in result) return Response.json({ error: result.error }, { status: 409 });

		return Response.json({
			slug: result.project.slug,
			updated_at: result.project.updated_at,
		});
	} catch (error) {
		console.error("updating a project failed", error);
		return serverError();
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	try {
		const db = await getDb();
		const { id } = await params;
		const project = await getOwnedProject(db, id, user.id);
		if (!project) return notFound();

		await deleteProject(db, project.id);
		return Response.json({ ok: true });
	} catch (error) {
		console.error("deleting a project failed", error);
		return serverError();
	}
}
