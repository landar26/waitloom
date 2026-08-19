-- Waitloom pre-launch site: waitlist + validation answers.
CREATE TABLE IF NOT EXISTS subscribers (
	id           TEXT PRIMARY KEY,
	email        TEXT NOT NULL UNIQUE,
	lang         TEXT NOT NULL DEFAULT 'en',
	source       TEXT,
	referrer     TEXT,
	utm_source   TEXT,
	utm_medium   TEXT,
	utm_campaign TEXT,
	ip_hash      TEXT,
	created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
	id            TEXT PRIMARY KEY,
	subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
	question_key  TEXT NOT NULL,
	value         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscribers_created ON subscribers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscribers_ip ON subscribers(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_answers_subscriber ON answers(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_key);
