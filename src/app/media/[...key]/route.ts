import { getMediaBucket } from "@/lib/media";

/**
 * Serves uploaded images out of R2. Keys carry a UUID, so a stored object is
 * immutable and can be cached forever.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ key: string[] }> },
) {
	const { key } = await params;
	const path = key.join("/");

	if (!path.startsWith("projects/")) {
		return new Response("Not found", { status: 404 });
	}

	try {
		const object = await (await getMediaBucket()).get(path);
		if (!object) return new Response("Not found", { status: 404 });

		// Built by hand rather than with object.writeHttpMetadata(): the R2 helper
		// mutates a Headers instance that cannot cross the dev server's
		// serialization boundary.
		const headers = new Headers({
			"content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
			"content-length": String(object.size),
			etag: object.httpEtag,
			"cache-control": "public, max-age=31536000, immutable",
			// Uploads can be SVG, which a browser would otherwise run as a document.
			"content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
			"x-content-type-options": "nosniff",
		});

		return new Response(object.body, { headers });
	} catch (error) {
		console.error("serving media failed", error);
		return new Response("Not found", { status: 404 });
	}
}
