import { cookies, headers } from "next/headers";
import { LANGS, type Lang } from "@/i18n/dictionaries";
import { LANG_COOKIE } from "./cookies";

export { LANG_COOKIE };

export function isLang(value: unknown): value is Lang {
	return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/**
 * The best of `available` for this visitor, in the order Accept-Language asked
 * for. A region tag matches its base language (`zh-CN` → `zh`); a language the
 * caller does not offer is skipped rather than approximated.
 *
 * Published pages offer only the languages their founder actually wrote, which
 * is why the set is a parameter and not always `LANGS`.
 */
export function negotiateLang<T extends string>(
	acceptLanguage: string | null | undefined,
	available: readonly T[],
	fallback: T,
): T {
	if (!acceptLanguage || available.length === 0) return fallback;

	const ranked = acceptLanguage
		.split(",")
		.map((part) => {
			const [tag, ...params] = part.split(";");
			const quality = params.find((p) => p.trim().startsWith("q="));
			return {
				tag: tag.trim().toLowerCase(),
				q: quality ? Number(quality.split("=")[1]) : 1,
			};
		})
		.filter((entry) => entry.tag && Number.isFinite(entry.q) && entry.q > 0)
		// Stable, so equal q-values keep the order the header listed them in.
		.sort((a, b) => b.q - a.q);

	for (const { tag } of ranked) {
		if (tag === "*") break;
		const base = tag.split("-")[0];
		const match = available.find((code) => code === tag || code === base);
		if (match) return match;
	}
	return fallback;
}

/** Picks a dashboard language from an Accept-Language header. */
export function preferredLang(acceptLanguage: string | null | undefined): Lang {
	return negotiateLang(acceptLanguage, LANGS, "en");
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
