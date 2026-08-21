"use client";

import type { PageDict } from "@/i18n/page";
import { buttonClass } from "@/templates/sections/chrome";

/**
 * The page's main button once its CTA points at a shipped product, in place of
 * the email form. It counts the click on the way out: `sendBeacon` survives the
 * navigation, and a click that fails to record still has to open the link.
 */
export function CtaLink({
	slug,
	href,
	label,
	dict,
	preview = false,
}: {
	slug: string;
	href: string;
	label: string;
	dict: PageDict;
	/** Editor preview: render the real thing, but go nowhere and count nothing. */
	preview?: boolean;
}) {
	function count() {
		if (preview) return;
		try {
			const body = JSON.stringify({
				referrer: document.referrer || null,
				utm_source: new URLSearchParams(window.location.search).get("utm_source"),
			});
			const url = `/api/p/${slug}/click`;
			const blob = new Blob([body], { type: "application/json" });
			if (navigator.sendBeacon?.(url, blob)) return;

			fetch(url, {
				method: "POST",
				body,
				keepalive: true,
				headers: { "content-type": "application/json" },
			}).catch(() => {});
		} catch {
			/* the link matters, the number does not */
		}
	}

	return (
		<div>
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(event) => {
					if (preview) event.preventDefault();
					else count();
				}}
				className={buttonClass()}
			>
				{label}
			</a>
			{preview && (
				<p className="mt-2.5 text-[13px] text-[var(--wl-dim)]">{dict.form.linkNote}</p>
			)}
		</div>
	);
}
