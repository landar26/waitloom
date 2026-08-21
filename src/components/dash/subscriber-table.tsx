"use client";

import { useMemo, useState } from "react";
import type { AppDict } from "@/i18n/app";
import type { Question } from "@/lib/projects";
import type { Subscriber } from "@/lib/subscribers";

/** Search, read the answers, delete. The PRD's whole subscriber surface. */
export function SubscriberTable({
	projectId,
	initialRows,
	questions,
	dict,
}: {
	projectId: string;
	initialRows: Subscriber[];
	questions: Question[];
	dict: AppDict;
}) {
	const t = dict.waitlist;
	const [rows, setRows] = useState(initialRows);
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState<string | null>(null);
	const [busy, setBusy] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) return rows;
		return rows.filter((row) => row.email.toLowerCase().includes(needle));
	}, [rows, query]);

	async function remove(id: string) {
		if (!confirm(t.deleteConfirm)) return;
		setBusy(id);
		try {
			const res = await fetch(`/api/projects/${projectId}/subscribers/${id}`, {
				method: "DELETE",
			});
			if (res.ok) setRows((prev) => prev.filter((row) => row.id !== id));
		} finally {
			setBusy(null);
		}
	}

	return (
		<div>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">{t.title}</h2>
					<p className="mt-1 text-[13px] text-dim">
						{t.count.replace("{n}", String(rows.length))}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t.search}
						className="rounded-full border border-line bg-ink-2 px-4 py-2 text-[13.5px] outline-none placeholder:text-dim focus:border-dim"
					/>
					<a
						href={`/api/projects/${projectId}/export`}
						className="rounded-full border border-line px-4 py-2 text-[13.5px] text-muted transition-colors hover:border-dim hover:text-fg"
					>
						{t.export}
					</a>
				</div>
			</div>

			<div className="mt-6 overflow-hidden rounded-xl border border-line">
				<table className="w-full border-collapse text-left text-[13.5px]">
					<thead className="bg-ink-2 text-[12px] uppercase tracking-[0.1em] text-dim">
						<tr>
							<th className="px-4 py-3 font-medium">{t.email}</th>
							<th className="px-4 py-3 font-medium">{t.source}</th>
							<th className="px-4 py-3 font-medium">{t.joined}</th>
							<th className="px-4 py-3" />
						</tr>
					</thead>
					<tbody>
						{filtered.length === 0 && (
							<tr>
								<td className="px-4 py-6 text-dim" colSpan={4}>
									{rows.length === 0 ? t.empty : t.noMatch}
								</td>
							</tr>
						)}

						{filtered.map((row) => {
							const answers = questions
								.map((q) => ({ q, value: row.answers[q.id] }))
								.filter((a) => a.value);
							const expanded = open === row.id;

							return (
								<tr key={row.id} className="border-t border-line-soft align-top">
									<td className="px-4 py-3">
										<span className="block truncate">{row.email}</span>
										{expanded && answers.length > 0 && (
											<dl className="mt-2.5 space-y-1.5 border-l border-line pl-3">
												{answers.map(({ q, value }) => (
													<div key={q.id}>
														<dt className="text-[12px] text-dim">{q.title}</dt>
														<dd className="text-[13px] text-muted">{value}</dd>
													</div>
												))}
											</dl>
										)}
									</td>
									<td className="px-4 py-3 text-muted">{row.source ?? "—"}</td>
									<td className="px-4 py-3 font-mono text-[12.5px] text-dim">
										{new Date(row.created_at).toISOString().slice(0, 10)}
									</td>
									<td className="px-4 py-3 text-right whitespace-nowrap">
										{answers.length > 0 && (
											<button
												type="button"
												onClick={() => setOpen(expanded ? null : row.id)}
												className="mr-3 text-[12.5px] text-dim transition-colors hover:text-fg"
											>
												{t.answers}
											</button>
										)}
										<button
											type="button"
											disabled={busy === row.id}
											onClick={() => remove(row.id)}
											className="text-[12.5px] text-dim transition-colors hover:text-brand-2 disabled:opacity-50"
										>
											{t.delete}
										</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
