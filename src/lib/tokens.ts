import { hashToken, randomToken, USER_COLUMNS, type User } from "./auth";
import { clampText } from "./validation";

/**
 * Personal access tokens for the MCP server. Sessions authenticate a browser
 * and expire; these authenticate an agent and do not — a founder revokes one by
 * deleting it. Both are stored the same way: the row's id is sha256(token), and
 * the token itself only ever exists in the response that created it.
 */

/** Distinguishes ours from whatever else is in an Authorization header. */
const PREFIX = "wl_";

/** Visible in the dashboard so two tokens are tellable apart. */
const PREFIX_LENGTH = PREFIX.length + 8;

export const MAX_TOKENS = 10;

/** A write per tool call would be silly; a chatty agent still updates hourly. */
const LAST_USED_STALE_MS = 60 * 1000;

export type ApiToken = {
	id: string;
	name: string;
	prefix: string;
	created_at: number;
	last_used_at: number | null;
};

const COLUMNS = "id, name, prefix, created_at, last_used_at";

export async function listApiTokens(
	db: D1Database,
	userId: string,
): Promise<ApiToken[]> {
	const { results } = await db
		.prepare(
			`SELECT ${COLUMNS} FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC`,
		)
		.bind(userId)
		.all<ApiToken>();
	return results ?? [];
}

export async function countApiTokens(
	db: D1Database,
	userId: string,
): Promise<number> {
	const row = await db
		.prepare("SELECT COUNT(*) AS n FROM api_tokens WHERE user_id = ?")
		.bind(userId)
		.first<{ n: number }>();
	return Number(row?.n ?? 0);
}

/**
 * Mints a token. The plaintext comes back exactly once — nothing stores it, so
 * a founder who loses it makes a new one.
 */
export async function createApiToken(
	db: D1Database,
	userId: string,
	name: unknown,
): Promise<{ token: string; row: ApiToken } | { error: "token_limit" }> {
	if ((await countApiTokens(db, userId)) >= MAX_TOKENS) return { error: "token_limit" };

	const token = `${PREFIX}${randomToken(32)}`;
	const row: ApiToken = {
		id: await hashToken(token),
		name: clampText(name, 60) ?? "",
		prefix: token.slice(0, PREFIX_LENGTH),
		created_at: Date.now(),
		last_used_at: null,
	};

	await db
		.prepare(
			`INSERT INTO api_tokens (id, user_id, name, prefix, created_at, last_used_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.bind(row.id, userId, row.name, row.prefix, row.created_at, null)
		.run();

	return { token, row };
}

/** Scoped by user_id so one founder can never revoke another's token. */
export async function deleteApiToken(
	db: D1Database,
	userId: string,
	id: string,
): Promise<boolean> {
	const result = await db
		.prepare("DELETE FROM api_tokens WHERE id = ? AND user_id = ?")
		.bind(id, userId)
		.run();
	return (result.meta.changes ?? 0) > 0;
}

/** The founder behind a bearer token, or null. The MCP server's only gate. */
export async function userForApiToken(
	db: D1Database,
	token: string,
): Promise<User | null> {
	if (!token.startsWith(PREFIX)) return null;

	const id = await hashToken(token);
	const row = await db
		.prepare(
			`SELECT ${USER_COLUMNS.split(", ").map((c) => `u.${c}`).join(", ")}, t.last_used_at
			 FROM api_tokens t JOIN users u ON u.id = t.user_id
			 WHERE t.id = ?`,
		)
		.bind(id)
		.first<User & { last_used_at: number | null }>();

	if (!row) return null;

	const now = Date.now();
	if (!row.last_used_at || now - row.last_used_at > LAST_USED_STALE_MS) {
		await db
			.prepare("UPDATE api_tokens SET last_used_at = ? WHERE id = ?")
			.bind(now, id)
			.run();
	}

	const { last_used_at: _ignored, ...user } = row;
	return user;
}

/** The bearer token on a request, or null. Cookies are deliberately ignored. */
export function bearerToken(request: Request): string | null {
	const header = request.headers.get("authorization") ?? "";
	const [scheme, value] = header.split(" ");
	if (scheme?.toLowerCase() !== "bearer" || !value) return null;
	return value.trim() || null;
}
