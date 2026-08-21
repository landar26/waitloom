"use client";

import { useEffect } from "react";

// Module scope, so React StrictMode's double-invoked effect in dev — and any
// client-side re-render — still counts the visit exactly once per load.
let sent = false;

/** Counts one pageview on a published project page. */
export function ProjectBeacon({ slug }: { slug: string }) {
	useEffect(() => {
		if (sent) return;
		sent = true;

		const body = JSON.stringify({
			referrer: document.referrer || null,
			utm_source: new URLSearchParams(window.location.search).get("utm_source"),
		});

		const url = `/api/p/${slug}/hit`;
		const blob = new Blob([body], { type: "application/json" });
		if (navigator.sendBeacon?.(url, blob)) return;

		fetch(url, {
			method: "POST",
			body,
			keepalive: true,
			headers: { "content-type": "application/json" },
		}).catch(() => {});
	}, [slug]);

	return null;
}
