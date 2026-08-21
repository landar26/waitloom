import { NextResponse, type NextRequest } from "next/server";
import { recordHit } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { dayKey } from "@/lib/day";
import { getPublishedProject } from "@/lib/projects";
import { clampText, hashIp, normalizeSource } from "@/lib/validation";

// Crawlers that do execute JS still announce themselves.
const BOT_RE = /bot|crawler|spider|headless|lighthouse|preview|monitor|curl|wget/i;

const noContent = () => new NextResponse(null, { status: 204 });

/** Same contract as /api/hit, scoped to one published project. */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	const ua = request.headers.get("user-agent") ?? "";
	const fetchSite = request.headers.get("sec-fetch-site");

	if (BOT_RE.test(ua) || (fetchSite !== null && fetchSite !== "same-origin")) {
		return noContent();
	}

	let payload: { referrer?: unknown; utm_source?: unknown } = {};
	try {
		payload = await request.json();
	} catch {
		/* a beacon with no body still counts as a view */
	}

	try {
		const { slug } = await params;
		const db = await getDb();
		const project = await getPublishedProject(db, slug);
		if (!project) return noContent();

		const source = normalizeSource({
			utm_source: clampText(payload.utm_source, 40),
			referrer: clampText(payload.referrer, 500),
			selfHost: new URL(request.url).hostname,
		});

		await recordHit(db, {
			// The project id, not the slug: renaming a page must not orphan its
			// traffic history.
			projectId: project.id,
			day: dayKey(Date.now()),
			source,
			ipHash: await hashIp(request.headers.get("cf-connecting-ip")),
		});
	} catch {
		// Analytics must never be visible to a visitor; drop the hit instead.
	}

	return noContent();
}
