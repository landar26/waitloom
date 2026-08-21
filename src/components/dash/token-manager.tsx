"use client";

import { useState } from "react";
import type { AppDict } from "@/i18n/app";
import type { ApiToken } from "@/lib/tokens";

/**
 * Mint and revoke MCP tokens. The plaintext token comes back once, from the
 * create call, and is never fetchable again — so it lives in this component's
 * state until the founder dismisses it, and nowhere else.
 */
export function TokenManager({
	initialTokens,
	endpoint,
	maxTokens,
	dict,
}: {
	initialTokens: ApiToken[];
	endpoint: string;
	maxTokens: number;
	dict: AppDict;
}) {
	const t = dict.mcp;
	const [tokens, setTokens] = useState(initialTokens);
	const [name, setName] = useState("");
	const [fresh, setFresh] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [revoking, setRevoking] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState<string | null>(null);

	const atLimit = tokens.length >= maxTokens;

	const config = `{
  "mcpServers": {
    "waitloom": {
      "type": "http",
      "url": "${endpoint}",
      "headers": { "Authorization": "Bearer ${fresh ?? "wl_..."}" }
    }
  }
}`;

	const cli = `claude mcp add --transport http waitloom ${endpoint} --header "Authorization: Bearer ${fresh ?? "wl_..."}"`;

	async function copy(key: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(key);
			setTimeout(() => setCopied((k) => (k === key ? null : k)), 1800);
		} catch {
			/* clipboard denied — the text is on screen to select by hand */
		}
	}

	async function create() {
		setCreating(true);
		setError(null);
		try {
			const res = await fetch("/api/tokens", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name: name.trim() }),
			});
			const data = (await res.json().catch(() => null)) as {
				token?: string;
				row?: ApiToken;
				error?: string;
			} | null;

			if (res.status === 403 && data?.error === "token_limit") {
				setError(t.limit.replace("{n}", String(maxTokens)));
				return;
			}
			if (!res.ok || !data?.token || !data.row) throw new Error("create failed");

			setTokens((current) => [data.row!, ...current]);
			setFresh(data.token);
			setName("");
		} catch {
			setError(dict.common.error);
		} finally {
			setCreating(false);
		}
	}

	async function revoke(id: string) {
		setRevoking(id);
		setError(null);
		try {
			const res = await fetch(`/api/tokens/${encodeURIComponent(id)}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("revoke failed");
			setTokens((current) => current.filter((token) => token.id !== id));
		} catch {
			setError(dict.common.error);
		} finally {
			setRevoking(null);
		}
	}

	return (
		<div className="space-y-10">
			<section>
				<h2 className="text-lg font-semibold tracking-tight">{t.tokens}</h2>

				<div className="mt-4 flex flex-wrap items-center gap-2">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={60}
						placeholder={t.namePlaceholder}
						className="min-w-64 flex-1 rounded-lg border border-line bg-ink-2 px-3 py-2 text-[13.5px] outline-none placeholder:text-dim focus:border-dim"
					/>
					<button
						type="button"
						onClick={create}
						disabled={creating || atLimit}
						className="rounded-full bg-brand px-5 py-2.5 text-[14px] font-medium text-[#1a0d05] transition-opacity hover:opacity-90 disabled:opacity-40"
					>
						{creating ? t.creating : t.create}
					</button>
				</div>

				{atLimit && !error && (
					<p className="mt-2 text-[12.5px] text-dim">
						{t.limit.replace("{n}", String(maxTokens))}
					</p>
				)}
				{error && <p className="mt-2 text-[13px] text-brand-2">{error}</p>}

				{fresh && (
					<div className="mt-5 rounded-xl border border-brand/30 bg-brand-dim p-4">
						<p className="text-[13px] font-medium text-brand-2">{t.copyTitle}</p>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-line-soft bg-ink px-3 py-2.5 font-mono text-[12.5px] text-fg">
								{fresh}
							</code>
							<button
								type="button"
								onClick={() => copy("token", fresh)}
								className="rounded-full border border-line px-4 py-2 text-[13px] text-muted transition-colors hover:border-dim hover:text-fg"
							>
								{copied === "token" ? t.copied : t.copy}
							</button>
						</div>
						<button
							type="button"
							onClick={() => setFresh(null)}
							className="mt-3 text-[12.5px] text-dim underline-offset-4 hover:text-muted hover:underline"
						>
							{t.done}
						</button>
					</div>
				)}

				{tokens.length === 0 ? (
					<p className="mt-5 text-[13.5px] text-dim">{t.empty}</p>
				) : (
					<ul className="mt-5 divide-y divide-line-soft rounded-xl border border-line">
						{tokens.map((token) => (
							<li
								key={token.id}
								className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
							>
								<div className="min-w-0">
									<p className="truncate text-[14px]">
										{token.name || (
											<span className="font-mono text-[13px] text-muted">
												{token.prefix}…
											</span>
										)}
									</p>
									<p className="mt-0.5 text-[12px] text-dim">
										<span className="font-mono">{token.prefix}…</span>
										{" · "}
										{t.created.replace("{date}", formatDate(token.created_at))}
										{" · "}
										{token.last_used_at
											? t.lastUsed.replace("{date}", formatDate(token.last_used_at))
											: t.neverUsed}
									</p>
								</div>
								<button
									type="button"
									onClick={() => revoke(token.id)}
									disabled={revoking === token.id}
									className="shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[12.5px] text-muted transition-colors hover:border-brand hover:text-brand-2 disabled:opacity-40"
								>
									{revoking === token.id ? t.revoking : t.revoke}
								</button>
							</li>
						))}
					</ul>
				)}
			</section>

			<section>
				<h2 className="text-lg font-semibold tracking-tight">{t.connect}</h2>
				<p className="mt-2 text-[13.5px] leading-relaxed text-muted">{t.connectHint}</p>

				<div className="mt-4 flex items-start gap-2">
					<pre className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-line bg-ink-2 px-4 py-3.5 font-mono text-[12px] leading-relaxed text-muted">
						{config}
					</pre>
					<button
						type="button"
						onClick={() => copy("config", config)}
						className="shrink-0 rounded-full border border-line px-4 py-2 text-[13px] text-muted transition-colors hover:border-dim hover:text-fg"
					>
						{copied === "config" ? t.copied : t.copy}
					</button>
				</div>

				<p className="mt-5 text-[13px] text-dim">{t.cli}</p>
				<div className="mt-2 flex items-start gap-2">
					<pre className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-line bg-ink-2 px-4 py-3.5 font-mono text-[12px] leading-relaxed text-muted">
						{cli}
					</pre>
					<button
						type="button"
						onClick={() => copy("cli", cli)}
						className="shrink-0 rounded-full border border-line px-4 py-2 text-[13px] text-muted transition-colors hover:border-dim hover:text-fg"
					>
						{copied === "cli" ? t.copied : t.copy}
					</button>
				</div>
			</section>

			<section>
				<h2 className="text-lg font-semibold tracking-tight">{t.tools}</h2>
				<p className="mt-2 font-mono text-[12.5px] leading-relaxed text-dim">
					{t.toolsHint}
				</p>
			</section>
		</div>
	);
}

function formatDate(ms: number): string {
	return new Date(ms).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
