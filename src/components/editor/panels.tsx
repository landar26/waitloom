"use client";

import type { AppDict } from "@/i18n/app";
import { LANGS, LANG_LABELS, type Lang } from "@/i18n/dictionaries";
import {
	MAX_FAQ,
	MAX_FEATURES,
	MAX_PLANS,
	MAX_PLAN_POINTS,
	LOCKED_SECTIONS,
	MAX_STEPS,
	SECTIONS,
	localesOf,
	sanitizeContent,
	type Cta,
	type Plan,
	type ProjectContent,
	type SectionId,
	type Translations,
} from "@/lib/content";
import {
	MAX_QUESTIONS,
	type Question,
	type QuestionTranslation,
	type QuestionType,
} from "@/lib/projects";
import { TEMPLATES } from "@/templates/registry";
import { ACCENTS, FONTS, type AccentName, type FontName } from "@/templates/style";
import { AddButton, Card, Field, ImageInput, TextArea, TextInput } from "./fields";

export type Draft = {
	name: string;
	templateId: string;
	theme: string;
	accent: string;
	font: string;
	/** The language `content` is written in. Every other one lives in translations. */
	lang: Lang;
	content: ProjectContent;
	translations: Translations;
	sections: SectionId[];
};

type PanelProps = {
	projectId: string;
	draft: Draft;
	patch: (partial: Partial<Draft>) => void;
	dict: AppDict;
	/** The language being edited right now, which may not be the primary one. */
	editing: Lang;
	/** Owned by the editor: the flip moves the questions as well as the draft. */
	setPrimaryLang: (lang: Lang) => void;
};

/**
 * The document being edited. Deliberately not the merged one the page renders:
 * a founder has to see which fields they have not translated yet.
 */
function activeContent({ draft, editing }: PanelProps): ProjectContent {
	if (editing === draft.lang) return draft.content;
	return draft.translations[editing] ?? sanitizeContent({});
}

/**
 * The call to action is the page's, not one language's: `mergeContent` reads it
 * from the primary document whichever language a visitor lands in. So it is
 * written there too, whatever tab the founder happens to be on.
 */
function setCta(props: PanelProps, partial: Partial<Cta>): void {
	const { draft } = props;
	props.patch({
		content: { ...draft.content, cta: { ...draft.content.cta, ...partial } },
	});
}

function setContent(props: PanelProps, partial: Partial<ProjectContent>): void {
	const { draft, editing } = props;
	const next = { ...activeContent(props), ...partial };

	if (editing === draft.lang) {
		props.patch({ content: next });
	} else {
		props.patch({ translations: { ...draft.translations, [editing]: next } });
	}
}

/**
 * Flipping which language is primary carries the two documents with it, so the
 * founder keeps the copy they wrote in each rather than finding it relabelled.
 */
export function withPrimaryLang(draft: Draft, lang: Lang): Draft {
	if (draft.lang === lang) return draft;

	const promoted = draft.translations[lang];
	const translations = { ...draft.translations };
	delete translations[lang];
	if (promoted) translations[draft.lang] = draft.content;

	return { ...draft, lang, content: promoted ?? draft.content, translations };
}

/** The same move for one question's wording. Mirrors the server's own swap. */
export function withQuestionPrimaryLang(
	question: Question,
	from: Lang,
	to: Lang,
): Question {
	if (from === to) return question;

	const promoted = question.translations[to];
	const translations = { ...question.translations };
	delete translations[to];
	if (promoted) {
		translations[from] = { title: question.title, options: question.options };
	}

	return {
		...question,
		title: promoted?.title || question.title,
		options: question.options.map((option, i) => promoted?.options[i] || option),
		translations,
	};
}

function fill(template: string, lang: Lang): string {
	return template.replace("{lang}", LANG_LABELS[lang]);
}

/**
 * The language strip above the Content and Questions panels. A new language
 * starts as a copy of the primary one, so the founder edits a page that already
 * looks finished instead of a blank form.
 */
