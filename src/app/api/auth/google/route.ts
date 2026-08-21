import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_STATE_COOKIE, randomToken } from "@/lib/auth";
import { requireSecret } from "@/lib/env";
import { authorizeUrl } from "@/lib/google";
import { callbackUrl } from "../callback/google/callback-url";

export async function GET(request: NextRequest) {
	let clientId: string;
	try {
		clientId = await requireSecret("GOOGLE_CLIENT_ID");
	} catch (error) {
		return new NextResponse((error as Error).message, { status: 503 });
	}

	const state = randomToken(16);
	const redirect = callbackUrl(request.url);

	const response = NextResponse.redirect(
		authorizeUrl({ clientId, redirectUri: redirect, state }),
	);

	response.cookies.set(OAUTH_STATE_COOKIE, state, {
		httpOnly: true,
		secure: new URL(request.url).protocol === "https:",
		sameSite: "lax",
		path: "/",
		maxAge: 600,
	});

	return response;
}
