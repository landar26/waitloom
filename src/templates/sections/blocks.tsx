import type { ProjectContent } from "@/lib/content";
import type { PageDict } from "@/i18n/page";
import type { TemplateSpec } from "../registry";
import { Container, Heading, Section } from "./chrome";

/** The optional sections, in the order they may appear. */

export function Screenshot({ url, spec }: { url: string; spec: TemplateSpec }) {
	if (!url) return null;
	const chrome = spec.hero === "terminal" || spec.hero === "spotlight";

	return (
		<Container wide className="pb-6">
			<div
				className="overflow-hidden rounded-[var(--wl-radius)] border-[length:var(--wl-border-width)] border-[var(--wl-border)] bg-[var(--wl-surface)]"
				style={{ boxShadow: "var(--wl-shadow)" }}
			>
				{chrome && (
					<div className="flex items-center gap-1.5 border-b border-[var(--wl-border-soft)] bg-[var(--wl-surface-2)] px-4 py-2.5">
						{[0, 1, 2].map((i) => (
							<span
								key={i}
								className="h-2.5 w-2.5 rounded-full bg-[var(--wl-border)]"
							/>
						))}
					</div>
				)}
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={url} alt="" className="block w-full" />
			</div>
		</Container>
	);
}

export function Features({
	content,
	spec,
	dict,
}: {
	content: ProjectContent;
	spec: TemplateSpec;
	dict: PageDict;
}) {
	if (content.features.length === 0) return null;

	return (
		<Section rules={spec.shape.rules}>
			<Heading title={dict.sections.features} align={spec.shape.align} />
			<div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{content.features.map((feature, i) => (
					<div
						key={i}
						className="rounded-[var(--wl-radius)] border-[length:var(--wl-border-width)] border-[var(--wl-border-soft)] bg-[var(--wl-surface)] p-5"
					>
						<p
							className="text-[15.5px] text-[var(--wl-fg)]"
							style={{ fontWeight: "var(--wl-heading-weight)" as unknown as number }}
						>
							{feature.title}
						</p>
						{feature.body && (
							<p className="mt-2 text-[14.5px] leading-relaxed text-[var(--wl-muted)]">
								{feature.body}
							</p>
						)}
					</div>
				))}
			</div>
		</Section>
	);
}

export function HowItWorks({
	content,
	spec,
	dict,
}: {
	content: ProjectContent;
	spec: TemplateSpec;
	dict: PageDict;
}) {
	if (content.howItWorks.length === 0) return null;

	return (
		<Section rules={spec.shape.rules}>
			<Heading title={dict.sections.howItWorks} align={spec.shape.align} />
			<ol className="mt-9 grid gap-6 sm:grid-cols-2">
				{content.howItWorks.map((step, i) => (
					<li key={i} className="flex gap-4">
						<span
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--wl-control)] bg-[var(--wl-accent-soft)] text-[13.5px] text-[var(--wl-accent)]"
							style={{ fontWeight: "var(--wl-heading-weight)" as unknown as number }}
						>
							{i + 1}
						</span>
						<div>
							<p
								className="text-[15.5px] text-[var(--wl-fg)]"
								style={{ fontWeight: "var(--wl-heading-weight)" as unknown as number }}
							>
								{step.title}
							</p>
							{step.body && (
								<p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--wl-muted)]">
									{step.body}
								</p>
							)}
						</div>
					</li>
				))}
			</ol>
		</Section>
	);
}

export function Faq({
	content,
	spec,
	dict,
}: {
	content: ProjectContent;
	spec: TemplateSpec;
	dict: PageDict;
}) {
	if (content.faq.length === 0) return null;

	return (
		<Section rules={spec.shape.rules}>
			<Heading title={dict.sections.faq} align={spec.shape.align} />
			<div className="mx-auto mt-8 max-w-2xl divide-y divide-[var(--wl-border-soft)] border-y border-[var(--wl-border-soft)]">
				{content.faq.map((item, i) => (
					<details key={i} className="group py-4">
						<summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] text-[var(--wl-fg)]">
							{item.q}
							<span className="text-[var(--wl-dim)] transition-transform group-open:rotate-45">
								+
							</span>
						</summary>
						<p className="mt-2.5 text-[14.5px] leading-relaxed text-[var(--wl-muted)]">
							{item.a}
						</p>
					</details>
				))}
			</div>
		</Section>
	);
}

export function Founder({
	content,
	spec,
	dict,
}: {
	content: ProjectContent;
	spec: TemplateSpec;
	dict: PageDict;
}) {
	const { name, avatarUrl, bio } = content.founder;
	if (!name && !bio) return null;

	return (
		<Section tight rules={spec.shape.rules}>
			<Heading title={dict.sections.founder} align={spec.shape.align} />
			<div
				className={`mt-7 flex max-w-2xl gap-4 ${
					spec.shape.align === "center" ? "mx-auto text-left" : ""
				}`}
			>
				{avatarUrl && (
					/* eslint-disable-next-line @next/next/no-img-element */
					<img
						src={avatarUrl}
						alt=""
						className="h-12 w-12 shrink-0 rounded-full object-cover"
					/>
				)}
				<div>
					{name && (
						<p
							className="text-[15.5px] text-[var(--wl-fg)]"
							style={{ fontWeight: "var(--wl-heading-weight)" as unknown as number }}
						>
							{name}
						</p>
					)}
					{bio && (
						<p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--wl-muted)]">
							{bio}
						</p>
					)}
				</div>
			</div>
		</Section>
	);
}

const SOCIAL_LABELS: Record<string, string> = {
	x: "X",
	github: "GitHub",
	website: "Website",
	discord: "Discord",
};

export function Social({ content, spec }: { content: ProjectContent; spec: TemplateSpec }) {
	const links = Object.entries(content.social).filter(([, url]) => url);
	if (links.length === 0) return null;

	return (
		<Section tight rules={spec.shape.rules}>
			<div
				className={`flex flex-wrap gap-2.5 ${
					spec.shape.align === "center" ? "justify-center" : ""
				}`}
			>
				{links.map(([key, url]) => (
					<a
						key={key}
						href={url}
						target="_blank"
						rel="noopener noreferrer nofollow"
						className="rounded-[var(--wl-control)] border-[length:var(--wl-border-width)] border-[var(--wl-border)] px-4 py-2 text-[13.5px] text-[var(--wl-muted)] transition-colors hover:border-[var(--wl-accent)] hover:text-[var(--wl-accent)]"
					>
						{SOCIAL_LABELS[key] ?? key}
					</a>
				))}
			</div>
		</Section>
	);
}
