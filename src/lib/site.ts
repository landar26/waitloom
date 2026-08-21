export const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://waitloom.app";

export const SITE_NAME = "Waitloom";

/**
 * Where product problems get reported. Every Discord entry point in the app
 * reads this one constant; empty string renders none of them, so taking the
 * server down for a while is a one-line change rather than a revert.
 */
export const DISCORD_URL = "https://discord.com/invite/wwA7Bzaxff";

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
