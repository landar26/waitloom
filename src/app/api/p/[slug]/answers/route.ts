import { getDb } from "@/lib/db";
import { getPublishedProject, getQuestions } from "@/lib/projects";
import { saveAnswers } from "@/lib/subscribers";

type Body = { id?: unknown; answers?: unknown };

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const { slug } = await params;

	let body: Body;
	try {
		body = (await request.json()) as Body;
	} catch {
		return Response.json({ error: "bad_request" }, { status: 400 });
	}

	if (typeof body.id !== "string" || !UUID_RE.test(body.id)) {
		return Response.json({ error: "bad_request" }, { status: 400 });
	}

	try {
		const db = await getDb();
		const project = await getPublishedProject(db, slug);
		if (!project) return Response.json({ error: "not_found" }, { status: 404 });

		const questions = await getQuestions(db, project.id);
		const ok = await saveAnswers(db, project.id, body.id, body.answers, questions);
		if (!ok) return Response.json({ error: "not_found" }, { status: 404 });

		return Response.json({ ok: true });
	} catch (error) {
		console.error("saving project answers failed", error);
		return Response.json({ error: "server_error" }, { status: 500 });
	}
}
