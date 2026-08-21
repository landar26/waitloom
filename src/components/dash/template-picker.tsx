"use client";

import type { Lang } from "@/i18n/dictionaries";
import type { ProjectContent } from "@/lib/content";
import { TEMPLATES } from "@/templates/registry";
import { TemplatePage } from "@/templates/render";
import { ScaledFrame } from "./scaled-frame";

/**
 * Pick by looking at the real page, not a thumbnail: the preview is the same
 * component the published page renders, filled with what has been typed so far.
 */
export function TemplatePicker({
	value,
	onChange,
	name,
	content,
	lang,
}: {
	value: string;
	onChange: (id: string) => void;
	name: string;
	content: ProjectContent;
	lang: Lang;
}) {
	const spec = TEMPLATES.find((t) => t.id === value) ?? TEMPLATES[0];

	return (
		<div>
			<div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{TEMPLATES.map((template) => {
					const active = template.id === value;
					return (
						<button
							key={template.id}
							type="button"
							onClick={() => onChange(template.id)}
							aria-pressed={active}
							className={`shrink-0 snap-start rounded-full border px-4 py-2 text-[13.5px] transition-colors ${
								active
									? "border-brand bg-brand-dim text-brand-2"
									: "border-line bg-ink-2 text-muted hover:border-dim hover:text-fg"
							}`}
						>
							{template.name}
						</button>
					);
				})}
			</div>

			<p className="mt-3 font-mono text-[12px] tracking-wide text-dim">
				{lang === "zh" ? spec.forZh : spec.forEn}
			</p>

			<div className="mt-4 overflow-hidden rounded-xl border border-line">
				<ScaledFrame width={1280}>
					<TemplatePage
						project={{
							name: name || "Your product",
							slug: "preview",
							lang,
							templateId: spec.id,
							theme: spec.defaults.theme,
							accent: spec.defaults.accent,
							font: spec.defaults.font,
							branding: true,
						}}
						content={content}
						sections={["hero", "features", "waitlist"]}
						questions={[]}
						preview
					/>
				</ScaledFrame>
			</div>
		</div>
	);
}
