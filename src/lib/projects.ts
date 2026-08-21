import { PRODUCT_TYPES, type Lang } from "@/i18n/dictionaries";
import {
	DEFAULT_SECTIONS,
	defaultContent,
	isLangCode,
	parseContent,
	parseSections,
	parseTranslations,
	sanitizeContent,
	sanitizeSections,
	sanitizeTranslations,
	type ProjectContent,
	type SectionId,
	type Translations,
} from "./content";
import { clampText } from "./validation";
import { isValidSlug, slugify } from "./host";
import { getTemplate, isTemplateId } from "@/templates/registry";
import { isAccent, isFont, isTheme } from "@/templates/style";

export type ProjectStatus = "draft" | "published";

export type ProjectRow = {
	id: string;
	user_id: string;
	name: string;
	slug: string;
	description: string;
	product_type: string;
	template_id: string;
	theme: string;
	accent: string;
	font: string;
	lang: string;
	status: ProjectStatus;
	custom_domain: string | null;
	content: string;
	sections: string;
	/** JSON: a ProjectContent per language other than `lang`. */
	translations: string;
	created_at: number;
	updated_at: number;
	published_at: number | null;
};

/** A row with its JSON columns already parsed — what the UI actually wants. */
export type Project = Omit<ProjectRow, "content" | "sections" | "translations"> & {
	content: ProjectContent;
	sections: SectionId[];
	translations: Translations;
};

export type QuestionType = "short_text" | "single_choice" | "multi_choice";

export type QuestionRow = {
	id: string;
	project_id: string;
	title: string;
	type: QuestionType;
	options: string;
	required: number;
	sort_order: number;
	/** JSON: `{ zh: { title, options } }` for languages other than the page's. */
	translations: string;
};

/** A question's wording in one non-primary language. */
export type QuestionTranslation = { title: string; options: string[] };
export type QuestionTranslations = Partial<Record<Lang, QuestionTranslation>>;

export type Question = {
	id: string;
	title: string;
	type: QuestionType;
	options: string[];
	required: boolean;
	translations: QuestionTranslations;
};

export const MAX_QUESTIONS = 3;

const COLUMNS =
	"id, user_id, name, slug, description, product_type, template_id, theme, accent, font, lang, status, custom_domain, content, sections, translations, created_at, updated_at, published_at";

export function hydrate(row: ProjectRow): Project {
	return {
		...row,
		content: parseContent(row.content),
		sections: parseSections(row.sections),
		translations: parseTranslations(row.translations, row.lang),
	};
}

export async function getProjectById(
	db: D1Database,
	id: string,
): Promise<Project | null> {
	const row = await db
		.prepare(`SELECT ${COLUMNS} FROM projects WHERE id = ?`)
		.bind(id)
		.first<ProjectRow>();
	return row ? hydrate(row) : null;
}

/** The project behind a published slug, or null when it is a draft. */
export async function getPublishedProject(
	db: D1Database,
	slug: string,
): Promise<Project | null> {
	const row = await db
		.prepare(`SELECT ${COLUMNS} FROM projects WHERE slug = ? AND status = 'published'`)
		.bind(slug)
		.first<ProjectRow>();
	return row ? hydrate(row) : null;
}

/** Ownership check and fetch in one call — every write path starts here. */
export async function getOwnedProject(
	db: D1Database,
	id: string,
	userId: string,
): Promise<Project | null> {
	const project = await getProjectById(db, id);
	if (!project || project.user_id !== userId) return null;
	return project;
}

export async function listProjects(
	db: D1Database,
	userId: string,
): Promise<Project[]> {
	const { results } = await db
		.prepare(`SELECT ${COLUMNS} FROM projects WHERE user_id = ? ORDER BY created_at DESC`)
		.bind(userId)
		.all<ProjectRow>();
	return (results ?? []).map(hydrate);
}

export async function countProjects(
	db: D1Database,
	userId: string,
): Promise<number> {
	const row = await db
		.prepare("SELECT COUNT(*) AS n FROM projects WHERE user_id = ?")
		.bind(userId)
		.first<{ n: number }>();
	return Number(row?.n ?? 0);
}

export async function slugTaken(
	db: D1Database,
	slug: string,
	exceptId?: string,
): Promise<boolean> {
	const row = await db
		.prepare("SELECT id FROM projects WHERE slug = ?")
		.bind(slug)
		.first<{ id: string }>();
	return Boolean(row) && row!.id !== exceptId;
}

