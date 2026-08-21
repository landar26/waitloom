import { cookies, headers } from "next/headers";
import { LANGS, type Lang } from "@/i18n/dictionaries";
import { LANG_COOKIE } from "./cookies";

export { LANG_COOKIE };

export function isLang(value: unknown): value is Lang {
	return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** Picks a dashboard language from an Accept-Language header. */
export function preferredLang(acceptLanguage: string | null | undefined): Lang {
	if (!acceptLanguage) return "en";
	// zh, zh-CN, zh-Hans — any of them means the Chinese copy is the better fit.
	return /(^|,|\s)zh\b/i.test(acceptLanguage) ? "zh" : "en";
}

/**
 * The language for the app shell: an explicit choice wins, otherwise the
 * browser's. Public project pages ignore this — they follow `projects.lang`.
 */
export async function appLang(): Promise<Lang> {
	const chosen = (await cookies()).get(LANG_COOKIE)?.value;
	if (isLang(chosen)) return chosen;
	return preferredLang((await headers()).get("accept-language"));
}
