"use client";

import { useState } from "react";
import type { AppDict } from "@/i18n/app";
import { SLUG_MAX } from "@/lib/host";

/** Address, page language, and the one destructive action. */
export function ProjectSettings({
	projectId,
	name,
	initialSlug,
	initialLang,
	rootHost,
	dict,
}: {
	projectId: string;
	name: string;
	initialSlug: string;
	initialLang: string;
	rootHost: string;
	dict: AppDict;
}) {
	const t = dict.settings;
	const [slug, setSlug] = useState(initialSlug);
	const [lang, setLang] = useState(initialLang);
	const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
	const [error, setError] = useState<string | null>(null);
	const [confirmName, setConfirmName] = useState("");
	const [deleting, setDeleting] = useState(false);

	async function save() {
		setState("saving");
		setError(null);
		try {
			const res = await fetch(`/api/projects/${projectId}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ slug: slug.trim().toLowerCase(), lang }),
			});
			const data = (await res.json().catch(() => null)) as { error?: string } | null;

			if (res.status === 409) {
				setError(data?.error === "slug_taken" ? t.slugTaken : t.slugInvalid);
				setState("idle");
				return;
			}
			if (!res.ok) throw new Error("save failed");

			setState("saved");
			setTimeout(() => setState("idle"), 1800);
		} catch {
			setError(dict.common.error);
			setState("idle");
		}
	}

	async function remove() {
		setDeleting(true);
		try {
			const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
			if (res.ok) window.location.href = "/dashboard";
			else throw new Error("delete failed");
		} catch {
			setError(dict.common.error);
			setDeleting(false);
		}
	}

	return (
		<div className="max-w-xl space-y-8">
			<section>
				<h2 className="text-lg font-semibold tracking-tight">{t.address}</h2>

				<div className="mt-4 flex items-center gap-2">
					<input
						type="text"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						maxLength={SLUG_MAX}
						className="w-44 rounded-lg border border-line bg-ink-2 px-3 py-2 text-[14px] outline-none focus:border-dim"
					/>
					<span className="font-mono text-[13.5px] text-dim">.{rootHost}</span>
				</div>
				<p className="mt-2 text-[12.5px] text-dim">{t.slugHint}</p>
			</section>

			<section>
				<h2 className="text-lg font-semibold tracking-tight">{t.language}</h2>
				<div className="mt-4 flex gap-2">
					{(["en", "zh"] as const).map((value) => (
						<button
							key={value}
							type="button"
							onClick={() => setLang(value)}
							aria-pressed={lang === value}
							className={`rounded-full border px-4 py-2 text-[13.5px] transition-colors ${
								lang === value
									? "border-brand bg-brand-dim text-brand-2"
									: "border-line bg-ink-2 text-muted hover:border-dim hover:text-fg"
							}`}
						>
							{value === "en" ? "English" : "中文"}
						</button>
					))}
				</div>
				<p className="mt-2 text-[12.5px] text-dim">{t.languageHint}</p>
			</section>

			{error && <p className="text-[13.5px] text-brand-2">{error}</p>}

			<button
				type="button"
				onClick={save}
				disabled={state === "saving"}
				className="rounded-full bg-brand px-5 py-2.5 text-[14px] font-medium text-[#1a0d05] transition-opacity hover:opacity-90 disabled:opacity-50"
			>
				{state === "saving" ? t.saving : state === "saved" ? t.saved : t.save}
			</button>

			<section className="rounded-xl border border-line-soft p-5">
				<h2 className="text-[15px] font-semibold tracking-tight text-brand-2">
					{t.danger}
				</h2>
				<p className="mt-2 text-[13px] leading-relaxed text-dim">{t.deleteHint}</p>

				<div className="mt-4 flex flex-wrap items-center gap-2">
					<input
						type="text"
						value={confirmName}
						onChange={(e) => setConfirmName(e.target.value)}
						placeholder={t.deleteConfirm}
						className="min-w-56 flex-1 rounded-lg border border-line bg-ink-2 px-3 py-2 text-[13.5px] outline-none placeholder:text-dim focus:border-dim"
					/>
					<button
						type="button"
						onClick={remove}
						disabled={confirmName !== name || deleting}
						className="rounded-full border border-line px-4 py-2 text-[13.5px] text-muted transition-colors hover:border-brand hover:text-brand-2 disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted"
					>
						{deleting ? t.deleting : t.deleteProject}
					</button>
				</div>
			</section>
		</div>
	);
}
