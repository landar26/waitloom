-- Personal access tokens for the MCP server (src/app/api/mcp). A founder mints
-- one at /dashboard/settings and pastes it into Claude Code, Cursor or any other
-- MCP client; every tool call carries it as `Authorization: Bearer wl_…`.
--
-- id is sha256(token), exactly like `sessions`: the token itself is shown once
-- and never stored, so a database read cannot hand out working credentials.
-- `prefix` is the visible fragment ("wl_a1b2c3de") the dashboard lists, which is
-- how a founder tells two tokens apart without either being recoverable.
CREATE TABLE IF NOT EXISTS api_tokens (
	id           TEXT PRIMARY KEY,
	user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name         TEXT NOT NULL DEFAULT '',
	prefix       TEXT NOT NULL,
	created_at   INTEGER NOT NULL,
	last_used_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id, created_at DESC);
