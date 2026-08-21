import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getAppDict } from "@/i18n/app";
import { currentUser } from "@/lib/auth";
import { appLang } from "@/lib/lang";

export const metadata: Metadata = {
	title: "Sign in — Waitloom",
	robots: { index: false, follow: false },
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string; next?: string }>;
}) {
	if (await currentUser()) redirect("/dashboard");

	const [lang, params] = await Promise.all([appLang(), searchParams]);
	const t = getAppDict(lang).login;
	const error = params.error as keyof typeof t.errors | undefined;

	return (
		<main className="flex min-h-[80vh] items-center justify-center px-5 py-16">
			<div className="w-full max-w-sm text-center">
				<Logo className="mx-auto h-9 w-9 text-brand" />
				<h1 className="mt-6 text-2xl font-semibold tracking-tight">{t.title}</h1>
				<p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{t.subtitle}</p>

				{error && t.errors[error] && (
					<p className="mt-5 rounded-lg border border-line bg-ink-2 px-4 py-3 text-[13.5px] text-brand-2">
						{t.errors[error]}
					</p>
				)}

				<a
					href="/api/auth/google"
					className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-fg px-5 py-3 text-[14.5px] font-medium text-ink transition-opacity hover:opacity-90"
				>
					<GoogleMark />
					{t.google}
				</a>

				{process.env.NODE_ENV !== "production" && (
					<a
						href="/api/auth/dev"
						className="mt-3 block text-[13px] text-dim underline-offset-4 hover:underline"
					>
						{t.dev}
					</a>
				)}
			</div>
		</main>
	);
}

function GoogleMark() {
	return (
		<svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
			<path
				fill="#EA4335"
				d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
			/>
			<path
				fill="#4285F4"
				d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.3z"
			/>
			<path
				fill="#FBBC05"
				d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z"
			/>
			<path
				fill="#34A853"
				d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
			/>
		</svg>
	);
}
