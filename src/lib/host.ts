import { SITE_URL } from "./site";

/** The apex the app is served from, e.g. `waitloom.app`. */
export const ROOT_HOST = new URL(SITE_URL).host;

/**
 * Subdomains that must never become a project. Anything the platform might
 * want later belongs here too — freeing a taken slug is a lot harder than
 * reserving one now.
 */
export const RESERVED_SLUGS = new Set([
	"www", "app", "api", "admin", "dashboard", "login", "logout", "signup",
	"auth", "account", "billing", "mail", "email", "smtp", "imap", "ns1", "ns2",
	"blog", "docs", "help", "support", "status", "cdn", "static", "assets",
	"media", "img", "images", "files", "download", "downloads", "cname",
	"waitloom", "test", "dev", "staging", "preview", "demo", "example",
	"about", "pricing", "terms", "privacy", "legal", "security", "s", "p",
]);

export const SLUG_MIN = 3;
export const SLUG_MAX = 30;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
	if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return false;
	if (!SLUG_RE.test(slug)) return false;
	if (slug.includes("--")) return false;
	return !RESERVED_SLUGS.has(slug);
}

/** Best-effort slug from a product name. May still be taken or reserved. */
export function slugify(name: string): string {
	const base = name
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, SLUG_MAX)
		.replace(/-+$/, "");
	return base.length >= SLUG_MIN ? base : "";
}

export function hostname(host: string | null | undefined): string {
	return (host ?? "").split(":")[0].toLowerCase();
}

function isLocal(host: string): boolean {
	const name = hostname(host);
	return name === "localhost" || name === "127.0.0.1" || name.endsWith(".localhost");
}

/**
 * The slug a request is for, or null when this host is the app itself.
 * `www` is never a project — middleware redirects it to the apex.
 */
export function slugFromHost(host: string | null | undefined): string | null {
	const name = hostname(host);
	if (!name.endsWith(`.${ROOT_HOST}`)) return null;

	const slug = name.slice(0, -(ROOT_HOST.length + 1));
	if (!slug || slug.includes(".")) return null;
	if (RESERVED_SLUGS.has(slug)) return null;
	return slug;
}

/** Where a published page lives, always reachable by path as well. */
export function projectPath(slug: string): string {
	return `/s/${slug}`;
}

/**
 * The canonical URL to show and share. Wildcard DNS does not exist in local
 * dev, so a localhost request gets the path form instead of a subdomain that
 * would not resolve.
 */
export function projectUrl(slug: string, requestHost?: string | null): string {
	if (requestHost && isLocal(requestHost)) {
		return `http://${requestHost}${projectPath(slug)}`;
	}
	return `https://${slug}.${ROOT_HOST}`;
}