export function LocaleTabs({
	draft,
	patch,
	editing,
	setEditing,
	dict,
}: {
	draft: Draft;
	patch: (partial: Partial<Draft>) => void;
	editing: Lang;
	setEditing: (lang: Lang) => void;
	dict: AppDict;
}) {
	const t = dict.editor.locales;
	const present = localesOf(draft);
	const missing = LANGS.filter((code) => !present.includes(code));

	const add = (code: Lang) => {
		patch({ translations: { ...draft.translations, [code]: draft.content } });
		setEditing(code);
	};

	const remove = () => {
		if (editing === draft.lang) return;
		if (!confirm(t.removeConfirm)) return;
		const translations = { ...draft.translations };
		delete translations[editing];
		patch({ translations });
		setEditing(draft.lang);
	};

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center gap-2">
				{present.map((code) => (
					<Chip key={code} active={code === editing} onClick={() => setEditing(code)}>
						{LANG_LABELS[code]}
						{code === draft.lang && (
							<span className="ml-1.5 text-[11px] text-dim">{t.primary}</span>
						)}
					</Chip>
				))}

				{missing.map((code) => (
					<button
						key={code}
						type="button"
						onClick={() => add(code)}
						className="rounded-full border border-dashed border-line px-3 py-1.5 text-[13px] text-dim transition-colors hover:border-dim hover:text-fg"
					>
						{fill(t.add, code)}
					</button>
				))}

				{editing !== draft.lang && (
					<button
						type="button"
						onClick={remove}
						className="ml-auto text-[12.5px] text-dim transition-colors hover:text-brand-2"
					>
						{t.remove}
					</button>
				)}
			</div>

			{editing !== draft.lang && (
				<p className="text-[12.5px] leading-relaxed text-dim">
					{fill(t.hint, draft.lang)}
				</p>
			)}
		</div>
	);
}

