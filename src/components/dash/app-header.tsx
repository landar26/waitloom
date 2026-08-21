import { headers } from "next/headers";
import { Logo } from "@/components/logo";
import { SettingsMenu } from "@/components/dash/settings-menu";
import { getAppDict } from "@/i18n/app";
import type { Lang } from "@/i18n/dictionaries";
import type { User } from "@/lib/auth";

/** The app's own chrome: who you are, and a gear for everything else. */
export async function AppHeader({ lang, user }: { lang: Lang; user: User }) {
	const t = getAppDict(lang).nav;
	// So the language toggle returns to the page it was clicked on.
	const current = (await headers()).get("x-pathname") ?? "/dashboard";

	return (
		<header className="border-b border-line-soft">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
				<a href="/dashboard" className="flex items-center gap-2.5">
					<Logo className="h-6 w-6" />
					<span className="text-[15px] font-semibold tracking-tight">Waitloom</span>
				</a>

				<div className="flex items-center gap-3 text-[13.5px]">
					<span className="hidden text-dim sm:inline">{user.email}</span>
					<SettingsMenu lang={lang} next={current} t={t} />
				</div>
			</div>
		</header>
	);
}
