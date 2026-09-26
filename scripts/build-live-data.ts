// Builds data/live/, the data the live site uses, from a release of Beyond-The-Jersey/data.
//
//   npm run data:pull   # the latest release into .data-release/ (BTJ_DATA_RELEASE=<tag> for another)
//   npm run data:live   # check it and write data/live/ and data/live/REPORT.md
//
// The data repo checks and fixes its data before it publishes a release, so nothing is changed
// here: the files are copied as they are. REPORT.md says what changes on the site compared with the
// data/live it replaces (club levels, ratings, sponsors, claims), for the person reviewing the
// pull request. The website update workflow (.github/workflows/data-update.yml) runs both steps.
import fs from 'node:fs';
import path from 'node:path';
import { loadDataset, type Dataset } from '../lib/data';
import { clubHref, clubLevel } from '../lib/data/derive';
import { DATA_FILES } from '../lib/data/schema';
import { DirectorySource } from '../lib/data/source';

const IN = path.resolve(process.env.BTJ_DATA_DIR ?? '.data-release');
const OUT = path.resolve('data', 'live');
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://behind-the-jersey.org';
const LIST_MAX = 40;

const release = fs.existsSync(path.join(IN, 'RELEASE'))
  ? fs.readFileSync(path.join(IN, 'RELEASE'), 'utf8').trim()
  : null;

async function load(dir: string, name: string) {
  return loadDataset({ source: new DirectorySource(name, dir) });
}

async function previous(): Promise<Dataset | null> {
  if (!fs.existsSync(path.join(OUT, 'clubs.json'))) return null;
  try {
    return (await load(OUT, 'previous live')).dataset;
  } catch {
    return null; // The old files no longer validate: report everything as new.
  }
}

type Row = { id: string };
const ids = <T extends Row>(xs: T[]) => new Set(xs.map((x) => x.id));
const added = <T extends Row>(before: T[], after: T[]) => after.filter((x) => !ids(before).has(x.id));
const removed = <T extends Row>(before: T[], after: T[]) => before.filter((x) => !ids(after).has(x.id));
/** Records in both whose `key` differs (the whole record by default). */
const changed = <T extends Row>(before: T[], after: T[], key: (x: T) => unknown = (x) => x) => {
  const old = new Map(before.map((x) => [x.id, JSON.stringify(key(x))]));
  return after.filter((x) => old.has(x.id) && old.get(x.id) !== JSON.stringify(key(x)));
};

function list(items: string[]): string[] {
  const shown = items.slice(0, LIST_MAX).map((i) => `- ${i}`);
  if (items.length > LIST_MAX) shown.push(`- … and ${items.length - LIST_MAX} more`);
  return shown;
}

/** Clubs whose page changes: the level first, then the kits. For screenshots in the update workflow. */
interface PagesToCheck {
  levelChanged: string[];
  kitsChanged: string[];
}

