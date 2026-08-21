import type { ReactNode } from "react";
import type { Shape } from "../style";

/** Shared furniture: container, header, footer, section headings. */

export function Container({
	children,
	className = "",
	wide = false,
}: {
	children: ReactNode;
	className?: string;
	wide?: boolean;
}) {
	return (
		<div
			className={`mx-auto w-full px-6 sm:px-8 ${wide ? "max-w-6xl" : "max-w-5xl"} ${className}`}
		>
			{children}
		</div>
	);
}

export function Section({
	id,
	children,
	tight = false,
	rules = false,
}: {
	id?: string;
	children: ReactNode;
	tight?: boolean;
	rules?: boolean;
}) {
	return (
		<section
			id={id}
			className={`${tight ? "py-14 sm:py-16" : "py-16 sm:py-24"} ${
				rules ? "border-t border-[var(--wl-border-soft)]" : ""
			}`}
		>
			<Container>{children}</Container>
		</section>
	);
}

export function Heading({
	title,
	subtitle,
	align,
}: {
	title: string;
	subtitle?: string;
	align: Shape["align"];
}) {
	return (
		<div className={align === "center" ? "text-center" : ""}>
			<h2
				className="text-[clamp(1.5rem,3.4vw,2.1rem)] leading-[1.15] text-[var(--wl-fg)]"
				style={{
					fontWeight: "var(--wl-heading-weight)" as unknown as number,
					letterSpacing: "var(--wl-tracking)",
				}}
			>
				{title}
			</h2>
			{subtitle && (
				<p
					className={`mt-3 text-[15.5px] leading-relaxed text-[var(--wl-muted)] ${
						align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
					}`}
				>
					{subtitle}
				</p>
			)}
		</div>
	);
}

/** The one button style, shared by the hero CTA and every form. */
export function buttonClass(): string {
	return "inline-flex items-center justify-center rounded-[var(--wl-control)] bg-[var(--wl-accent)] px-5 py-3 text-[14.5px] font-medium text-[var(--wl-on-accent)] shadow-[var(--wl-button-shadow)] transition-transform hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0";
}

export function inputClass(): string {
	return "w-full rounded-[var(--wl-control)] border-[length:var(--wl-border-width)] border-[var(--wl-border)] bg-[var(--wl-surface)] px-4 py-3 text-[14.5px] text-[var(--wl-fg)] outline-none placeholder:text-[var(--wl-dim)] focus:border-[var(--wl-accent)]";
}

export function Logo({ url, name }: { url: string; name: string }) {
	if (!url) {
		return (
			<span
				className="text-[15.5px] text-[var(--wl-fg)]"
				style={{
					fontWeight: "var(--wl-heading-weight)" as unknown as number,
					letterSpacing: "var(--wl-tracking)",
				}}
			>
				{name}
			</span>
		);
	}
	return (
		<span className="flex items-center gap-2.5">
			{/* Arbitrary founder-supplied host; next/image would need a loader per domain. */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={url}
				alt=""
				className="h-7 w-7 rounded-[calc(var(--wl-radius)/2)] object-cover"
			/>
			<span
				className="text-[15.5px] text-[var(--wl-fg)]"
				style={{
					fontWeight: "var(--wl-heading-weight)" as unknown as number,
					letterSpacing: "var(--wl-tracking)",
				}}
			>
				{name}
			</span>
		</span>
	);
}

/** One language a page can be read in, as the header needs to render it. */
export type PageLocale = { code: string; label: string; href: string };

/**
 * Plain links, not a dropdown: with two languages a menu costs a click and
 * teaches the visitor nothing the labels do not already say.
 */
function LanguageSwitcher({
	locales,
	active,
	label,
	inert,
}: {
	locales: PageLocale[];
	active: string;
	label: string;
	/** In the editor preview the switcher is shown but goes nowhere. */
	inert: boolean;
}) {
	return (
		<nav aria-label={label} className="flex items-center gap-1.5 text-[13px]">
			{locales.map((locale, i) => (
				<span key={locale.code} className="flex items-center gap-1.5">
					{i > 0 && <span aria-hidden className="text-[var(--wl-dim)]">·</span>}
					{locale.code === active || inert ? (
						<span
							aria-current={locale.code === active ? "true" : undefined}
							className={
								locale.code === active ? "text-[var(--wl-fg)]" : "text-[var(--wl-dim)]"
							}
						>
							{locale.label}
						</span>
					) : (
						<a
							href={locale.href}
							hrefLang={locale.code}
							className="text-[var(--wl-dim)] transition-colors hover:text-[var(--wl-accent)]"
						>
							{locale.label}
						</a>
					)}
				</span>
			))}
		</nav>
	);
}

export function PageHeader({
	name,
	logoUrl,
	ctaLabel,
	ctaHref,
	ctaExternal,
	rules,
	locales,
	activeLocale,
	switcherLabel,
	preview,
}: {
	name: string;
	logoUrl: string;
	ctaLabel: string;
	/** The product's own link, `#waitlist`, or empty for no button at all. */
	ctaHref: string;
	ctaExternal: boolean;
	rules: boolean;
	/** Fewer than two languages means there is nothing to switch between. */
	locales: PageLocale[];
	activeLocale: string;
	switcherLabel: string;
	preview: boolean;
}) {
	return (
		<header
			className={`relative z-10 py-5 ${rules ? "border-b border-[var(--wl-border-soft)]" : ""}`}
		>
			<Container className="flex items-center justify-between gap-4">
				<Logo url={logoUrl} name={name} />
				<div className="flex items-center gap-3.5">
					{locales.length > 1 && (
						<LanguageSwitcher
							locales={locales}
							active={activeLocale}
							label={switcherLabel}
							inert={preview}
						/>
					)}
					{ctaHref && (
						<a
							href={ctaHref}
							{...(ctaExternal
								? { target: "_blank", rel: "noopener noreferrer" }
								: {})}
							className="rounded-[var(--wl-control)] border-[length:var(--wl-border-width)] border-[var(--wl-border)] px-3.5 py-1.5 text-[13px] text-[var(--wl-fg)] transition-colors hover:border-[var(--wl-accent)] hover:text-[var(--wl-accent)]"
						>
							{ctaLabel}
						</a>
					)}
				</div>
			</Container>
		</header>
	);
}

export function PageFooter({
	name,
	branding,
	madeWith,
}: {
	name: string;
	branding: boolean;
	madeWith: string;
}) {
	return (
		<footer className="border-t border-[var(--wl-border-soft)] py-8">
			<Container className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[var(--wl-dim)]">
				<span>
					© {new Date().getFullYear()} {name}
				</span>
				{branding && (
					<a
						href="https://waitloom.app"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-[var(--wl-accent)]"
					>
						{madeWith}
					</a>
				)}
			</Container>
		</footer>
	);
}
