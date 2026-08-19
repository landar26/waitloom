import { SectionHeading } from "./section-heading";
import type { Dict } from "@/i18n/dictionaries";

export function Founder({ dict }: { dict: Dict }) {
	return (
		<section className="px-5 py-20 sm:px-8 sm:py-24">
			<div className="mx-auto max-w-3xl rounded-2xl border border-line bg-ink-2/60 p-7 sm:p-10">
				<SectionHeading
					eyebrow={dict.founder.eyebrow}
					title={dict.founder.title}
				/>
				<p className="mt-4 text-[15px] leading-relaxed text-muted">
					{dict.founder.body}
				</p>
				<a
					href={dict.founder.linkHref}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-brand transition-opacity hover:opacity-80"
				>
					{dict.founder.link}
					<svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
						<path
							d="M7 17 17 7M9 7h8v8"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</a>
			</div>
		</section>
	);
}
