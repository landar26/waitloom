import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Public prefix for uploaded images. Kept out of /api so the URLs read well. */
export const MEDIA_PREFIX = "/media/";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/svg+xml": "svg",
};

export async function getMediaBucket(): Promise<R2Bucket> {
	const { env } = await getCloudflareContext({ async: true });
	const bucket = (env as CloudflareEnv & { MEDIA?: R2Bucket }).MEDIA;
	if (!bucket) {
		throw new Error(
			"R2 binding `MEDIA` is missing. Check the r2_buckets block in wrangler.jsonc.",
		);
	}
	return bucket;
}

export function mediaUrl(key: string): string {
	return `${MEDIA_PREFIX}${key}`;
}
