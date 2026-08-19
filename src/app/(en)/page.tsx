import type { Metadata } from "next";
import { Landing } from "@/components/landing";
import { en } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: en.meta.title,
	description: en.meta.description,
	alternates: {
		canonical: "/",
		languages: { en: "/", zh: "/zh" },
	},
	openGraph: {
		type: "website",
		url: "/",
		siteName: "Waitloom",
		title: en.meta.title,
		description: en.meta.description,
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: en.meta.title,
		description: en.meta.description,
	},
};

export default function Page() {
	return <Landing lang="en" />;
}
