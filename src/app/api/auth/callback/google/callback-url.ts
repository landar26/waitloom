/**
 * The redirect_uri, which must match the one registered in Google Cloud
 * byte for byte on both the authorize and the token request.
 */
export function callbackUrl(requestUrl: string): string {
	const url = new URL("/api/auth/callback/google", requestUrl);
	url.search = "";
	// Cloudflare terminates TLS, so the inbound URL can arrive as http.
	if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
		url.protocol = "https:";
	}
	return url.toString();
}
