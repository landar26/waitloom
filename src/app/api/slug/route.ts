import { apiUser, isResponse, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { isValidSlug } from "@/lib/host";
import { slugTaken } from "@/lib/projects";

/** Live availability for the settings form. */
export async function GET(request: Request) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	const params = new URL(request.url).searchParams;
	const slug = (params.get("slug") ?? "").trim().toLowerCase();
	const exceptId = params.get("projectId") ?? undefined;

	if (!isValidSlug(slug)) {
		return Response.json({ available: false, reason: "invalid" });
	}

	try {
		const taken = await slugTaken(await getDb(), slug, exceptId);
		return Response.json({ available: !taken, reason: taken ? "taken" : null });
	} catch (error) {
		console.error("slug lookup failed", error);
		return serverError();
	}
}
