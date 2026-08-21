import { apiUser, badRequest, isResponse, jsonBody, notFound, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getOwnedProject, replaceQuestions } from "@/lib/projects";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	const body = await jsonBody<{ questions?: unknown }>(request);
	if (!body) return badRequest();

	try {
		const db = await getDb();
		const { id } = await params;
		const project = await getOwnedProject(db, id, user.id);
		if (!project) return notFound();

		const questions = await replaceQuestions(db, project.id, body.questions);
		return Response.json({ questions });
	} catch (error) {
		console.error("saving questions failed", error);
		return serverError();
	}
}
