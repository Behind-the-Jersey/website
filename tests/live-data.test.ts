// data/live: the data repo's release as the live site uses it (npm run data:live). These guard what
// the data repo fixed before publishing, and what the site does with the data.
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadDataset, type Dataset } from '@/lib/data';
import { clubLevel, clubsToCheck, hasMarkedShirt } from '@/lib/data/derive';
import { contactFor, teamPage } from '@/lib/data/team';
import { DirectorySource, LIVE_DIR } from '@/lib/data/source';

let ds: Dataset;
let warnings: string[];
beforeAll(async () => {
  ({ dataset: ds, warnings } = await loadDataset({ source: new DirectorySource('live', LIVE_DIR) }));
});

const allText = () =>
  fs
    .readdirSync(LIVE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => fs.readFileSync(path.join(LIVE_DIR, f), 'utf8'))
    .join('\n');

describe('data/live', () => {
  it('validates, with only draft and missing-link warnings', () => {
    expect(ds.clubs.length).toBeGreaterThan(200);
    for (const w of warnings) expect(w).toMatch(/why text is a draft|has no URL yet/);
  });

  it('has no placeholder sources or guessed claims', () => {
    expect(allText()).not.toMatch(/example\.(com|org|net)/);
    expect(ds.claims.some((c) => /^inference/i.test(c.source?.name ?? ''))).toBe(false);
  });

  it('writes season kits with season periods', () => {
    for (const k of ds.kits.filter((k) => /^\d{4}-\d{2}$/.test(k.season ?? ''))) {
      expect(k.periodFrom).toMatch(/^\d{4}-\d{2}$/);
      expect(k.periodTo).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('keeps the three team pages, with the design’s copy where it still fits', () => {
    expect(ds.clubs.filter((c) => hasMarkedShirt(ds, c.id)).map((c) => c.id)).toEqual([
      'arsenal',
      'aston-villa',
      'atletico-de-madrid',
    ]);
    const arsenal = teamPage(ds, 'arsenal')!;
    const now = arsenal.periods[arsenal.current];
    expect(now.headline.text).toBe(
      'The shirt is Stained: the front sponsor, Emirates, is owned by the Government of Dubai.',
    );
    expect(now.why.map((w) => w.sponsorId)).toEqual(['emirates']);
    expect(now.why[0].source?.url).toMatch(/^https:\/\/www\.hrw\.org\//);
    expect(now.rows.map((r) => [r.name, r.tier])).toEqual([
      ['Emirates', 'serious'],
      ['Deel', 'none'],
    ]);
    // Villa's old shirt is rated now, so the design's "not rated yet" headline isn't used.
    const villaOld = teamPage(ds, 'aston-villa')!.periods[0];
    expect(clubLevel(ds, 'aston-villa')).toBe('soaked');
    expect(villaOld.headline.text).toBe('The shirt was Clean: we checked every sponsor and found nothing.');
  });

  it('sends "Tell {club}" only to addresses meant for fans', () => {
    const c = (id: string) => contactFor(ds, ds.byId.club.get(id)!);
    // Arsenal's only listed form is for hospitality bookings.
    expect(c('arsenal')).toEqual({ kind: null, email: null, url: null });
    expect(c('juventus').kind).toBe('supporter-liaison');
    expect(c('atletico-de-madrid')).toMatchObject({ kind: 'general', email: 'socios@atleticodemadrid.com' });
    for (const club of ds.clubs) {
      const { email, url } = c(club.id);
      expect(email ?? '').not.toMatch(/ticket|tix|sales|media|press|shop|store|legal|lopd|webmaster/i);
      // No named members of staff (first.last@), which some clubs list for sales.
      expect(email ?? '').not.toMatch(/^(?!contact\.us@)[a-z]+\.[a-z]+@/i);
      expect(url ?? '').not.toMatch(/ticket|meeting|event|hospitality|impressum|aviso-legal/i);
    }
  });

  it('holds ratings that rest on state ownership alone, but keeps what we know', () => {
    const t = teamPage(ds, 'udinese')!;
    const row = t.periods[t.current].rows.find((r) => r.sponsorId === 'io-sono-friuli-venezia-giulia')!;
    expect(row.tier).toBe('unrated');
    expect(row.held).toBe(true);
    expect(row.payer).toMatch(/Friuli Venezia Giulia/);
    expect(row.evidence.length).toBeGreaterThan(0);
    expect(row.evidence[0].text).not.toMatch(/serious|state-owner rule|Human-rights relevance/);
    expect(clubLevel(ds, 'udinese')).not.toBe('stained');
    // Only the three with broken evidence links are still rated serious or severe without a why text.
    const unsupported = ds.sponsors.filter((s) => (s.tier === 'serious' || s.tier === 'severe') && !s.why);
    expect(unsupported.map((s) => s.id).sort()).toEqual(['gazprom', 'qatar-airways-global', 'valvoline']);
  });

  it('offers a full list of clubs to check, from the big five leagues first', () => {
    const { pick, more, notStarted } = clubsToCheck(ds, 16);
    expect(pick).toHaveLength(16);
    const leagues = new Set(pick.map((c) => ds.byId.club.get(c.id)!.leagueId));
    expect([...leagues].sort()).toEqual(['bundesliga', 'la-liga', 'ligue-1', 'premier-league', 'serie-a']);
    expect(pick.every((c) => c.level === 'not-rated')).toBe(true);
    expect(more).toBeGreaterThan(100);
    expect(notStarted).toContain('2. Bundesliga');
  });
});
