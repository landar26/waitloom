import { PRODUCT_TYPES, type ProductType } from "@/i18n/dictionaries";
import { clampText } from "./validation";

/**
 * Everything a founder can edit on their page, stored as one JSON blob on
 * `projects.content`. The editor writes whole documents and the templates read
 * whole documents, so a table per section would buy nothing.
 */

export const SECTIONS = [
	"hero",
	"screenshot",
	"features",
	"waitlist",
	"howItWorks",
	"faq",
	"founder",
	"social",
] as const;

export type SectionId = (typeof SECTIONS)[number];

/** A pre-launch page without these two is not a pre-launch page. */
export const LOCKED_SECTIONS: SectionId[] = ["hero", "waitlist"];

export const DEFAULT_SECTIONS: SectionId[] = [
	"hero",
	"screenshot",
	"features",
	"waitlist",
];

export const MAX_FEATURES = 6;
export const MAX_STEPS = 4;
export const MAX_FAQ = 6;

const MAX_HEADLINE = 90;
const MAX_LINE = 160;
const MAX_BODY = 400;
const MAX_URL = 500;

export type Feature = { title: string; body: string };
export type Step = { title: string; body: string };
export type FaqItem = { q: string; a: string };

export type ProjectContent = {
	logoUrl: string;
	headline: string;
	subheadline: string;
	ctaLabel: string;
	screenshotUrl: string;
	features: Feature[];
	howItWorks: Step[];
	faq: FaqItem[];
	founder: { name: string; avatarUrl: string; bio: string };
	social: { x: string; github: string; website: string; discord: string };
};

/** http(s) only — this is user content rendered on a waitloom.app subdomain. */
export function safeUrl(raw: unknown): string {
	if (typeof raw !== "string") return "";
	const value = raw.trim();
	if (!value) return "";
	if (value.length > MAX_URL) return "";
	// Relative uploads served by our own Worker.
	if (value.startsWith("/media/")) return value;
	try {
		const url = new URL(value);
		if (url.protocol !== "http:" && url.protocol !== "https:") return "";
		return url.toString();
	} catch {
		return "";
	}
}

function text(raw: unknown, max: number): string {
	return clampText(raw, max) ?? "";
}

function list<T>(raw: unknown, max: number, map: (item: unknown) => T | null): T[] {
	if (!Array.isArray(raw)) return [];
	const out: T[] = [];
	for (const item of raw.slice(0, max)) {
		const mapped = map(item);
		if (mapped) out.push(mapped);
	}
	return out;
}

/** Coerces whatever the client sent into a content document we can render. */
export function sanitizeContent(raw: unknown): ProjectContent {
	const input = (raw ?? {}) as Record<string, unknown>;
	const founder = (input.founder ?? {}) as Record<string, unknown>;
	const social = (input.social ?? {}) as Record<string, unknown>;

	return {
		logoUrl: safeUrl(input.logoUrl),
		headline: text(input.headline, MAX_HEADLINE),
		subheadline: text(input.subheadline, MAX_LINE),
		ctaLabel: text(input.ctaLabel, 40),
		screenshotUrl: safeUrl(input.screenshotUrl),
		features: list<Feature>(input.features, MAX_FEATURES, (item) => {
			const f = (item ?? {}) as Record<string, unknown>;
			const title = text(f.title, 60);
			const body = text(f.body, MAX_BODY);
			return title || body ? { title, body } : null;
		}),
		howItWorks: list<Step>(input.howItWorks, MAX_STEPS, (item) => {
			const s = (item ?? {}) as Record<string, unknown>;
			const title = text(s.title, 60);
			const body = text(s.body, MAX_BODY);
			return title || body ? { title, body } : null;
		}),
		faq: list<FaqItem>(input.faq, MAX_FAQ, (item) => {
			const f = (item ?? {}) as Record<string, unknown>;
			const q = text(f.q, MAX_LINE);
			const a = text(f.a, MAX_BODY);
			return q || a ? { q, a } : null;
		}),
		founder: {
			name: text(founder.name, 60),
			avatarUrl: safeUrl(founder.avatarUrl),
			bio: text(founder.bio, MAX_BODY),
		},
		social: {
			x: safeUrl(social.x),
			github: safeUrl(social.github),
			website: safeUrl(social.website),
			discord: safeUrl(social.discord),
		},
	};
}

