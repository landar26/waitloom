"use client";

import { useEffect, useRef, useState } from "react";
import type { PageDict } from "@/i18n/page";
import { buttonClass, inputClass } from "@/templates/sections/chrome";

export type PublicQuestion = {
	id: string;
	title: string;
	type: "short_text" | "single_choice" | "multi_choice";
	options: string[];
	required: boolean;
};

type Step = "email" | "questions" | "done";

type Attribution = {
	referrer?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ProjectWaitlistForm({
	slug,
	questions,
	dict,
	ctaLabel,
	preview = false,
	instanceId,
}: {
	slug: string;
	questions: PublicQuestion[];
	dict: PageDict;
	ctaLabel: string;
	/** Editor preview: render the real thing, but never write to the database. */
	preview?: boolean;
	instanceId: string;
}) {
	const t = dict.form;
	const [step, setStep] = useState<Step>("email");
	const [email, setEmail] = useState("");
	const [honey, setHoney] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [subscriberId, setSubscriberId] = useState<string | null>(null);
	const [position, setPosition] = useState<number | null>(null);
	const [answers, setAnswers] = useState<Record<string, string[]>>({});
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

	function setAnswer(questionId: string, values: string[]) {
		setAnswers((prev) => ({ ...prev, [questionId]: values }));
	}

	function toggleAnswer(questionId: string, option: string) {
		setAnswers((prev) => {
			const current = prev[questionId] ?? [];
			return {
				...prev,
				[questionId]: current.includes(option)
					? current.filter((v) => v !== option)
					: [...current, option],
			};
		});
	}

	async function submitEmail(event: React.FormEvent) {
		event.preventDefault();
		if (busy) return;
		setError(null);

		if (!EMAIL_RE.test(email.trim())) {
			setError(t.errInvalid);
			return;
		}

		if (preview) {
			setPosition(1);
			setStep(questions.length > 0 ? "questions" : "done");
			return;
		}

		setBusy(true);
		try {
			const res = await fetch(`/api/p/${slug}/join`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					website: honey,
					...attribution.current,
				}),
			});
			const data = (await res.json().catch(() => null)) as {
				id?: string;
				position?: number;
				error?: string;
			} | null;

			if (res.status === 429) return setError(t.errRate);
			if (res.status === 403) return setError(t.errFull);
			if (!res.ok || !data?.id) {
				return setError(
					data?.error === "invalid_email" ? t.errInvalid : t.errGeneric,
				);
			}

			setSubscriberId(data.id);
			setPosition(data.position ?? null);
			setStep(questions.length > 0 ? "questions" : "done");
		} catch {
			setError(t.errGeneric);
		} finally {
			setBusy(false);
		}
	}

	async function submitAnswers() {
		if (busy) return;
		const filled = Object.entries(answers).filter(([, v]) => v.some((s) => s.trim()));

		if (preview || !subscriberId || filled.length === 0) {
			setStep("done");
			return;
		}

		setBusy(true);
		try {
			await fetch(`/api/p/${slug}/answers`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					id: subscriberId,
					answers: Object.fromEntries(filled),
				}),
			});
		} catch {
			/* answers are optional — never block the success state */
		} finally {
			setBusy(false);
			setStep("done");
		}
	}

	if (step === "done") {
		return (
			<div className="rounded-[var(--wl-radius)] border-[length:var(--wl-border-width)] border-[var(--wl-border)] bg-[var(--wl-surface)] p-6">
				<p
					className="text-[18px] text-[var(--wl-fg)]"
					style={{ fontWeight: "var(--wl-heading-weight)" as unknown as number }}
				>
					{t.successTitle}
				</p>
				{position !== null && (
					<p className="mt-1.5 text-[15px] text-[var(--wl-accent)]">
						{t.successPosition.replace("{n}", String(position))}
					</p>
				)}
				<p className="mt-2 text-[14.5px] leading-relaxed text-[var(--wl-muted)]">
					{t.successBody}
				</p>
			</div>
		);
	}

	if (step === "questions") {
		return (
			<div className="rounded-[var(--wl-radius)] border-[length:var(--wl-border-width)] border-[var(--wl-border)] bg-[var(--wl-surface)] p-6 text-left">
				<p className="text-[14px] text-[var(--wl-muted)]">{t.qIntro}</p>

				<div className="mt-5 space-y-5">
					{questions.map((question) => (
						<fieldset key={question.id}>
							<legend className="text-[14.5px] text-[var(--wl-fg)]">
								{question.title}
								{!question.required && (
									<span className="ml-2 text-[12px] text-[var(--wl-dim)]">
										{t.optional}
									</span>
								)}
							</legend>

							{question.type === "short_text" ? (
								<input
									type="text"
									value={answers[question.id]?.[0] ?? ""}
									onChange={(e) => setAnswer(question.id, [e.target.value])}
									className={`mt-2.5 ${inputClass()}`}
									maxLength={300}
								/>
							) : (
								<div className="mt-2.5 flex flex-wrap gap-2">
									{question.options.map((option) => {
										const selected = (answers[question.id] ?? []).includes(option);
										return (
											<button
												key={option}
												type="button"
												onClick={() =>
													question.type === "single_choice"
														? setAnswer(question.id, selected ? [] : [option])
														: toggleAnswer(question.id, option)
												}
												aria-pressed={selected}
												className={`rounded-[var(--wl-control)] border-[length:var(--wl-border-width)] px-3.5 py-2 text-[13.5px] transition-colors ${
													selected
														? "border-[var(--wl-accent)] bg-[var(--wl-accent-soft)] text-[var(--wl-accent)]"
														: "border-[var(--wl-border)] text-[var(--wl-muted)] hover:border-[var(--wl-accent-line)]"
												}`}
											>
												{option}
											</button>
										);
									})}
								</div>
							)}
						</fieldset>
					))}
				</div>

				<div className="mt-6 flex items-center gap-3">
					<button type="button" onClick={submitAnswers} className={buttonClass()}>
						{busy ? t.saving : t.done}
					</button>
					<button
						type="button"
						onClick={() => setStep("done")}
						className="text-[13.5px] text-[var(--wl-dim)] underline-offset-4 hover:underline"
					>
						{t.skip}
					</button>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={submitEmail} className="w-full">
			<div className="flex flex-col gap-2.5 sm:flex-row">
				<label className="sr-only" htmlFor={`email-${instanceId}`}>
					{t.placeholder}
				</label>
				<input
					id={`email-${instanceId}`}
					type="email"
					inputMode="email"
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder={t.placeholder}
					className={`${inputClass()} sm:flex-1`}
					maxLength={254}
				/>
				{/* Honeypot: bots fill every field, people never see this one. */}
				<input
					type="text"
					name="website"
					tabIndex={-1}
					autoComplete="off"
					aria-hidden="true"
					value={honey}
					onChange={(e) => setHoney(e.target.value)}
					className="absolute h-0 w-0 overflow-hidden opacity-0"
				/>
				<button type="submit" disabled={busy} className={`${buttonClass()} sm:w-auto`}>
					{busy ? t.joining : ctaLabel}
				</button>
			</div>

			{error && <p className="mt-2.5 text-[13.5px] text-[#e5484d]">{error}</p>}
			{preview && (
				<p className="mt-2.5 text-[13px] text-[var(--wl-dim)]">{t.previewNote}</p>
			)}
		</form>
	);
}
