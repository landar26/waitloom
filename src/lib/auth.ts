import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

export { OAUTH_STATE_COOKIE, SESSION_COOKIE } from "./cookies";
import { SESSION_COOKIE } from "./cookies";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export type User = {
	id: string;
	email: string;
	name: string | null;
	avatar_url: string | null;
	lang: string;
	plan: string;
	created_at: number;
};

/** Every column of `users` the app treats as the signed-in identity. */
export const USER_COLUMNS = "id, email, name, avatar_url, lang, plan, created_at";

function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/** The cookie carries the token; the database only ever sees its hash. */
export async function hashToken(token: string): Promise<string> {
	const bytes = new TextEncoder().encode(token);
	return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

export function randomToken(bytes = 32): string {
	const buffer = crypto.getRandomValues(new Uint8Array(bytes));
	return btoa(String.fromCharCode(...buffer))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

export type GoogleIdentity = {
	sub: string;
	email: string;
	name?: string;
	picture?: string;
};

/** Finds the account for a Google identity, creating it on first sign-in. */
export async function upsertGoogleUser(
	db: D1Database,
	identity: GoogleIdentity,
	lang: string,
): Promise<User> {
	const bySub = await db
		.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE google_sub = ?`)
		.bind(identity.sub)
		.first<User>();

	if (bySub) {
		// Names and avatars change; keep them fresh but never touch the plan.
		await db
			.prepare("UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?")
			.bind(identity.email, identity.name ?? null, identity.picture ?? null, bySub.id)
			.run();
		return { ...bySub, email: identity.email, name: identity.name ?? null, avatar_url: identity.picture ?? null };
	}

	// Same person, signed up before Google was linked (or by another route).
	const byEmail = await db
		.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`)
		.bind(identity.email)
		.first<User>();

	if (byEmail) {
		await db
			.prepare("UPDATE users SET google_sub = ?, name = ?, avatar_url = ? WHERE id = ?")
			.bind(identity.sub, identity.name ?? null, identity.picture ?? null, byEmail.id)
			.run();
		return byEmail;
	}

	const user: User = {
		id: crypto.randomUUID(),
		email: identity.email,
		name: identity.name ?? null,
		avatar_url: identity.picture ?? null,
		lang,
		plan: "free",
		created_at: Date.now(),
	};

	await db
		.prepare(
			`INSERT INTO users (id, email, name, avatar_url, google_sub, lang, plan, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			user.id,
			user.email,
			user.name,
			user.avatar_url,
			identity.sub,
			user.lang,
			user.plan,
			user.created_at,
		)
		.run();

	return user;
}

export async function createSession(
	db: D1Database,
	userId: string,
): Promise<{ token: string; expiresAt: number }> {
	const token = randomToken();
	const expiresAt = Date.now() + SESSION_MS;

	await db
		.prepare(
			"INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
		)
		.bind(await hashToken(token), userId, Date.now(), expiresAt)
		.run();

	// Opportunistic cleanup; sessions are tiny but they should not accumulate.
	await db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(Date.now()).run();

	return { token, expiresAt };
}

export async function destroySession(db: D1Database, token: string): Promise<void> {
	await db.prepare("DELETE FROM sessions WHERE id = ?").bind(await hashToken(token)).run();
}

export async function userForToken(
	db: D1Database,
	token: string,
): Promise<User | null> {
	const row = await db
		.prepare(
			`SELECT ${USER_COLUMNS.split(", ").map((c) => `u.${c}`).join(", ")}
			 FROM sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.id = ? AND s.expires_at > ?`,
		)
		.bind(await hashToken(token), Date.now())
		.first<User>();
	return row ?? null;
}

/** The signed-in founder, or null. Safe to call from any server component. */
export async function currentUser(): Promise<User | null> {
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	if (!token) return null;
	try {
		return await userForToken(await getDb(), token);
	} catch (error) {
		console.error("session lookup failed", error);
		return null;
	}
}

export async function requireUser(): Promise<User> {
	const user = await currentUser();
	if (!user) redirect("/login");
	return user;
}

/** Cookie attributes shared by every place that sets the session. */
export function sessionCookieOptions(url: string, expiresAt: number) {
	const secure = new URL(url).protocol === "https:";
	return {
		httpOnly: true,
		secure,
		sameSite: "lax" as const,
		path: "/",
		// Deliberately host-only: a Domain of .waitloom.app would ship the
		// founder's session to every page their users publish.
		expires: new Date(expiresAt),
	};
}

export async function requestHost(): Promise<string | null> {
	return (await headers()).get("host");
}
