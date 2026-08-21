import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE } from "@/lib/cookies";
import { isLang } from "@/lib/lang";

/** Flips the dashboard language and returns to wherever the toggle was. */
export async function POST(request: NextRequest) {
	const form = await request.formData().catch(() => null);
	const lang = form?.get("lang");
	const next = form?.get("next");

	const target =
		typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
			? next
			: "/dashboard";

	const response = NextResponse.redirect(new URL(target, request.url), 303);

	if (isLang(lang)) {
		response.cookies.set(LANG_COOKIE, lang, {
			path: "/",
			maxAge: 365 * 24 * 60 * 60,
			sameSite: "lax",
		});
	}

	return response;
}
