import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
 * HTTP Basic auth for the founder-only pages.
 *
 * Deliberately `middleware.ts` and not Next 16's `proxy.ts`: a proxy always runs
 * on the Node.js runtime, and @opennextjs/cloudflare refuses to build one
 * ("Node.js middleware is not currently supported") as of 1.20.2. The deprecated
 * middleware convention still compiles to an edge function, which is what the
 * Workers adapter needs. Revisit when the adapter supports Node proxies.
 */
export async function middleware(request: NextRequest) {
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
	matcher: ["/admin/:path*", "/api/admin/:path*"],
};
