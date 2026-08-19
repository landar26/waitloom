import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { PROJECT_ID, recordHit } from "@/lib/analytics";
import { dayKey } from "@/lib/day";
import { clampText, hashIp, normalizeSource } from "@/lib/validation";

// Crawlers that do execute JS still announce themselves.
const BOT_RE = /bot|crawler|spider|headless|lighthouse|preview|monitor|curl|wget/i;

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
	const ua = request.headers.get("user-agent") ?? "";
	const fetchSite = request.headers.get("sec-fetch-site");

	// Browsers label the beacon same-origin; a missing header (older clients) is
	// allowed through, a foreign one is not.
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
		const source = normalizeSource({
			utm_source: clampText(payload.utm_source, 40),
			referrer: clampText(payload.referrer, 500),
			selfHost: new URL(request.url).hostname,
		});

		await recordHit(await getDb(), {
			projectId: PROJECT_ID,
			day: dayKey(Date.now()),
			source,
			ipHash: await hashIp(request.headers.get("cf-connecting-ip")),
		});
	} catch {
		// Analytics must never be visible to a visitor; drop the hit instead.
	}

	return noContent();
}
