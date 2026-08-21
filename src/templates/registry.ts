import type { AccentName, FontName, Neutrals, Shape, Theme } from "./style";

/**
 * Six templates. Each one is a pair of neutral palettes (light and dark) plus
 * a shape, which is all the section components need — the visual identity of a
 * template lives in its numbers, not in bespoke markup. `hero` names the one
 * flourish a template gets on top of that.
 */

export type HeroVariant =
	| "plain"
	| "spotlight"
	| "terminal"
	| "gradientText"
	| "blobs";

export type TemplateSpec = {
	id: string;
	name: string;
	/** Product types the template suits, for the picker. */
	forEn: string;
	forZh: string;
	hero: HeroVariant;
	defaults: { theme: Theme; accent: AccentName; font: FontName };
	shape: Shape;
	neutrals: Record<Theme, Neutrals>;
};

const SHARED: Pick<Shape, "buttonShadow" | "rules"> = {
	buttonShadow: "none",
	rules: false,
};

export const TEMPLATES: TemplateSpec[] = [
	{
		id: "minimal",
		name: "Minimal",
		forEn: "SaaS · Productivity · Micro SaaS",
		forZh: "SaaS · 效率工具 · 小型 SaaS",
		hero: "plain",
		defaults: { theme: "light", accent: "blue", font: "modern" },
		shape: {
			...SHARED,
			radius: "12px",
			control: "999px",
			border: "1px",
			align: "left",
			headingWeight: 600,
			headingScale: 1,
		},
		neutrals: {
			light: {
				bg: "#ffffff",
				surface: "#fafafa",
				surface2: "#f4f4f5",
				border: "#e6e6e6",
				borderSoft: "#efefef",
				fg: "#111111",
				muted: "#6b6b6b",
				dim: "#8a8a8a",
				heroWash: "none",
				shadow: "0 1px 2px rgba(0,0,0,0.04)",
				onAccent: "",
			},
			dark: {
				bg: "#0b0b0d",
				surface: "#121215",
				surface2: "#17171b",
				border: "#26262b",
				borderSoft: "#1d1d21",
				fg: "#f4f4f5",
				muted: "#a1a1aa",
				dim: "#71717a",
				heroWash: "none",
				shadow: "0 1px 2px rgba(0,0,0,0.5)",
				onAccent: "",
			},
		},
	},
	{
		id: "apple",
		name: "Apple",
		forEn: "iOS · macOS · Consumer app",
		forZh: "iOS · macOS · 消费级应用",
		hero: "spotlight",
		defaults: { theme: "light", accent: "blue", font: "clean" },
		shape: {
			...SHARED,
			radius: "18px",
			control: "999px",
			border: "1px",
			align: "center",
			headingWeight: 600,
			headingScale: 1.12,
		},
		neutrals: {
			light: {
				bg: "#fbfbfd",
				surface: "#ffffff",
				surface2: "#f5f5f7",
				border: "#dcdce0",
				borderSoft: "#e8e8ed",
				fg: "#1d1d1f",
				muted: "#6e6e73",
				dim: "#86868b",
				// Fades to transparent rather than to a flat colour: a gradient that
				// stops at a different value than the page draws a hard band.
				heroWash:
					"linear-gradient(180deg, rgba(20,20,32,0.055) 0%, rgba(20,20,32,0) 100%)",
				shadow: "0 18px 48px rgba(0,0,0,0.10)",
				onAccent: "",
			},
			dark: {
				bg: "#000000",
				surface: "#1c1c1e",
				surface2: "#2c2c2e",
				border: "#3a3a3c",
				borderSoft: "#2c2c2e",
				fg: "#f5f5f7",
				muted: "#a1a1a6",
				dim: "#86868b",
				heroWash:
					"linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)",
				shadow: "0 18px 48px rgba(0,0,0,0.6)",
				onAccent: "",
			},
		},
	},
	{
		id: "developer",
		name: "Developer",
		forEn: "API · CLI · Developer tool · Open source",
		forZh: "API · CLI · 开发者工具 · 开源项目",
		hero: "terminal",
		defaults: { theme: "dark", accent: "green", font: "developer" },
		shape: {
			...SHARED,
			radius: "6px",
			control: "6px",
			border: "1px",
			align: "left",
			headingWeight: 600,
			headingScale: 0.92,
		},
		neutrals: {
			light: {
				bg: "#ffffff",
				surface: "#f6f8fa",
				surface2: "#eaeef2",
				border: "#d0d7de",
				borderSoft: "#e4e8ec",
				fg: "#1f2328",
				muted: "#59636e",
				dim: "#818b98",
				heroWash: "none",
				shadow: "0 1px 0 rgba(31,35,40,0.04)",
				onAccent: "",
			},
			dark: {
				bg: "#0d1117",
				surface: "#161b22",
				surface2: "#1c2129",
				border: "#21262d",
				borderSoft: "#1b2027",
				fg: "#e6edf3",
				muted: "#8b949e",
				dim: "#6e7681",
				heroWash: "none",
				shadow: "0 1px 0 rgba(0,0,0,0.4)",
				onAccent: "#ffffff",
			},
		},
	},
	{
		id: "ai",
		name: "AI",
		forEn: "AI SaaS · Agent · AI tool",
		forZh: "AI SaaS · Agent · AI 工具",
		hero: "gradientText",
		defaults: { theme: "dark", accent: "purple", font: "modern" },
		shape: {
			...SHARED,
			radius: "14px",
			control: "999px",
			border: "1px",
			align: "center",
			headingWeight: 600,
			headingScale: 1.05,
		},
		neutrals: {
			light: {
				bg: "#ffffff",
				surface: "#faf8ff",
				surface2: "#f3efff",
				border: "#e7e0f7",
				borderSoft: "#efeaf9",
				fg: "#160f28",
				muted: "#5b5372",
				dim: "#847ba0",
				heroWash:
					"radial-gradient(48% 46% at 50% 0%, rgba(124,58,237,0.16), transparent 72%)",
				shadow: "0 20px 60px rgba(88,44,180,0.12)",
				onAccent: "",
			},
			dark: {
				bg: "#0b0716",
				surface: "#120c24",
				surface2: "#1a1233",
				border: "#2a2244",
				borderSoft: "#201936",
				fg: "#e7e3f5",
				muted: "#a79fc4",
				dim: "#7d75a0",
				heroWash:
					"radial-gradient(48% 52% at 50% 0%, rgba(139,92,246,0.38), transparent 72%)",
				shadow: "0 24px 70px rgba(0,0,0,0.55)",
				onAccent: "#ffffff",
			},
		},
	},
	{
		id: "dark",
		name: "Dark",
		forEn: "Developer · AI · Security",
		forZh: "开发者 · AI · 安全",
		hero: "plain",
		defaults: { theme: "dark", accent: "blue", font: "modern" },
		shape: {
			...SHARED,
			radius: "4px",
			control: "4px",
			border: "1px",
			align: "left",
			headingWeight: 500,
			headingScale: 0.96,
			rules: true,
		},
		neutrals: {
			light: {
				bg: "#ffffff",
				surface: "#ffffff",
				surface2: "#f7f7f7",
				border: "#e4e4e4",
				borderSoft: "#efefef",
				fg: "#000000",
				muted: "#5a5a5a",
				dim: "#8a8a8a",
				heroWash: "none",
				shadow: "none",
				onAccent: "",
			},
			dark: {
				bg: "#000000",
				surface: "#0a0a0a",
				surface2: "#111111",
				border: "#242424",
				borderSoft: "#1a1a1a",
				fg: "#ffffff",
				muted: "#8a8a8a",
				dim: "#5a5a5a",
				heroWash: "none",
				shadow: "none",
				onAccent: "",
			},
		},
	},
	{
		id: "playful",
		name: "Playful",
		forEn: "Consumer app · Social · Game",
		forZh: "消费级应用 · 社交 · 游戏",
		hero: "blobs",
		defaults: { theme: "light", accent: "red", font: "modern" },
		shape: {
			radius: "20px",
			control: "999px",
			border: "2px",
			align: "left",
			headingWeight: 800,
			headingScale: 1.06,
			buttonShadow: "0 4px 0 rgba(0,0,0,0.28)",
			rules: false,
		},
		neutrals: {
			light: {
				bg: "#fff3e6",
				surface: "#ffffff",
				surface2: "#fff8ef",
				border: "#2b1a12",
				borderSoft: "#f0dcc6",
				fg: "#2b1a12",
				muted: "#7a5c4c",
				dim: "#9c7f6d",
				heroWash: "none",
				shadow: "0 6px 0 rgba(43,26,18,0.12)",
				onAccent: "#ffffff",
			},
			dark: {
				bg: "#221410",
				surface: "#2e1c16",
				surface2: "#38231c",
				border: "#ffd166",
				borderSoft: "#4a2f24",
				fg: "#fff3e6",
				muted: "#d3b49f",
				dim: "#a98a76",
				heroWash: "none",
				shadow: "0 6px 0 rgba(0,0,0,0.35)",
				onAccent: "#ffffff",
			},
		},
	},
];

export const DEFAULT_TEMPLATE_ID = "minimal";

export function getTemplate(id: string | null | undefined): TemplateSpec {
	return (
		TEMPLATES.find((t) => t.id === id) ??
		TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)!
	);
}

export function isTemplateId(value: unknown): boolean {
	return typeof value === "string" && TEMPLATES.some((t) => t.id === value);
}
