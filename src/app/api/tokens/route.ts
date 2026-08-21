import { apiUser, isResponse, jsonBody, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { createApiToken, listApiTokens, MAX_TOKENS } from "@/lib/tokens";

/** The founder's MCP tokens. Cookie-authenticated, like every dashboard route. */
export async function GET() {
	const user = await apiUser();
	if (isResponse(user)) return user;

	try {
		return Response.json({ tokens: await listApiTokens(await getDb(), user.id) });
	} catch (error) {
		console.error("listing tokens failed", error);
		return serverError();
	}
}

export async function POST(request: Request) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	const body = await jsonBody<{ name?: unknown }>(request);

	try {
		const result = await createApiToken(await getDb(), user.id, body?.name);
		if ("error" in result) {
			return Response.json({ error: result.error, max: MAX_TOKENS }, { status: 403 });
		}

		// The only time the plaintext token exists outside the client's clipboard.
		return Response.json({ token: result.token, row: result.row });
	} catch (error) {
		console.error("creating a token failed", error);
		return serverError();
	}
}