export function ContentPanel(props: PanelProps) {
	const { draft, dict, projectId, editing } = props;
	const t = dict.editor.fields;
	const c = activeContent(props);
	const has = (id: SectionId) => draft.sections.includes(id);

	return (
		<div className="space-y-5">
			{/*
			  First, not fifth: this switch decides whether the page collects emails
			  or sends people at a shipped product, which is what every field below
			  it is written for. Framed rather than another Field for the same reason.
			*/}
			<div className="space-y-3 rounded-xl border border-line bg-ink-2 p-3.5">
				<Field label={t.ctaMode}>
					<div className="flex flex-wrap gap-2">
						{(["waitlist", "link"] as const).map((mode) => (
							<Chip
								key={mode}
								active={draft.content.cta.mode === mode}
								onClick={() => setCta(props, { mode })}
							>
								{mode === "waitlist" ? t.ctaWaitlist : t.ctaLink}
							</Chip>
						))}
					</div>
				</Field>

				{draft.content.cta.mode === "link" && (
					<>
						<Field label={t.ctaHref}>
							<TextInput
								value={draft.content.cta.href}
								placeholder={t.ctaHrefPlaceholder}
								maxLength={500}
								onChange={(href) => setCta(props, { href })}
							/>
						</Field>
						<p className="text-[12.5px] leading-relaxed text-dim">{t.ctaHrefHint}</p>
					</>
				)}

				<Field label={t.cta}>
					<TextInput
						value={c.ctaLabel}
						onChange={(ctaLabel) => setContent(props, { ctaLabel })}
						maxLength={40}
					/>
				</Field>
			</div>

			<Field label={t.name}>
				<TextInput
					value={draft.name}
					onChange={(name) => props.patch({ name })}
					maxLength={60}
				/>
			</Field>

			<Field label={t.logo}>
				<ImageInput
					projectId={projectId}
					value={c.logoUrl}
					onChange={(logoUrl) => setContent(props, { logoUrl })}
					dict={dict}
				/>
			</Field>

			<Field label={t.headline}>
				<TextArea
					value={c.headline}
					onChange={(headline) => setContent(props, { headline })}
					maxLength={90}
					rows={2}
				/>
			</Field>

			<Field label={t.subheadline}>
				<TextArea
					value={c.subheadline}
					onChange={(subheadline) => setContent(props, { subheadline })}
					maxLength={160}
				/>
			</Field>

			{has("screenshot") && (
				<Field label={t.screenshot}>
					<ImageInput
						projectId={projectId}
						value={c.screenshotUrl}
						onChange={(screenshotUrl) => setContent(props, { screenshotUrl })}
						dict={dict}
					/>
				</Field>
			)}

			{has("features") && (
				<section>
					<p className="text-[12px] uppercase tracking-[0.1em] text-dim">{t.features}</p>
					<div className="mt-2 space-y-2.5">
						{c.features.map((feature, i) => (
							<Card
								key={i}
								title={`${i + 1}`}
								removeLabel={t.remove}
								onRemove={() =>
									setContent(props, {
										features: c.features.filter((_, j) => j !== i),
									})
								}
							>
								<TextInput
									value={feature.title}
									placeholder={t.title}
									maxLength={60}
									onChange={(title) =>
										setContent(props, {
											features: c.features.map((f, j) =>
												j === i ? { ...f, title } : f,
											),
										})
									}
								/>
								<TextArea
									value={feature.body}
									placeholder={t.body}
									rows={2}
									onChange={(body) =>
										setContent(props, {
											features: c.features.map((f, j) => (j === i ? { ...f, body } : f)),
										})
									}
								/>
							</Card>
						))}
						<AddButton
							label={t.add}
							disabled={c.features.length >= MAX_FEATURES}
							onClick={() =>
								setContent(props, {
									features: [...c.features, { title: "", body: "" }],
								})
							}
						/>
					</div>
				</section>
			)}

			{has("howItWorks") && (
				<section>
					<p className="text-[12px] uppercase tracking-[0.1em] text-dim">
						{t.howItWorks}
					</p>
					<div className="mt-2 space-y-2.5">
						{c.howItWorks.map((step, i) => (
							<Card
								key={i}
								title={`${t.step} ${i + 1}`}
								removeLabel={t.remove}
								onRemove={() =>
									setContent(props, {
										howItWorks: c.howItWorks.filter((_, j) => j !== i),
									})
								}
							>
								<TextInput
									value={step.title}
									placeholder={t.title}
									maxLength={60}
									onChange={(title) =>
										setContent(props, {
											howItWorks: c.howItWorks.map((s, j) =>
												j === i ? { ...s, title } : s,
											),
										})
									}
								/>
								<TextArea
									value={step.body}
									placeholder={t.body}
									rows={2}
									onChange={(body) =>
										setContent(props, {
											howItWorks: c.howItWorks.map((s, j) =>
												j === i ? { ...s, body } : s,
											),
										})
									}
								/>
							</Card>
						))}
						<AddButton
							label={t.add}
							disabled={c.howItWorks.length >= MAX_STEPS}
							onClick={() =>
								setContent(props, {
									howItWorks: [...c.howItWorks, { title: "", body: "" }],
								})
							}
						/>
					</div>
				</section>
			)}

			{has("pricing") && (
				<section>
					<p className="text-[12px] uppercase tracking-[0.1em] text-dim">{t.pricing}</p>
					<div className="mt-2 space-y-2.5">
						{c.pricing.map((plan, i) => {
							const edit = (partial: Partial<Plan>) =>
								setContent(props, {
									pricing: c.pricing.map((p, j) => (j === i ? { ...p, ...partial } : p)),
								});

							return (
								<Card
									key={i}
									title={plan.name || `${i + 1}`}
									removeLabel={t.remove}
									onRemove={() =>
										setContent(props, { pricing: c.pricing.filter((_, j) => j !== i) })
									}
								>
									<TextInput
										value={plan.name}
										placeholder={t.planName}
										maxLength={40}
										onChange={(name) => edit({ name })}
									/>
									<div className="flex gap-2">
										<TextInput
											value={plan.price}
											placeholder={t.planPrice}
											maxLength={24}
											onChange={(price) => edit({ price })}
										/>
										<TextInput
											value={plan.period}
											placeholder={t.planPeriod}
											maxLength={24}
											onChange={(period) => edit({ period })}
										/>
									</div>

									{plan.points.map((point, j) => (
										<TextInput
											key={j}
											value={point}
											placeholder={t.planPoint}
											onChange={(value) =>
												edit({ points: plan.points.map((p, k) => (k === j ? value : p)) })
											}
										/>
									))}
									<AddButton
										label={t.add}
										disabled={plan.points.length >= MAX_PLAN_POINTS}
										onClick={() => edit({ points: [...plan.points, ""] })}
									/>

									{/* A button's destination and which plan is the loud one are the
									    page's, not a translation's — same rule as the hero CTA. */}
									{editing === draft.lang && (
										<>
											<TextInput
												value={plan.ctaHref}
												placeholder={t.planCtaHref}
												maxLength={500}
												onChange={(ctaHref) => edit({ ctaHref })}
											/>
											<label className="flex items-center gap-2 text-[13px] text-muted">
												<input
													type="checkbox"
													checked={plan.highlight}
													onChange={(e) => edit({ highlight: e.target.checked })}
													className="h-4 w-4 accent-[var(--color-brand)]"
												/>
												{t.planHighlight}
											</label>
										</>
									)}
									<TextInput
										value={plan.ctaLabel}
										placeholder={t.planCtaLabel}
										maxLength={40}
										onChange={(ctaLabel) => edit({ ctaLabel })}
									/>
								</Card>
							);
						})}
						<AddButton
							label={t.add}
							disabled={c.pricing.length >= MAX_PLANS}
							onClick={() =>
								setContent(props, {
									pricing: [
										...c.pricing,
										{
											name: "",
											price: "",
											period: "",
											points: [],
											ctaLabel: "",
											ctaHref: "",
											highlight: false,
										},
									],
								})
							}
						/>
					</div>
				</section>
			)}

			{has("faq") && (
				<section>
					<p className="text-[12px] uppercase tracking-[0.1em] text-dim">{t.faq}</p>
					<div className="mt-2 space-y-2.5">
						{c.faq.map((item, i) => (
							<Card
								key={i}
								title={`${i + 1}`}
								removeLabel={t.remove}
								onRemove={() =>
									setContent(props, { faq: c.faq.filter((_, j) => j !== i) })
								}
							>
								<TextInput
									value={item.q}
									placeholder={t.question}
									onChange={(q) =>
										setContent(props, {
											faq: c.faq.map((f, j) => (j === i ? { ...f, q } : f)),
										})
									}
								/>
								<TextArea
									value={item.a}
									placeholder={t.answer}
									rows={2}
									onChange={(a) =>
										setContent(props, {
											faq: c.faq.map((f, j) => (j === i ? { ...f, a } : f)),
										})
									}
								/>
							</Card>
						))}
						<AddButton
							label={t.add}
							disabled={c.faq.length >= MAX_FAQ}
							onClick={() => setContent(props, { faq: [...c.faq, { q: "", a: "" }] })}
						/>
					</div>
				</section>
			)}

			{has("founder") && (
				<section className="space-y-2.5">
					<p className="text-[12px] uppercase tracking-[0.1em] text-dim">{t.founder}</p>
					<TextInput
						value={c.founder.name}
						placeholder={t.founderName}
						maxLength={60}
						onChange={(name) =>
							setContent(props, { founder: { ...c.founder, name } })
						}
					/>
					<TextArea
						value={c.founder.bio}
						placeholder={t.founderBio}
						rows={2}
						onChange={(bio) => setContent(props, { founder: { ...c.founder, bio } })}
					/>
					<ImageInput
						projectId={projectId}
						value={c.founder.avatarUrl}
						onChange={(avatarUrl) =>
							setContent(props, { founder: { ...c.founder, avatarUrl } })
						}
						dict={dict}
					/>
				</section>
			)}

			{has("social") && (
				<section className="space-y-2.5">
					<p className="text-[12px] uppercase tracking-[0.1em] text-dim">{t.social}</p>
					{(["x", "github", "website", "discord"] as const).map((key) => (
						<TextInput
							key={key}
							value={c.social[key]}
							placeholder={`${key} URL`}
							maxLength={500}
							onChange={(value) =>
								setContent(props, { social: { ...c.social, [key]: value } })
							}
						/>
					))}
				</section>
			)}
		</div>
	);
}

