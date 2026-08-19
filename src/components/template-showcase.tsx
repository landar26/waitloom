"use client";

import { useState } from "react";
import { SectionHeading } from "./section-heading";
import { TemplatePreview } from "./template-previews";
import type { Dict } from "@/i18n/dictionaries";

export function TemplateShowcase({ dict }: { dict: Dict }) {
	const items = dict.templates.items;
	const [active, setActive] = useState(items[0].id);
	const current = items.find((i) => i.id === active) ?? items[0];

	return (
		<section
			id="templates"
			className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28"
		>
			<div className="mx-auto max-w-5xl">
				<SectionHeading
					eyebrow={dict.templates.eyebrow}
					title={dict.templates.title}
					subtitle={dict.templates.subtitle}
					align="center"
				/>

				<div
					role="tablist"
					aria-label={dict.templates.eyebrow}
					className="mt-9 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
				>
					{items.map((item) => {
						const isActive = item.id === active;
						return (
							<button
								key={item.id}
								role="tab"
								aria-selected={isActive}
								onClick={() => setActive(item.id)}
								className={`shrink-0 snap-start rounded-full border px-4 py-2 text-[13.5px] transition-colors ${
									isActive
										? "border-brand bg-brand-dim text-brand-2"
										: "border-line bg-ink-2 text-muted hover:border-dim hover:text-fg"
								}`}
							>
								{item.name}
							</button>
						);
					})}
				</div>

				<p className="mt-4 text-center font-mono text-[12px] tracking-wide text-dim">
					{current.for}
				</p>

				<div key={active} className="rise mx-auto mt-6 max-w-3xl">
					<TemplatePreview id={active} />
				</div>
			</div>
		</section>
	);
}
