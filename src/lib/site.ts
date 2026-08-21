export const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://waitloom.app";

export const SITE_NAME = "Waitloom";

/**
 * The product is live: the marketing CTAs point at sign-up rather than at a
 * waitlist, and the hero drops the email form. The marketing waitlist form and
 * its copy are still in the tree, so setting this back to false restores the
 * pre-launch page as it was.
 *
 * Do not deploy with this on until the wildcard `*` DNS record exists — the
 * page invites people to publish, and a published link resolves nowhere
 * without it.
 */
export const APP_LAUNCHED = true;
