"use client";

import { useEffect, useRef, useState } from "react";
import { DiscordIcon } from "@/components/discord-icon";
import type { AppDict } from "@/i18n/app";
import type { Lang } from "@/i18n/dictionaries";
import { DISCORD_URL } from "@/lib/site";

const ROW =
	"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-ink-3";

const LANGS: { code: Lang; label: string }[] = [
	{ code: "en", label: "English" },
	{ code: "zh", label: "中文" },
];

/**
 * The one control in the app header: language, MCP and sign out, collapsed
 * behind a gear. `next` is the current pathname, so switching language lands
 * back on the page the menu was opened from.
 */
export function SettingsMenu({
	lang,
	next,
	t,
}: {
	lang: Lang;
	next: string;
	t: AppDict["nav"];
}) {
	const [open, setOpen] = useState(false);
	const wrap = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;

		function onPointerDown(event: PointerEvent) {
			if (!wrap.current?.contains(event.target as Node)) setOpen(false);
		}
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setOpen(false);
		}

		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	return (
		<div ref={wrap} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label={t.settings}
				aria-haspopup="menu"
				aria-expanded={open}
				className={`rounded-full border p-1.5 transition-colors ${
					open
						? "border-dim text-fg"
						: "border-line text-muted hover:border-dim hover:text-fg"
				}`}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
					className="h-[18px] w-[18px]"
				>
					<path
						d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path
						d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.7-1.3-1.9-3.3-2 .8a7.7 7.7 0 0 0-2.6-1.5L14.3 3H9.7l-.3 2.2a7.7 7.7 0 0 0-2.6 1.5l-2-.8-1.9 3.3 1.7 1.3a7.7 7.7 0 0 0 0 3l-1.7 1.3 1.9 3.3 2-.8a7.7 7.7 0 0 0 2.6 1.5l.3 2.2h4.6l.3-2.2a7.7 7.7 0 0 0 2.6-1.5l2 .8 1.9-3.3-1.7-1.3Z"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinejoin="round"
					/>
				</svg>
			</button>

			{open && (
				<div
					role="menu"
					className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-ink-2 p-1.5 shadow-xl shadow-black/40"
				>
					<p className="px-3 pb-1 pt-1.5 text-[11.5px] uppercase tracking-wide text-dim">
						{t.language}
					</p>
					{LANGS.map((option) => (
						<form key={option.code} action="/api/lang" method="post">
							<input type="hidden" name="lang" value={option.code} />
							<input type="hidden" name="next" value={next} />
							<button
								type="submit"
								role="menuitem"
								className={`${ROW} ${
									option.code === lang ? "text-fg" : "text-muted hover:text-fg"
								}`}
							>
								{option.label}
								{option.code === lang && (
									<svg
										viewBox="0 0 24 24"
										fill="none"
										aria-hidden="true"
										className="h-4 w-4 text-brand"
									>
										<path
											d="m5 12.5 4.5 4.5L19 7.5"
											stroke="currentColor"
											strokeWidth="1.8"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</button>
						</form>
					))}

					<div className="my-1.5 h-px bg-line-soft" />

					<a
						href="/dashboard/settings"
						role="menuitem"
						className={`${ROW} text-muted hover:text-fg`}
					>
						{t.mcp}
					</a>

					{DISCORD_URL && (
						<a
							href={DISCORD_URL}
							target="_blank"
							rel="noopener noreferrer"
							role="menuitem"
							className={`${ROW} text-muted hover:text-fg`}
						>
							{t.feedback}
							<DiscordIcon className="h-4 w-4 text-dim" />
						</a>
					)}

					<div className="my-1.5 h-px bg-line-soft" />

					<form action="/api/auth/logout" method="post">
						<button
							type="submit"
							role="menuitem"
							className={`${ROW} text-muted hover:text-fg`}
						>
							{t.logout}
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
