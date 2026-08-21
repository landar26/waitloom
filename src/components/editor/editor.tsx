"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScaledFrame } from "@/components/dash/scaled-frame";
import type { AppDict } from "@/i18n/app";
import { LANG_SHORT, type Lang } from "@/i18n/dictionaries";
import { contentFor, localesOf } from "@/lib/content";
import { questionFor, type Question } from "@/lib/projects";
import { TemplatePage } from "@/templates/render";
import {
	ContentPanel,
	LocaleTabs,
	QuestionsPanel,
	SectionsPanel,
	StylePanel,
	withPrimaryLang,
	withQuestionPrimaryLang,
	type Draft,
} from "./panels";

type Tab = "content" | "sections" | "style" | "questions";
type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 700;
const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 420;

/**
 * The block editor. The preview is the same <TemplatePage> the published page
 * renders, driven straight off the in-memory draft — so what a founder sees
 * while typing needs no save round-trip to be accurate.
 */
export function Editor({
	projectId,
	slug,
	branding,
	initialDraft,
	initialQuestions,
	dict,
}: {
	projectId: string;
	slug: string;
	branding: boolean;
	initialDraft: Draft;
	initialQuestions: Question[];
	dict: AppDict;
}) {
	const t = dict.editor;
	const [tab, setTab] = useState<Tab>("content");
	const [draft, setDraft] = useState<Draft>(initialDraft);
	const [questions, setQuestions] = useState<Question[]>(initialQuestions);
	const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
	const [save, setSave] = useState<SaveState>("idle");
	const [editing, setEditing] = useState<Lang>(initialDraft.lang);

	const locales = useMemo(() => localesOf(draft), [draft]);
	// Removing a translation, or promoting one to primary, can leave the strip
	// pointing at a language the page no longer has.
	const active = locales.includes(editing) ? editing : draft.lang;

	// Skip the save that would otherwise fire for the initial render.
	const dirty = useRef<{ draft: boolean; questions: boolean }>({
		draft: false,
		questions: false,
	});

	const patch = useCallback((partial: Partial<Draft>) => {
		dirty.current.draft = true;
		setDraft((prev) => ({ ...prev, ...partial }));
	}, []);

	const updateQuestions = useCallback((next: Question[]) => {
		dirty.current.questions = true;
		setQuestions(next);
	}, []);

	/**
	 * Changing which language is primary moves the page document and every
	 * question's wording together. Both are swapped here and saved already
	 * swapped, so the server leaves a patch that carries documents alone.
	 */
	const setPrimaryLang = useCallback(
		(lang: Lang) => {
			setEditing(lang);
			if (draft.lang === lang) return;

			dirty.current.draft = true;
			dirty.current.questions = true;
			setDraft(withPrimaryLang(draft, lang));
			setQuestions((qs) => qs.map((q) => withQuestionPrimaryLang(q, draft.lang, lang)));
		},
		[draft],
	);

	useEffect(() => {
		if (!dirty.current.draft) return;

		const timer = setTimeout(async () => {
			setSave("saving");
			try {
				const res = await fetch(`/api/projects/${projectId}`, {
					method: "PATCH",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						name: draft.name,
						templateId: draft.templateId,
						theme: draft.theme,
						accent: draft.accent,
						font: draft.font,
						lang: draft.lang,
						content: draft.content,
						translations: draft.translations,
						sections: draft.sections,
					}),
				});
				setSave(res.ok ? "saved" : "error");
			} catch {
				setSave("error");
			}
		}, AUTOSAVE_MS);

		return () => clearTimeout(timer);
	}, [draft, projectId]);

	useEffect(() => {
		if (!dirty.current.questions) return;

		const timer = setTimeout(async () => {
			setSave("saving");
			try {
				// Questions with no title never make it to the page, so they are not
				// worth a round-trip while the founder is still typing one.
				const res = await fetch(`/api/projects/${projectId}/questions`, {
					method: "PUT",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						questions: questions.filter((q) => q.title.trim()),
					}),
				});
				setSave(res.ok ? "saved" : "error");
			} catch {
				setSave("error");
			}
		}, AUTOSAVE_MS);

		return () => clearTimeout(timer);
	}, [questions, projectId]);

	const panelProps = { projectId, draft, patch, dict, editing: active, setPrimaryLang };
	const localeStrip = (tab === "content" || tab === "questions") && (
		<LocaleTabs
			draft={draft}
			patch={patch}
			editing={active}
			setEditing={setEditing}
			dict={dict}
		/>
	);

	return (
		<div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[380px_minmax(0,1fr)]">
			<div className="min-w-0">
				<div className="flex items-center justify-between gap-3">
					<div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						{(["content", "sections", "style", "questions"] as Tab[]).map((id) => (
							<button
								key={id}
								type="button"
								onClick={() => setTab(id)}
								aria-pressed={tab === id}
								className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors ${
									tab === id ? "bg-ink-3 text-fg" : "text-muted hover:text-fg"
								}`}
							>
								{t.panels[id]}
							</button>
						))}
					</div>

					<span className="shrink-0 text-[12px] text-dim">
						{save === "saving" && t.saving}
						{save === "saved" && t.saved}
						{save === "error" && <span className="text-brand-2">{t.saveFailed}</span>}
					</span>
				</div>

				{localeStrip && <div className="mt-5">{localeStrip}</div>}

				<div className="mt-5">
					{tab === "content" && <ContentPanel {...panelProps} />}
					{tab === "sections" && <SectionsPanel {...panelProps} />}
					{tab === "style" && <StylePanel {...panelProps} />}
					{tab === "questions" && (
						<QuestionsPanel
							questions={questions}
							setQuestions={updateQuestions}
							dict={dict}
							primaryLang={draft.lang}
							editing={active}
						/>
					)}
				</div>
			</div>

			{/* Sticky, so the preview stays in view while the form scrolls past it. */}
			<div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
				<div className="flex items-center justify-between gap-3">
					<span className="text-[12px] uppercase tracking-[0.1em] text-dim">
						{t.preview}
					</span>
					<div className="flex gap-1">
						{(["desktop", "mobile"] as const).map((id) => (
							<button
								key={id}
								type="button"
								onClick={() => setDevice(id)}
								aria-pressed={device === id}
								className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${
									device === id ? "bg-ink-3 text-fg" : "text-muted hover:text-fg"
								}`}
							>
								{t[id]}
							</button>
						))}
					</div>
				</div>

				<div
					className={`mt-3 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden rounded-xl border border-line ${
						device === "mobile" ? "mx-auto max-w-[420px]" : ""
					}`}
				>
					<ScaledFrame width={device === "desktop" ? DESKTOP_WIDTH : MOBILE_WIDTH}>
						<TemplatePage
							project={{
								name: draft.name,
								slug,
								// The preview follows the language being edited, and shows the
								// same fallbacks a visitor would get from a half-done translation.
								lang: active,
								locales: locales.map((code) => ({
									code,
									label: LANG_SHORT[code],
									href: "#",
								})),
								templateId: draft.templateId,
								theme: draft.theme,
								accent: draft.accent,
								font: draft.font,
								branding,
							}}
							content={contentFor(draft, active)}
							sections={draft.sections}
							questions={questions
								.filter((q) => q.title.trim())
								.map((q) => questionFor(q, active, draft.lang))}
							preview
						/>
					</ScaledFrame>
				</div>
			</div>
		</div>
	);
}
