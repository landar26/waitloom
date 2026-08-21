import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Reads a secret the same way in dev (.dev.vars via miniflare) and in
 * production (`wrangler secret put`), falling back to the Node environment so
 * plain `next build` does not explode.
 */
export async function secret(key: string): Promise<string | undefined> {
	try {
		const { env } = await getCloudflareContext({ async: true });
		const value = (env as unknown as Record<string, unknown>)[key];
		if (typeof value === "string" && value) return value;
	} catch {
		/* not running on Workers */
	}
	return process.env[key] || undefined;
}

export async function requireSecret(key: string): Promise<string> {
	const value = await secret(key);
	if (!value) {
		throw new Error(
			`${key} is not set. Add it to .dev.vars locally, or run npm run secrets:push.`,
		);
	}
	return value;
}
