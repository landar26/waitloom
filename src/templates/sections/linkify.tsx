import type { ReactNode } from "react";

/**
 * CJK text and its punctuation, which a URL must stop at: Chinese, Japanese and
 * Korean run without spaces, so `…/zh，然后订阅` would otherwise be swallowed
 * whole into the href. The cost is that an unencoded CJK path stops early —
 * rarer than a link followed by a sentence, and browsers percent-encode those.
 */
const STOP = "\\u3000-\\u303F\\u3040-\\u30FF\\u4E00-\\u9FFF\\uAC00-\\uD7AF\\uFF00-\\uFFEF";

/**
 * URLs (`https://…`, `www.…`) and bare emails inside free text the founder
 * typed. Everything else in the string is left alone.
 */
const PATTERN = new RegExp(
	`(?:https?://|www\\.)[^\\s<>${STOP}]+|[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+`,
	"gi",
);

/** Sentence punctuation that trails a URL far more often than it belongs to it. */
const TRAILING = /[.,;:!?'"）)\]}、。，！？]+$/;

/**
 * Strip the punctuation that ended the sentence rather than the link, keeping a
 * closing paren only when the link opened one itself (`…/Foo_(bar)`).
 */
function trimTrailing(raw: string): string {
	let url = raw;
	for (;;) {
		const trimmed = url.replace(TRAILING, "");
		if (trimmed === url) return url;
		const dropped = url.slice(trimmed.length);
		if (dropped.startsWith(")") && countChar(trimmed, "(") > countChar(trimmed, ")")) {
			return trimmed + ")";
		}
		url = trimmed;
	}
}

function countChar(s: string, char: string): number {
	let n = 0;
	for (const c of s) if (c === char) n += 1;
	return n;
}

function hrefFor(url: string): string {
	if (/^https?:\/\//i.test(url)) return url;
	if (url.includes("@")) return `mailto:${url}`;
	return `https://${url}`;
}

/**
 * Turn the links a founder typed into free text into real anchors. Returns React
 * nodes rather than HTML, so nothing user-supplied is ever parsed as markup.
 */
export function linkify(text: string): ReactNode {
	const out: ReactNode[] = [];
	let last = 0;

	PATTERN.lastIndex = 0;
	for (let m = PATTERN.exec(text); m; m = PATTERN.exec(text)) {
		const url = trimTrailing(m[0]);
		const start = m.index;
		const end = start + url.length;
		PATTERN.lastIndex = end;

		if (start > last) out.push(text.slice(last, start));
		out.push(
			<a
				key={start}
				href={hrefFor(url)}
				target="_blank"
				rel="noopener noreferrer nofollow ugc"
				className="text-[var(--wl-accent)] underline underline-offset-2 transition-opacity hover:opacity-70"
			>
				{url}
			</a>,
		);
		last = end;
	}

	if (last === 0) return text;
	if (last < text.length) out.push(text.slice(last));
	return out;
}
