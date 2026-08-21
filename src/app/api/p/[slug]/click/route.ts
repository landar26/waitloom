import { NextResponse, type NextRequest } from "next/server";
import { recordClick } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { dayKey } from "@/lib/day";
import { isLinkCta } from "@/lib/content";
import { getPublishedProject } from "@/lib/projects";
import { clampText, normalizeSource } from "@/lib/validation";

// Crawlers that do execute JS still announce themselves.
const BOT_RE = /bot|crawler|spider|headless|lighthouse|preview|monitor|curl|wget/i;

const noContent = () => new NextResponse(null, { status: 204 });

/**
 * One click on a link CTA. Same shape as the hit beacon next door, and the same
 * source normalization on purpose: a click only means something read next to
 * the views from the same source.
 */
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
		/* a beacon with no body still counts as a click */
	}

	try {
		const { slug } = await params;
		const db = await getDb();
		const project = await getPublishedProject(db, slug);
		// Nothing else can click: a page whose CTA is a form has no link to press,
		// so a click on it could only have been forged.
		if (!project || !isLinkCta(project.content.cta)) return noContent();

		const source = normalizeSource({
			utm_source: clampText(payload.utm_source, 40),
			referrer: clampText(payload.referrer, 500),
			selfHost: new URL(request.url).hostname,
		});

		await recordClick(db, {
			projectId: project.id,
			day: dayKey(Date.now()),
			source,
		});
	} catch {
		// Analytics must never be visible to a visitor; drop the click instead.
	}

	return noContent();
}
