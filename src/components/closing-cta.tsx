import type { Dict } from "@/i18n/dictionaries";

export function ClosingCta({ dict }: { dict: Dict }) {
	return (
		<section className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(46% 46% at 50% 38%, rgba(255,138,61,0.16), transparent 70%)",
				}}
			/>
			<div className="relative mx-auto max-w-2xl text-center">
				<h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-[2.6rem] sm:leading-[1.1]">
					{dict.closing.title}
				</h2>
				<p className="mt-4 text-[16px] text-muted">{dict.closing.subtitle}</p>
				<a
					href="#join"
					className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-7 text-[15px] font-semibold text-[#1a0d05] transition-opacity hover:opacity-90"
				>
					{dict.nav.cta}
				</a>
			</div>
		</section>
	);
}
