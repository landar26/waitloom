import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE } from "@/lib/cookies";
import { ROOT_HOST, hostname, projectPath, slugFromHost } from "@/lib/host";

/**
 * Server components cannot see the request path. The app header needs it so the
 * language toggle can return to the page it was clicked on.
 */
function withPathname(request: NextRequest) {
	const headers = new Headers(request.headers);
	headers.set("x-pathname", request.nextUrl.pathname);
	return NextResponse.next({ request: { headers } });
}

async function adminPassword(): Promise<string | undefined> {
	// .dev.vars in dev, `wrangler secret put` in production.
	try {
		const { env } = await getCloudflareContext({ async: true });
		const fromBinding = (env as CloudflareEnv & { ADMIN_PASSWORD?: string })
			.ADMIN_PASSWORD;
		if (fromBinding) return fromBinding;
	} catch {
		/* not running on Workers */
	}
	return process.env.ADMIN_PASSWORD;
}

/**
 * Deliberately `middleware.ts` and not Next 16's `proxy.ts`: a proxy always runs
 * on the Node.js runtime, and @opennextjs/cloudflare refuses to build one
 * ("Node.js middleware is not currently supported") as of 1.20.2. The deprecated
 * middleware convention still compiles to an edge function, which is what the
 * Workers adapter needs. Revisit when the adapter supports Node proxies.
 *
 * Three jobs, in order: put published pages on their own subdomain, keep the
 * founder-only pages behind a password, and bounce signed-out visitors off the
 * dashboard.
 */
export async function middleware(request: NextRequest) {
	const host = hostname(request.headers.get("host"));
	const { pathname } = request.nextUrl;

	// The wildcard Worker route swallows www along with everything else.
	if (host === `www.${ROOT_HOST}`) {
		const url = new URL(request.url);
		url.host = ROOT_HOST;
		return NextResponse.redirect(url, 301);
	}

	const slug = slugFromHost(host);
	if (slug) {
		// API routes resolve the project from the host themselves, and /media
		// serves uploads straight out of R2 — neither belongs under /s/<slug>.
		if (pathname.startsWith("/api/") || pathname.startsWith("/media/")) {
			return NextResponse.next();
		}

		const url = request.nextUrl.clone();
		url.pathname = `${projectPath(slug)}${pathname === "/" ? "" : pathname}`;
		return NextResponse.rewrite(url);
	}

	if (pathname.startsWith("/dashboard")) {
		// Presence only. Whether the session is real is settled by the page,
		// which can reach D1; this just avoids a flash of the signed-in shell.
		if (!request.cookies.get(SESSION_COOKIE)?.value) {
			const url = new URL("/login", request.url);
			url.searchParams.set("next", pathname);
			return NextResponse.redirect(url);
		}
		return withPathname(request);
	}

	if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
		return adminGate(request);
	}

	if (pathname === "/login") return withPathname(request);

	return NextResponse.next();
}

async function adminGate(request: NextRequest) {
	const password = await adminPassword();

	if (!password) {
		return new NextResponse(
			"ADMIN_PASSWORD is not set. Add it to .dev.vars locally, or `wrangler secret put ADMIN_PASSWORD` in production.",
			{ status: 503 },
		);
	}

	const header = request.headers.get("authorization") ?? "";
	const [scheme, encoded] = header.split(" ");

	if (scheme === "Basic" && encoded) {
		const decoded = atob(encoded);
		const supplied = decoded.slice(decoded.indexOf(":") + 1);
		if (timingSafeEqual(supplied, password)) {
			return NextResponse.next();
		}
	}

	return new NextResponse("Authentication required.", {
		status: 401,
		headers: { "WWW-Authenticate": 'Basic realm="Waitloom admin"' },
	});
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

export const config = {
	// Everything except build output and the static files served straight from
	// the assets binding — host rewriting has to see ordinary page requests.
	matcher: [
		"/((?!_next/static|_next/image|icon.svg|favicon.ico|robots.txt|sitemap.xml).*)",
	],
};