export function parseContent(raw: string | null): ProjectContent {
	if (!raw) return sanitizeContent({});
	try {
		return sanitizeContent(JSON.parse(raw));
	} catch {
		return sanitizeContent({});
	}
}

export function parseSections(raw: string | null): SectionId[] {
	let parsed: unknown;
	try {
		parsed = raw ? JSON.parse(raw) : null;
	} catch {
		parsed = null;
	}
	return sanitizeSections(parsed);
}

export function sanitizeSections(raw: unknown): SectionId[] {
	const wanted = new Set(
		Array.isArray(raw)
			? raw.filter((s): s is SectionId =>
					(SECTIONS as readonly string[]).includes(s as string),
				)
			: DEFAULT_SECTIONS,
	);
	for (const locked of LOCKED_SECTIONS) wanted.add(locked);
	// Keep SECTIONS order so the page never renders FAQ above features.
	return SECTIONS.filter((s) => wanted.has(s));
}

/** Starter copy so the page looks finished the moment a template is picked. */
const STARTER_FEATURES: Record<ProductType, Feature[]> = {
	saas: [
		{ title: "Set up in minutes", body: "No migration, no onboarding call. Connect your account and you are running." },
		{ title: "Built for small teams", body: "Everyone sees the same thing, without another admin panel to learn." },
		{ title: "Fair pricing", body: "One flat price. No per-seat maths, no surprise overage bill." },
	],
	ai: [
		{ title: "Answers with sources", body: "Every result links back to where it came from, so you can check the work." },
		{ title: "Works on your data", body: "Point it at your own documents instead of the whole internet." },
		{ title: "Private by default", body: "Nothing you upload is used to train anything." },
	],
	ios: [
		{ title: "Fast and native", body: "Built with SwiftUI, so it feels like it came with the phone." },
		{ title: "Syncs everywhere", body: "iCloud keeps every device on the same page automatically." },
		{ title: "No account needed", body: "Open it and start. Sign in only if you want to sync." },
	],
	macos: [
		{ title: "Lives in the menu bar", body: "One keystroke away, out of the way the rest of the time." },
		{ title: "Native, not a web wrapper", body: "Launches instantly and stays out of your battery budget." },
		{ title: "Works offline", body: "Everything runs locally. The network is optional." },
	],
	android: [
		{ title: "Material You", body: "Adapts to your wallpaper and your theme, the way Android should." },
		{ title: "Tiny download", body: "Under 10 MB, and it stays that way." },
		{ title: "Widgets included", body: "The part you use most, right on your home screen." },
	],
	devtool: [
		{ title: "One command", body: "Install with npm, run it, done. No config file to write first." },
		{ title: "CI friendly", body: "Deterministic output and a real exit code, so pipelines can trust it." },
		{ title: "Open source", body: "MIT licensed. Read it, fork it, ship it." },
	],
	extension: [
		{ title: "One click", body: "No account, no setup screen. Install and it works on the page you are on." },
		{ title: "Nothing leaves the browser", body: "No tracking, no analytics, no phoning home." },
		{ title: "Keyboard first", body: "Every action has a shortcut you can remap." },
	],
	game: [
		{ title: "Easy to learn", body: "One rule to start. The depth shows up on its own." },
		{ title: "Play with friends", body: "Share a link, no accounts, no lobby to configure." },
		{ title: "Runs anywhere", body: "Phone, tablet or desktop — same game, same save." },
	],
	other: [
		{ title: "Simple", body: "Does the one thing you came for, and does it well." },
		{ title: "Fast", body: "No loading spinners, no waiting around." },
		{ title: "Yours", body: "Export your data whenever you like." },
	],
};

export function defaultContent(
	name: string,
	description: string,
	productType: string,
): ProjectContent {
	const type = (PRODUCT_TYPES as readonly string[]).includes(productType)
		? (productType as ProductType)
		: "other";

	return sanitizeContent({
		headline: description || name,
		subheadline: "",
		ctaLabel: "Join the waitlist",
		features: STARTER_FEATURES[type],
		howItWorks: [],
		faq: [],
		founder: {},
		social: {},
	});
}
