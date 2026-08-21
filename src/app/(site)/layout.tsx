import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/**
 * Root layout for published pages. Deliberately not RootShell: a founder's page
 * gets the palette and typography their template chose, and none of Waitloom's
 * own dark chrome. `lang` is set per page, in the page's own wrapper.
 */
export default function SiteLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{children}
			</body>
		</html>
	);
}
