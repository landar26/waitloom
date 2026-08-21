-- Pages whose CTA is a link rather than an email form have no signups to count,
-- so the only conversion they have is the click that sent someone at the
-- product. Same grain as the rest of page_stats — project/day/source — which is
-- what lets a click sit next to the views from the same source.
--
-- Additive: the old Worker keeps serving while this lands, and it never writes
-- the column.
ALTER TABLE page_stats ADD COLUMN clicks INTEGER NOT NULL DEFAULT 0;
