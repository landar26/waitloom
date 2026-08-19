import { SectionHeading } from "./section-heading";
import type { Dict } from "@/i18n/dictionaries";

const icons = [
	// beautiful page
	"M4 5.5h16M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM8 10h8M8 13.5h5",
	// waitlist
	"M4 7.5h16v11H4zM4 8l8 5.5L20 8",
	// validation
	"M12 3.5 4.5 7v5.5c0 4 3 7 7.5 8 4.5-1 7.5-4 7.5-8V7L12 3.5ZM9 12l2.2 2.2L15.5 10",
	// analytics
	"M4.5 19.5h15M7.5 16V9.5M12 16V5.5M16.5 16v-4",
	// domain
	"M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z",
	// mcp
	"M7 8 3.5 12 7 16M17 8l3.5 4-3.5 4M14 5l-4 14",
];

export function Features({ dict }: { dict: Dict }) {
	return (
		<section
			id="features"
			className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28"
		>
			<div className="mx-auto max-w-6xl">
				<SectionHeading
					eyebrow={dict.features.eyebrow}
					title={dict.features.title}
					subtitle={dict.features.subtitle}
				/>

				<div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
					{dict.features.items.map((item, i) => (
						<div
							key={item.title}
							className="group bg-ink-2 p-6 transition-colors hover:bg-ink-3 sm:p-7"
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
								className="h-5 w-5 text-brand"
							>
								<path
									d={icons[i]}
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<h3 className="mt-4 flex items-center gap-2 text-[15.5px] font-semibold">
								{item.title}
								{item.tag && (
									<span className="rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[11px] font-medium text-brand-2">
										{item.tag}
									</span>
								)}
							</h3>
							<p className="mt-2 text-[14px] leading-relaxed text-muted">
								{item.body}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
