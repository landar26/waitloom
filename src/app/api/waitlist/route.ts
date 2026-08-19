import { getDb } from "@/lib/db";
import {
	hashIp,
	normalizeEmail,
	normalizeSource,
	clampText,
} from "@/lib/validation";
import { isRateLimited, joinWaitlist } from "@/lib/waitlist";

type Body = {
	email?: unknown;
	lang?: unknown;
	website?: unknown;
	referrer?: unknown;
	utm_source?: unknown;
	utm_medium?: unknown;
	utm_campaign?: unknown;
};

function selfHost(request: Request): string | null {
	const host = request.headers.get("host");
	if (host) return host.split(":")[0];
	try {
		return new URL(request.url).hostname;
	} catch {
		return null;
	}
}

export async function POST(request: Request) {
	let body: Body;
	try {
		body = (await request.json()) as Body;
	} catch {
		return Response.json({ error: "bad_request" }, { status: 400 });
	}

	// Honeypot: bots fill every field. Look successful, write nothing.
	if (typeof body.website === "string" && body.website.trim() !== "") {
		return Response.json({ id: crypto.randomUUID(), position: 1 });
	}

	const email = normalizeEmail(body.email);
	if (!email) {
		return Response.json({ error: "invalid_email" }, { status: 400 });
	}

	const lang = body.lang === "zh" ? "zh" : "en";
	const referrer = clampText(body.referrer, 500);
	const utm_source = clampText(body.utm_source, 80);
	const utm_medium = clampText(body.utm_medium, 80);
	const utm_campaign = clampText(body.utm_campaign, 80);

	try {
		const db = await getDb();
		const ipHash = await hashIp(request.headers.get("cf-connecting-ip"));

		if (await isRateLimited(db, ipHash)) {
			return Response.json({ error: "rate_limited" }, { status: 429 });
		}

		const { id, position } = await joinWaitlist(db, {
			email,
			lang,
			source: normalizeSource({
				utm_source,
				referrer,
				selfHost: selfHost(request),
			}),
			referrer,
			utm_source,
			utm_medium,
			utm_campaign,
			ipHash,
		});

		return Response.json({ id, position });
	} catch (error) {
		console.error("waitlist join failed", error);
		return Response.json({ error: "server_error" }, { status: 500 });
	}
}
