# Waitloom

A pre-launch page builder for indie founders: describe a product, pick one of six
templates, publish to `<slug>.waitloom.app`, and collect a waitlist with up to
three validation questions. Next.js 16 + Tailwind 4 on Cloudflare Workers
(OpenNext), with everything in D1 and uploads in R2.

The repository also contains Waitloom's own bilingual marketing site at `/` and
`/zh`, with its own waitlist behind `/admin`. That is a separate concern from the
product and uses its own tables — see [Two waitlists](#two-waitlists).

## What's here

```
src/
├── app/
│   ├── (en)/page.tsx              /                    English marketing page
│   ├── (en)/admin/page.tsx        /admin               Waitloom's own waitlist dashboard
│   ├── (zh)/zh/page.tsx           /zh                  Chinese marketing page
│   ├── (app)/login                /login               Google sign-in
│   ├── (app)/dashboard            /dashboard           projects, editor, subscribers, analytics
│   ├── (site)/s/[slug]            <slug>.waitloom.app  a published page
│   ├── api/                                            auth, projects, uploads, public join/hit
│   └── media/[...key]             /media/…             uploaded images, out of R2
├── templates/                     six templates: style tokens + shared sections
├── components/
│   ├── dash/  editor/  public/                         app UI, block editor, public form
├── i18n/                          dictionaries.ts (marketing) · app.ts (dashboard) · page.ts (public)
└── lib/                           auth, projects, subscribers, content, hosts, plans
```

Four root layouts, one per route group: the marketing pages and the dashboard
wear Waitloom's dark chrome (`.app-shell`), while a published page carries only
the palette its founder chose.

## Local development

```bash
npm install
npm run db:migrate:local
npm run dev
```

`.dev.vars` holds the real secrets — see `.dev.vars.example` for the keys. It is
gitignored and is also the source for `npm run secrets:push`. `/admin` and
`/api/admin/*` sit behind HTTP Basic auth — any username, the password from
`ADMIN_PASSWORD`.

**Signing in locally.** Google OAuth works against `http://localhost:3000` once
the client exists, but `GET /api/auth/dev` mints a session for a throwaway
account without touching a real Google account. It returns 404 in a production
build.

**Published pages locally.** Wildcard DNS does not exist on localhost, so
`projectUrl()` falls back to the path form: a page published as `halo` is at
`http://localhost:3000/s/halo`. To exercise the real subdomain path, send the
Host header yourself:

```bash
curl -H "Host: halo.waitloom.app" http://127.0.0.1:3000/
```

Inspect what a project collected:

```bash
npx wrangler d1 execute waitloom-db --local --command "SELECT email, source FROM project_subscribers"
```

## Two waitlists

`subscribers` / `answers` belong to Waitloom's own marketing page and are read by
`/admin` through `src/lib/waitlist.ts`. `project_subscribers` / `project_answers`
belong to founders' projects and are read by the dashboard through
`src/lib/subscribers.ts`.

They are separate tables on purpose. Folding the marketing list into the product
one would have meant rebuilding `subscribers` to trade its global `UNIQUE(email)`
for `UNIQUE(project_id, email)` — and D1 enforces foreign keys, so dropping the
old table fires `answers`' `ON DELETE CASCADE` and takes every live answer with
it. The query logic is shared at the module level instead.

## Templates

A template is a pair of neutral palettes (light and dark) plus a shape — radii,
border width, hero alignment, heading weight — declared in
`src/templates/registry.ts`. `resolveStyle()` turns that, the founder's accent and
their font choice into CSS custom properties, and every section component reads
those variables. No section branches on which template it is inside, which is why
six templates cost roughly one template's worth of markup.

`<TemplatePage>` is the single renderer, used by the published page, the editor
preview and the marketing gallery alike — so the homepage cannot drift from what
a founder actually gets.

## Traffic

The landing pages stay statically prerendered, so pageviews are counted from the
client: `<PageBeacon />` fires one `POST /api/hit` per load, and `src/lib/analytics.ts`
folds it into `page_stats`, aggregated per project/day/source rather than one row
per view. A visit counts as a new *visitor* the first time that day's salted IP
hash lands in `visitor_days` — that dedupe is what makes the conversion rate on
`/admin` mean anything.

Days everywhere are bucketed in Beijing time (`src/lib/day.ts`), not the UTC that
Workers reports as local.

`page_stats.project_id` is the marketing site's own `"waitloom"` for `/api/hit`,
and a real project UUID for `/api/p/[slug]/hit` — the id rather than the slug, so
renaming a page does not orphan its history.

Traffic is not backfillable — numbers start from the first visit after deploy.

## Deploying

The `waitloom-db` database already exists (id in `wrangler.jsonc`) and has the
schema applied. `wrangler.jsonc` also claims `waitloom.app` as a
custom domain, which requires that zone to be in the same Cloudflare account.

### One-time setup for the product

1. **Wildcard subdomain.** Published pages live at `<slug>.waitloom.app`. Custom
   Domains cannot be wildcards, so `wrangler.jsonc` carries the route
   `*.waitloom.app/*` — which needs a **proxied** DNS record on the zone to
   attach to: type `A`, name `*`, content `192.0.2.0` (or `AAAA` → `100::`),
   orange cloud on. Universal SSL covers first-level wildcards, so no extra
   certificate is needed.

2. **R2 bucket** for logos and screenshots:

   ```bash
   npx wrangler r2 bucket create waitloom-media
   ```

3. **Google OAuth client** (Cloud Console → Credentials → OAuth client ID → Web
   application). Add both redirect URIs:

   ```
   https://waitloom.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

   Put the id and secret in `.dev.vars` as `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`.

4. **Flip the launch switch.** `APP_LAUNCHED` in `src/lib/site.ts` is `false`
   until the three steps above are done; it swaps the marketing CTAs from "join
   the waitlist" to "create your page". The waitlist form stays in the page
   either way, so turning it back off loses nothing.

### Every deploy

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

Shared by both waitlists:

- Email is normalized and de-duplicated; a repeat signup silently returns the
  original queue position instead of an error.
- Source is derived from `utm_source`, falling back to the referrer host
  (x / reddit / producthunt / hackernews / …); a same-host referrer counts as
  direct.
- Validation questions are asked *after* the email is stored, so skipping them
  never costs a signup. Founders get up to three; the marketing page has two
  fixed ones.
- A hidden honeypot field and a 5-per-hour-per-IP cap keep casual bots out. IPs
  are only ever stored as a salted SHA-256 hash.

## Plans

`src/lib/plans.ts` holds the PRD's limits, enforced at the two choke points that
matter — creating a project and joining a waitlist.

`MAX_PROJECTS` (5 per account, every plan) binds today: it is an abuse guard
rather than a paywall, so it applies regardless of `BILLING_ENABLED`. Creating a
sixth project returns `403 project_limit`, and the dashboard hides the create
button at the cap.

The rest — the 50-subscriber cap and the "Made with Waitloom" branding flag —
stay non-binding while `BILLING_ENABLED` is `false`: capping a free founder at 50
subscribers with no way to pay would break the loop the product exists to prove.
Flip it when checkout lands.
