import { WaitlistForm } from "./waitlist-form";
import type { Dict, Lang } from "@/i18n/dictionaries";

export function Hero({
	dict,
	lang,
	shareUrl,
}: {
	dict: Dict;
	lang: Lang;
	shareUrl: string;
}) {
	return (
		<section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
			<div className="loom-glow pointer-events-none absolute inset-x-0 -top-40 h-[560px]" />
			<div className="loom-warp pointer-events-none absolute inset-x-0 -top-14 h-[520px]" />

			<div className="relative mx-auto max-w-3xl text-center">
				<span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2/70 px-3 py-1 text-[12.5px] text-muted">
					<span className="h-1.5 w-1.5 rounded-full bg-brand" />
					{dict.hero.badge}
				</span>

				<h1 className="mt-6 text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
					{dict.hero.title}
				</h1>

				<p className="mx-auto mt-5 max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted sm:text-lg">
					{dict.hero.subtitle}
				</p>

				<div className="mt-8">
					<WaitlistForm dict={dict} lang={lang} shareUrl={shareUrl} />
				</div>

				<div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
					{dict.hero.chips.map((chip) => (
						<span
							key={chip}
							className="text-[13.5px] text-dim line-through decoration-line decoration-1"
						>
							{chip}
						</span>
					))}
				</div>
			</div>

			<div className="relative mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:mt-20">
				{dict.hero.flow.map((stepLabel, i) => (
					<span key={stepLabel} className="flex items-center gap-3">
						{i > 0 && <span className="text-line">→</span>}
						<span className="font-mono text-[12px] uppercase tracking-[0.14em] text-dim">
							{stepLabel}
						</span>
					</span>
				))}
			</div>
		</section>
	);
}
