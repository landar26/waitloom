import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();
	return [
		{
			url: `${SITE_URL}/`,
			lastModified,
			alternates: { languages: { en: `${SITE_URL}/`, zh: `${SITE_URL}/zh` } },
		},
		{
			url: `${SITE_URL}/zh`,
			lastModified,
			alternates: { languages: { en: `${SITE_URL}/`, zh: `${SITE_URL}/zh` } },
		},
	];
}
