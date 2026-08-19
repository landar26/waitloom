"use client";

import { useEffect } from "react";

// Module scope, so React StrictMode's double-invoked effect in dev — and any
// client-side re-render — still counts the visit exactly once per load.
let sent = false;

/** Counts one pageview. Client-side so the landing page stays static. */
export function PageBeacon() {
	useEffect(() => {
		if (sent) return;
		sent = true;

		const body = JSON.stringify({
			referrer: document.referrer || null,
			utm_source: new URLSearchParams(window.location.search).get("utm_source"),
		});

		// sendBeacon survives the visitor navigating away mid-flight.
		const blob = new Blob([body], { type: "application/json" });
		if (navigator.sendBeacon?.("/api/hit", blob)) return;

		fetch("/api/hit", {
			method: "POST",
			body,
			keepalive: true,
			headers: { "content-type": "application/json" },
		}).catch(() => {});
	}, []);

	return null;
}
