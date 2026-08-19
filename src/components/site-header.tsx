import Link from "next/link";
import { Logo } from "./logo";
import type { Dict } from "@/i18n/dictionaries";

export function SiteHeader({ dict }: { dict: Dict }) {
	const links = [
		{ href: "#templates", label: dict.nav.templates },
		{ href: "#features", label: dict.nav.features },
		{ href: "#mcp", label: dict.nav.mcp },
		{ href: "#faq", label: dict.nav.faq },
	];

	return (
		<header className="sticky top-0 z-50 border-b border-line-soft/80 bg-ink/70 backdrop-blur-xl">
			<div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
				<Link
					href={dict.nav.langHref === "/zh" ? "/" : "/zh"}
					className="flex items-center gap-2 text-fg"
					aria-label="Waitloom"
				>
					<Logo className="h-5 w-5 text-brand" />
					<span className="text-[15px] font-semibold tracking-tight">
						Waitloom
					</span>
				</Link>

				<nav className="hidden flex-1 items-center gap-7 md:flex">
					{links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							className="text-[13.5px] text-muted transition-colors hover:text-fg"
						>
							{l.label}
						</a>
					))}
				</nav>

				<div className="ml-auto flex items-center gap-2 md:ml-0">
					<Link
						href={dict.nav.langHref}
						className="rounded-full px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-ink-3 hover:text-fg"
					>
						{dict.nav.langLabel}
					</Link>
					<a
						href="#join"
						className="rounded-full bg-fg px-3.5 py-1.5 text-[13px] font-medium text-ink transition-opacity hover:opacity-90"
					>
						{dict.nav.cta}
					</a>
				</div>
			</div>
		</header>
	);
}
