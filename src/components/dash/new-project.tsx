"use client";

import { useMemo, useState } from "react";
import type { AppDict } from "@/i18n/app";
import { PRODUCT_TYPES, getDict, type Lang } from "@/i18n/dictionaries";
import { defaultContent } from "@/lib/content";
import { TEMPLATES } from "@/templates/registry";
import { TemplatePicker } from "./template-picker";

type Step = "about" | "template";

/**
 * The whole create flow: two steps, because the PRD's target is a founder who
 * publishes in under ten minutes.
 */
export function NewProject({ dict, lang }: { dict: AppDict; lang: Lang }) {
	const t = dict.create;
	const productLabels = getDict(lang).productTypes as Record<string, string>;

	const [step, setStep] = useState<Step>("about");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [productType, setProductType] = useState<string>("saas");
	const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const preview = useMemo(
		() => defaultContent(name || "Your product", description, productType),
		[name, description, productType],
	);

	async function submit() {
		if (busy) return;
		setBusy(true);
		setError(null);

		try {
			const res = await fetch("/api/projects", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name, description, productType, templateId }),
			});
			const data = (await res.json().catch(() => null)) as {
				id?: string;
				error?: string;
			} | null;

			if (res.status === 403) return setError(t.limit);
			if (!res.ok || !data?.id) return setError(t.error);

			window.location.href = `/dashboard/p/${data.id}/edit`;
		} catch {
			setError(t.error);
		} finally {
			setBusy(false);
		}
	}

	if (step === "about") {
		return (
			<div className="mx-auto max-w-lg">
				<h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>

				<label className="mt-8 block">
					<span className="text-[14px] text-muted">{t.nameLabel}</span>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t.namePlaceholder}
						maxLength={60}
						autoFocus
						className="mt-2 w-full rounded-lg border border-line bg-ink-2 px-4 py-3 text-[15px] outline-none placeholder:text-dim focus:border-dim"
					/>
				</label>

				<label className="mt-5 block">
					<span className="text-[14px] text-muted">{t.descLabel}</span>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t.descPlaceholder}
						maxLength={160}
						rows={3}
						className="mt-2 w-full resize-none rounded-lg border border-line bg-ink-2 px-4 py-3 text-[15px] outline-none placeholder:text-dim focus:border-dim"
					/>
				</label>

				<fieldset className="mt-6">
					<legend className="text-[14px] text-muted">{t.typeLabel}</legend>
					<div className="mt-3 flex flex-wrap gap-2">
						{PRODUCT_TYPES.map((type) => (
							<button
								key={type}
								type="button"
								onClick={() => setProductType(type)}
								aria-pressed={productType === type}
								className={`rounded-full border px-3.5 py-2 text-[13.5px] transition-colors ${
									productType === type
										? "border-brand bg-brand-dim text-brand-2"
										: "border-line bg-ink-2 text-muted hover:border-dim hover:text-fg"
								}`}
							>
								{productLabels[type] ?? type}
							</button>
						))}
					</div>
				</fieldset>

				{error && <p className="mt-5 text-[13.5px] text-brand-2">{error}</p>}

				<button
					type="button"
					disabled={!name.trim()}
					onClick={() => setStep("template")}
					className="mt-8 w-full rounded-full bg-brand px-5 py-3 text-[14.5px] font-medium text-[#1a0d05] transition-opacity hover:opacity-90 disabled:opacity-40"
				>
					{t.next}
				</button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold tracking-tight">{t.templateLabel}</h1>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setStep("about")}
						className="rounded-full border border-line px-4 py-2 text-[13.5px] text-muted transition-colors hover:border-dim hover:text-fg"
					>
						{t.back}
					</button>
					<button
						type="button"
						disabled={busy}
						onClick={submit}
						className="rounded-full bg-brand px-5 py-2 text-[13.5px] font-medium text-[#1a0d05] transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{busy ? t.submitting : t.submit}
					</button>
				</div>
			</div>

			{error && <p className="mt-5 text-[13.5px] text-brand-2">{error}</p>}

			<div className="mt-7">
				<TemplatePicker
					value={templateId}
					onChange={setTemplateId}
					name={name}
					content={preview}
					lang={lang}
				/>
			</div>
		</div>
	);
}
