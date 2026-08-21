import type { CSSProperties } from "react";
import { getPageDict } from "@/i18n/page";
import type { ProjectContent, SectionId } from "@/lib/content";
import {
	ProjectWaitlistForm,
	type PublicQuestion,
} from "@/components/public/project-waitlist-form";
import { getTemplate } from "./registry";
import { Faq, Features, Founder, HowItWorks, Screenshot, Social } from "./sections/blocks";
import {
	Heading,
	PageFooter,
	PageHeader,
	Section,
	type PageLocale,
} from "./sections/chrome";
import { Hero, HeroDecoration } from "./sections/hero";
import { type FontName, isFont, isTheme, resolveStyle } from "./style";

export type RenderProject = {
	name: string;
	slug: string;
	/** The language being read right now, not necessarily the founder's own. */
	lang: string;
	/** Every language this page offers. Fewer than two hides the switcher. */
	locales?: PageLocale[];
	templateId: string;
	theme: string;
	accent: string;
	font: string;
	/** "Made with Waitloom" in the footer. */
	branding: boolean;
};

/**
 * The published page, and the editor's preview. One component so what a
 * founder sees while editing is literally what visitors get.
 */
export function TemplatePage({
	project,
	content,
	sections,
	questions,
	preview = false,
}: {
	project: RenderProject;
	content: ProjectContent;
	sections: SectionId[];
	questions: PublicQuestion[];
	preview?: boolean;
}) {
	const spec = getTemplate(project.templateId);
	const dict = getPageDict(project.lang);

	const style = resolveStyle({
		neutrals: spec.neutrals[isTheme(project.theme) ? project.theme : spec.defaults.theme],
		shape: spec.shape,
		theme: isTheme(project.theme) ? project.theme : spec.defaults.theme,
		accent: project.accent,
		font: (isFont(project.font) ? project.font : spec.defaults.font) as FontName,
	});

	const on = (id: SectionId) => sections.includes(id);
	const ctaLabel = content.ctaLabel || dict.form.join;

	const form = (instanceId: string) => (
		<ProjectWaitlistForm
			slug={project.slug}
			questions={questions}
			dict={dict}
			ctaLabel={ctaLabel}
			preview={preview}
			instanceId={instanceId}
		/>
	);

	return (
		<div
			className="relative min-h-screen overflow-hidden bg-[var(--wl-bg)] text-[var(--wl-fg)]"
			style={
				{
					...style.vars,
					fontFamily: "var(--wl-font)",
					background: "var(--wl-bg)",
				} as CSSProperties
			}
		>
			<HeroDecoration variant={spec.hero} />

			<PageHeader
				name={project.name}
				logoUrl={content.logoUrl}
				ctaLabel={ctaLabel}
				rules={spec.shape.rules}
				locales={project.locales ?? []}
				activeLocale={project.lang}
				switcherLabel={dict.switcher.label}
				preview={preview}
			/>

			<main>
				<Hero
					spec={spec}
					content={content}
					name={project.name}
					slug={project.slug}
					form={form("hero")}
				/>

				{on("screenshot") && <Screenshot url={content.screenshotUrl} spec={spec} />}
				{on("features") && <Features content={content} spec={spec} dict={dict} />}
				{on("howItWorks") && <HowItWorks content={content} spec={spec} dict={dict} />}
				{on("faq") && <Faq content={content} spec={spec} dict={dict} />}
				{on("founder") && <Founder content={content} spec={spec} dict={dict} />}
				{on("social") && <Social content={content} spec={spec} />}

				{/*
				  The waitlist block always closes the page, whatever position it
				  holds in SECTIONS: the hero already carries a form, so this one is
				  the second ask, and a second ask belongs at the end of the story.
				*/}
				<Section id="waitlist" rules={spec.shape.rules}>
					<div
						className="rounded-[var(--wl-radius)] border-[length:var(--wl-border-width)] border-[var(--wl-border)] bg-[var(--wl-surface)] px-6 py-10 sm:px-10"
						style={{ boxShadow: "var(--wl-shadow)" }}
					>
						<div className={spec.shape.align === "center" ? "mx-auto max-w-lg" : "max-w-lg"}>
							<Heading
								title={dict.sections.waitlist}
								subtitle={dict.sections.waitlistSubtitle}
								align={spec.shape.align}
							/>
							<div className="mt-7">{form("footer")}</div>
						</div>
					</div>
				</Section>
			</main>

			<PageFooter
				name={project.name}
				branding={project.branding}
				madeWith={dict.footer.madeWith}
			/>
		</div>
	);
}
