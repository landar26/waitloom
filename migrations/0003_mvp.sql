-- The product itself: accounts, projects, and per-project waitlists.
--
-- The marketing site's own `subscribers`/`answers` tables are deliberately left
-- alone. Reusing them would have meant rebuilding `subscribers` to swap its
-- global UNIQUE(email) for UNIQUE(project_id, email), and D1 enforces foreign
-- keys: dropping the old table fires answers' ON DELETE CASCADE and takes every
-- live answer row with it. `project_subscribers` starts clean instead, and
-- lib/subscribers.ts shares the query logic with lib/waitlist.ts.

CREATE TABLE IF NOT EXISTS users (
	id         TEXT PRIMARY KEY,
	email      TEXT NOT NULL UNIQUE,
	name       TEXT,
	avatar_url TEXT,
	google_sub TEXT UNIQUE,
	lang       TEXT NOT NULL DEFAULT 'en',
	plan       TEXT NOT NULL DEFAULT 'free',
	created_at INTEGER NOT NULL
);

-- id is sha256(cookie token), never the token itself: a leaked database read
-- must not hand out usable sessions.
CREATE TABLE IF NOT EXISTS sessions (
	id         TEXT PRIMARY KEY,
	user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at INTEGER NOT NULL,
	expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- `content` is one JSON blob (see lib/content.ts) rather than a table per
-- section: the editor writes whole documents, and the page renders whole
-- documents. `sections` is the ordered list of blocks switched on.
CREATE TABLE IF NOT EXISTS projects (
	id            TEXT PRIMARY KEY,
	user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name          TEXT NOT NULL,
	slug          TEXT NOT NULL UNIQUE,
	description   TEXT NOT NULL DEFAULT '',
	product_type  TEXT NOT NULL DEFAULT 'other',
	template_id   TEXT NOT NULL DEFAULT 'minimal',
	theme         TEXT NOT NULL DEFAULT 'light',
	accent        TEXT NOT NULL DEFAULT 'blue',
	font          TEXT NOT NULL DEFAULT 'modern',
	lang          TEXT NOT NULL DEFAULT 'en',
	status        TEXT NOT NULL DEFAULT 'draft',
	custom_domain TEXT,
	content       TEXT NOT NULL DEFAULT '{}',
	sections      TEXT NOT NULL DEFAULT '[]',
	created_at    INTEGER NOT NULL,
	updated_at    INTEGER NOT NULL,
	published_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, created_at DESC);

-- At most three per project, enforced in the API rather than by the schema.
CREATE TABLE IF NOT EXISTS questions (
	id         TEXT PRIMARY KEY,
	project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	title      TEXT NOT NULL,
	type       TEXT NOT NULL,                -- short_text | single_choice | multi_choice
	options    TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
	required   INTEGER NOT NULL DEFAULT 0,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_questions_project ON questions(project_id, sort_order);

-- Same email may join two different projects, hence UNIQUE(project_id, email).
CREATE TABLE IF NOT EXISTS project_subscribers (
	id           TEXT PRIMARY KEY,
	project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	email        TEXT NOT NULL,
	source       TEXT,
	referrer     TEXT,
	utm_source   TEXT,
	utm_medium   TEXT,
	utm_campaign TEXT,
	ip_hash      TEXT,
	created_at   INTEGER NOT NULL,
	UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_psubs_project ON project_subscribers(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_psubs_ip ON project_subscribers(ip_hash, created_at);

CREATE TABLE IF NOT EXISTS project_answers (
	id            TEXT PRIMARY KEY,
	subscriber_id TEXT NOT NULL REFERENCES project_subscribers(id) ON DELETE CASCADE,
	question_id   TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
	value         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_panswers_subscriber ON project_answers(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_panswers_question ON project_answers(question_id);
