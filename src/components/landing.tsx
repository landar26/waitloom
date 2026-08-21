import { SiteHeader } from "./site-header";
import { Hero } from "./hero";
import { TemplateShowcase } from "./template-showcase";
import { Features } from "./features";
import { McpSection } from "./mcp-section";
import { Faq } from "./faq";
import { DiscordCta } from "./discord-cta";
import { Founder } from "./founder";
import { ClosingCta } from "./closing-cta";
import { SiteFooter } from "./site-footer";
import { PageBeacon } from "./page-beacon";
import { getDict, type Lang } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";

export function Landing({ lang }: { lang: Lang }) {
	const dict = getDict(lang);
	const shareUrl = lang === "zh" ? `${SITE_URL}/zh` : SITE_URL;

	return (
		<div className="min-h-screen">
			<PageBeacon />
			<SiteHeader dict={dict} />
			<main>
				<Hero dict={dict} lang={lang} shareUrl={shareUrl} />
				<div className="hairline mx-auto h-px max-w-6xl" />
				<TemplateShowcase dict={dict} />
				<div className="hairline mx-auto h-px max-w-6xl" />
				<Features dict={dict} />
				<div className="hairline mx-auto h-px max-w-6xl" />
				<McpSection dict={dict} />
				<div className="hairline mx-auto h-px max-w-6xl" />
				<Faq dict={dict} />
				<DiscordCta dict={dict} />
				<Founder dict={dict} />
				<ClosingCta dict={dict} />
			</main>
			<SiteFooter dict={dict} />
		</div>
	);
}
