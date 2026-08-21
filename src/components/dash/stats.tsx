import type { ReactNode } from "react";

/**
 * The dashboard's chart vocabulary, shared by the founder-facing project pages
 * and Waitloom's own /admin. Deliberately plain HTML: four numbers and two bar
 * charts do not need a charting library.
 */

export type Point = { day: string; count: number };
export type ShareRow = { label: string; count: number; pct: number };

export function Stat({
	label,
	value,
	hint,
}: {
	label: string;
	value: string | number;
	hint?: string;
}) {
	return (
		<div className="rounded-xl border border-line bg-ink-2 p-5">
			<p className="text-[12px] uppercase tracking-[0.12em] text-dim">{label}</p>
			<p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
			{hint && <p className="mt-1 text-[12.5px] text-dim">{hint}</p>}
		</div>
	);
}

export function Panel({
	title,
	action,
	children,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="rounded-xl border border-line bg-ink-2 p-5">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[12px] uppercase tracking-[0.12em] text-dim">{title}</p>
				{action}
			</div>
			<div className="mt-4">{children}</div>
		</div>
	);
}

export function Bars({
	title,
	rows,
	labels,
	empty,
}: {
	title: string;
	rows: ShareRow[];
	labels?: Record<string, string>;
	/** English default so Waitloom's own /admin can stay untranslated. */
	empty?: string;
}) {
	return (
		<Panel title={title}>
			<div className="space-y-2.5">
				{rows.length === 0 && (
					<p className="text-[13px] text-dim">{empty ?? "No data yet."}</p>
				)}
				{rows.map((row) => (
					<div key={row.label} className="flex items-center gap-3">
						<span className="w-32 shrink-0 truncate text-[13px] text-muted">
							{labels?.[row.label] ?? row.label}
						</span>
						<span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-3">
							<span
								className="block h-full rounded-full bg-brand"
								style={{ width: `${Math.max(row.pct, 2)}%` }}
							/>
						</span>
						<span className="w-16 shrink-0 text-right font-mono text-[12px] text-dim">
							{row.pct}% · {row.count}
						</span>
					</div>
				))}
			</div>
		</Panel>
	);
}

export function Sparkbars({
	title,
	points,
	tone = "bg-brand",
	empty,
}: {
	title: string;
	points: Point[];
	tone?: string;
	empty?: string;
}) {
	const max = points.reduce((n, p) => Math.max(n, p.count), 0);

	return (
		<Panel title={title}>
			{max === 0 ? (
				<p className="text-[13px] text-dim">
					{empty ?? "Nothing in the last 30 days."}
				</p>
			) : (
				<>
					<div className="flex h-24 items-end gap-[3px]">
						{points.map((point) => (
							<span
								key={point.day}
								title={`${point.day} · ${point.count}`}
								className={`flex-1 rounded-t-sm ${tone}`}
								style={{ height: `${Math.max((point.count / max) * 100, 2)}%` }}
							/>
						))}
					</div>
					<div className="mt-2 flex justify-between font-mono text-[11px] text-dim">
						<span>{points[0]?.day}</span>
						<span>{points[points.length - 1]?.day}</span>
					</div>
				</>
			)}
		</Panel>
	);
}

export type SourceRow = { label: string; visitors: number; signups: number };

/** Sources are only interesting next to what they converted into. */
export function SourceTable({
	rows,
	tracking,
	labels,
	empty,
}: {
	rows: SourceRow[];
	tracking: boolean;
	labels?: { title: string; source: string; visitors: string; signups: string; conv: string };
	empty?: string;
}) {
	const t = labels ?? {
		title: "Sources",
		source: "Source",
		visitors: "Visitors",
		signups: "Signups",
		conv: "Conv.",
	};

	return (
		<Panel title={t.title}>
			<table className="w-full border-collapse text-[13px]">
				<thead className="text-[11px] uppercase tracking-[0.1em] text-dim">
					<tr>
						<th className="pb-2 text-left font-medium">{t.source}</th>
						<th className="pb-2 text-right font-medium">{t.visitors}</th>
						<th className="pb-2 text-right font-medium">{t.signups}</th>
						<th className="pb-2 text-right font-medium">{t.conv}</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 && (
						<tr>
							<td className="py-2 text-dim" colSpan={4}>
								{empty ?? "No data yet."}
							</td>
						</tr>
					)}
					{rows.map((row) => (
						<tr key={row.label} className="border-t border-line-soft">
							<td className="py-2 pr-2 text-muted">{row.label}</td>
							<td className="py-2 text-right font-mono text-[12.5px]">
								{tracking ? row.visitors : "—"}
							</td>
							<td className="py-2 text-right font-mono text-[12.5px]">{row.signups}</td>
							<td className="py-2 text-right font-mono text-[12.5px] text-brand-2">
								{row.visitors > 0
									? `${Math.round((row.signups / row.visitors) * 100)}%`
									: "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</Panel>
	);
}

/** Union of the sources people came from and the sources they signed up from. */
export function mergeSources(
	traffic: { sources: Array<{ label: string; visitors: number }> },
	signups: Array<{ label: string; count: number }>,
): SourceRow[] {
	const rows = new Map<string, SourceRow>();
	for (const s of traffic.sources) {
		rows.set(s.label, { label: s.label, visitors: s.visitors, signups: 0 });
	}
	for (const s of signups) {
		const row = rows.get(s.label);
		if (row) row.signups = s.count;
		else rows.set(s.label, { label: s.label, visitors: 0, signups: s.count });
	}
	return [...rows.values()].sort(
		(a, b) => b.visitors - a.visitors || b.signups - a.signups,
	);
}