function report(before: Dataset | null, after: Dataset, warnings: string[]): { text: string; pages: PagesToCheck } {
  const b = before;
  const pages: PagesToCheck = { levelChanged: [], kitsChanged: [] };
  const levelWord = (ds: Dataset, id: string) => {
    const l = clubLevel(ds, id);
    return ds.byId.level.get(l)?.label ?? l;
  };
  const clubName = (ds: Dataset, id: string) => ds.byId.club.get(id)?.name ?? id;
  const leagueOf = (ds: Dataset, id: string) => ds.byId.league.get(ds.byId.club.get(id)?.leagueId ?? '')?.name ?? '';
  const page = (id: string) => `${SITE}${clubHref({ id })}`;
  const sections: [string, string[]][] = [];
  const review = b ? changed(b.claims, after.claims, (c) => c.reviewed) : [];
  const reviewNote = review.length
    ? `Review status: ${review.filter((c) => c.reviewed).length} claims now checked against their source by a person, ${review.filter((c) => !c.reviewed).length} no longer marked as checked.`
    : null;

  if (b) {
    const levelClubs = after.clubs.filter(
      (c) => b.byId.club.has(c.id) && clubLevel(b, c.id) !== clubLevel(after, c.id),
    );
    pages.levelChanged = levelClubs.map((c) => c.id);
    const levels = levelClubs.map(
      (c) =>
        `[${c.name}](${page(c.id)}) (${leagueOf(after, c.id)}): ${levelWord(b, c.id)} → **${levelWord(after, c.id)}**`,
    );
    sections.push(['Club levels that change', levels]);

    const tiers = after.sponsors
      .filter((s) => {
        const o = b.byId.sponsor.get(s.id);
        return o && (o.tier !== s.tier || o.status !== s.status);
      })
      .map((s) => {
        const o = b.byId.sponsor.get(s.id)!;
        return `${s.name}: ${o.tier} (${o.status}) → **${s.tier}** (${s.status})`;
      });
    sections.push(['Sponsor ratings that change', tiers]);

    sections.push([
      'Clubs added',
      added(b.clubs, after.clubs).map(
        (c) => `[${c.name}](${page(c.id)}) (${leagueOf(after, c.id)}): ${levelWord(after, c.id)}`,
      ),
    ]);
    sections.push(['Clubs removed', removed(b.clubs, after.clubs).map((c) => `${c.name} (${c.id})`)]);
    sections.push(['Sponsors added', added(b.sponsors, after.sponsors).map((s) => `${s.name}: ${s.tier}`)]);
    sections.push(['Sponsors removed', removed(b.sponsors, after.sponsors).map((s) => `${s.name} (${s.id})`)]);
    sections.push(['Owners added', added(b.owners, after.owners).map((o) => `${o.name} (${o.id})`)]);
    sections.push(['Owners removed', removed(b.owners, after.owners).map((o) => `${o.name} (${o.id})`)]);
    sections.push(['Claims added', added(b.claims, after.claims).map((c) => `${c.id}: ${c.text}`)]);
    sections.push(['Claims removed', removed(b.claims, after.claims).map((c) => `${c.id}: ${c.text}`)]);
    sections.push([
      'Claims edited',
      changed(b.claims, after.claims, (c) => [c.text, c.short, c.ownerIds, c.source]).map((c) => `${c.id}: ${c.text}`),
    ]);
    const kitClubs = [
      ...new Set(
        [...added(b.kits, after.kits), ...removed(b.kits, after.kits), ...changed(b.kits, after.kits)].map(
          (k) => k.clubId,
        ),
      ),
    ];
    pages.kitsChanged = kitClubs.filter((id) => after.byId.club.has(id));
    sections.push(['Clubs whose kits change', kitClubs.map((id) => `[${clubName(after, id)}](${page(id)})`)]);
  }
  sections.push(['Warnings', warnings]);

  const kinds = ['clubs', 'kits', 'sponsors', 'owners', 'claims', 'deals', 'contacts'] as const;
  const count = (ds: Dataset, k: (typeof kinds)[number]) => String(ds[k].length);
  const text = [
    '# data/live',
    '',
    `Release ${release ? `\`${release}\`` : '(unknown)'} of [Beyond-The-Jersey/data](https://github.com/Beyond-The-Jersey/data), built from \`${after.meta.sourceCommit ?? '?'}\`, data updated ${after.meta.updatedAt}. Written by \`npm run data:live\`; don't edit these files by hand: fix the data repo and pull a new release.`,
    '',
    b
      ? `Compared with the data it replaces (\`${b.meta.sourceCommit ?? '?'}\`, updated ${b.meta.updatedAt}):`
      : 'No earlier data/live to compare with.',
    '',
    `| | ${kinds.join(' | ')} |`,
    `|---|${kinds.map(() => '---:').join('|')}|`,
    ...(b ? [`| before | ${kinds.map((k) => count(b, k)).join(' | ')} |`] : []),
    `| after | ${kinds.map((k) => count(after, k)).join(' | ')} |`,
    '',
    ...(reviewNote ? [reviewNote, ''] : []),
    ...sections.flatMap(([title, items]) =>
      items.length ? [`## ${title} (${items.length})`, '', ...list(items), ''] : [],
    ),
  ].join('\n');
  return { text, pages };
}

async function main() {
  if (!fs.existsSync(path.join(IN, 'clubs.json'))) {
    throw new Error(`No release in ${IN}. Run \`npm run data:pull\` first.`);
  }
  // Validates the release the way the site will read it, before anything is replaced.
  const { dataset, warnings } = await load(IN, `release ${release ?? IN}`);
  const before = await previous();

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of DATA_FILES) {
    const from = path.join(IN, `${name}.json`);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(OUT, `${name}.json`));
  }
  const { text, pages } = report(before, dataset, warnings);
  fs.writeFileSync(path.join(OUT, 'REPORT.md'), text);
  // Not committed: next to the release, for the update workflow's screenshots.
  fs.writeFileSync(path.join(IN, 'pages-to-check.json'), `${JSON.stringify(pages, null, 2)}\n`);
  const summary = text
    .split('\n')
    .filter((l) => l.startsWith('## '))
    .map((l) => l.slice(3));
  console.log(`data/live from ${release ?? IN}: ${summary.join(', ') || 'no changes'}. See data/live/REPORT.md.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
