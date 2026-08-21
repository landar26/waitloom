import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { projectUrl, slugFromHost } from "@/lib/host";
import { SITE_URL } from "@/lib/site";

/**
 * Served on every host the Worker answers to, including published pages at
 * <slug>.waitloom.app — which must not advertise Waitloom's sitemap, and must
 * not inherit rules written for the app.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
	const host = (await headers()).get("host");

	const slug = slugFromHost(host);
	if (slug) {
		// A founder's page is one URL per language it is written in, and we want
		// every one of them indexed — hence its own sitemap.
		return {
			rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
			sitemap: `${projectUrl(slug, host)}/sitemap.xml`,
		};
	}

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				// /s/ is the path form of a published page; its canonical is the
				// subdomain, so there is nothing to gain from crawling both.
				disallow: ["/admin", "/api/", "/dashboard", "/login", "/s/", "/media/"],
			},
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
}
