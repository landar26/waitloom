import { getDb } from "@/lib/db";
import { listSubscribers, toCsv } from "@/lib/waitlist";

export async function GET() {
	const db = await getDb();
	const rows = await listSubscribers(db, 10000);
	const stamp = new Date().toISOString().slice(0, 10);

	return new Response(toCsv(rows), {
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": `attachment; filename="waitloom-subscribers-${stamp}.csv"`,
			"cache-control": "no-store",
		},
	});
}
