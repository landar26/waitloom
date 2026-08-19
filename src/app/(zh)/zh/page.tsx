import type { Metadata } from "next";
import { Landing } from "@/components/landing";
import { zh } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: zh.meta.title,
	description: zh.meta.description,
	alternates: {
		canonical: "/zh",
		languages: { en: "/", zh: "/zh" },
	},
	openGraph: {
		type: "website",
		url: "/zh",
		siteName: "Waitloom",
		title: zh.meta.title,
		description: zh.meta.description,
		locale: "zh_CN",
	},
	twitter: {
		card: "summary_large_image",
		title: zh.meta.title,
		description: zh.meta.description,
	},
};

export default function Page() {
	return <Landing lang="zh" />;
}
