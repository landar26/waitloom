"use client";

import { ScaledFrame } from "@/components/dash/scaled-frame";
import { ROOT_HOST } from "@/lib/host";
import { getTemplate } from "@/templates/registry";
import { TemplatePage } from "@/templates/render";
import { getSample } from "@/templates/samples";

/**
 * The homepage template gallery.
 *
 * Renders the real <TemplatePage>, scaled down and cropped inside a browser
 * frame, rather than a hand-drawn miniature: the templates on the marketing
 * page are then, by construction, the templates a founder gets.
 */
function Dots({ light }: { light: boolean }) {
	return (
		<div className="flex gap-1.5">
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					className="h-2 w-2 rounded-full"
					style={{ background: light ? "#3a3a42" : "#2c2c33" }}
				/>
			))}
		</div>
	);
}

export function TemplatePreview({ id }: { id: string }) {
	const spec = getTemplate(id);
	const sample = getSample(spec.id);
	const light = spec.defaults.theme === "light";

	return (
		<div className="overflow-hidden rounded-xl border border-line bg-ink-2 sm:rounded-2xl">
			<div className="flex items-center gap-3 border-b border-line-soft bg-ink-3 px-3.5 py-2.5 sm:px-4">
				<Dots light={light} />
				<div className="mx-auto w-[58%] rounded-full bg-ink px-3 py-1 text-center font-mono text-[9.5px] text-dim sm:text-[11px]">
					{sample.slug}.{ROOT_HOST}
				</div>
			</div>

			{/* Cropped to the hero and the first row of cards — the part that sells. */}
			<div className="h-[260px] overflow-hidden sm:h-[520px]">
				<ScaledFrame width={1280}>
					<TemplatePage
						project={{
							name: sample.name,
							slug: sample.slug,
							lang: "en",
							templateId: spec.id,
							theme: spec.defaults.theme,
							accent: spec.defaults.accent,
							font: spec.defaults.font,
							branding: false,
						}}
						content={sample.content}
						sections={["hero", "features", "waitlist"]}
						questions={[]}
						preview
					/>
				</ScaledFrame>
			</div>
		</div>
	);
}
