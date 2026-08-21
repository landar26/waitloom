import type { Metadata } from "next";
import { headers } from "next/headers";
import { TokenManager } from "@/components/dash/token-manager";
import { getAppDict } from "@/i18n/app";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appLang } from "@/lib/lang";
import { listApiTokens, MAX_TOKENS } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "MCP — Waitloom",
	robots: { index: false, follow: false },
};

/**
 * Account settings, which today means one thing: the tokens that let an MCP
 * client act on this account. Project settings are a different page.
 */
export default async function AccountSettingsPage() {
	const user = await requireUser();
	const [lang, db, host] = await Promise.all([
		appLang(),
		getDb(),
		headers().then((h) => h.get("host")),
	]);

	const dict = getAppDict(lang);
	const tokens = await listApiTokens(db, user.id);

	// The snippet has to be pasteable as-is, which means the host this dashboard
	// is actually being served from — localhost included.
	const origin = host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
		? `http://${host}`
		: `https://${host ?? "waitloom.app"}`;

	return (
		<main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
			<h1 className="text-2xl font-semibold tracking-tight">{dict.mcp.title}</h1>
			<p className="mt-2.5 max-w-xl text-[14.5px] leading-relaxed text-muted">
				{dict.mcp.subtitle}
			</p>

			<div className="mt-10">
				<TokenManager
					initialTokens={tokens}
					endpoint={`${origin}/api/mcp`}
					maxTokens={MAX_TOKENS}
					dict={dict}
				/>
			</div>
		</main>
	);
}
