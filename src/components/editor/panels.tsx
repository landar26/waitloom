"use client";

import type { AppDict } from "@/i18n/app";
import type { Lang } from "@/i18n/dictionaries";
import {
	LOCKED_SECTIONS,
	MAX_FAQ,
	MAX_FEATURES,
	MAX_STEPS,
	SECTIONS,
	type ProjectContent,
	type SectionId,
} from "@/lib/content";
import { MAX_QUESTIONS, type Question, type QuestionType } from "@/lib/projects";
import { TEMPLATES } from "@/templates/registry";
import { ACCENTS, FONTS, type AccentName, type FontName } from "@/templates/style";
import { AddButton, Card, Field, ImageInput, TextArea, TextInput } from "./fields";

export type Draft = {
	name: string;
	templateId: string;
	theme: string;
	accent: string;
	font: string;
	lang: Lang;
	content: ProjectContent;
	sections: SectionId[];
};

type PanelProps = {
	projectId: string;
	draft: Draft;
	patch: (partial: Partial<Draft>) => void;
	dict: AppDict;
};

function setContent(
	props: PanelProps,
	partial: Partial<ProjectContent>,
): void {
	props.patch({ content: { ...props.draft.content, ...partial } });
}

export function ContentPanel(props: PanelProps) {
	const { draft, dict, projectId } = props;
	const t = dict.editor.fields;
	const c = draft.content;
	const has = (id: SectionId) => draft.sections.includes(id);

	return (
		<div className="space-y-5">
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

			<Field label={t.cta}>
				<TextInput
					value={c.ctaLabel}
					onChange={(ctaLabel) => setContent(props, { ctaLabel })}
					maxLength={40}
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
		faq: labels.faq,
		founder: labels.founder,
		social: labels.social,
	};

	return (
		<div className="space-y-2">
			{SECTIONS.map((section) => {
				const locked = LOCKED_SECTIONS.includes(section);
				const on = draft.sections.includes(section);

				return (
					<label
						key={section}
						className={`flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-ink-2 px-3.5 py-2.5 text-[13.5px] ${
							locked ? "opacity-60" : "cursor-pointer"
						}`}
					>
						<span>{names[section]}</span>
						<input
							type="checkbox"
							checked={on}
							disabled={locked}
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

export function StylePanel({ draft, patch, dict }: PanelProps) {
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
					<Chip active={draft.lang === "en"} onClick={() => patch({ lang: "en" })}>
						English
					</Chip>
					<Chip active={draft.lang === "zh"} onClick={() => patch({ lang: "zh" })}>
						中文
					</Chip>
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
}: {
	questions: Question[];
	setQuestions: (next: Question[]) => void;
	dict: AppDict;
}) {
	const t = dict.editor.questions;
	const typeLabel: Record<QuestionType, string> = {
		short_text: t.shortText,
		single_choice: t.singleChoice,
		multi_choice: t.multiChoice,
	};

	const update = (index: number, partial: Partial<Question>) =>
		setQuestions(questions.map((q, i) => (i === index ? { ...q, ...partial } : q)));

	return (
		<div className="space-y-3">
			<p className="text-[13px] leading-relaxed text-dim">{t.intro}</p>

			{questions.map((question, i) => (
				<Card
					key={question.id}
					title={`${i + 1}`}
					removeLabel={dict.editor.fields.remove}
					onRemove={() => setQuestions(questions.filter((_, j) => j !== i))}
				>
					<TextInput
						value={question.title}
						placeholder={t.titlePlaceholder}
						onChange={(title) => update(i, { title })}
					/>

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

					{question.type !== "short_text" && (
						<div className="space-y-2 pt-1">
							{question.options.map((option, j) => (
								<div key={j} className="flex gap-2">
									<TextInput
										value={option}
										placeholder={t.optionPlaceholder}
										maxLength={60}
										onChange={(value) =>
											update(i, {
												options: question.options.map((o, k) => (k === j ? value : o)),
											})
										}
									/>
									<button
										type="button"
										onClick={() =>
											update(i, { options: question.options.filter((_, k) => k !== j) })
										}
										className="shrink-0 rounded-lg border border-line px-2.5 text-[13px] text-dim transition-colors hover:border-dim hover:text-fg"
									>
										×
									</button>
								</div>
							))}
							<AddButton
								label={t.addOption}
								disabled={question.options.length >= 8}
								onClick={() => update(i, { options: [...question.options, ""] })}
							/>
						</div>
					)}
				</Card>
			))}

			{questions.length >= MAX_QUESTIONS ? (
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
