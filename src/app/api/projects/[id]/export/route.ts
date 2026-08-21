import { apiUser, isResponse, notFound, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getOwnedProject, getQuestions } from "@/lib/projects";
import { listSubscribers, toCsv } from "@/lib/subscribers";

export async function GET(
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

		const [rows, questions] = await Promise.all([
			listSubscribers(db, project.id, 10000),
			getQuestions(db, project.id),
		]);

		const stamp = new Date().toISOString().slice(0, 10);
		return new Response(toCsv(rows, questions), {
			headers: {
				"content-type": "text/csv; charset=utf-8",
				"content-disposition": `attachment; filename="${project.slug}-subscribers-${stamp}.csv"`,
				"cache-control": "no-store",
			},
		});
	} catch (error) {
		console.error("exporting subscribers failed", error);
		return serverError();
	}
}
