-- Traffic for the pre-launch page: how many people saw it, not just who joined.
--
-- Aggregated per project/day/source rather than one row per view, so the table
-- stays bounded (days x sources) once this is reused for many hosted projects.
-- project_id is a plain string today ('waitloom'); it becomes a real FK when the
-- MVP grows a projects table.
CREATE TABLE IF NOT EXISTS page_stats (
	project_id TEXT    NOT NULL,
	day        TEXT    NOT NULL,           -- YYYY-MM-DD, Beijing time
	source     TEXT    NOT NULL,           -- same buckets as subscribers.source
	views      INTEGER NOT NULL DEFAULT 0,
	visitors   INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (project_id, day, source)
);

-- One row per (project, day, visitor). The primary key is the whole mechanism:
-- an INSERT OR IGNORE that actually lands is what makes a view a *new* visitor.
-- Safe to prune beyond the reporting window.
CREATE TABLE IF NOT EXISTS visitor_days (
	project_id TEXT NOT NULL,
	day        TEXT NOT NULL,
	ip_hash    TEXT NOT NULL,
	PRIMARY KEY (project_id, day, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_page_stats_day ON page_stats(project_id, day);
