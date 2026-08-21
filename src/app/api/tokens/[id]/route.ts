import { apiUser, isResponse, notFound, serverError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { deleteApiToken } from "@/lib/tokens";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await apiUser();
	if (isResponse(user)) return user;

	try {
		const { id } = await params;
		const removed = await deleteApiToken(await getDb(), user.id, id);
		return removed ? Response.json({ ok: true }) : notFound();
	} catch (error) {
		console.error("revoking a token failed", error);
		return serverError();
	}
}
