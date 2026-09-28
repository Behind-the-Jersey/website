import { beforeAll, describe, expect, it } from 'vitest';
import { loadDataset, parseFiles, type Dataset } from '@/lib/data';
import {
  clubLevel,
  clubsForSponsor,
  coverage,
  currentKit,
  hasMarkedShirt,
  isMarkedKit,
  kitLevel,
  latestChanges,
  leagueSummary,
  featuredDropped,
} from '@/lib/data/derive';
import { levelForKit } from '@/lib/data/rating';
import { DirectorySource, SEED_DIR } from '@/lib/data/source';
import { checkDataset } from '@/lib/data/checks';
import type { Kit } from '@/lib/data/schema';

let ds: Dataset;
beforeAll(async () => {
  ds = (await loadDataset({ source: new DirectorySource('seed', SEED_DIR) })).dataset;
});

const kit = (id: string): Kit => {
  const k = ds.kits.find((x) => x.id === id);
  if (!k) throw new Error(`no kit ${id}`);
  return k;
};

describe('rating rule on the seed kits', () => {
  it.each([
    ['atletico-de-madrid-2026-27-home', 'soaked'],
    ['arsenal-2017-18-home', 'stained'],
    ['arsenal-2025-26-home', 'soaked'],
    ['arsenal-2026-27-home', 'stained'],
    ['aston-villa-2025-26-home', 'not-rated'],
    ['aston-villa-2026-27-home', 'soaked'],
    ['manchester-city-2026-27-home', 'stained'],
    ['newcastle-united-2025-26-home', 'stained'],
    ['newcastle-united-2026-27-home', 'spotted'],
    ['brighton-and-hove-albion-2026-27-home', 'clean'],
    ['real-madrid-2026-27-home', 'stained'],
  ])('%s is %s', (id, level) => {
    expect(kitLevel(ds, kit(id))).toBe(level);
  });

  it('rates every other club Not rated', () => {
    const rated = [
      'atletico-de-madrid',
      'arsenal',
      'aston-villa',
      'manchester-city',
      'newcastle-united',
      'brighton-and-hove-albion',
      'real-madrid',
    ];
    for (const c of ds.clubs.filter((c) => !rated.includes(c.id))) expect(clubLevel(ds, c.id), c.id).toBe('not-rated');
  });

  it('follows the draft rule on edge cases', () => {
    const tiers: Record<string, 'unrated' | 'none' | 'concern' | 'serious' | 'severe'> = {
      a: 'serious',
      b: 'serious',
      c: 'severe',
      d: 'none',
      e: 'unrated',
      f: 'concern',
    };
    const t = (id: string) => tiers[id];
    const k = (sponsors: [string, 'front' | 'back' | 'sleeve'][], complete = true) => ({
      sponsors: sponsors.map(([sponsorId, placement]) => ({ sponsorId, placement })),
      sponsorsComplete: complete,
    });
    expect(
      levelForKit(
        k([
          ['a', 'sleeve'],
          ['b', 'back'],
        ]),
        t,
      ),
    ).toBe('soaked'); // two serious anywhere
    expect(levelForKit(k([['c', 'front']]), t)).toBe('soaked');
    expect(levelForKit(k([['c', 'sleeve']]), t)).toBe('stained');
    expect(levelForKit(k([['a', 'sleeve']]), t)).toBe('spotted'); // serious off the front counts as a lesser link
    expect(
      levelForKit(
        k([
          ['d', 'front'],
          ['e', 'sleeve'],
        ]),
        t,
      ),
    ).toBe('not-rated'); // clean needs every sponsor checked
    expect(levelForKit(k([['d', 'front']], false), t)).toBe('not-rated');
    expect(levelForKit(k([['d', 'front']]), t)).toBe('clean');
    expect(
      levelForKit(
        k([
          ['f', 'sleeve'],
          ['e', 'front'],
        ]),
        t,
      ),
    ).toBe('spotted');
    expect(levelForKit({ ...k([['c', 'front']]), levelOverride: 'clean' }, t)).toBe('clean');
  });
});

