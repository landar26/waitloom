/**
 * The whole design surface a founder gets: a template, a theme, an accent and
 * a font. Everything resolves to CSS custom properties set on the page root,
 * so the section components never branch on which template they are inside.
 *
 * Limiting the knobs is the point — the PRD's rule is that a page should not be
 * possible to make ugly.
 */

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const ACCENTS = {
	blue: "#2563eb",
	purple: "#7c3aed",
	green: "#16a34a",
	orange: "#ea580c",
	red: "#e11d48",
} as const;
export type AccentName = keyof typeof ACCENTS;

export const FONTS = {
	modern: {
		label: "Modern",
		body: 'var(--font-geist-sans), ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif',
		weight: { heading: 600, body: 400 },
		tracking: "-0.03em",
	},
	clean: {
		label: "Clean",
		body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "PingFang SC", "Noto Sans SC", sans-serif',
		weight: { heading: 600, body: 400 },
		tracking: "-0.035em",
	},
	developer: {
		label: "Developer",
		body: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
		weight: { heading: 600, body: 400 },
		tracking: "-0.02em",
	},
} as const;
export type FontName = keyof typeof FONTS;

export type Neutrals = {
	bg: string;
	surface: string;
	surface2: string;
	border: string;
	borderSoft: string;
	fg: string;
	muted: string;
	dim: string;
	/** Painted behind the hero only — gradients, glows, grids. */
	heroWash: string;
	shadow: string;
	/** Text that sits on top of a filled accent button. */
	onAccent: string;
};

export type Shape = {
	/** Corner radius for cards and images. */
	radius: string;
	/** Buttons and inputs. */
	control: string;
	border: string;
	align: "left" | "center";
	headingWeight: number;
	/** Multiplier on the base hero heading size. */
	headingScale: number;
	buttonShadow: string;
	/** Rules above the footer and below the header, as in the Dark template. */
	rules: boolean;
};

export type TemplateStyle = {
	theme: Theme;
	shape: Shape;
	vars: Record<string, string>;
};

export function isTheme(value: unknown): value is Theme {
	return value === "light" || value === "dark";
}

export function isAccent(value: unknown): value is AccentName {
	return typeof value === "string" && value in ACCENTS;
}

export function isFont(value: unknown): value is FontName {
	return typeof value === "string" && value in FONTS;
}

/** Accepts a named accent or a `#rrggbb` custom colour. */
export function accentColor(accent: string): string {
	if (isAccent(accent)) return ACCENTS[accent];
	return /^#[0-9a-f]{6}$/i.test(accent) ? accent : ACCENTS.blue;
}

/** Relative luminance, so the label on a button stays readable. */
function readableOn(hex: string): string {
	const value = hex.replace("#", "");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
	const channel = (c: number) =>
		c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	const luminance =
		0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
	return luminance > 0.55 ? "#111111" : "#ffffff";
}

/** `#rrggbb` plus an alpha channel, for washes and soft fills. */
export function alpha(hex: string, a: number): string {
	const value = hex.replace("#", "");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function resolveStyle(input: {
	neutrals: Neutrals;
	shape: Shape;
	theme: Theme;
	accent: string;
	font: FontName;
}): TemplateStyle {
	const { neutrals, shape, theme } = input;
	const accent = accentColor(input.accent);
	const font = FONTS[input.font] ?? FONTS.modern;

	return {
		theme,
		shape,
		vars: {
			"--wl-bg": neutrals.bg,
			"--wl-surface": neutrals.surface,
			"--wl-surface-2": neutrals.surface2,
			"--wl-border": neutrals.border,
			"--wl-border-soft": neutrals.borderSoft,
			"--wl-fg": neutrals.fg,
			"--wl-muted": neutrals.muted,
			"--wl-dim": neutrals.dim,
			"--wl-hero-wash": neutrals.heroWash,
			"--wl-shadow": neutrals.shadow,
			"--wl-accent": accent,
			"--wl-accent-soft": alpha(accent, theme === "dark" ? 0.18 : 0.1),
			"--wl-accent-line": alpha(accent, theme === "dark" ? 0.4 : 0.25),
			"--wl-on-accent": neutrals.onAccent || readableOn(accent),
			"--wl-radius": shape.radius,
			"--wl-control": shape.control,
			"--wl-border-width": shape.border,
			"--wl-button-shadow": shape.buttonShadow,
			"--wl-font": font.body,
			"--wl-tracking": font.tracking,
			"--wl-heading-weight": String(shape.headingWeight || font.weight.heading),
		},
	};
}
