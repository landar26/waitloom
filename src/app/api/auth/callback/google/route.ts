import { NextResponse, type NextRequest } from "next/server";
import {
	OAUTH_STATE_COOKIE,
	SESSION_COOKIE,
	createSession,
	sessionCookieOptions,
	upsertGoogleUser,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { requireSecret } from "@/lib/env";
import { exchangeCode } from "@/lib/google";
import { preferredLang } from "@/lib/lang";
import { callbackUrl } from "./callback-url";

function failed(request: NextRequest, reason: string) {
	const url = new URL("/login", request.url);
	url.searchParams.set("error", reason);
	return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
	const params = new URL(request.url).searchParams;

	if (params.get("error")) return failed(request, "denied");

	const code = params.get("code");
	const state = params.get("state");
	const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

	if (!code || !state || !expected || state !== expected) {
		return failed(request, "state");
	}

	try {
		const [clientId, clientSecret] = await Promise.all([
			requireSecret("GOOGLE_CLIENT_ID"),
			requireSecret("GOOGLE_CLIENT_SECRET"),
		]);

		const identity = await exchangeCode({
			code,
			clientId,
			clientSecret,
			redirectUri: callbackUrl(request.url),
		});

		const db = await getDb();
		const user = await upsertGoogleUser(
			db,
			identity,
			preferredLang(request.headers.get("accept-language")),
		);
		const { token, expiresAt } = await createSession(db, user.id);

		const response = NextResponse.redirect(new URL("/dashboard", request.url));
		response.cookies.set(
			SESSION_COOKIE,
			token,
			sessionCookieOptions(request.url, expiresAt),
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	} catch (error) {
		console.error("google sign-in failed", error);
		return failed(request, "server");
	}
}
