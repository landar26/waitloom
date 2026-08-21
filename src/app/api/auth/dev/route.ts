import { NextResponse, type NextRequest } from "next/server";
import {
	SESSION_COOKIE,
	createSession,
	sessionCookieOptions,
	upsertGoogleUser,
} from "@/lib/auth";
import { getDb } from "@/lib/db";

/**
 * Signs in as a throwaway account, so the whole product can be exercised
 * locally without a Google client — and without anyone driving a real Google
 * account through a browser. Never available in a production build.
 */
export async function GET(request: NextRequest) {
	if (process.env.NODE_ENV === "production") {
		return new NextResponse("Not found", { status: 404 });
	}

	const email = (
		new URL(request.url).searchParams.get("email") ?? "dev@waitloom.local"
	)
		.trim()
		.toLowerCase();

	const db = await getDb();
	const user = await upsertGoogleUser(
		db,
		{ sub: `dev:${email}`, email, name: "Dev Founder" },
		"en",
	);
	const { token, expiresAt } = await createSession(db, user.id);

	const response = NextResponse.redirect(new URL("/dashboard", request.url));
	response.cookies.set(
		SESSION_COOKIE,
		token,
		sessionCookieOptions(request.url, expiresAt),
	);
	return response;
}
