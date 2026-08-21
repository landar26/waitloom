import type { ReactNode } from "react";
import type { ProjectContent } from "@/lib/content";
import type { HeroVariant, TemplateSpec } from "../registry";
import { Container } from "./chrome";

/**
 * One hero for every template. The template's `hero` variant only adds
 * decoration around it — the structure, and therefore the conversion path,
 * is identical everywhere.
 */
export function Hero({
	spec,
	content,
	name,
	slug,
	form,
}: {
	spec: TemplateSpec;
	content: ProjectContent;
	name: string;
	slug: string;
	form: ReactNode;
}) {
	const centered = spec.shape.align === "center";
	const headline = content.headline || name;

	return (
		<section className="relative pt-10 pb-14 sm:pt-16 sm:pb-20">
			<Container className="relative">
				<div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
					{spec.hero === "terminal" && (
						<p className="mb-4 text-[13px] text-[var(--wl-accent)]">
							<span className="text-[var(--wl-dim)]">$</span> {slug}
						</p>
					)}

					<h1
						className="text-[clamp(2.1rem,6.2vw,3.9rem)] leading-[1.06] text-[var(--wl-fg)]"
						style={{
							fontWeight: "var(--wl-heading-weight)" as unknown as number,
							letterSpacing: "var(--wl-tracking)",
							fontSize: `calc(clamp(2.1rem, 6.2vw, 3.9rem) * ${spec.shape.headingScale})`,
							...(spec.hero === "gradientText"
								? {
										backgroundImage:
											"linear-gradient(100deg, var(--wl-fg) 15%, var(--wl-accent) 95%)",
										WebkitBackgroundClip: "text",
										backgroundClip: "text",
										color: "transparent",
									}
								: {}),
						}}
					>
						{headline}
					</h1>

					{content.subheadline && (
						<p
							className={`mt-5 text-[clamp(1rem,2vw,1.15rem)] leading-relaxed text-[var(--wl-muted)] ${
								centered ? "mx-auto max-w-xl" : "max-w-xl"
							}`}
						>
							{content.subheadline}
						</p>
					)}

					<div className={`mt-8 ${centered ? "mx-auto max-w-lg" : "max-w-lg"}`}>
						{form}
					</div>
				</div>
			</Container>
		</section>
	);
}

/**
 * Painted at the top of the page rather than inside the hero: a glow clipped by
 * the hero's own bounds leaves a hard horizontal edge under the header.
 */
export function HeroDecoration({ variant }: { variant: HeroVariant }) {
	if (variant === "spotlight" || variant === "gradientText") {
		return (
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
				style={{ background: "var(--wl-hero-wash)" }}
			/>
		);
	}

	if (variant === "blobs") {
		return (
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden"
			>
				<span
					className="absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-70"
					style={{ background: "var(--wl-accent-soft)" }}
				/>
				<span
					className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full opacity-60"
					style={{ background: "var(--wl-surface-2)" }}
				/>
			</div>
		);
	}

	return null;
}
