import { PRODUCT_TYPES } from "@/i18n/dictionaries";
import { DEFAULT_TEMPLATE_ID, TEMPLATES } from "@/templates/registry";
import { ACCENTS, FONTS, THEMES } from "@/templates/style";
import { getTotals, getTraffic } from "../analytics";
import {
	LOCKED_SECTIONS,
	MAX_FAQ,
	MAX_FEATURES,
	MAX_STEPS,
	SECTIONS,
} from "../content";
import { projectUrl } from "../host";
import { limitsFor } from "../plans";
import {
	countProjects,
	createProject,
	getOwnedProject,
	getQuestions,
	listProjects,
	MAX_QUESTIONS,
	replaceQuestions,
	setPublished,
	updateProject,
	type Project,
} from "../projects";
import {
	countByProject,
	getStats,
	listSubscribers,
	SERIES_DAYS,
} from "../subscribers";
import type { McpContext } from "./protocol";

/**
 * Thrown when a client calls a tool that does not exist — the one tool failure
 * that really is a malformed call, so the protocol layer turns it into a
 * JSON-RPC error rather than an isError result.
 */
export class UnknownToolError extends Error {}

/**
 * The tools an agent gets. Every one of them is a thin wrapper over a function
 * the dashboard already calls — the MCP layer adds a protocol, not a second
 * copy of the rules. In particular `update_page` hands its patch straight to
 * `updateProject`, which is what sanitizes content and validates style ids, so
 * an agent cannot reach anything the editor could not.
 */

type ToolResult = {
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
};

type Handler = (
	args: Record<string, unknown>,
	ctx: McpContext,
) => Promise<ToolResult>;

type Tool = {
	name: string;
	title: string;
	description: string;
	inputSchema: Record<string, unknown>;
	handler: Handler;
};

/** Structured payloads go back as pretty JSON — models read it well enough. */
function ok(data: unknown): ToolResult {
	return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/**
 * A refusal the agent should read and act on — a taken slug, a project that is
 * not theirs. Deliberately not a JSON-RPC error: those mean the *call* was
 * malformed, and a client is entitled to treat them as a bug rather than as an
 * answer.
 */
function fail(message: string): ToolResult {
	return { content: [{ type: "text", text: message }], isError: true };
}

const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);
const ACCENT_NAMES = Object.keys(ACCENTS);
const FONT_NAMES = Object.keys(FONTS);

const PROJECT_ID_SCHEMA = {
	type: "string",
	description: "The project's id, as returned by list_projects or create_project.",
} as const;

/**
 * Resolves a project id to a project this token's owner actually owns.
 *
 * The result is tagged rather than `Project | ToolResult`: a Project has a
 * `content` field of its own, so any guard that sniffed for one would answer
 * yes to both and hand the raw row back as if it were a tool result.
 */
type Owned = { project: Project } | { refusal: ToolResult };

async function owned(
	args: Record<string, unknown>,
	ctx: McpContext,
): Promise<Owned> {
	const id = args.projectId;
	if (typeof id !== "string" || !id) return { refusal: fail("projectId is required.") };

	const project = await getOwnedProject(ctx.db, id, ctx.user.id);
	if (!project) {
		return {
			refusal: fail(
				`No project ${id} on this account. Call list_projects to see what is there.`,
			),
		};
	}
	return { project };
}

/** The shape every tool reports a project in, so the agent sees one vocabulary. */
function summarize(project: Project, host: string | null) {
	return {
		id: project.id,
		name: project.name,
		slug: project.slug,
		status: project.status,
		url: projectUrl(project.slug, host),
		template: project.template_id,
		theme: project.theme,
		accent: project.accent,
		font: project.font,
		lang: project.lang,
		updatedAt: new Date(project.updated_at).toISOString(),
	};
}

