# Behind the Jersey

A fan-facing website that shows who really pays for the sponsors on sports jerseys, and rates each club's shirt with a blood level: **Clean, Spotted, Stained, Soaked**.

> **Preview.** The shirt photos and crests aren't cleared for public use yet (see [`public/assets/manifest.json`](public/assets/manifest.json)), and all ratings are illustrative until the method is agreed. The site is public at https://behind-the-jersey.org but asks search engines not to index it.

Built from the design handover in [`handover/`](handover/README.md): Next.js (App Router) + TypeScript, statically exported, CSS Modules with the design tokens as CSS custom properties, data validated with zod.

## Run it

Needs Node 22.12+ (24 LTS recommended, see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Validates the data, then writes the static site to `out/` |
| `npm run build:pages` | What GitHub Pages serves: the live site in `out/` plus the seed demo in `out/demo/` |
| `npm run preview` | Serves `out/` on http://localhost:4173 |
| `npm test` | Unit tests (Vitest): rating rule, league summaries, search, data checks, the team page view model (rows, headlines, why boxes, markers) and the "Tell the club" message |
| `npm run test:e2e` | Builds, serves `out/` and runs the Playwright tests (desktop 1440×900 and a phone) |
| `npm run validate:data` | Validates the configured data source against the schemas and checks references and assets |
| `npm run data:pull` | Downloads the latest release of Beyond-The-Jersey/data into `.data-release/` (`BTJ_DATA_RELEASE=<tag>` for another) |
| `npm run data:live` | Copies that release into `data/live/` and writes `data/live/REPORT.md`: what changes on the site |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `node scripts/visual-compare.mjs` | Side-by-side screenshots of each route and its design snapshot in `test-results/visual/` (site must be running, `--site <url>`) |

## Where the data comes from

Every page reads its content through [`lib/data`](lib/data/README.md), which loads 14 JSON files, validates them (zod, mirroring the data repo's [`schema/`](https://github.com/Beyond-The-Jersey/data/tree/main/schema)) and derives everything else (club levels, league summaries, the search index). Choose the source with `BTJ_DATA_SOURCE`:

| Source | Reads |
|---|---|
| `seed` (default) | [`data/seed/`](data/seed): every fact the designs use, with sources. `/demo/` and the tests use it. |
| `live` | [`data/live/`](data/live): a release of Beyond-The-Jersey/data, reviewed in a pull request. The live site uses it. |
| `release` | a release downloaded by `npm run data:pull`, in `.data-release/` (override with `BTJ_DATA_DIR`), before it's reviewed |
| `api` | `$BTJ_DATA_URL/<file>.json` over HTTP, with `$BTJ_DATA_TOKEN` as a bearer token if set, e.g. `https://github.com/Beyond-The-Jersey/data/releases/latest/download` |

[Beyond-The-Jersey/data](https://github.com/Beyond-The-Jersey/data) is where the data is edited, checked and reviewed: one JSON file per record, a schema, CI and a review agent on every pull request. Every merge there publishes a [release](https://github.com/Beyond-The-Jersey/data/releases) (JSON, CSV and a zip). The live site doesn't read a release directly: it's copied into [`data/live/`](data/live), which is committed, so every data update is a pull request here too, and nothing reaches the site unreviewed:

```bash
npm run data:pull   # download the latest release into .data-release/
npm run data:live   # copy it into data/live/ and write data/live/REPORT.md
```

[`data/live/REPORT.md`](data/live/REPORT.md) says what changes on the site compared with the data it replaces: club levels, sponsor ratings, clubs, sponsors, owners and claims added or removed, clubs whose kits change, and the data's warnings. Nothing is fixed on the way: a data error is fixed in the data repo, and the next release brings it here.

**The website update workflow** ([`.github/workflows/data-update.yml`](.github/workflows/data-update.yml)) does this every morning and on demand: it pulls the latest release, and if anything changed it runs the tests, builds the site, takes screenshots of the club pages whose level changes, and opens a pull request with the report. A maintainer reviews it and merges; the merge deploys.

Club levels are never stored: they're derived from the sponsors' tiers and where they sit on the shirt ([`lib/data/rating.ts`](lib/data/rating.ts), the draft rule from the handover). `kits[].levelOverride` exists for exceptions.

## Adding content

Real content goes into [Beyond-The-Jersey/data](https://github.com/Beyond-The-Jersey/data), one file per record, as its [CONTRIBUTING.md](https://github.com/Beyond-The-Jersey/data/blob/main/CONTRIBUTING.md) explains; it reaches the site with the next release. `data/seed/` is the design's data for `/demo/` and the tests; run `npm run validate:data` after changing it. The fields are the same in both:

- **Club:** add it to `clubs.json` with an ASCII kebab-case `id`, `leagueId` and `aliases` (what fans type: "spurs", "gunners"). Put the crest at `public/assets/crests/<id>.png` (200×200 PNG) and set `crest: "assets/crests/<id>.png"`, or `null` to show initials.
- **Kit:** one entry per club per season, or per period when nothing changed (`periodFrom`/`periodTo`, `periodLabel` "2006/07 – 2017/18"). List each sponsor with its `placement` and a `source`. For a team page, add front and back photos (720×800 on white) under `public/assets/shirts/<club>/<season>-home-{front,back}.jpg` and give every sponsor `side` (`front` or `back`: which photo) and a `hotspot`: the logo's centre and size as fractions of the photo. Measure the logo box in pixels and divide by 720 and 800; a logo centred at (369, 314) and 266×104 px is `{ "x": 0.513, "y": 0.393, "w": 0.37, "h": 0.13 }`. Every club has a page at `/clubs/<id>/`; with both photos and every hotspot its shirt gets numbered markers, with only a photo (`front` or `square`) the photo is shown without markers, and without one a placeholder. `cardSlot` is no longer used. Optional: `headline` (the sentence under the club name, with `{level}`; otherwise it's built from the worst sponsor) and `shortLine` (the line in "Travel back in time").
- **Sponsor:** add it to `sponsors.json` with `tier: "unrated"` and `status: "unrated"` until it's been researched. A tier of concern or worse needs `ownerId` and at least one claim.
- **Owner:** `owners.json`, with `parentId` up to the state (e.g. Riyadh Air → `saudi-pif` → `government-of-saudi-arabia`).
- **Claim:** `claims.json`: one sourced statement about an owner, `source: { name, date, url }`. Link it from the sponsor's `claimIds`. Set `reviewed: true` only once a person checked it.
- **Deal (money):** `deals.json`, always "reported" with a source; `value: null` shows "Value not disclosed".
- **Change:** `changes.json`. The landing page shows the newest four (by month; within a month, file order).
- **Dropped:** `dropped.json` with `featured: true` to show it on the landing page. Items about an organisation rather than a club use `orgName` and `leagueId`.
- **Why is that a problem?** `sponsors[].why`: a short paragraph, the claims it rests on (they must be about the sponsor's own owner chain; validation checks it), the one sentence for the "Tell {club}" message, and `status` (`draft` until the team has reviewed it). Only sponsors rated serious or severe show it, and the site never writes one itself. `ownerVerb` (`owned by` or `paid for by`) sets how sentences name the owner.
- **Departed sponsors:** a sponsor rated concern or worse on the previous kit and missing from the current one shows as a teal "Left in …" row. `deals[].endedOn` (`YYYY-MM`) gives the month; `source.short` is the short source name next to a deal value.
- **Contacts:** `clubs[].contact` (`{ kind, email?, url?, source }`) is where "Tell {club}" sends the message: `mailto:` with an email, otherwise a dialog to copy the message (and a link to the contact page if there is one). `contacts.json` channels are used when `contact` is empty. No placeholders or guessed addresses: validation rejects them.

## Configuration

Copy `.env.example` to `.env.local`.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_REPO_URL` | `https://github.com/Beyond-The-Jersey/data` | The open data: "Open data on GitHub", "Sources", the contribute section, "Every change, with sources", the Follow dialog, and the "Help check" issue links (its "Check a club" and "Check a sponsor" forms). |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Absolute URLs for Open Graph images |
| `NEXT_PUBLIC_SHOW_TEAM_CREST` | `true` | The crest next to the club name on team pages (a test feature) |
| `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_DEMO` | unset | Set by `build:pages` for the `/demo/` copy |
| `NEXT_PUBLIC_FOLLOW_ROW` | `true` | The "Follow {club}" row on team pages. Alerts aren't live, so it opens a dialog pointing to the open data. |
| `BTJ_DATA_SOURCE`, `BTJ_DATA_DIR`, `BTJ_DATA_URL`, `BTJ_DATA_TOKEN` | `seed` | See above |

## Deploying

The site is on GitHub Pages at **https://behind-the-jersey.org**. [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds and deploys `main` after CI passes (or on demand from the Actions tab). It runs `npm run build:pages`, which builds two copies:

- `/`: the live site, from `data/live` (`LIVE_DATA_SOURCE` in `pages.yml`; `repo` would read the data repo at build time and needs a `DATA_REPO_TOKEN` secret while it's private).
- `/demo/`: always the seed data from the design handover, with a banner saying so. It's built with `NEXT_PUBLIC_BASE_PATH=/demo`.
 The custom domain is set in the repo's Pages settings; DNS is at Gandi (apex `A`/`AAAA` records to GitHub Pages, `www` as a `CNAME` to `beyond-the-jersey.github.io`).

`npm run build` writes a fully static site to `out/`, so any static host works. Routes end in `/` (`trailingSlash`), and a post-build step gives the Open Graph images a `.png` extension so static hosts serve them as images.

Pages are still marked `noindex` (see `app/layout.tsx`) until the team clears the image rights and the rating method.

## Layout

```
app/                 routes: / · /soccer/[league] · /[sport] · /clubs/[slug] (+ opengraph-image, fact-sheet/)
components/          shared components; overview/ and team/ for the two big pages
lib/copy/team-page.ts  every fixed string on the team page
lib/messages.ts      the "Tell {club}" draft message
lib/data/            data layer (see its README)
lib/search.ts        search matching (runs in the browser)
lib/og/              share-card rendering and the TTF it needs (SIL OFL)
data/seed/           the design's data: /demo/ and the tests
data/live/           the live site's data: a release of Beyond-The-Jersey/data (npm run data:live)
e2e/, tests/         Playwright and Vitest
handover/            the design handover as received (docs, snapshots, design source, assets); update-v3/ is the team page update
public/assets/       crests and shirt photos from the handover (not cleared for public use)
app/fonts/           Big Shoulders Display, self-hosted and bundled by Next (SIL OFL; licence in OFL.txt)
```

## Differences from the design we chose to keep

Compared with `handover/design/static/*` and `handover/update-v3/design/static/*` at 1440px:

- **Data over design copy.** Where the data says something different, the page follows the data: source lines name the actual source (the Arsenal renewal cites Inside World Football), club short names come from `clubs.json` ("Palace", "Forest"), league notes are the full sentences from `leagues.json`, PSG shows up in the Ligue 1 strip, the Visit Rwanda card lists all five sourced claims, and placements show dates from the deals ("Sleeve · 2018–2026", "from 2026/27").
- **"[DEAL VALUE]"** is shown as "Value not disclosed". Known values show the reported amount, the USD approximation and the source.
- **Overview "They dropped it"** uses the landing page's teal cards, filtered to the league, as the handover recommends, instead of the older stamp style.
- **Team pages have the standard footer** with the photo licensing note. The design source has no footer there.
- **Header links without a destination** ("Sources", "About") point to the repo and the contribute section. "About" is dropped.
- **Team page v3** (`handover/update-v3/UPDATE.md`) replaced the first design's stage, cards and timeline. Where the v3 mockup and the data disagree, the page follows the data: "Up to £70m a year" (not "a season"), the claim's own wording ("were given life sentences"), "Visit Rwanda left Arsenal's sleeve in 2026" (the spec asks for the year instead of "this summer"), other clubs by their short names ("Bayern Munich, Schalke 04 and Man Utd"), and the Soaked tooltip says "Arsenal was here in 2018/19 – 2025/26" (the spec's rule) rather than "until June 2026".
- **Source lines without a link** show no "↗": the claims in the seed have no URLs yet, and an arrow that goes nowhere would promise a link.
- **Tier chips hug their text** (the spec) rather than stretching across the column (the mockup).
- **Every club has a page**, not only the three with marked-up shirt photos: the same template shows the photo without markers when the logos aren't marked, a placeholder when there's no photo, and "We haven't recorded the sponsors on {club}'s shirt yet" with a "Help check {club}" row when there's no kit at all. Every club card, tile and deal row links to it.
- **Other sports** (basketball, American football, baseball, motorsport, cycling, tournaments) show each league like a soccer league, grouped by level, above the list of known deals.
- **Long club names** ("Atlético de Madrid") put the rating scale under the name instead of beside it; so does any window where the left column is narrower than 700px.
- **Two small contrast fixes:** "FRONT" on the white shirt panel and the small labels in the "Tell {club}" card are one shade lighter/darker than the mockup, to reach 4.5:1.
- **Not designed, kept minimal:** the old-shirt notice, the "Tell {club}" dialog (no checked address yet, so it offers the draft to copy), the Follow dialog, the "Link copied" toast, the fact sheet at `/clubs/[slug]/fact-sheet/`, the notes on an old shirt's rating scale ("{club} is here now"), and the phone layout (UPDATE.md §10).
- **Search icons** use generic initials (EA, RA) rather than the hand-picked codes (EY, RX).
- **"Tell {club}" says where the message goes:** the design's text (to the supporter liaison officer) only when the club publishes one; otherwise "send it from your own email" for a general fan inbox, or "send it to the club yourself" when no fan-facing address is on file. Ticket offices, shops, hospitality, legal inboxes and named staff are never used.
- **The numbers on the shirt are part of the click target.** UPDATE.md §5.8 has them ignore the pointer, but small logos put the number above the logo, outside its hit area, so hovering or clicking the number did nothing. Each sponsor is now one button: the area over the logo with its number inside.
- **"Nothing found" sponsors get a dark marker with a solid ring**, not the red one: red is for concern or worse.
- **"Share the card"** uses the phone's share sheet or copies a link. The link's preview is the club's share card.
- **Page heights** are natural. The design artboards have fixed heights with extra space before the footer.

## Open questions for the team

See [`handover/docs/07-open-questions.md`](handover/docs/07-open-questions.md), plus:

- "Your chest. Their ad." uses the design's dark red `#8a2a22`, about 2.3:1 on the background. That's below the 4.5:1 contrast rule; it's deliberately quiet. Keep it or lighten it?
- From the v3 update (UPDATE.md §13): no checked club contacts yet; "fans speaking up is part of why" needs a source per club named (or softer wording); the Human Rights Watch link for `uae-mass-trial-2024` is still missing; the why texts and message lines are drafts.
