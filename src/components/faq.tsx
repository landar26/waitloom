import { SectionHeading } from "./section-heading";
import type { Dict } from "@/i18n/dictionaries";

export function Faq({ dict }: { dict: Dict }) {
	return (
		<section id="faq" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
			<div className="mx-auto max-w-3xl">
				<SectionHeading
					eyebrow={dict.faq.eyebrow}
					title={dict.faq.title}
					align="center"
				/>

				<div className="mt-10 divide-y divide-line-soft border-y border-line-soft">
					{dict.faq.items.map((item) => (
						<details key={item.q} className="group py-5">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15.5px] font-medium marker:hidden">
								{item.q}
								<svg
									viewBox="0 0 24 24"
									aria-hidden="true"
									className="h-4 w-4 shrink-0 text-dim transition-transform group-open:rotate-45"
								>
									<path
										d="M12 5v14M5 12h14"
										stroke="currentColor"
										strokeWidth="1.6"
										strokeLinecap="round"
									/>
								</svg>
							</summary>
							<p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">
								{item.a}
							</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
