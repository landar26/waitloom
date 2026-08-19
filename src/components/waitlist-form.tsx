"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCT_TYPES, type Dict, type Lang } from "@/i18n/dictionaries";

type Step = "email" | "questions" | "done";

type Attribution = {
	referrer?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
};

export function WaitlistForm({
	dict,
	lang,
	shareUrl,
}: {
	dict: Dict;
	lang: Lang;
	shareUrl: string;
}) {
	const t = dict.form;
	const [step, setStep] = useState<Step>("email");
	const [email, setEmail] = useState("");
	const [honey, setHoney] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [id, setId] = useState<string | null>(null);
	const [position, setPosition] = useState<number | null>(null);
	const [building, setBuilding] = useState<string | null>(null);
	const [pain, setPain] = useState("");
	const [copied, setCopied] = useState(false);
	const attribution = useRef<Attribution>({});

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		attribution.current = {
			referrer: document.referrer || undefined,
			utm_source: params.get("utm_source") ?? undefined,
			utm_medium: params.get("utm_medium") ?? undefined,
			utm_campaign: params.get("utm_campaign") ?? undefined,
		};
	}, []);

	async function submitEmail(e: React.FormEvent) {
		e.preventDefault();
		if (busy) return;
		setError(null);

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
			setError(t.errInvalid);
			return;
		}

		setBusy(true);
		try {
			const res = await fetch("/api/waitlist", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					lang,
					website: honey,
					...attribution.current,
				}),
			});
			const data = (await res.json().catch(() => null)) as {
				id?: string;
				position?: number;
				error?: string;
			} | null;

			if (res.status === 429) {
				setError(t.errRate);
				return;
			}
			if (!res.ok || !data?.id) {
				setError(data?.error === "invalid_email" ? t.errInvalid : t.errGeneric);
				return;
			}

			setId(data.id);
			setPosition(data.position ?? null);
			setStep("questions");
		} catch {
			setError(t.errGeneric);
		} finally {
			setBusy(false);
		}
	}

	async function submitAnswers() {
		if (busy) return;
		setBusy(true);
		try {
			if (id && (building || pain.trim())) {
				await fetch("/api/waitlist/answers", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						id,
						answers: {
							building: building ?? undefined,
							pain: pain.trim() || undefined,
						},
					}),
				});
			}
		} catch {
			/* answers are optional — never block the success state */
		} finally {
			setBusy(false);
			setStep("done");
		}
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard unavailable */
		}
	}

	if (step === "done") {
		const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(
			`${t.shareText} ${shareUrl}`,
		)}`;
		const redditHref = `https://www.reddit.com/submit?url=${encodeURIComponent(
			shareUrl,
		)}&title=${encodeURIComponent(dict.meta.ogTagline)}`;

		return (
			<div
				id="join"
				className="rise mx-auto w-full max-w-xl scroll-mt-24 rounded-2xl border border-line bg-ink-2/80 p-6 text-left sm:p-7"
			>
				<p className="text-lg font-semibold">{t.successTitle}</p>
				{position !== null && (
					<p className="mt-1 text-2xl font-semibold tracking-tight text-brand">
						{t.successPosition.replace("{n}", String(position))}
					</p>
				)}
				<p className="mt-3 text-[14px] leading-relaxed text-muted">
					{t.successBody}
				</p>

				<div className="mt-6 border-t border-line-soft pt-5">
					<p className="text-[13px] text-dim">{t.shareTitle}</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={copyLink}
							className="rounded-full border border-line bg-ink-3 px-3.5 py-1.5 text-[13px] transition-colors hover:border-dim"
						>
							{copied ? t.copied : t.copy}
						</button>
						<a
							href={xHref}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-full border border-line bg-ink-3 px-3.5 py-1.5 text-[13px] transition-colors hover:border-dim"
						>
							{t.shareX}
						</a>
						<a
							href={redditHref}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-full border border-line bg-ink-3 px-3.5 py-1.5 text-[13px] transition-colors hover:border-dim"
						>
							{t.shareReddit}
						</a>
					</div>
				</div>
			</div>
		);
	}

	if (step === "questions") {
		return (
			<div
				id="join"
				className="rise mx-auto w-full max-w-xl scroll-mt-24 rounded-2xl border border-line bg-ink-2/80 p-6 text-left sm:p-7"
			>
				<p className="text-[13px] text-dim">{t.qIntro}</p>

				<fieldset className="mt-5">
					<legend className="text-[14px] font-medium">
						{t.q1}{" "}
						<span className="ml-1 text-[12px] font-normal text-dim">
							{t.optional}
						</span>
					</legend>
					<div className="mt-3 flex flex-wrap gap-2">
						{PRODUCT_TYPES.map((key) => {
							const active = building === key;
							return (
								<button
									key={key}
									type="button"
									aria-pressed={active}
									onClick={() => setBuilding(active ? null : key)}
									className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
										active
											? "border-brand bg-brand-dim text-brand-2"
											: "border-line bg-ink-3 text-muted hover:border-dim hover:text-fg"
									}`}
								>
									{dict.productTypes[key]}
								</button>
							);
						})}
					</div>
				</fieldset>

				<div className="mt-6">
					<label
						htmlFor="pain"
						className="block text-[14px] font-medium"
					>
						{t.q2}{" "}
						<span className="ml-1 text-[12px] font-normal text-dim">
							{t.optional}
						</span>
					</label>
					<textarea
						id="pain"
						rows={3}
						value={pain}
						maxLength={300}
						onChange={(e) => setPain(e.target.value)}
						placeholder={t.q2Placeholder}
						className="mt-2.5 w-full resize-none rounded-xl border border-line bg-ink px-3.5 py-2.5 text-[14px] text-fg outline-none transition-colors placeholder:text-dim focus:border-brand/60"
					/>
				</div>

				<div className="mt-5 flex items-center gap-3">
					<button
						type="button"
						onClick={submitAnswers}
						disabled={busy}
						className="rounded-full bg-fg px-4 py-2 text-[13.5px] font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
					>
						{busy ? t.saving : t.done}
					</button>
					<button
						type="button"
						onClick={() => setStep("done")}
						className="text-[13.5px] text-dim transition-colors hover:text-fg"
					>
						{t.skip}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div id="join" className="mx-auto w-full max-w-xl scroll-mt-24">
			<form
				onSubmit={submitEmail}
				className="flex flex-col gap-2.5 sm:flex-row"
				noValidate
			>
				<input
					type="text"
					name="website"
					tabIndex={-1}
					autoComplete="off"
					aria-hidden="true"
					value={honey}
					onChange={(e) => setHoney(e.target.value)}
					className="hidden"
				/>
				<input
					type="email"
					name="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder={t.placeholder}
					autoComplete="email"
					aria-label={t.placeholder}
					className="h-12 flex-1 rounded-full border border-line bg-ink-2 px-5 text-[15px] text-fg outline-none transition-colors placeholder:text-dim focus:border-brand/60"
				/>
				<button
					type="submit"
					disabled={busy}
					className="h-12 shrink-0 rounded-full bg-brand px-6 text-[15px] font-semibold text-[#1a0d05] transition-opacity hover:opacity-90 disabled:opacity-60"
				>
					{busy ? t.joining : t.join}
				</button>
			</form>
			<p
				className={`mt-3 text-[13px] ${error ? "text-brand-2" : "text-dim"}`}
				role={error ? "alert" : undefined}
			>
				{error ?? t.note}
			</p>
		</div>
	);
}
