import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The D1 binding, resolved the same way in dev (miniflare) and on Workers. */
export async function getDb(): Promise<D1Database> {
	const { env } = await getCloudflareContext({ async: true });
	const db = (env as CloudflareEnv & { DB?: D1Database }).DB;
	if (!db) {
		throw new Error(
			"D1 binding `DB` is missing. Check the d1_databases block in wrangler.jsonc.",
		);
	}
	return db;
}
