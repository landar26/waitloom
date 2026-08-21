import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, destroySession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
	const token = request.cookies.get(SESSION_COOKIE)?.value;

	if (token) {
		try {
			await destroySession(await getDb(), token);
		} catch (error) {
			// The cookie still gets cleared below; a stale row expires on its own.
			console.error("logout failed to delete the session row", error);
		}
	}

	const response = NextResponse.redirect(new URL("/", request.url), 303);
	response.cookies.delete(SESSION_COOKIE);
	return response;
}
