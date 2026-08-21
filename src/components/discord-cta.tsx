import { SectionHeading } from "./section-heading";
import { DiscordIcon } from "./discord-icon";
import type { Dict } from "@/i18n/dictionaries";
import { DISCORD_URL } from "@/lib/site";

/** Where product problems go. Sits right after the FAQ: the questions it can't answer. */
export function DiscordCta({ dict }: { dict: Dict }) {
	if (!DISCORD_URL) return null;

	return (
		<section className="px-5 pt-20 sm:px-8 sm:pt-24">
			<div className="mx-auto max-w-3xl rounded-2xl border border-line bg-ink-2/60 p-7 sm:p-10">
				<SectionHeading
					eyebrow={dict.discord.eyebrow}
					title={dict.discord.title}
				/>
				<p className="mt-4 text-[15px] leading-relaxed text-muted">
					{dict.discord.body}
				</p>
				<a
					href={DISCORD_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-brand transition-opacity hover:opacity-80"
				>
					<DiscordIcon className="h-4 w-4" />
					{dict.discord.cta}
				</a>
			</div>
		</section>
	);
}
