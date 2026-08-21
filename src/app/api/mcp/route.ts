import { getDb } from "@/lib/db";
import {
	handleRpc,
	INVALID_REQUEST,
	LATEST_PROTOCOL_VERSION,
	PARSE_ERROR,
	rpcError,
} from "@/lib/mcp/protocol";
import { bearerToken, userForApiToken } from "@/lib/tokens";

/**
 * Waitloom's MCP server, over the Streamable HTTP transport.
 *
 * Stateless on purpose: one POST carries one JSON-RPC message and gets one JSON
 * response back. No SSE stream, no `Mcp-Session-Id`, nothing to keep alive
 * between calls — which is what lets an MCP server live inside an ordinary
 * Worker route instead of a Durable Object.
 *
 * Auth is a bearer token from `api_tokens` and *only* that. This route
 * deliberately does not go through `apiUser()`: it accepts cross-origin
 * requests, and a route that accepted the session cookie as well would let any
 * page on the internet drive a signed-in founder's account.
 */

export const dynamic = "force-dynamic";

const CORS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "POST, OPTIONS",
	"access-control-allow-headers":
		"authorization, content-type, mcp-protocol-version, mcp-session-id",
	"access-control-max-age": "86400",
};

function json(body: unknown, status = 200): Response {
	return Response.json(body, {
		status,
		headers: { ...CORS, "mcp-protocol-version": LATEST_PROTOCOL_VERSION },
	});
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
	const token = bearerToken(request);
	if (!token) return challenge("a bearer token is required");

	let user;
	try {
		const db = await getDb();
		user = await userForApiToken(db, token);
		if (!user) return challenge("that token is not valid");

		let body: unknown;
		try {
			body = await request.json();
		} catch {
			return json(rpcError(null, PARSE_ERROR, "the request body is not valid JSON"), 400);
		}

		const response = await handleRpc(body, {
			db,
			user,
			host: request.headers.get("host"),
		});

		// Every message was a notification, so there is nothing to answer with.
		if (response === null) return new Response(null, { status: 202, headers: CORS });

		return json(response);
	} catch (error) {
		console.error("mcp request failed", error);
		return json(rpcError(null, INVALID_REQUEST, "the request could not be handled"), 500);
	}
}

/** GET is where a client would open an SSE stream; a stateless server has none. */
export async function GET() {
	return new Response("This MCP endpoint accepts POST only.", {
		status: 405,
		headers: { ...CORS, allow: "POST, OPTIONS" },
	});
}

function challenge(message: string): Response {
	return Response.json(
		{ jsonrpc: "2.0", id: null, error: { code: -32001, message } },
		{
			status: 401,
			headers: {
				...CORS,
				"www-authenticate": 'Bearer realm="Waitloom MCP"',
			},
		},
	);
}
