import { SectionHeading } from "./section-heading";
import type { Dict } from "@/i18n/dictionaries";

const CONFIG = `{
  "mcpServers": {
    "waitloom": {
      "type": "http",
      "url": "https://waitloom.app/api/mcp",
      "headers": { "Authorization": "Bearer wl_..." }
    }
  }
}`;

export function McpSection({ dict }: { dict: Dict }) {
	return (
		<section id="mcp" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
			<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
				<div>
					<SectionHeading
						eyebrow={dict.mcp.eyebrow}
						title={dict.mcp.title}
					/>
					<p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
						{dict.mcp.body}
					</p>
					<ul className="mt-6 space-y-3">
						{dict.mcp.bullets.map((b, i) => (
							<li key={b} className="flex gap-3 text-[14px] text-muted">
								<span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
								<span className={i === 0 ? "font-mono text-[13px]" : ""}>
									{b}
								</span>
							</li>
						))}
					</ul>
				</div>

				<div className="overflow-hidden rounded-2xl border border-line bg-ink-2">
					<div className="flex items-center gap-2 border-b border-line-soft px-4 py-3">
						<span className="h-2.5 w-2.5 rounded-full bg-line" />
						<span className="h-2.5 w-2.5 rounded-full bg-line" />
						<span className="h-2.5 w-2.5 rounded-full bg-line" />
						<span className="ml-2 font-mono text-[11.5px] text-dim">
							claude code
						</span>
						<span className="ml-auto rounded-full border border-brand/30 bg-brand-dim px-2 py-0.5 text-[10.5px] font-medium text-brand-2">
							{dict.mcp.badge}
						</span>
					</div>

					<div className="space-y-3 px-4 py-5 font-mono text-[12.5px] leading-relaxed sm:px-5">
						<p className="text-muted">
							<span className="text-brand">›</span> create a pre-launch page
							for Filevia
						</p>
						<p className="text-dim">
							<span className="text-brand-2">✔</span> waitloom·create_project
							— <span className="text-fg">Filevia</span>, template{" "}
							<span className="text-fg">apple</span>
						</p>
						<p className="text-dim">
							<span className="text-brand-2">✔</span> waitloom·publish —{" "}
							<span className="text-fg">filevia.waitloom.app</span>
						</p>
						<p className="text-muted">
							<span className="text-brand">›</span> how many signups today?
						</p>
						<p className="text-dim">
							<span className="text-brand-2">✔</span> waitloom·list_subscribers
							— <span className="text-fg">103 total</span>, +12 today, 8.0%
							conversion
						</p>
					</div>

					<div className="border-t border-line-soft px-4 pb-5 pt-4 sm:px-5">
						<p className="text-[12.5px] text-dim">{dict.mcp.note}</p>
						<pre className="mt-3 overflow-x-auto rounded-xl border border-line-soft bg-ink px-4 py-3.5 font-mono text-[12px] leading-relaxed text-muted">
							{CONFIG}
						</pre>
					</div>
				</div>
			</div>
		</section>
	);
}
