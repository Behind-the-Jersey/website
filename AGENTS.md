# AGENTS.md

Rules for AI agents working in this repository. OpenCode, Codex, Cursor and similar tools load this file automatically; Claude Code loads it through `CLAUDE.md`. They apply to every task, however small, and whoever runs you.

## Every change goes through a pull request

**Never push to `main`. Never merge, approve or close a pull request.** A maintainer reviews and merges, and the merge deploys the live site at behind-the-jersey.org. This holds even when your token could do it: don't use admin rights, `gh pr merge`, `--admin`, `--force` or a direct push.

```bash
git fetch origin
git switch -c <kind>/<short-name> origin/main     # e.g. fix/team-page-marker, feat/overview-filter
# … make the change …
npm run lint && npm run typecheck && npm test      # and npm run test:e2e for anything a page shows
git add <files> && git commit -m "…"
git push -u origin HEAD
gh pr create --base main --fill
```

Before you finish, check:
- `git branch --show-current` is **not** `main`;
- `gh pr view` shows your pull request.

**If you committed or pushed to `main` by mistake:** stop. Don't try to repair `main`, force-push, or revert on it. Tell the person running you, with the commit id. A maintainer fixes it.

## What belongs here, and what doesn't

- **Data doesn't belong here.** Clubs, kits, sponsors, owners, claims and sources are edited in [Behind-the-Jersey/data](https://github.com/Behind-the-Jersey/data) through its own pull requests; its [`AGENTS.md`](https://github.com/Behind-the-Jersey/data/blob/main/AGENTS.md) has the rules.
  - Never edit `data/live/` by hand. The update workflow (`.github/workflows/data-update.yml`) brings each data release in through a pull request.
  - `data/seed/` is the design's demo data. Don't add real data to it.
- **No bulk images.** Don't commit crests, kit photos or other images under `public/assets/` without a maintainer asking for them. They aren't cleared for public use (`public/assets/manifest.json`), and one bulk commit replaced the design's crests before.
- **Keep the design.** [`CLAUDE.md`](CLAUDE.md) and `handover/` describe the site; the copy is part of the design; never invent facts, sources or ratings.
- **Keep pull requests small:** one change each, with the checks passing.
