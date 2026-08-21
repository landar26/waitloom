import { apiUser, badRequest, isResponse, notFound, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import {
	ALLOWED_IMAGE_TYPES,
	MAX_UPLOAD_BYTES,
	getMediaBucket,
	mediaUrl,
} from "@/lib/media";
import { getOwnedProject } from "@/lib/projects";

/** Logos, screenshots and avatars. Images only, and only into your own project. */
export async function POST(request: Request) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return badRequest();
	}

	const file = form.get("file");
	const projectId = form.get("projectId");

	if (!(file instanceof File) || typeof projectId !== "string") return badRequest();

	const extension = ALLOWED_IMAGE_TYPES[file.type];
	if (!extension) return badRequest("unsupported_type");
	if (file.size > MAX_UPLOAD_BYTES) return badRequest("too_large");

	try {
		const project = await getOwnedProject(await getDb(), projectId, user.id);
		if (!project) return notFound();

		// Keyed by project so deleting a project can sweep its media later.
		const key = `projects/${project.id}/${crypto.randomUUID()}.${extension}`;
		const bucket = await getMediaBucket();

		// R2 needs a known length, which a FormData File's stream does not carry.
		// Buffering is safe here: MAX_UPLOAD_BYTES caps the file at 4 MB.
		await bucket.put(key, await file.arrayBuffer(), {
			httpMetadata: {
				contentType: file.type,
				cacheControl: "public, max-age=31536000, immutable",
			},
		});

		return Response.json({ url: mediaUrl(key) });
	} catch (error) {
		console.error("upload failed", error);
		return serverError();
	}
}
