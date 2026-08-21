import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

/**
 * Shared <html> shell. Each language gets its own root layout so the
 * document carries the right `lang` attribute in the server-rendered HTML.
 */
export function RootShell({
	lang,
	children,
}: {
	lang: string;
	children: React.ReactNode;
}) {
	return (
		<html lang={lang} suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} app-shell antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
