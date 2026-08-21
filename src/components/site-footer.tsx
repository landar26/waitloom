import Link from "next/link";
import { Logo } from "./logo";
import type { Dict } from "@/i18n/dictionaries";

export function SiteFooter({ dict }: { dict: Dict }) {
	return (
		<footer className="border-t border-line-soft px-5 py-10 sm:px-8">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
				<div className="max-w-md">
					<div className="flex items-center gap-2">
						<Logo className="h-4 w-4 text-brand" />
						<span className="text-sm font-semibold tracking-tight">
							Waitloom
						</span>
					</div>
					<p className="mt-3 text-[13px] leading-relaxed text-dim">
						{dict.footer.privacy}
					</p>
				</div>
				<div className="flex items-center gap-4 text-[13px] text-dim">
					<Link href={dict.nav.langHref} className="hover:text-fg">
						{dict.nav.langLabel}
					</Link>
					<span className="text-line">·</span>
					<a href="/login" className="hover:text-fg">
						{dict.nav.signIn}
					</a>
					<span className="text-line">·</span>
					<span>
						© {new Date().getFullYear()} {dict.footer.rights}
					</span>
				</div>
			</div>
		</footer>
	);
}
