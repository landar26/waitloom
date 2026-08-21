import type { GoogleIdentity } from "./auth";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export function authorizeUrl(input: {
	clientId: string;
	redirectUri: string;
	state: string;
}): string {
	const params = new URLSearchParams({
		client_id: input.clientId,
		redirect_uri: input.redirectUri,
		response_type: "code",
		scope: "openid email profile",
		state: input.state,
		access_type: "online",
		prompt: "select_account",
	});
	return `${AUTHORIZE_URL}?${params}`;
}

function decodeSegment(segment: string): unknown {
	const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
	const json = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
	// atob gives latin-1; the payload may carry a non-ASCII display name.
	const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0));
	return JSON.parse(new TextDecoder().decode(bytes));
}

type IdTokenClaims = {
	sub?: string;
	iss?: string;
	aud?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	picture?: string;
};

/**
 * Swaps the authorization code for the caller's identity.
 *
 * The id_token's signature is not verified, and does not need to be: it came
 * straight back from Google's token endpoint over TLS on a connection we
 * opened, which OpenID Connect Core 3.1.3.7 explicitly allows. `iss` and `aud`
 * are still checked as cheap protection against a misconfigured client.
 */
export async function exchangeCode(input: {
	code: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}): Promise<GoogleIdentity> {
	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code: input.code,
			client_id: input.clientId,
			client_secret: input.clientSecret,
			redirect_uri: input.redirectUri,
			grant_type: "authorization_code",
		}),
	});

	if (!response.ok) {
		throw new Error(`google token exchange failed: ${response.status}`);
	}

	const body = (await response.json()) as { id_token?: string };
	if (!body.id_token) throw new Error("google token response had no id_token");

	const parts = body.id_token.split(".");
	if (parts.length !== 3) throw new Error("malformed id_token");

	const claims = decodeSegment(parts[1]) as IdTokenClaims;

	if (!claims.iss || !ISSUERS.has(claims.iss)) {
		throw new Error(`unexpected id_token issuer: ${claims.iss}`);
	}
	if (claims.aud !== input.clientId) {
		throw new Error("id_token was issued for a different client");
	}
	if (!claims.sub || !claims.email) {
		throw new Error("id_token was missing sub or email");
	}
	if (claims.email_verified === false) {
		throw new Error("google account has an unverified email");
	}

	return {
		sub: claims.sub,
		email: claims.email.toLowerCase(),
		name: claims.name,
		picture: claims.picture,
	};
}
