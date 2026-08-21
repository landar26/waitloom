/**
 * Plan limits from the PRD's pricing section.
 *
 * Billing is not built yet (it is P1), so most limits are wired up but not
 * binding: capping a free founder at 50 subscribers with no way to pay would
 * break the exact loop the MVP exists to validate. Flip BILLING_ENABLED when
 * checkout lands and the numbers below start applying.
 *
 * The project cap is the exception — see MAX_PROJECTS.
 */
export const BILLING_ENABLED = false;

/**
 * Hard ceiling on projects per account, applied to everyone on every plan.
 * This one is an abuse guard rather than a paywall, so it binds today instead
 * of waiting on checkout.
 */
export const MAX_PROJECTS = 5;

export type PlanId = "free" | "launch";

export type PlanLimits = {
	/** Max projects the account may own. */
	projects: number;
	/** Max subscribers a single project may collect. */
	subscribers: number;
	/** Whether published pages carry the "Made with Waitloom" footer. */
	branding: boolean;
	customDomain: boolean;
};

export const PLANS: Record<PlanId, PlanLimits> = {
	free: { projects: MAX_PROJECTS, subscribers: 50, branding: true, customDomain: false },
	launch: {
		projects: MAX_PROJECTS,
		subscribers: 1000,
		branding: false,
		customDomain: true,
	},
};

const UNMETERED: PlanLimits = {
	// Metered even before billing: the cap is about abuse, not about paying.
	projects: MAX_PROJECTS,
	subscribers: Number.POSITIVE_INFINITY,
	branding: true,
	customDomain: false,
};

export function planOf(raw: string | null | undefined): PlanId {
	return raw === "launch" ? "launch" : "free";
}

export function limitsFor(plan: string | null | undefined): PlanLimits {
	if (!BILLING_ENABLED) return UNMETERED;
	return PLANS[planOf(plan)];
}
