# Waitloom — pre-launch site

The public pre-launch page for Waitloom, in English (`/`) and Chinese (`/zh`),
plus the waitlist that backs it. Next.js 16 + Tailwind 4 on Cloudflare Workers
(OpenNext), with subscribers stored in D1.

## What's here

```
src/
├── app/
│   ├── (en)/page.tsx          /        English landing page
│   ├── (en)/admin/page.tsx    /admin   founder-only waitlist dashboard
│   ├── (zh)/zh/page.tsx       /zh      Chinese landing page
│   └── api/                            waitlist, answers, pageview hits, CSV export
├── components/                         landing sections + the six template previews
├── i18n/dictionaries.ts                every string on the site, en + zh
└── lib/                                D1 access, validation, waitlist + traffic queries
```

Each language has its own root layout so the served HTML carries the right
`lang` attribute; both render the same `<Landing />` from the shared dictionary.

## Local development

```bash
npm install
npm run db:migrate:local
npm run dev
```

`.dev.vars` holds the real secrets (`ADMIN_PASSWORD`, `IP_SALT`); it is
gitignored and is also the source for `npm run secrets:push`. `/admin` and `/api/admin/*` sit behind HTTP Basic auth — any
username, the password from `ADMIN_PASSWORD`.

Inspect what the form collected:

```bash
npx wrangler d1 execute waitloom-db --local --command "SELECT * FROM subscribers"
```

## Traffic

The landing pages stay statically prerendered, so pageviews are counted from the
client: `<PageBeacon />` fires one `POST /api/hit` per load, and `src/lib/analytics.ts`
folds it into `page_stats`, aggregated per project/day/source rather than one row
per view. A visit counts as a new *visitor* the first time that day's salted IP
hash lands in `visitor_days` — that dedupe is what makes the conversion rate on
`/admin` mean anything.

Days everywhere are bucketed in Beijing time (`src/lib/day.ts`), not the UTC that
Workers reports as local.

`project_id` is the string `"waitloom"` today. It exists so the same two tables
and the same module carry over unchanged when the MVP hosts many projects; only
`PROJECT_ID` has to become a lookup.

Traffic is not backfillable — numbers start from the first visit after deploy.

## Deploying

The `waitloom-db` database already exists (id in `wrangler.jsonc`) and has the
schema applied. `wrangler.jsonc` also claims `waitloom.app` as a
custom domain, which requires that zone to be in the same Cloudflare account.

1. Push the secrets from `.dev.vars` (the same values are used locally and in
   production, so there is one source of truth):

   ```bash
   npm run secrets:push
   ```

   The script asks for confirmation, prints key names and lengths but never the
   values, and refuses to run unattended unless you pass `-y`.

2. Deploy:

   ```bash
   npm run deploy
   ```

### Schema changes

Drop a new numbered file in `migrations/` and push. `npm run deploy` starts with
`npm run db:migrate` (`wrangler d1 migrations apply DB --remote`), so the schema
lands **before** the code that needs it, and a failed migration aborts the deploy
instead of shipping code against a table that is not there. Applied migrations are
tracked in `d1_migrations`, so re-running is a no-op.

That ordering only holds for additive migrations — new tables, new nullable
columns. Anything that drops or renames has to be split expand/contract across two
deploys, because the old Worker keeps serving until the new one is live.

Since Workers Builds runs the deploy command on `git push`, migrations ride along
with the commit that needs them. If a build ever fails on the migrate step with an
authorization error, the auto-generated build token lacks D1 access: create an API
token with **D1:Edit** and set it under **Settings → Build → API token**.

`npm run preview` builds the worker and runs it locally in workerd — worth doing
before any deploy, since that is the runtime the site actually runs on.

## Waitlist behaviour

- Email is normalized and de-duplicated; a repeat signup silently returns the
  original queue position instead of an error.
- Source is derived from `utm_source`, falling back to the referrer host
  (x / reddit / producthunt / hackernews / …); a same-host referrer counts as
  direct.
- Two optional validation questions are asked *after* the email is stored, so
  skipping them never costs a signup.
- A hidden honeypot field and a 5-per-hour-per-IP cap keep casual bots out. IPs
  are only ever stored as a salted SHA-256 hash.
