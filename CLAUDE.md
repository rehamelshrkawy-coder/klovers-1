# Klovers — Claude Code Instructions

## Before you build anything

**Check whether it already exists in `main` first.** This repo has been ported
between forks more than once, so features regularly land by a route other than
the PR you are looking at. In August 2026 three separate PRs were closed because
`main` already implemented them: one would have broken the build with duplicate
declarations, one would have regressed multi-currency pricing back to EGP-only.

Grep for the symbol name, the UI string, and the column name before writing code.

## Git workflow

- Branch as `claude/<short-description>`. The `claude/` prefix is what the
  auto-merge workflow matches on — any other prefix will never merge itself.
- Open a PR. Draft is fine; the automation marks it ready before merging.
- `.github/workflows/ci.yml` runs `npm test` and `npm run build` against the
  **merge result** (not the branch), then `.github/workflows/auto-merge.yml`
  squash-merges it into `main`.
- Vercel deploys `main` to kloversegy.com automatically. Supabase migrations and
  edge functions deploy via `deploy-functions.yml`.
- **Do not leave a PR open.** Anything sitting more than about a week against a
  moving `main` should be closed and rebuilt, not reconciled. Stale PRs here have
  a track record of being actively harmful, not merely useless.

## One PR, one concern

- **Never put a database migration in a feature PR.** Migrations get their own PR
  and their SQL is checked against what is actually live before merging. A
  migration bundled into a "fix the refresh button" PR nearly stripped
  `SET search_path` off a live trigger function.
- No strategy documents, scratch notes, or unreferenced modules in a code PR.

## Migrations

Local migration files and the remote migration history have diverged — filenames
in `supabase/migrations/` do not match the versions recorded in the database.
Before writing a migration:

1. Read the live object first (`pg_get_functiondef`, `information_schema.columns`).
2. If it already exists, do not "backfill" it into a migration file.
3. If you must replace a function, preserve every clause on the live version —
   especially `SET search_path`.

Supabase project ref: `ewtdgpbybkceokfohhyg`

## Known debt — expected, do not fix as a side quest

- `npm run lint`: 22 errors, ~579 warnings. Advisory in CI, not blocking.
- `npx tsc --noEmit`: fails on ~10 files (stale generated Supabase types, a
  too-narrow `LeadSource` union). Advisory in CI. Vite does not typecheck at
  build time, which is why production is unaffected.
- A dead Netlify integration (`preeminent-bienenstitch-afa306`) fails 4 checks on
  every PR. Ignore it. Only `CI / Build & Test` is a real signal.

## Project overview

Korean language learning platform targeting Arabic speakers and K-drama fans
(Egyptian / Middle East market).

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Supabase (Postgres + Edge Functions on Deno)
- AI: Lovable AI Gateway → `google/gemini-2.5-flash` (`LOVABLE_API_KEY`)
- Admin panel: `src/pages/AdminDashboard.tsx`

## Supabase functions

| Function | Purpose |
|---|---|
| `seo-orchestration` | Multi-agent SEO analysis (analyze/fix modes) |
| `image-audit` | EN/AR bilingual image alt text audit |
| `article-generator` | Generate up to 5 blog draft articles from topic gaps; accepts `ArticleSpec[]`, inserts as unpublished drafts |

## Token efficiency rules

- Triage runs locally (no AI tokens) first
- Only posts with gaps get queued for AI
- Batch up to 5 posts per AI call
- Never send full article content — title, description, keywords, headings only
