import type { User } from "../auth";
import { callTool, TOOL_DEFINITIONS, UnknownToolError } from "./tools";

/**
 * JSON-RPC 2.0 and the handful of MCP methods a tools-only server owes a
 * client. Hand-rolled rather than pulled from @modelcontextprotocol/sdk: the
 * SDK is built around long-lived Node transports, and this server is stateless
 * — one HTTP request in, one JSON response out — which is five methods' worth
 * of code and no extra weight in the Worker bundle.
 */

export const SERVER_NAME = "waitloom";
export const SERVER_VERSION = "1.0.0";

/** Newest first. We answer in the client's version when we know it. */
export const SUPPORTED_PROTOCOL_VERSIONS = [
	"2025-06-18",
	"2025-03-26",
	"2024-11-05",
] as const;

export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

export type JsonRpcId = string | number | null;

type JsonRpcMessage = {
	jsonrpc?: unknown;
	id?: JsonRpcId;
	method?: unknown;
	params?: unknown;
};

export type JsonRpcResponse = {
	jsonrpc: "2.0";
	id: JsonRpcId;
	result?: unknown;
	error?: { code: number; message: string; data?: unknown };
};

export type McpContext = {
	db: D1Database;
	user: User;
	/** The Host of the incoming request, so tools can build correct URLs. */
	host: string | null;
};

export function rpcError(
	id: JsonRpcId,
	code: number,
	message: string,
	data?: unknown,
): JsonRpcResponse {
	return { jsonrpc: "2.0", id, error: data === undefined ? { code, message } : { code, message, data } };
}

function rpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
	return { jsonrpc: "2.0", id, result };
}

function negotiateVersion(params: unknown): string {
	const requested = (params as { protocolVersion?: unknown })?.protocolVersion;
	return typeof requested === "string" &&
		(SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
		? requested
		: LATEST_PROTOCOL_VERSION;
}

/**
 * One message in, one response out — or null for a notification, which by
 * definition gets no reply.
 */
async function handleMessage(
	message: JsonRpcMessage,
	ctx: McpContext,
): Promise<JsonRpcResponse | null> {
	const method = typeof message.method === "string" ? message.method : null;
	// A message with no id is a notification; its errors go nowhere either.
	const id = message.id ?? null;
	const isNotification = message.id === undefined || message.id === null;

	if (!method) {
		return isNotification ? null : rpcError(id, INVALID_REQUEST, "method is required");
	}

	// Client-side lifecycle chatter. Nothing to do, nothing to say back.
	if (method.startsWith("notifications/")) return null;

	switch (method) {
		case "initialize":
			return rpcResult(id, {
				protocolVersion: negotiateVersion(message.params),
				capabilities: { tools: { listChanged: false } },
				serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
				instructions:
					"Waitloom manages pre-launch pages: one page per product, on its own " +
					"subdomain, collecting a waitlist and up to three validation questions. " +
					"Start with list_projects to see what the founder already has.",
			});

		case "ping":
			return rpcResult(id, {});

		case "tools/list":
			return rpcResult(id, { tools: TOOL_DEFINITIONS });

		case "tools/call": {
			const params = (message.params ?? {}) as { name?: unknown; arguments?: unknown };
			if (typeof params.name !== "string") {
				return rpcError(id, INVALID_PARAMS, "tools/call requires a tool name");
			}

			const args = (params.arguments ?? {}) as Record<string, unknown>;
			if (typeof args !== "object" || Array.isArray(args)) {
				return rpcError(id, INVALID_PARAMS, "arguments must be an object");
			}

			try {
				return rpcResult(id, await callTool(params.name, args, ctx));
			} catch (error) {
				if (error instanceof UnknownToolError) {
					return rpcError(id, INVALID_PARAMS, error.message);
				}
				console.error(`mcp tool ${params.name} failed`, error);
				return rpcError(id, INTERNAL_ERROR, "the tool failed unexpectedly");
			}
		}

		default:
			return isNotification
				? null
				: rpcError(id, METHOD_NOT_FOUND, `unknown method: ${method}`);
	}
}

/**
 * Handles a parsed request body — a single message or a batch. Returns null
 * when every message was a notification, which the route answers with a 202.
 */
export async function handleRpc(
	body: unknown,
	ctx: McpContext,
): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
	if (Array.isArray(body)) {
		if (body.length === 0) return rpcError(null, INVALID_REQUEST, "empty batch");
		const responses = await Promise.all(
			body.map((message) => handleMessage((message ?? {}) as JsonRpcMessage, ctx)),
		);
		const answered = responses.filter((r): r is JsonRpcResponse => r !== null);
		return answered.length > 0 ? answered : null;
	}

	if (!body || typeof body !== "object") {
		return rpcError(null, INVALID_REQUEST, "expected a JSON-RPC message");
	}

	return handleMessage(body as JsonRpcMessage, ctx);
}
