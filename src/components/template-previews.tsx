"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Six miniature landing pages, rendered in plain HTML + CSS.
 * No image assets: they cost nothing to load and stay editable.
 */

function Dots({ color }: { color: string }) {
	return (
		<div className="flex gap-1.5">
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					className="rounded-full h-2 w-2"
					style={{ background: color }}
				/>
			))}
		</div>
	);
}

function FakeUi({
	bg,
	line,
	accent,
	sidebar,
}: {
	bg: string;
	line: string;
	accent: string;
	sidebar?: string;
}) {
	return (
		<div className="flex h-full w-full gap-2.5 p-3" style={{ background: bg }}>
			<div
				className="hidden w-[16%] flex-col gap-1.5 rounded-md p-1.5 flex"
				style={{ background: sidebar ?? "transparent" }}
			>
				<span className="h-1.5 w-[85%] rounded-full" style={{ background: accent }} />
				<span className="h-1.5 w-[65%] rounded-full" style={{ background: line }} />
				<span className="h-1.5 w-[72%] rounded-full" style={{ background: line }} />
				<span className="h-1.5 w-[55%] rounded-full" style={{ background: line }} />
			</div>
			<div className="flex flex-1 flex-col gap-2">
				<span className="h-2 w-[32%] rounded-full" style={{ background: accent }} />
				<span className="h-1.5 w-[62%] rounded-full" style={{ background: line }} />
				<span className="h-1.5 w-[48%] rounded-full" style={{ background: line }} />
				<div className="mt-auto flex gap-2">
					{[0, 1, 2].map((i) => (
						<span
							key={i}
							className="flex-1 rounded-md h-8"
							style={{ background: line, opacity: 1 - i * 0.22 }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function Minimal() {
	return (
		<div className="flex h-full flex-col bg-white text-[#111] px-10 py-8">
			<div className="flex items-center justify-between">
				<span className="font-semibold tracking-tight text-[13px]">
					Filevia
				</span>
				<span className="rounded-full bg-[#111] px-2.5 py-1 font-medium text-white text-[10px]">
					Join waitlist
				</span>
			</div>
			<div className="flex flex-1 flex-col justify-center">
				<p className="font-medium text-[#8a8a8a] text-[11.5px]">
					Coming this spring
				</p>
				<h3 className="mt-2 font-semibold leading-[1.1] tracking-[-0.03em] text-[30px]">
					Move files.
					<br />
					Without the friction.
				</h3>
				<p className="mt-3 max-w-[70%] leading-relaxed text-[#6b6b6b] text-[11.5px]">
					The fastest way to move files between all of your devices.
				</p>
				<div className="mt-5 flex items-center gap-2">
					<div className="w-[45%] rounded-full border border-[#e2e2e2] bg-[#fafafa] h-8" />
					<div className="rounded-full bg-[#111] h-8 px-4">
						<span className="flex h-full items-center font-medium text-white text-[10px]">
							Get early access
						</span>
					</div>
				</div>
			</div>
			<div className="h-[30%] overflow-hidden rounded-t-xl border border-b-0 border-[#ececec]">
				<FakeUi bg="#fafafa" line="#e6e6e6" accent="#111" sidebar="#f2f2f2" />
			</div>
		</div>
	);
}

function Apple() {
	return (
		<div className="flex h-full flex-col items-center bg-gradient-to-b from-[#fbfbfd] to-[#f0f0f4] text-center text-[#1d1d1f] px-10 py-8">
			<div className="flex w-full items-center justify-between">
				<span className="font-medium tracking-tight text-[13px]">
					Halo
				</span>
				<span className="text-[#0071e3] text-[10px]">
					Join the waitlist ›
				</span>
			</div>
			<div className="flex flex-1 flex-col items-center justify-center">
				<h3 className="font-semibold leading-[1.05] tracking-[-0.035em] text-[34px]">
					Focus,
					<br />
					beautifully.
				</h3>
				<p className="mt-3 max-w-[78%] leading-relaxed text-[#6e6e73] text-[11.5px]">
					A calmer way to plan your day on Mac and iPhone.
				</p>
				<div className="mt-4 rounded-full bg-[#0071e3] font-medium text-white px-5 py-2 text-[10.5px]">
					Get early access
				</div>
			</div>
			<div className="h-[30%] w-[68%] overflow-hidden rounded-t-[14px] border border-b-0 border-[#dcdce0] bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
				<FakeUi bg="#ffffff" line="#e8e8ed" accent="#0071e3" sidebar="#f5f5f7" />
			</div>
		</div>
	);
}

function Developer() {
	return (
		<div className="flex h-full flex-col bg-[#0d1117] font-mono text-[#c9d1d9] px-10 py-8">
			<div className="flex items-center justify-between">
				<span className="font-medium text-white text-[12.5px]">
					relay<span className="text-[#3fb950]">/</span>cli
				</span>
				<span className="text-[#8b949e] text-[10px]">
					docs · github
				</span>
			</div>
			<div className="flex flex-1 flex-col justify-center">
				<h3 className="font-semibold leading-[1.15] tracking-[-0.02em] text-white text-[24px]">
					Deploy from
					<br />
					the terminal.
				</h3>
				<div className="mt-4 rounded-md border border-[#21262d] bg-[#161b22] px-4 py-3">
					<p className="text-[10.5px]">
						<span className="text-[#3fb950]">$</span> npx relay deploy
					</p>
					<p className="mt-1 text-[#8b949e] text-[10.5px]">
						✔ live in 2.4s
					</p>
				</div>
				<div className="mt-4 flex items-center gap-2">
					<div className="w-[45%] rounded-md border border-[#21262d] bg-[#161b22] h-7" />
					<div className="flex items-center rounded-md bg-[#238636] px-3 font-medium text-white h-7 text-[10px]">
						Join waitlist
					</div>
				</div>
			</div>
			<p className="text-[#484f58] text-[9.5px]">
				MIT licensed · 1.2k stars
			</p>
		</div>
	);
}

function Ai() {
	return (
		<div className="relative flex h-full flex-col overflow-hidden bg-[#0b0716] text-[#e7e3f5] px-10 py-8">
			<div
				className="pointer-events-none absolute inset-x-0 -top-16 h-56"
				style={{
					background:
						"radial-gradient(45% 60% at 50% 0%, rgba(139,92,246,0.45), transparent 70%)",
				}}
			/>
			<div className="relative flex items-center justify-between">
				<span className="font-semibold tracking-tight text-white text-[13px]">
					Prism
				</span>
				<span className="rounded-full border border-[#3a2d5f] px-2.5 py-1 text-[#c4b5fd] text-[10px]">
					Early access
				</span>
			</div>
			<div className="relative flex flex-1 flex-col items-center justify-center text-center">
				<h3
					className="font-semibold leading-[1.1] tracking-[-0.03em] text-[29px]"
					style={{
						background: "linear-gradient(100deg,#fff 20%,#a78bfa 90%)",
						WebkitBackgroundClip: "text",
						backgroundClip: "text",
						color: "transparent",
					}}
				>
					Your research,
					<br />
					summarized.
				</h3>
				<p className="mt-3 max-w-[76%] leading-relaxed text-[#a79fc4] text-[11.5px]">
					An agent that reads every paper so you don&apos;t have to.
				</p>
				<div className="mt-4 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] font-medium text-white px-5 py-2 text-[10.5px]">
					Request access
				</div>
			</div>
			<div className="relative h-[26%] overflow-hidden rounded-t-xl border border-b-0 border-[#2a2244]">
				<FakeUi bg="#120c24" line="#241b3f" accent="#8b5cf6" sidebar="#1a1233" />
			</div>
		</div>
	);
}

function Dark() {
	return (
		<div className="flex h-full flex-col bg-black text-white px-10 py-8">
			<div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
				<span className="font-medium tracking-tight text-[13px]">
					Vaultline
				</span>
				<span className="text-[#7a7a7a] text-[10px]">
					security · pricing
				</span>
			</div>
			<div className="flex flex-1 flex-col justify-center">
				<h3 className="font-medium leading-[1.12] tracking-[-0.03em] text-[28px]">
					Secrets that
					<br />
					never leave.
				</h3>
				<p className="mt-3 max-w-[68%] leading-relaxed text-[#8a8a8a] text-[11.5px]">
					End-to-end encrypted secret management for small teams.
				</p>
				<div className="mt-5 flex items-center gap-2">
					<div className="w-[45%] rounded-sm border border-[#242424] h-8" />
					<div className="flex items-center rounded-sm bg-white font-semibold text-black h-8 px-4 text-[10px]">
						Join waitlist
					</div>
				</div>
			</div>
			<div className="flex gap-4 border-t border-[#1a1a1a] pt-3 text-[#5a5a5a] text-[9.5px]">
				<span>SOC 2 in progress</span>
				<span>Zero knowledge</span>
			</div>
		</div>
	);
}

function Playful() {
	return (
		<div className="relative flex h-full flex-col overflow-hidden bg-[#fff3e6] text-[#2b1a12] px-10 py-8">
			<div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ffd166] opacity-70" />
			<div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-[#ff8fab] opacity-60" />
			<div className="relative flex items-center justify-between">
				<span className="font-extrabold tracking-tight text-[13.5px]">
					Bloop
				</span>
				<span className="rounded-full bg-[#2b1a12] px-2.5 py-1 font-bold text-[#fff3e6] text-[10px]">
					Get it first
				</span>
			</div>
			<div className="relative flex flex-1 flex-col justify-center">
				<h3 className="font-extrabold leading-[1.05] tracking-[-0.03em] text-[31px]">
					Group chats,
					<br />
					but fun again.
				</h3>
				<p className="mt-3 max-w-[70%] font-medium leading-relaxed text-[#7a5c4c] text-[11.5px]">
					Tiny rooms for the six people you actually text.
				</p>
				<div className="mt-4 w-fit rounded-full bg-[#ff5d5d] font-bold text-white shadow-[0_3px_0_#c93c3c] px-5 py-2 text-[10.5px]">
					Join the waitlist
				</div>
			</div>
			<div className="relative h-[24%] overflow-hidden rounded-t-2xl border-2 border-b-0 border-[#2b1a12] bg-white">
				<FakeUi bg="#ffffff" line="#ffe0c2" accent="#ff5d5d" sidebar="#fff6ec" />
			</div>
		</div>
	);
}

const PREVIEWS: Record<string, () => React.JSX.Element> = {
	minimal: Minimal,
	apple: Apple,
	developer: Developer,
	ai: Ai,
	dark: Dark,
	playful: Playful,
};

const URLS: Record<string, string> = {
	minimal: "filevia.waitloom.app",
	apple: "halo.waitloom.app",
	developer: "relay.waitloom.app",
	ai: "prism.waitloom.app",
	dark: "vaultline.waitloom.app",
	playful: "bloop.waitloom.app",
};

const DESIGN_WIDTH = 760;
const DESIGN_HEIGHT = 428;

/** Renders the mini page at a fixed design size and scales it down to fit. */
function ScaledPage({ children }: { children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const update = () => setScale(el.clientWidth / DESIGN_WIDTH);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className="w-full overflow-hidden"
			style={{ height: DESIGN_HEIGHT * scale }}
		>
			<div
				style={{
					width: DESIGN_WIDTH,
					height: DESIGN_HEIGHT,
					transform: `scale(${scale})`,
					transformOrigin: "top left",
				}}
			>
				{children}
			</div>
		</div>
	);
}

export function TemplatePreview({ id }: { id: string }) {
	const Preview = PREVIEWS[id] ?? Minimal;
	const isLight = id === "minimal" || id === "apple" || id === "playful";

	return (
		<div className="overflow-hidden rounded-xl border border-line bg-ink-2 sm:rounded-2xl">
			<div className="flex items-center gap-3 border-b border-line-soft bg-ink-3 px-3.5 py-2.5 sm:px-4">
				<Dots color={isLight ? "#3a3a42" : "#2c2c33"} />
				<div className="mx-auto w-[58%] rounded-full bg-ink px-3 py-1 text-center font-mono text-[9.5px] text-dim sm:text-[11px]">
					{URLS[id]}
				</div>
			</div>
			<ScaledPage>
				<Preview />
			</ScaledPage>
		</div>
	);
}
