export function SectionHeading({
	eyebrow,
	title,
	subtitle,
	align = "left",
}: {
	eyebrow: string;
	title: string;
	subtitle?: string;
	align?: "left" | "center";
}) {
	return (
		<div className={align === "center" ? "text-center" : ""}>
			<p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-brand">
				{eyebrow}
			</p>
			<h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-[2.4rem] sm:leading-[1.15]">
				{title}
			</h2>
			{subtitle && (
				<p
					className={`mt-3 max-w-xl text-[15.5px] leading-relaxed text-muted ${
						align === "center" ? "mx-auto" : ""
					}`}
				>
					{subtitle}
				</p>
			)}
		</div>
	);
}
