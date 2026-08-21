-- Multi-language published pages.
--
-- `projects.lang` keeps its meaning but is now explicitly the *primary*
-- language: the one `projects.content` is written in. `translations` holds a
-- ProjectContent per additional language, keyed by language code, and never a
-- copy of the primary one — the set of languages a page offers is
-- `[lang, ...Object.keys(translations)]`.
--
-- A column rather than reshaping `content` into `{ en: …, zh: … }`: every
-- existing row, the MCP `content` contract and every template that reads a
-- ProjectContent keep working untouched, and a page with no translation costs
-- nothing.

ALTER TABLE projects ADD COLUMN translations TEXT NOT NULL DEFAULT '{}';

-- `{ "zh": { "title": "…", "options": ["…"] } }` — the questions asked after
-- someone joins are visitor-facing copy too.
ALTER TABLE questions ADD COLUMN translations TEXT NOT NULL DEFAULT '{}';
