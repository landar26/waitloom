import { apiUser, badRequest, isResponse, jsonBody, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { limitsFor } from "@/lib/plans";
import { countProjects, createProject } from "@/lib/projects";
import { isTemplateId } from "@/templates/registry";

type Body = {
	name?: unknown;
	description?: unknown;
	productType?: unknown;
	templateId?: unknown;
};

export async function POST(request: Request) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	const body = await jsonBody<Body>(request);
	if (!body || typeof body.name !== "string" || !body.name.trim()) {
		return badRequest("name_required");
	}

	try {
		const db = await getDb();

		const limit = limitsFor(user.plan).projects;
		if (Number.isFinite(limit) && (await countProjects(db, user.id)) >= limit) {
			return Response.json({ error: "project_limit" }, { status: 403 });
		}

		const project = await createProject(db, {
			userId: user.id,
			name: body.name,
			description: typeof body.description === "string" ? body.description : "",
			productType: typeof body.productType === "string" ? body.productType : "other",
			templateId: isTemplateId(body.templateId) ? (body.templateId as string) : "minimal",
		});

		return Response.json({ id: project.id, slug: project.slug });
	} catch (error) {
		console.error("creating a project failed", error);
		return serverError();
	}
}
