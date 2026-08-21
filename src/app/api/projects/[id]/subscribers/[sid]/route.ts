import { apiUser, isResponse, notFound, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getOwnedProject } from "@/lib/projects";
import { deleteSubscriber } from "@/lib/subscribers";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string; sid: string }> },
) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	try {
		const db = await getDb();
		const { id, sid } = await params;
		const project = await getOwnedProject(db, id, user.id);
		if (!project) return notFound();

		const removed = await deleteSubscriber(db, project.id, sid);
		if (!removed) return notFound();

		return Response.json({ ok: true });
	} catch (error) {
		console.error("deleting a subscriber failed", error);
		return serverError();
	}
}
