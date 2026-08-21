import Link from "next/link";
import { Logo } from "./logo";
import { DiscordIcon } from "./discord-icon";
import type { Dict } from "@/i18n/dictionaries";
import { DISCORD_URL } from "@/lib/site";

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
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-dim">
					<Link href={dict.nav.langHref} className="hover:text-fg">
						{dict.nav.langLabel}
					</Link>
					<span className="hidden text-line lg:inline">·</span>
					<a href="/login" className="hover:text-fg">
						{dict.nav.signIn}
					</a>
					{DISCORD_URL && (
						<>
							<span className="hidden text-line lg:inline">·</span>
							<a
								href={DISCORD_URL}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 hover:text-fg"
							>
								<DiscordIcon className="h-3.5 w-3.5" />
								{dict.discord.footer}
							</a>
						</>
					)}
					<span className="hidden text-line lg:inline">·</span>
					<span>
						© {new Date().getFullYear()} {dict.footer.rights}
					</span>
				</div>
			</div>
		</footer>
	);
}
