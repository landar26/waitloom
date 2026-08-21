import type { Metadata } from "next";
import { RootShell } from "@/components/root-shell";
import { AppHeader } from "@/components/dash/app-header";
import { currentUser } from "@/lib/auth";
import { appLang } from "@/lib/lang";
import "../globals.css";

export const metadata: Metadata = {
	icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
	robots: { index: false, follow: false },
};

export default async function AppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const [lang, user] = await Promise.all([appLang(), currentUser()]);

	return (
		<RootShell lang={lang}>
			{user && <AppHeader lang={lang} user={user} />}
			{children}
		</RootShell>
	);
}