const TOOLS: Tool[] = [
	{
		name: "list_projects",
		title: "List projects",
		description:
			"Every pre-launch page on this account, with its subdomain, whether it is " +
			"published, and how many signups and visitors it has. Start here.",
		inputSchema: { type: "object", properties: {}, additionalProperties: false },
		handler: async (_args, ctx) => {
			const projects = await listProjects(ctx.db, ctx.user.id);
			const ids = projects.map((p) => p.id);
			const [signups, traffic] = await Promise.all([
				countByProject(ctx.db, ids),
				getTotals(ctx.db, ids, SERIES_DAYS),
			]);

			return ok({
				projects: projects.map((project) => ({
					...summarize(project, ctx.host),
					subscribers: signups.get(project.id) ?? 0,
					visitors: traffic.get(project.id)?.visitors ?? 0,
				})),
			});
		},
	},

	{
		name: "get_project",
		title: "Get a project",
		description:
			"One project in full: its page content, which sections are switched on, " +
			"its styling, and its validation questions. Read this before update_page " +
			"so an edit does not blank a field it did not mean to touch.",
		inputSchema: {
			type: "object",
			properties: { projectId: PROJECT_ID_SCHEMA },
			required: ["projectId"],
			additionalProperties: false,
		},
		handler: async (args, ctx) => {
			const found = await owned(args, ctx);
			if ("refusal" in found) return found.refusal;
			const project = found.project;

			return ok({
				...summarize(project, ctx.host),
				description: project.description,
				productType: project.product_type,
				sections: project.sections,
				content: project.content,
				questions: await getQuestions(ctx.db, project.id),
			});
		},
	},

	{
		name: "create_project",
		title: "Create a project",
		description:
			"Creates a pre-launch page as a draft, with a free subdomain derived from " +
			"the name and starter copy already filled in. It is not live until publish " +
			"is called.",
		inputSchema: {
			type: "object",
			properties: {
				name: { type: "string", description: "The product's name. Up to 60 characters." },
				description: {
					type: "string",
					description: "One line on what it does. Up to 160 characters.",
				},
				productType: { type: "string", enum: [...PRODUCT_TYPES] },
				templateId: {
					type: "string",
					enum: TEMPLATE_IDS,
					description: `Visual template. Defaults to ${DEFAULT_TEMPLATE_ID}.`,
				},
			},
			required: ["name"],
			additionalProperties: false,
		},
		handler: async (args, ctx) => {
			const name = typeof args.name === "string" ? args.name.trim() : "";
			if (!name) return fail("name is required.");

			// The same choke point as POST /api/projects — MCP must not be the way
			// around a cap the dashboard enforces.
			const limit = limitsFor(ctx.user.plan).projects;
			if (Number.isFinite(limit) && (await countProjects(ctx.db, ctx.user.id)) >= limit) {
				return fail(
					`This account is at its limit of ${limit} projects. Delete one in the ` +
						`dashboard before creating another.`,
				);
			}

			const project = await createProject(ctx.db, {
				userId: ctx.user.id,
				name,
				description: typeof args.description === "string" ? args.description : "",
				productType:
					typeof args.productType === "string" ? args.productType : "other",
				templateId:
					typeof args.templateId === "string" ? args.templateId : DEFAULT_TEMPLATE_ID,
			});

			return ok({
				...summarize(project, ctx.host),
				content: project.content,
				sections: project.sections,
				note: "Draft. Call publish to put it live.",
			});
		},
	},

	{
		name: "update_page",
		title: "Update a page",
		description:
			"Edits a page. Every field is optional and only what is sent changes — but " +
			"`content` and `sections` are whole documents, so send the full object " +
			"from get_project with your edits applied, not a fragment.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: PROJECT_ID_SCHEMA,
				name: { type: "string" },
				description: { type: "string" },
				slug: {
					type: "string",
					description:
						"The subdomain, 3-30 lowercase letters, numbers and dashes. Changing " +
						"it breaks any link already shared.",
				},
				templateId: { type: "string", enum: TEMPLATE_IDS },
				theme: { type: "string", enum: [...THEMES] },
				accent: {
					type: "string",
					description: `One of ${ACCENT_NAMES.join(", ")}, or a #rrggbb hex colour.`,
				},
				font: { type: "string", enum: FONT_NAMES },
				lang: {
					type: "string",
					enum: ["en", "zh"],
					description: "The language of the form and section headings on the page.",
				},
				sections: {
					type: "array",
					items: { type: "string", enum: [...SECTIONS] },
					description:
						`Which sections appear, in order. ${LOCKED_SECTIONS.join(" and ")} ` +
						`are always kept.`,
				},
				content: {
					type: "object",
					description: "The page document.",
					properties: {
						logoUrl: { type: "string" },
						headline: { type: "string", description: "The hero headline. Up to 90 characters." },
						subheadline: { type: "string" },
						ctaLabel: { type: "string", description: "The waitlist button's label." },
						screenshotUrl: { type: "string" },
						features: {
							type: "array",
							maxItems: MAX_FEATURES,
							items: {
								type: "object",
								properties: { title: { type: "string" }, body: { type: "string" } },
							},
						},
						howItWorks: {
							type: "array",
							maxItems: MAX_STEPS,
							items: {
								type: "object",
								properties: { title: { type: "string" }, body: { type: "string" } },
							},
						},
						faq: {
							type: "array",
							maxItems: MAX_FAQ,
							items: {
								type: "object",
								properties: { q: { type: "string" }, a: { type: "string" } },
							},
						},
						founder: {
							type: "object",
							properties: {
								name: { type: "string" },
								avatarUrl: { type: "string" },
								bio: { type: "string" },
							},
						},
						social: {
							type: "object",
							properties: {
								x: { type: "string" },
								github: { type: "string" },
								website: { type: "string" },
								discord: { type: "string" },
							},
						},
					},
				},
			},
			required: ["projectId"],
			additionalProperties: false,
		},
		handler: async (args, ctx) => {
			const found = await owned(args, ctx);
			if ("refusal" in found) return found.refusal;
			const project = found.project;

			const { projectId: _id, ...patch } = args;
			const result = await updateProject(ctx.db, project, patch);

			if ("error" in result) {
				return fail(
					result.error === "slug_taken"
						? `The address "${String(args.slug)}" is taken. Try another.`
						: `"${String(args.slug)}" cannot be used as an address: 3-30 lowercase ` +
							`letters, numbers and single dashes, and not a reserved word.`,
				);
			}

			return ok({
				...summarize(result.project, ctx.host),
				sections: result.project.sections,
				content: result.project.content,
			});
		},
	},

	{
		name: "set_questions",
		title: "Set validation questions",
		description:
			`Replaces the project's validation questions — up to ${MAX_QUESTIONS}, asked ` +
			"after a visitor's email is already stored so skipping them never costs a " +
			"signup. Send the whole set; anything left out is removed along with its " +
			"answers. Keep the ids from get_project on questions you are keeping.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: PROJECT_ID_SCHEMA,
				questions: {
					type: "array",
					maxItems: MAX_QUESTIONS,
					items: {
						type: "object",
						properties: {
							id: {
								type: "string",
								description:
									"Omit for a new question. Pass an existing id to edit it and keep " +
									"the answers already collected.",
							},
							title: { type: "string" },
							type: {
								type: "string",
								enum: ["short_text", "single_choice", "multi_choice"],
							},
							options: {
								type: "array",
								items: { type: "string" },
								description: "Required for choice questions, up to 8.",
							},
							required: { type: "boolean" },
						},
						required: ["title", "type"],
					},
				},
			},
			required: ["projectId", "questions"],
			additionalProperties: false,
		},
		handler: async (args, ctx) => {
			const found = await owned(args, ctx);
			if ("refusal" in found) return found.refusal;
			const project = found.project;

			const questions = await replaceQuestions(ctx.db, project.id, args.questions);
			return ok({ questions });
		},
	},

	{
		name: "publish",
		title: "Publish or unpublish",
		description:
			"Puts a page live on its subdomain, or takes it back to draft. Unpublishing " +
			"hides the page but keeps every subscriber and answer.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: PROJECT_ID_SCHEMA,
				published: {
					type: "boolean",
					description: "Defaults to true. Pass false to revert to a draft.",
				},
			},
			required: ["projectId"],
			additionalProperties: false,
		},
		handler: async (args, ctx) => {
			const found = await owned(args, ctx);
			if ("refusal" in found) return found.refusal;
			const project = found.project;

			const published = args.published !== false;
			await setPublished(ctx.db, project.id, published);

			return ok({
				id: project.id,
				status: published ? "published" : "draft",
				url: published ? projectUrl(project.slug, ctx.host) : null,
			});
		},
	},

	{
		name: "list_subscribers",
		title: "List subscribers",
		description:
			"The waitlist for one project, newest first, with where each signup came " +
			"from and what they answered.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: PROJECT_ID_SCHEMA,
				limit: {
					type: "integer",
					minimum: 1,
					maximum: 500,
					description: "How many to return. Defaults to 50.",
				},
			},
			required: ["projectId"],
			additionalProperties: false,
		},
		handler: async (args, ctx) => {
			const found = await owned(args, ctx);
			if ("refusal" in found) return found.refusal;
			const project = found.project;

			const asked = Number(args.limit);
			const limit = Number.isFinite(asked)
				? Math.min(Math.max(Math.trunc(asked), 1), 500)
				: 50;

			const [subscribers, questions] = await Promise.all([
				listSubscribers(ctx.db, project.id, limit),
				getQuestions(ctx.db, project.id),
			]);

			// Answers are stored against question ids, which say nothing to a reader.
			const titles = new Map(questions.map((q) => [q.id, q.title]));

			return ok({
				project: { id: project.id, name: project.name, slug: project.slug },
				count: subscribers.length,
				subscribers: subscribers.map((s) => ({
					email: s.email,
					joined: new Date(s.created_at).toISOString(),
					source: s.source ?? "direct",
					utmCampaign: s.utm_campaign,
					answers: Object.fromEntries(
						Object.entries(s.answers).map(([id, value]) => [titles.get(id) ?? id, value]),
					),
				})),
			});
		},
	},

	{
		name: "get_stats",
		title: "Get signup and traffic stats",
		description:
			`Signups and traffic for one project over the last ${SERIES_DAYS} days, ` +
			"including today, week over week, where they came from, and the conversion " +
			"rate — the number that says whether the idea is landing.",
		inputSchema: {
			type: "object",
			properties: { projectId: PROJECT_ID_SCHEMA },
			required: ["projectId"],
			additionalProperties: false,
		},
		handler: async (args, ctx) => {
			const found = await owned(args, ctx);
			if ("refusal" in found) return found.refusal;
			const project = found.project;

			const [stats, traffic] = await Promise.all([
				getStats(ctx.db, project.id),
				getTraffic(ctx.db, project.id, SERIES_DAYS),
			]);

			const signupsInWindow = stats.series.reduce((n, point) => n + point.count, 0);

			return ok({
				project: { id: project.id, name: project.name, slug: project.slug },
				windowDays: SERIES_DAYS,
				subscribers: {
					total: stats.total,
					today: stats.today,
					yesterday: stats.yesterday,
					last7: stats.last7,
					prev7: stats.prev7,
					sources: stats.sources,
					utmCampaign: stats.utmCampaign,
					series: stats.series,
				},
				traffic: traffic.available
					? { views: traffic.views, visitors: traffic.visitors, sources: traffic.sources }
					: null,
				// Signups per visitor, both counted over the same window.
				conversionPct:
					traffic.available && traffic.visitors > 0
						? Math.round((signupsInWindow / traffic.visitors) * 1000) / 10
						: null,
			});
		},
	},
];

/** What tools/list returns — the handlers stay on this side of the wire. */
export const TOOL_DEFINITIONS = TOOLS.map(({ name, title, description, inputSchema }) => ({
	name,
	title,
	description,
	inputSchema,
}));

const BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

export async function callTool(
	name: string,
	args: Record<string, unknown>,
	ctx: McpContext,
): Promise<ToolResult> {
	const tool = BY_NAME.get(name);
	if (!tool) throw new UnknownToolError(`unknown tool: ${name}`);
	return tool.handler(args, ctx);
}
