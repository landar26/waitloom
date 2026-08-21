import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { slugFromHost } from "@/lib/host";
import { SITE_URL } from "@/lib/site";

/**
 * Served on every host the Worker answers to, including published pages at
 * <slug>.waitloom.app — which must not advertise Waitloom's sitemap, and must
 * not inherit rules written for the app.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
	const host = (await headers()).get("host");

	if (slugFromHost(host)) {
		// A founder's page is one URL and we want it indexed.
		return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }] };
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
