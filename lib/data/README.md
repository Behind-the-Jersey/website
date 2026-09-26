# lib/data: the data layer

Pages never read JSON themselves. They call `getDataset()` from `lib/data` and the selectors in `derive.ts`.

```
source.ts        where the files come from (seed, repo checkout, HTTP)
schema.ts        zod schemas, mirroring the data repo's schema/*.schema.json
checks.ts        cross-file checks: references, tiers need claims, hotspots need a side, why texts cite the sponsor's own owner
index.ts         loadDataset(): load → validate → check → Dataset with lookup maps (memoised per build)
dataset.ts       the Dataset type and lookup maps
rating.ts        levelForKit(): the draft rating rule (illustrative until the method is agreed)
derive.ts        selectors and view models: currentKit, clubLevel, leagueSummary, latestChanges…
team.ts          the team page (v3): sponsorRows, headlineFor, whyBoxes, scaleNote, markerPosition,
                 actionIntroExamples, teamPage, factSheet
search-index.ts  builds the search index at build time (matching lives in lib/search.ts)
```

## Choosing a source

| `BTJ_DATA_SOURCE` | Reads | Notes |
|---|---|---|
| `seed` (default) | `data/seed/*.json` | The facts the designs use. Also the test fixtures and `/demo/`. |
| `live` | `data/live/*.json` | The live site: a release of the data repo, copied in by `npm run data:live` and reviewed in a pull request (see the main README). |
| `release` | `$BTJ_DATA_DIR` (default `.data-release`) | A release downloaded by `npm run data:pull`. |
| `api` | `$BTJ_DATA_URL/<file>.json` | Sends `$BTJ_DATA_TOKEN` as a bearer token if set. Works with `https://github.com/Beyond-The-Jersey/data/releases/latest/download`. |

Every source must provide the same 14 files: `meta`, `levels`, `tiers`, `sports`, `leagues`, `clubs`, `owners`, `claims`, `sponsors`, `kits`, `deals`, `changes`, `dropped`, `contacts`. `contacts` and `meta` may be missing: contacts default to none, and `meta.updatedAt` falls back to the newest change date.

`npm run validate:data` validates whichever source is configured. `npm run build` runs it first, so broken data fails the build.

## The data repo (Beyond-The-Jersey/data)

The data is edited in [Beyond-The-Jersey/data](https://github.com/Beyond-The-Jersey/data), one JSON file per record, and published as releases with the same 14 files this layer reads. Its JSON Schemas (`schema/`) are the contract; `schema.ts` mirrors them and `checks.ts` mirrors its `scripts/validate.py`. When the contract changes there, change it here in the same step. If a release ever drifts from what the pages need, add a mapping step in `source.ts` (a `RawFiles → RawFiles` transform) rather than changing pages.

## Adding content

See the README at the repo root.
