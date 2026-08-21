import { getDb } from "@/lib/db";
import { getPublishedProject } from "@/lib/projects";
import { limitsFor } from "@/lib/plans";
import { countSubscribers, isRateLimited, joinWaitlist } from "@/lib/subscribers";
import { clampText, hashIp, normalizeEmail, normalizeSource } from "@/lib/validation";

type Body = {
	email?: unknown;
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

	// Honeypot: bots fill every field. Look successful, write nothing.
	if (typeof body.website === "string" && body.website.trim() !== "") {
		return Response.json({ id: crypto.randomUUID(), position: 1 });
	}

	const email = normalizeEmail(body.email);
	if (!email) return Response.json({ error: "invalid_email" }, { status: 400 });

	const referrer = clampText(body.referrer, 500);
	const utm_source = clampText(body.utm_source, 80);
	const utm_medium = clampText(body.utm_medium, 80);
	const utm_campaign = clampText(body.utm_campaign, 80);

	try {
		const db = await getDb();
		const project = await getPublishedProject(db, slug);
		if (!project) return Response.json({ error: "not_found" }, { status: 404 });

		const ipHash = await hashIp(request.headers.get("cf-connecting-ip"));
		if (await isRateLimited(db, ipHash)) {
			return Response.json({ error: "rate_limited" }, { status: 429 });
		}

		const owner = await db
			.prepare("SELECT plan FROM users WHERE id = ?")
			.bind(project.user_id)
			.first<{ plan: string }>();

		const limit = limitsFor(owner?.plan).subscribers;
		if (Number.isFinite(limit) && (await countSubscribers(db, project.id)) >= limit) {
			return Response.json({ error: "list_full" }, { status: 403 });
		}

		const { id, position } = await joinWaitlist(db, {
			projectId: project.id,
			email,
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
		console.error("project waitlist join failed", error);
		return Response.json({ error: "server_error" }, { status: 500 });
	}
}