export function SectionsPanel({ draft, patch, dict }: PanelProps) {
	const labels = dict.editor.fields as unknown as Record<string, string>;
	const names: Record<SectionId, string> = {
		hero: labels.headline,
		screenshot: labels.screenshot,
		features: labels.features,
		waitlist: dict.project.waitlist,
		howItWorks: labels.howItWorks,
		pricing: labels.pricing,
		faq: labels.faq,
		founder: labels.founder,
		social: labels.social,
	};

	return (
		<div className="space-y-2">
			{SECTIONS.map((section) => {
				const isLocked = LOCKED_SECTIONS.includes(section);
				const on = draft.sections.includes(section);

				return (
					<label
						key={section}
						className={`flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-ink-2 px-3.5 py-2.5 text-[13.5px] ${
							isLocked ? "opacity-60" : "cursor-pointer"
						}`}
					>
						<span>{names[section]}</span>
						<input
							type="checkbox"
							checked={on}
							disabled={isLocked}
							onChange={(e) =>
								patch({
									sections: e.target.checked
										? [...draft.sections, section]
										: draft.sections.filter((s) => s !== section),
								})
							}
							className="h-4 w-4 accent-[var(--color-brand)]"
						/>
					</label>
				);
			})}
		</div>
	);
}

export function StylePanel({ draft, patch, dict, setPrimaryLang }: PanelProps) {
	const t = dict.editor.style;
	const custom = !(draft.accent in ACCENTS);

	return (
		<div className="space-y-6">
			<Field label={t.template}>
				<div className="flex flex-wrap gap-2">
					{TEMPLATES.map((template) => (
						<Chip
							key={template.id}
							active={draft.templateId === template.id}
							onClick={() =>
								patch({
									templateId: template.id,
									theme: template.defaults.theme,
									accent: template.defaults.accent,
									font: template.defaults.font,
								})
							}
						>
							{template.name}
						</Chip>
					))}
				</div>
			</Field>

			<Field label={t.theme}>
				<div className="flex gap-2">
					<Chip active={draft.theme === "light"} onClick={() => patch({ theme: "light" })}>
						{t.light}
					</Chip>
					<Chip active={draft.theme === "dark"} onClick={() => patch({ theme: "dark" })}>
						{t.dark}
					</Chip>
				</div>
			</Field>

			<Field label={t.accent}>
				<div className="flex flex-wrap items-center gap-2">
					{(Object.keys(ACCENTS) as AccentName[]).map((name) => (
						<button
							key={name}
							type="button"
							onClick={() => patch({ accent: name })}
							aria-label={name}
							aria-pressed={draft.accent === name}
							className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-105 ${
								draft.accent === name ? "border-fg" : "border-transparent"
							}`}
							style={{ background: ACCENTS[name] }}
						/>
					))}
					<label className="ml-1 flex items-center gap-2 text-[12px] text-dim">
						{t.custom}
						<input
							type="color"
							value={custom ? draft.accent : "#2563eb"}
							onChange={(e) => patch({ accent: e.target.value.toLowerCase() })}
							className="h-7 w-9 cursor-pointer rounded border border-line bg-ink"
						/>
					</label>
				</div>
			</Field>

			<Field label={t.font}>
				<div className="flex gap-2">
					{(Object.keys(FONTS) as FontName[]).map((font) => (
						<Chip key={font} active={draft.font === font} onClick={() => patch({ font })}>
							{FONTS[font].label}
						</Chip>
					))}
				</div>
			</Field>

			<Field label={t.language}>
				<div className="flex gap-2">
					{LANGS.map((code) => (
						<Chip
							key={code}
							active={draft.lang === code}
							// Not just `lang`: every document the page has moves with it.
							onClick={() => setPrimaryLang(code)}
						>
							{LANG_LABELS[code]}
						</Chip>
					))}
				</div>
			</Field>
		</div>
	);
}

const QUESTION_TYPES: QuestionType[] = ["short_text", "single_choice", "multi_choice"];

export function QuestionsPanel({
	questions,
	setQuestions,
	dict,
	primaryLang,
	editing,
}: {
	questions: Question[];
	setQuestions: (next: Question[]) => void;
	dict: AppDict;
	primaryLang: Lang;
	editing: Lang;
}) {
	const t = dict.editor.questions;
	const typeLabel: Record<QuestionType, string> = {
		short_text: t.shortText,
		single_choice: t.singleChoice,
		multi_choice: t.multiChoice,
	};

	// A translation restates the wording; the shape of the question is shared,
	// because an answer stored against option 2 has to mean the same thing in
	// every language.
	const translating = editing !== primaryLang;

	const update = (index: number, partial: Partial<Question>) =>
		setQuestions(questions.map((q, i) => (i === index ? { ...q, ...partial } : q)));

	const wording = (question: Question): QuestionTranslation =>
		translating
			? (question.translations[editing] ?? { title: "", options: [] })
			: { title: question.title, options: question.options };

	const setWording = (
		index: number,
		question: Question,
		partial: Partial<QuestionTranslation>,
	) => {
		if (!translating) {
			update(index, partial);
			return;
		}
		update(index, {
			translations: {
				...question.translations,
				[editing]: { ...wording(question), ...partial },
			},
		});
	};

	return (
		<div className="space-y-3">
			<p className="text-[13px] leading-relaxed text-dim">
				{translating
					? dict.editor.locales.questionsHint.replace("{lang}", LANG_LABELS[primaryLang])
					: t.intro}
			</p>

			{questions.map((question, i) => (
				<Card
					key={question.id}
					title={`${i + 1}`}
					removeLabel={dict.editor.fields.remove}
					onRemove={
						translating
							? undefined
							: () => setQuestions(questions.filter((_, j) => j !== i))
					}
				>
					<TextInput
						value={wording(question).title}
						placeholder={translating ? question.title : t.titlePlaceholder}
						onChange={(title) => setWording(i, question, { title })}
					/>

					{!translating && (
						<div className="flex flex-wrap gap-2 pt-1">
							{QUESTION_TYPES.map((type) => (
								<Chip
									key={type}
									active={question.type === type}
									onClick={() =>
										update(i, {
											type,
											options:
												type === "short_text"
													? []
													: question.options.length > 0
														? question.options
														: ["", ""],
										})
									}
								>
									{typeLabel[type]}
								</Chip>
							))}
						</div>
					)}

					{question.type !== "short_text" && (
						<div className="space-y-2 pt-1">
							{question.options.map((option, j) => (
								<div key={j} className="flex gap-2">
									<TextInput
										value={translating ? (wording(question).options[j] ?? "") : option}
										placeholder={translating ? option : t.optionPlaceholder}
										maxLength={60}
										onChange={(value) => {
											const current = wording(question).options;
											const options = question.options.map((o, k) =>
												k === j ? value : (translating ? (current[k] ?? "") : o),
											);
											setWording(i, question, { options });
										}}
									/>
									{!translating && (
										<button
											type="button"
											onClick={() =>
												update(i, { options: question.options.filter((_, k) => k !== j) })
											}
											className="shrink-0 rounded-lg border border-line px-2.5 text-[13px] text-dim transition-colors hover:border-dim hover:text-fg"
										>
											×
										</button>
									)}
								</div>
							))}
							{!translating && (
								<AddButton
									label={t.addOption}
									disabled={question.options.length >= 8}
									onClick={() => update(i, { options: [...question.options, ""] })}
								/>
							)}
						</div>
					)}
				</Card>
			))}

			{translating ? null : questions.length >= MAX_QUESTIONS ? (
				<p className="text-[12.5px] text-dim">{t.full}</p>
			) : (
				<AddButton
					label={t.add}
					onClick={() =>
						setQuestions([
							...questions,
							{
								id: crypto.randomUUID(),
								title: "",
								type: "short_text",
								options: [],
								required: false,
								translations: {},
							},
						])
					}
				/>
			)}
		</div>
	);
}

function Chip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
				active
					? "border-brand bg-brand-dim text-brand-2"
					: "border-line bg-ink-2 text-muted hover:border-dim hover:text-fg"
			}`}
		>
			{children}
		</button>
	);
}