describe('selectors', () => {
  it('summarises the Premier League', () => {
    const s = leagueSummary(ds, 'premier-league');
    expect(s.total).toBe(20);
    expect(s.bad).toBe(4);
    expect(s.counts).toEqual({ soaked: 1, stained: 2, spotted: 1, clean: 1, 'not-rated': 15 });
    expect(s.worst).toEqual({ level: 'soaked', n: 1 });
    expect(s.clubs.slice(0, 5).map((c) => c.id)).toEqual([
      'aston-villa',
      'arsenal',
      'manchester-city',
      'newcastle-united',
      'brighton-and-hove-albion',
    ]);
  });

  it('pads La Liga with unknown clubs', () => {
    const s = leagueSummary(ds, 'la-liga');
    expect(s.clubs.map((c) => c.id)).toEqual(['atletico-de-madrid', 'real-madrid']);
    expect(s.unknown).toBe(18);
    expect(s.counts['not-rated']).toBe(18);
    expect(s.clubs[0].sponsorLine).toBe('Riyadh Air · front, Visit Rwanda · back');
    expect(s.clubs[0].payerLine).toBe('Paid for by the governments of Saudi Arabia and Rwanda');
  });

  it('writes overview card lines', () => {
    const pl = leagueSummary(ds, 'premier-league').clubs;
    const byId = Object.fromEntries(pl.map((c) => [c.id, c]));
    expect(byId['aston-villa'].sponsorLine).toBe('Visit Rwanda · front of shirt');
    expect(byId['aston-villa'].payerLine).toBe('Paid for by the Government of Rwanda');
    expect(byId['newcastle-united'].sponsorLine).toBe('noon · sleeve');
    expect(byId['newcastle-united'].payerLine).toBe('Part-owned by the Public Investment Fund (Saudi Arabia)');
    expect(byId['brighton-and-hove-albion'].payerLine).toBe('A listed US company with no state owner. Nothing found.');
  });

  it('counts coverage for the landing kicker', () => {
    expect(coverage(ds)).toEqual({ ratedClubs: 7, mappedLeagues: 2, updated: '24 Sep 2026' });
  });

  it('picks the current kit and team pages', () => {
    expect(currentKit(ds, 'arsenal')?.id).toBe('arsenal-2026-27-home');
    expect(ds.clubs.filter((c) => hasMarkedShirt(ds, c.id)).map((c) => c.id)).toEqual([
      'arsenal',
      'aston-villa',
      'atletico-de-madrid',
    ]);
  });

  it('marks a shirt by the logos printed on it, not the kit maker or shorts', () => {
    const kit = structuredClone(currentKit(ds, 'arsenal')!);
    expect(isMarkedKit(kit)).toBe(true);
    kit.sponsors.push({ sponsorId: 'adidas', placement: 'partner' }, { sponsorId: 'deel', placement: 'shorts' });
    expect(isMarkedKit(kit)).toBe(true);
    kit.sponsors.push({ sponsorId: 'deel', placement: 'back' });
    expect(isMarkedKit(kit)).toBe(false);
  });

  it('lists the newest four changes like the design', () => {
    expect(latestChanges(ds).map((c) => c.id)).toEqual([
      '2026-08-06-arsenal-emirates',
      '2026-07-15-villa-visit-rwanda',
      '2026-06-arsenal-visit-rwanda-ends',
      '2026-06-10-real-madrid-emirates',
    ]);
  });

  it('lists featured dropped items newest first', () => {
    expect(featuredDropped(ds).map((d) => d.name)).toEqual([
      'Arsenal',
      'Newcastle United',
      'Bayern Munich',
      'Bayern Munich',
      'Schalke 04',
      'Manchester United',
    ]);
  });

  it('finds the clubs a sponsor pays', () => {
    expect(clubsForSponsor(ds, 'visit-rwanda').map((c) => c.id)).toEqual([
      'aston-villa',
      'atletico-de-madrid',
      'paris-saint-germain',
      'la-clippers',
      'la-rams',
    ]);
  });
});

describe('validation', () => {
  it('rejects broken references', () => {
    const bad = structuredClone(ds) as unknown as Parameters<typeof checkDataset>[0];
    bad.kits = [...bad.kits, { ...bad.kits[0], id: 'x', sponsors: [{ sponsorId: 'nobody', placement: 'front' }] }];
    expect(checkDataset(bad).errors).toContain('kits/x: unknown sponsors id "nobody"');
  });

  it('rejects placeholder contacts', () => {
    const files = {
      ...rawFiles(),
      contacts: [
        {
          clubId: 'arsenal',
          lastChecked: '2026-09-24',
          channels: [
            { type: 'phone', value: '+44 800 XXX XXXX', source: { name: 'x', url: 'https://x.org', date: '2026' } },
          ],
        },
      ],
    };
    expect(() => parseFiles(files, 'test')).toThrow(/placeholder/);
  });

  it('rejects a why text that cites another owner’s claim', () => {
    const bad = structuredClone(ds) as unknown as Parameters<typeof checkDataset>[0];
    const emirates = bad.sponsors.find((x) => x.id === 'emirates')!;
    emirates.why = { ...emirates.why!, claimIds: ['saudi-executions-2024'] };
    expect(checkDataset(bad).errors).toContain(
      'sponsors/emirates: why cites claim "saudi-executions-2024", which is about a different owner',
    );
  });

  it('accepts a why whose record is about a state an ownership claim names (a minority stake)', () => {
    const ok = structuredClone(ds) as unknown as Parameters<typeof checkDataset>[0];
    const emirates = ok.sponsors.find((x) => x.id === 'emirates')!;
    const stake = {
      ...structuredClone(ok.claims[0]),
      id: 'test-stake',
      kind: 'ownership' as const,
      ownerIds: ['government-of-dubai', 'saudi-pif'],
    };
    ok.claims.push(stake);
    emirates.claimIds = [...emirates.claimIds, 'test-stake'];
    emirates.why = { ...emirates.why!, claimIds: ['saudi-executions-2024', 'test-stake'] };
    expect(checkDataset(ok).errors.filter((e) => e.startsWith('sponsors/emirates'))).toEqual([]);
  });

  it('rejects a guessed or placeholder club contact', () => {
    const files = rawFiles();
    (files.clubs as { id: string; contact?: unknown }[])[0].contact = {
      kind: 'supporter-liaison',
      email: 'slo@example.com',
      source: 'guess',
    };
    expect(() => parseFiles(files, 'test')).toThrow(/placeholder/);
  });

  it('rejects non-ASCII ids', () => {
    const files = rawFiles();
    (files.clubs as { id: string }[])[0].id = 'atlético-de-madrid';
    expect(() => parseFiles(files, 'test')).toThrow(/kebab-case/);
  });
});

function rawFiles(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of [
    'meta',
    'levels',
    'tiers',
    'sports',
    'leagues',
    'clubs',
    'owners',
    'claims',
    'sponsors',
    'kits',
    'deals',
    'changes',
    'dropped',
    'contacts',
  ] as const) {
    out[k] = structuredClone((ds as unknown as Record<string, unknown>)[k]);
  }
  return out;
}
