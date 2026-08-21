import { sanitizeContent, type ProjectContent } from "@/lib/content";

/**
 * One imaginary product per template, used by the marketing showcase so the
 * templates on the homepage are the same components a founder actually gets.
 */
export type Sample = {
	name: string;
	slug: string;
	content: ProjectContent;
};

const make = (
	name: string,
	slug: string,
	headline: string,
	subheadline: string,
	ctaLabel: string,
	features: Array<[string, string]>,
): Sample => ({
	name,
	slug,
	content: sanitizeContent({
		headline,
		subheadline,
		ctaLabel,
		features: features.map(([title, body]) => ({ title, body })),
	}),
});

export const SAMPLES: Record<string, Sample> = {
	minimal: make(
		"Filevia",
		"filevia",
		"Move files. Without the friction.",
		"The fastest way to move files between all of your devices.",
		"Get early access",
		[
			["Drag, drop, done", "No accounts on the other end. Send a link, it lands."],
			["Every device", "Mac, Windows, iPhone and Android, over the local network."],
			["End to end", "Files never sit on anyone's server, including ours."],
		],
	),
	apple: make(
		"Halo",
		"halo",
		"Focus, beautifully.",
		"A calmer way to plan your day on Mac and iPhone.",
		"Get early access",
		[
			["One list, everywhere", "iCloud keeps your day in sync without a login."],
			["Quiet by design", "No streaks, no badges, no nagging."],
			["Built for the Mac", "Native SwiftUI, in the menu bar where you need it."],
		],
	),
	developer: make(
		"relay/cli",
		"relay",
		"Deploy from the terminal.",
		"One command from your repo to a URL. No dashboard required.",
		"Join waitlist",
		[
			["npx relay deploy", "Live in about two seconds, from any directory."],
			["CI friendly", "Real exit codes and deterministic output."],
			["MIT licensed", "Read it, fork it, ship it."],
		],
	),
	ai: make(
		"Prism",
		"prism",
		"Your research, summarized.",
		"An agent that reads every paper so you don't have to.",
		"Request access",
		[
			["Answers with sources", "Every claim links back to the paper it came from."],
			["Your library", "Point it at your own PDFs, not the whole internet."],
			["Private by default", "Nothing you upload trains anything."],
		],
	),
	dark: make(
		"Vaultline",
		"vaultline",
		"Secrets that never leave.",
		"End-to-end encrypted secret management for small teams.",
		"Join waitlist",
		[
			["Zero knowledge", "We cannot read your secrets. Neither can anyone else."],
			["Built for small teams", "Share a vault without buying a seat per person."],
			["Audit trail", "Who read what, and when, for as far back as you need."],
		],
	),
	playful: make(
		"Bloop",
		"bloop",
		"Group chats, but fun again.",
		"Tiny rooms for the six people you actually text.",
		"Get it first",
		[
			["Six people, max", "Small on purpose. No one gets added by accident."],
			["Disappearing by default", "Yesterday's chaos does not follow you around."],
			["Silly on purpose", "Reactions, doodles, and terrible sound effects."],
		],
	),
};

export function getSample(templateId: string): Sample {
	return SAMPLES[templateId] ?? SAMPLES.minimal;
}
