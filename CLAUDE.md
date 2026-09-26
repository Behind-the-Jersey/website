# CLAUDE.md: Behind the Jersey

> **This repo, as built so far (25 Sep 2026).** The site lives at the repo root (Next.js 16, static export, Node 24 via `.nvmrc`); the handovers are kept as received in `handover/` (the team page v3 update in `handover/update-v3/`). Data goes through `lib/data` (see `lib/data/README.md`), from `data/seed` by default (tests, `/demo/`). The live site builds from `data/live`: a release of the data repo (Beyond-The-Jersey/data, where the data, its JSON Schemas and its checks now live), copied in by `npm run data:pull && npm run data:live` and reviewed as a pull request (`.github/workflows/data-update.yml` opens it); read `data/live/REPORT.md` after every update. Fix data errors in the data repo, not here. `README.md` lists the differences from the design we chose to keep. Checks: `npm run build`, `npm test`, `npm run test:e2e`, `node scripts/visual-compare.mjs --site <url>`.

You are implementing **Behind the Jersey**, a fan-facing website that shows who really pays for the sponsors on sports jerseys. It rates each club with a blood level: Clean, Spotted, Stained, Soaked. The design is finished for five pages. Your job is to build them as a real, data-driven website and connect them to the data that exists.

Read this file first, then the docs in this order:

1. `handover/docs/01-project-brief.md`: what we are building and why, the background research, the tone, and every design decision so far. **Read it fully before writing code.**
2. `handover/docs/02-implementation-plan.md`: milestones, tasks and acceptance criteria. Work through it in order.
3. `handover/docs/03-page-specs.md`: exact layout, copy and states for each page.
4. `handover/docs/04-design-system.md`: colours, type, spacing and shared components.
5. `handover/docs/05-data-model.md`: entities, JSON files, the rating rule, and how to plug in real data and pipelines.
6. `handover/docs/06-interactions.md`: search, the rotating headline, and the team-page hover behaviour (including the hover-intent algorithm).
7. `handover/docs/07-open-questions.md`: caveats, placeholders and things you must not invent.

## What is in this folder

| Path | What it is | How to use it |
|---|---|---|
| `handover/design/static/*.html` | Static snapshots of every page and key state, rendered from the design source, images included | **The visual target.** Open them in a browser at 1440px wide and match them. |
| `handover/design/source/*.dc.html` | The original design components (markup, inline styles and JS logic) | **The source of truth** for exact styles, copy and behaviour. See `handover/design/README.md` for how to read them. |
| `handover/assets/` (copied to `public/assets/`) | Club crests and real shirt photos, plus `manifest.json` | Copy into the app's public folder. **Not cleared for public use** (see licensing below). |
| `data/seed/*.json` | All the data the designs use, normalised, with sources | Use as the first data source and as test fixtures. |
| `data/schema/*.schema.json` | JSON Schemas for every seed file | Moved to the data repo's `schema/` (one per record). `lib/data/schema.ts` mirrors them. |

## Pages to build (scope of this handover)

1. **Landing page** `/`. Snapshots: `handover/design/static/landing.html`, `landing--search-open.html`. Source: `Landing.dc.html`.
2. **Soccer overview, club crests version** `/soccer/[league]` (default `premier-league`). Snapshots: `overview-premier-league.html`, `overview-la-liga.html`. Source: `Overview.dc.html` with `view="crests"`, wrapped by `Overview-crests.dc.html`.
3. Team pages `/clubs/[slug]`: **v3 two-column layout**, see `handover/update-v3/UPDATE.md`. The old stage, cards, lines, hover intent and timeline were removed on purpose. Every club has one; clubs without marked-up photos get the same page with the photo alone or a placeholder.

Out of scope for now, parked: the money-flow section (`handover/design/source/parked/MoneyFlow.dc.html`), the mobile "Label" scan feature, the "Follow the Money" story page, "next chance to drop it", and email alerts. Don't build these unless asked.

## Stack (default: adapt if the repo already has one)

- If this repository already has a framework, data folder, pipelines or agents, **use and extend what exists**. Don't start a parallel app.
- Otherwise use **Next.js (App Router) + TypeScript**, statically generated (`output: 'export'` is fine). Use **CSS Modules plus CSS custom properties** for the tokens in `handover/docs/04-design-system.md`. No UI kit, no Tailwind unless the repo already uses it.
- Validate data with **zod** (mirroring `data/schema`) inside a small data-access layer (`lib/data/`), so the source can be swapped from seed JSON to the real open-data repo or an API without touching pages.
- Tests: **Vitest** for the rating rule, the search ranking and the data loaders. **Playwright** for page smoke tests and a visual comparison against `handover/design/static/*` at 1440×900.
- Fonts from Google Fonts: Big Shoulders Display (700/800/900), Schibsted Grotesk (400/500/700), IBM Plex Mono (400/600). Use `next/font` or equivalent.

## Non-negotiable rules

1. **Never invent facts, numbers, sources, ratings or deal values.** Every claim shown must come from the data with its source. Show unknown values as "value not disclosed" or "Not rated yet". Show missing sources as a visible TODO in development, and never as a made-up citation.
2. **Ratings are illustrative until the method is agreed.** Keep the "ratings are illustrative" footer line until the team says otherwise.
3. **Derive club levels from sponsors** using the rule in `handover/docs/05-data-model.md`. Don't hard-code levels in components. `levelOverride` exists in the data model for exceptions but should rarely be needed.
4. **Tone:** factual, never mocking clubs or fans. Positive changes are celebrated in teal. Don't add blood splatter to shirts: the team explicitly removed it.
5. **Copy is part of the design.** Use the exact headings and sentences from the specs and snapshots unless data replaces them. The main headline is "Who's buying your ___?", rotating *shirt → shoes → stadium → game → league → club → loyalty*. Never use the word "race" in it.
6. **Accessibility:** real links and buttons, a keyboard path to everything that has a hover, visible focus states, and `prefers-reduced-motion` stops the headline rotation (show "loyalty"). Text contrast is at least 4.5:1.
7. **Images:** the shirt photos (footballkitarchive.com, footyheadlines.com) and crests (football-data.org) are fine for a prototype but not cleared for public launch. Keep `public/assets/manifest.json` licensing notes with them and don't deploy publicly without the team's OK.
8. The designs are desktop at 1440px. Build responsive layouts that keep the same hierarchy on mobile, following the notes in `handover/docs/03-page-specs.md`, and don't invent new sections.

## Definition of done for this handover

- All five pages render from data, with the states shown in `handover/design/static/` reproducible (search open), and the team page states in `handover/update-v3/design/static/`.
- They look like the snapshots at 1440px: same layout, type, colours and copy, with only small differences.
- Search works across clubs, leagues, sports and sponsors with the matching rules in `handover/docs/06-interactions.md`.
- Team pages match `update-v3/design/screenshots/` for Arsenal, and follow UPDATE.md §8 for Atlético and Villa.
- Data is loaded through `lib/data`, validated, and switchable to the real source. The adapter for any existing data you find is written and documented.
- `npm run build`, `npm test` and `npm run test:e2e` pass. The README explains how to run the site, where the data comes from and how to add a club.

## How to work

- Start with milestone 0 in `handover/docs/02-implementation-plan.md`. Before coding, **look for existing data, pipelines or agents** in this repo or its organisation. If a GitHub data repository or API exists, ask the user for access or its URL and write an adapter to the schema in `data/schema`.
- Commit in small steps per milestone. After each milestone, compare against the snapshots and list any differences you chose to keep.
- When the design and data disagree, follow the data and tell the user. When the specs are silent, follow the static snapshot. When both are silent, ask.
