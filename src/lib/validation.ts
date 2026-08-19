export const MAX_EMAIL_LENGTH = 254;
export const MAX_TEXT_ANSWER_LENGTH = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: unknown): string | null {
	if (typeof raw !== "string") return null;
	const email = raw.trim().toLowerCase();
	if (!email || email.length > MAX_EMAIL_LENGTH) return null;
	if (!EMAIL_RE.test(email)) return null;
	return email;
}

export function clampText(raw: unknown, max = MAX_TEXT_ANSWER_LENGTH): string | null {
	if (typeof raw !== "string") return null;
	const value = raw.trim().replace(/\s+/g, " ");
	if (!value) return null;
	return value.slice(0, max);
}

/** Collapses utm_source / referrer into the handful of buckets worth reporting. */
export function normalizeSource(input: {
	utm_source?: string | null;
	referrer?: string | null;
	selfHost?: string | null;
}): string {
	const utm = input.utm_source?.trim().toLowerCase();
	if (utm) return utm.slice(0, 40);

	const ref = input.referrer?.trim();
	if (!ref) return "direct";

	let host: string;
	try {
		host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
	} catch {
		return "direct";
	}

	// A referrer from our own site is not a traffic source.
	const self = input.selfHost?.replace(/^www\./, "").toLowerCase();
	if (self && host === self) return "direct";

	const known: Record<string, string> = {
		"x.com": "x",
		"twitter.com": "x",
		"t.co": "x",
		"reddit.com": "reddit",
		"old.reddit.com": "reddit",
		"producthunt.com": "producthunt",
		"news.ycombinator.com": "hackernews",
		"indiehackers.com": "indiehackers",
		"linkedin.com": "linkedin",
		"lnkd.in": "linkedin",
		"github.com": "github",
	};
	return known[host] ?? host.slice(0, 60);
}

export async function hashIp(ip: string | null): Promise<string | null> {
	if (!ip) return null;
	const salt = process.env.IP_SALT ?? "waitloom-local-salt";
	const bytes = new TextEncoder().encode(`${salt}:${ip}`);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
