import { getDb } from "@/lib/db";
import { saveAnswers } from "@/lib/waitlist";

type Body = {
	id?: unknown;
	answers?: { building?: unknown; pain?: unknown };
};

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
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
		const ok = await saveAnswers(db, body.id, body.answers ?? {});
		if (!ok) return Response.json({ error: "not_found" }, { status: 404 });
		return Response.json({ ok: true });
	} catch (error) {
		console.error("saving answers failed", error);
		return Response.json({ error: "server_error" }, { status: 500 });
	}
}