/**
 * A free slug near the one the name suggests. Falls back to a numeric suffix
 * rather than making the founder guess what is available.
 */
export async function availableSlug(
	db: D1Database,
	name: string,
): Promise<string> {
	const base = slugify(name) || `page-${crypto.randomUUID().slice(0, 6)}`;

	if (isValidSlug(base) && !(await slugTaken(db, base))) return base;

	for (let i = 2; i < 40; i++) {
		const candidate = `${base.slice(0, 26)}-${i}`;
		if (isValidSlug(candidate) && !(await slugTaken(db, candidate))) return candidate;
	}
	return `page-${crypto.randomUUID().slice(0, 8)}`;
}

export type CreateInput = {
	userId: string;
	name: string;
	description: string;
	productType: string;
	templateId: string;
};

export async function createProject(
	db: D1Database,
	input: CreateInput,
): Promise<Project> {
	const spec = getTemplate(input.templateId);
	const name = clampText(input.name, 60) ?? "Untitled";
	const description = clampText(input.description, 160) ?? "";
	const productType = (PRODUCT_TYPES as readonly string[]).includes(input.productType)
		? input.productType
		: "other";

	const now = Date.now();
	const row: ProjectRow = {
		id: crypto.randomUUID(),
		user_id: input.userId,
		name,
		slug: await availableSlug(db, name),
		description,
		product_type: productType,
		template_id: spec.id,
		theme: spec.defaults.theme,
		accent: spec.defaults.accent,
		font: spec.defaults.font,
		lang: "en",
		status: "draft",
		custom_domain: null,
		content: JSON.stringify(defaultContent(name, description, productType)),
		sections: JSON.stringify(DEFAULT_SECTIONS),
		translations: "{}",
		created_at: now,
		updated_at: now,
		published_at: null,
	};

	await db
		.prepare(
			`INSERT INTO projects
				(id, user_id, name, slug, description, product_type, template_id, theme, accent, font,
				 lang, status, custom_domain, content, sections, translations, created_at, updated_at,
				 published_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			row.id, row.user_id, row.name, row.slug, row.description, row.product_type,
			row.template_id, row.theme, row.accent, row.font, row.lang, row.status,
			row.custom_domain, row.content, row.sections, row.translations, row.created_at,
			row.updated_at, row.published_at,
		)
		.run();

	return hydrate(row);
}

export type PatchInput = Partial<{
	name: unknown;
	description: unknown;
	slug: unknown;
	templateId: unknown;
	theme: unknown;
	accent: unknown;
	font: unknown;
	lang: unknown;
	content: unknown;
	translations: unknown;
	sections: unknown;
}>;

/**
 * Applies whichever fields the editor sent. Anything unrecognised is dropped
 * rather than rejected: an autosave should never fail over one bad key.
 */
export async function updateProject(
	db: D1Database,
	project: Project,
	patch: PatchInput,
): Promise<{ project: Project } | { error: "slug_taken" | "slug_invalid" }> {
	const set: string[] = [];
	const values: unknown[] = [];
	const next: Project = { ...project };

	const put = (column: string, value: unknown) => {
		set.push(`${column} = ?`);
		values.push(value);
	};

	if (typeof patch.name === "string") {
		next.name = clampText(patch.name, 60) ?? project.name;
		put("name", next.name);
	}

	if (typeof patch.description === "string") {
		next.description = clampText(patch.description, 160) ?? "";
		put("description", next.description);
	}

	if (typeof patch.slug === "string" && patch.slug !== project.slug) {
		const slug = patch.slug.trim().toLowerCase();
		if (!isValidSlug(slug)) return { error: "slug_invalid" };
		if (await slugTaken(db, slug, project.id)) return { error: "slug_taken" };
		next.slug = slug;
		put("slug", slug);
	}

	if (isTemplateId(patch.templateId)) {
		next.template_id = patch.templateId as string;
		put("template_id", next.template_id);
	}

	if (isTheme(patch.theme)) put("theme", (next.theme = patch.theme));
	if (isFont(patch.font)) put("font", (next.font = patch.font));

	if (
		typeof patch.accent === "string" &&
		(isAccent(patch.accent) || /^#[0-9a-f]{6}$/i.test(patch.accent))
	) {
		next.accent = patch.accent.toLowerCase();
		put("accent", next.accent);
	}

	// Settled before content and translations, because `lang` is what says which
	// language `content` is written in.
	if (isLangCode(patch.lang)) {
		next.lang = patch.lang;
		put("lang", next.lang);
	}

	// Switching the primary language on its own — what the settings page does —
	// swaps the two documents over, so the founder keeps the copy they wrote in
	// each language instead of finding it under the wrong label. The editor sends
	// a whole draft it has already swapped itself, and those documents win.
	if (
		next.lang !== project.lang &&
		patch.content === undefined &&
		patch.translations === undefined
	) {
		const promoted = project.translations[next.lang as Lang];
		if (promoted) {
			next.content = promoted;
			next.translations = { ...project.translations, [project.lang]: project.content };
			delete next.translations[next.lang as Lang];
			put("content", JSON.stringify(next.content));
			put("translations", JSON.stringify(next.translations));
		}
		// The questions are stored in their own table and saved through their own
		// endpoint, so nothing else in this request would move them.
		await swapQuestionLanguages(db, project.id, project.lang, next.lang);
	}

	if (patch.content !== undefined) {
		next.content = sanitizeContent(patch.content);
		put("content", JSON.stringify(next.content));
	}

	if (patch.translations !== undefined) {
		next.translations = sanitizeTranslations(patch.translations, next.lang);
		put("translations", JSON.stringify(next.translations));
	}

	if (patch.sections !== undefined) {
		next.sections = sanitizeSections(patch.sections);
		put("sections", JSON.stringify(next.sections));
	}

	if (set.length === 0) return { project };

	next.updated_at = Date.now();
	put("updated_at", next.updated_at);
	values.push(project.id);

	await db
		.prepare(`UPDATE projects SET ${set.join(", ")} WHERE id = ?`)
		.bind(...values)
		.run();

	return { project: next };
}

/**
 * Carries every question's wording across when a page changes which language is
 * primary, so `title` and `options` keep meaning "as the page's own language
 * words it" — the same move `updateProject` makes for the page document.
 */
async function swapQuestionLanguages(
	db: D1Database,
	projectId: string,
	from: string,
	to: string,
): Promise<void> {
	const questions = await getQuestions(db, projectId);
	if (questions.length === 0) return;

	await db.batch(
		questions.map((question) => {
			const promoted = isLangCode(to) ? question.translations[to] : undefined;
			const translations = { ...question.translations };
			if (isLangCode(to)) delete translations[to];
			// Without a translation to promote, the wording is simply relabelled.
			if (promoted && isLangCode(from)) {
				translations[from] = { title: question.title, options: question.options };
			}

			return db
				.prepare("UPDATE questions SET title = ?, options = ?, translations = ? WHERE id = ?")
				.bind(
					promoted?.title || question.title,
					JSON.stringify(
						question.options.map((option, i) => promoted?.options[i] || option),
					),
					JSON.stringify(translations),
					question.id,
				);
		}),
	);
}

export async function setPublished(
	db: D1Database,
	projectId: string,
	published: boolean,
): Promise<void> {
	const now = Date.now();
	await db
		.prepare(
			// published_at records the *first* publish, so "time to publish" stays
			// measurable after an unpublish/republish cycle.
			`UPDATE projects
			 SET status = ?, updated_at = ?, published_at = COALESCE(published_at, ?)
			 WHERE id = ?`,
		)
		.bind(published ? "published" : "draft", now, published ? now : null, projectId)
		.run();
}

export async function deleteProject(db: D1Database, projectId: string): Promise<void> {
	await db.prepare("DELETE FROM projects WHERE id = ?").bind(projectId).run();
}

export async function getQuestions(
	db: D1Database,
	projectId: string,
): Promise<Question[]> {
	const { results } = await db
		.prepare(
			"SELECT id, title, type, options, required, translations FROM questions WHERE project_id = ? ORDER BY sort_order",
		)
		.bind(projectId)
		.all<QuestionRow>();

	return (results ?? []).map((row) => ({
		id: row.id,
		title: row.title,
		type: row.type,
		options: parseOptions(row.options),
		required: Boolean(row.required),
		translations: parseQuestionTranslations(row.translations),
	}));
}

function parseQuestionTranslations(raw: string | null): QuestionTranslations {
	try {
		return sanitizeQuestionTranslations(JSON.parse(raw ?? "{}"));
	} catch {
		return {};
	}
}

export function sanitizeQuestionTranslations(raw: unknown): QuestionTranslations {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

	const out: QuestionTranslations = {};
	for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
		if (!isLangCode(code)) continue;
		const entry = (value ?? {}) as Record<string, unknown>;
		const title = clampText(entry.title, 160) ?? "";
		const options = (Array.isArray(entry.options) ? entry.options : [])
			.map((o) => clampText(o, 60) ?? "")
			.slice(0, 8);
		if (!title && options.every((o) => !o)) continue;
		out[code] = { title, options };
	}
	return out;
}

/**
 * A question as one visitor reads it. Blanks fall back to the page's primary
 * wording, so a half-finished translation never shows an empty choice.
 */
export function questionFor(
	question: Question,
	lang: string,
	primaryLang: string,
): Pick<Question, "id" | "type" | "options" | "required" | "title"> {
	// `title` and `options` are the primary language's wording, whatever a stale
	// translation left over from a language swap might still claim.
	if (lang === primaryLang) return question;

	const translated = isLangCode(lang) ? question.translations[lang] : undefined;
	if (!translated) return question;

	return {
		id: question.id,
		type: question.type,
		required: question.required,
		title: translated.title || question.title,
		options: question.options.map((option, i) => translated.options[i] || option),
	};
}

function parseOptions(raw: string | null): string[] {
	try {
		const parsed = JSON.parse(raw ?? "[]");
		return Array.isArray(parsed)
			? parsed.filter((o): o is string => typeof o === "string").slice(0, 8)
			: [];
	} catch {
		return [];
	}
}

const QUESTION_TYPES: QuestionType[] = ["short_text", "single_choice", "multi_choice"];

/**
 * Replaces the whole set. The editor edits three questions as one document, and
 * rewriting them wholesale keeps sort_order honest without a reorder API.
 *
 * Existing answers reference question ids, so an id the client sends back is
 * preserved — only questions the founder actually removed lose their answers.
 */
export async function replaceQuestions(
	db: D1Database,
	projectId: string,
	raw: unknown,
): Promise<Question[]> {
	const incoming = Array.isArray(raw) ? raw.slice(0, MAX_QUESTIONS) : [];
	const existing = await getQuestions(db, projectId);
	const known = new Set(existing.map((q) => q.id));

	const questions: Question[] = [];
	for (const item of incoming) {
		const q = (item ?? {}) as Record<string, unknown>;
		const title = clampText(q.title, 160);
		if (!title) continue;

		const type = QUESTION_TYPES.includes(q.type as QuestionType)
			? (q.type as QuestionType)
			: "short_text";

		const options =
			type === "short_text"
				? []
				: (Array.isArray(q.options) ? q.options : [])
						.map((o) => clampText(o, 60))
						.filter((o): o is string => Boolean(o))
						.slice(0, 8);

		// A choice question with no options is a dead end on the public page.
		if (type !== "short_text" && options.length === 0) continue;

		questions.push({
			id: typeof q.id === "string" && known.has(q.id) ? q.id : crypto.randomUUID(),
			title,
			type,
			options,
			required: q.required === true,
			translations: sanitizeQuestionTranslations(q.translations),
		});
	}

	const keep = new Set(questions.map((q) => q.id));
	const statements = [
		...existing
			.filter((q) => !keep.has(q.id))
			.map((q) => db.prepare("DELETE FROM questions WHERE id = ?").bind(q.id)),
		...questions.map((q, i) =>
			db
				.prepare(
					`INSERT INTO questions
						(id, project_id, title, type, options, required, sort_order, translations)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					 ON CONFLICT (id) DO UPDATE SET
						title = excluded.title, type = excluded.type,
						options = excluded.options, required = excluded.required,
						sort_order = excluded.sort_order,
						translations = excluded.translations`,
				)
				.bind(
					q.id,
					projectId,
					q.title,
					q.type,
					JSON.stringify(q.options),
					q.required ? 1 : 0,
					i,
					JSON.stringify(q.translations),
				),
		),
	];

	if (statements.length > 0) await db.batch(statements);
	return questions;
}
