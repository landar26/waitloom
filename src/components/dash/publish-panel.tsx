"use client";

import { useState } from "react";
import type { AppDict } from "@/i18n/app";

/**
 * Publish, then the share panel from the PRD: the link, a copy button, and the
 * three places founders actually post.
 */
export function PublishPanel({
	projectId,
	url,
	initialPublished,
	dict,
}: {
	projectId: string;
	url: string;
	initialPublished: boolean;
	dict: AppDict;
}) {
	const t = dict.overview;
	const [published, setPublished] = useState(initialPublished);
	const [busy, setBusy] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const display = url.replace(/^https?:\/\//, "");

	async function toggle() {
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			const res = await fetch(`/api/projects/${projectId}/publish`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ published: !published }),
			});
			if (!res.ok) throw new Error(String(res.status));
			setPublished(!published);
		} catch {
			setError(dict.common.error);
		} finally {
			setBusy(false);
		}
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		} catch {
			/* clipboard can be blocked; the link is on screen anyway */
		}
	}

	const shareText = `${display}`;
	const shares = [
		{
			label: "X",
			href: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
		},
		{
			label: "Reddit",
			href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText)}`,
		},
		{
			label: "LinkedIn",
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
		},
	];

	return (
		<div className="rounded-xl border border-line bg-ink-2 p-5">
			<div className="flex flex-wrap items-center gap-3">
				<span
					className={`flex items-center gap-2 text-[13.5px] ${
						published ? "text-brand-2" : "text-dim"
					}`}
				>
					<span
						className={`h-2 w-2 rounded-full ${published ? "bg-brand" : "bg-dim"}`}
					/>
					{published ? dict.dashboard.live : dict.dashboard.draft}
				</span>

				<code className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted">
					{display}
				</code>

				<button
					type="button"
					onClick={toggle}
					disabled={busy}
					className={`rounded-full px-4 py-2 text-[13.5px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${
						published
							? "border border-line text-muted"
							: "bg-brand text-[#1a0d05]"
					}`}
				>
					{busy ? t.publishing : published ? t.unpublish : t.publish}
				</button>
			</div>

			{error && <p className="mt-3 text-[13px] text-brand-2">{error}</p>}

			{published ? (
				<div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-5">
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="rounded-full border border-line px-4 py-2 text-[13px] text-muted transition-colors hover:border-dim hover:text-fg"
					>
						{t.visit}
					</a>
					<button
						type="button"
						onClick={copy}
						className="rounded-full border border-line px-4 py-2 text-[13px] text-muted transition-colors hover:border-dim hover:text-fg"
					>
						{copied ? t.copied : t.copy}
					</button>

					<span className="ml-2 text-[12px] uppercase tracking-[0.1em] text-dim">
						{t.share}
					</span>
					{shares.map((share) => (
						<a
							key={share.label}
							href={share.href}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-full border border-line px-3.5 py-2 text-[13px] text-muted transition-colors hover:border-dim hover:text-fg"
						>
							{share.label}
						</a>
					))}
				</div>
			) : (
				<p className="mt-4 border-t border-line-soft pt-4 text-[13px] text-dim">
					{t.draftHint}
				</p>
			)}
		</div>
	);
}
