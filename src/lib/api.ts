import { currentUser, type User } from "./auth";

/** Shared shapes for the founder-only JSON API. */

export const unauthorized = () =>
	Response.json({ error: "unauthorized" }, { status: 401 });

export const notFound = () => Response.json({ error: "not_found" }, { status: 404 });

export const badRequest = (error = "bad_request") =>
	Response.json({ error }, { status: 400 });

export const serverError = () =>
	Response.json({ error: "server_error" }, { status: 500 });

/** The signed-in founder, or a 401 to return straight to the client. */
export async function apiUser(): Promise<User | Response> {
	const user = await currentUser();
	return user ?? unauthorized();
}

export function isResponse(value: unknown): value is Response {
	return value instanceof Response;
}

export async function jsonBody<T>(request: Request): Promise<T | null> {
	try {
		return (await request.json()) as T;
	} catch {
		return null;
	}
}
