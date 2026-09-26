// The v3 team page view model: the cases in handover/update-v3/UPDATE.md §8.
import { beforeAll, describe, expect, it } from 'vitest';
import { loadDataset, type Dataset } from '@/lib/data';
import {
  actionIntroExamples,
  factSheet,
  headlineFor,
  markerPosition,
  moneyFact,
  scaleNote,
  sponsorRows,
  teamPage,
  whyBoxes,
  type TeamPageView,
} from '@/lib/data/team';
import { DirectorySource, SEED_DIR } from '@/lib/data/source';
import type { Kit } from '@/lib/data/schema';

let ds: Dataset;
beforeAll(async () => {
  ds = (await loadDataset({ source: new DirectorySource('seed', SEED_DIR) })).dataset;
});

const kit = (id: string): Kit => ds.kits.find((x) => x.id === id)!;
const page = (id: string): TeamPageView => teamPage(ds, id)!;
const period = (club: string, key: string) => page(club).periods.find((p) => p.key === key)!;
const rowsOf = (club: string, key: string) =>
  period(club, key).rows.map((r) => [r.number, r.name, r.tier, r.placement]);
const headline = (club: string, key: string) => {
  const h = period(club, key).headline;
  return [h.before, h.level, h.after];
};

describe('Arsenal 2026/27', () => {
  it('is Stained, with one why box and Visit Rwanda as a departed row', () => {
    const p = period('arsenal', '2026-27');
    expect(p.level).toBe('stained');
    expect(p.isCurrent).toBe(true);
    expect(headline('arsenal', '2026-27')).toEqual([
      'The shirt is ',
      'stained',
      ': the front sponsor, Emirates, is owned by the Government of Dubai.',
    ]);
    expect(p.why.map((w) => w.sponsorId)).toEqual(['emirates']);
    expect(p.why[0].source).toEqual({ label: 'Human Rights Watch, Jul 2024', url: null });
    expect(p.change?.text).toBe('Better than last season: Visit Rwanda left in June 2026');
    expect(rowsOf('arsenal', '2026-27')).toEqual([
      [1, 'Emirates', 'serious', 'front'],
      [2, 'Deel', 'unrated', 'sleeve'],
    ]);
    expect(p.departed).toEqual([
      expect.objectContaining({
        name: 'Visit Rwanda',
        placementText: 'Sleeve, 2018–2026',
        payer: 'Government of Rwanda',
        leftChip: 'Left in 2026',
        goneLine: 'Gone since June 2026, after eight seasons.',
        whyLine: 'That’s why Arsenal is Stained now, not Soaked.',
      }),
    ]);
  });

  it('shows the facts of the Emirates row', () => {
    const emirates = period('arsenal', '2026-27').rows[0];
    expect(emirates.payer).toBe('Government of Dubai');
    expect(emirates.ownedThrough).toBe('Investment Corporation of Dubai');
    expect(emirates.money).toEqual({ main: 'Up to £70m a year', sub: 'about $93m · SportsPro · deal runs to 2033' });
    expect(emirates.evidence).toEqual([
      {
        text: '43 activists and dissidents were given life sentences in a 2024 mass trial that rights groups called grossly unfair.',
        source: { label: 'Human Rights Watch, Jul 2024', url: null },
      },
    ]);
    const deel = period('arsenal', '2026-27').rows[1];
    expect(deel.payer).toBeNull();
    expect(deel.money).toEqual({ main: 'Value not disclosed', sub: null });
  });

  it('asks about Emirates and names Deel for "Help check"', () => {
    const act = page('arsenal').act;
    expect(act.raise.map((r) => [r.name, r.flagged])).toEqual([
      ['Emirates', true],
      ['Deel', false],
    ]);
    expect(act.raise[0].message).toEqual({
      name: 'Emirates',
      placement: 'front',
      ownerVerb: 'owned by',
      owner: 'the Government of Dubai',
      messageLine: 'In 2024, 43 activists in the UAE got life sentences in one mass trial.',
    });
    expect(act.check?.name).toBe('Deel');
    expect(act.contact).toEqual({ kind: null, email: null, url: null });
    expect(act.share).toEqual({
      title: 'Arsenal is Stained',
      text: 'The shirt is Stained: the front sponsor, Emirates, is owned by the Government of Dubai.',
    });
  });

  it('lists the seasons newest last, keyed by their first season', () => {
    expect(page('arsenal').periods.map((p) => [p.key, p.label, p.level, p.shortLine])).toEqual([
      ['2006-07', '2006/07 – 2017/18', 'stained', 'Emirates on the front'],
      ['2018-19', '2018/19 – 2025/26', 'soaked', 'Emirates, plus Visit Rwanda on the sleeve'],
      ['2026-27', '2026/27', 'stained', 'Visit Rwanda gone, Deel on the sleeve'],
    ]);
  });
});

describe('Arsenal 2018/19 – 2025/26', () => {
  it('is Soaked with two why boxes, no departed rows and a red pill', () => {
    const p = period('arsenal', '2018-19');
    expect(p.level).toBe('soaked');
    expect(p.isCurrent).toBe(false);
    expect(p.kitLabel).toBe('Home 2018/19 – 2025/26');
    expect(p.why.map((w) => w.sponsorId)).toEqual(['visit-rwanda', 'emirates']);
    expect(rowsOf('arsenal', '2018-19')).toEqual([
      [1, 'Visit Rwanda', 'severe', 'sleeve'],
      [2, 'Emirates', 'serious', 'front'],
    ]);
    expect(p.departed).toEqual([]);
    expect(p.change).toEqual({ kind: 'worse', text: 'Worse from 2018: Visit Rwanda joined', badge: '+ Visit Rwanda' });
    expect(p.headline.before).toBe('The shirt was ');
  });
});

describe('Atlético 2026/27', () => {
  it('is Soaked, Visit Rwanda first (back), then Riyadh Air, then Kraken', () => {
    const t = page('atletico-de-madrid');
    const p = t.periods[t.current];
    expect(t.periods).toHaveLength(1);
    expect(p.level).toBe('soaked');
    expect(p.why.map((w) => w.sponsorId)).toEqual(['visit-rwanda', 'riyadh-air']);
    expect(p.rows.map((r) => [r.number, r.name, r.tier, r.placement, r.side])).toEqual([
      [1, 'Visit Rwanda', 'severe', 'back', 'back'],
      [2, 'Riyadh Air', 'serious', 'front', 'front'],
      [3, 'Kraken', 'unrated', 'sleeve', 'front'],
    ]);
    expect(p.backHasSponsor).toBe(true);
    expect(p.departed).toEqual([]);
    expect(p.change).toBeNull();
    // One period: the tooltip never says "was here".
    expect(Object.values(p.notes).filter(Boolean)).toEqual(['Atlético is here']);
    expect(t.act.raise.filter((r) => r.flagged).map((r) => r.name)).toEqual(['Visit Rwanda', 'Riyadh Air']);
  });
});

describe('Aston Villa', () => {
  it('2026/27 is Soaked: Visit Rwanda, then Betano; Trade Nation (unrated) is not a departed row', () => {
    const p = period('aston-villa', '2026-27');
    expect(p.level).toBe('soaked');
    expect(p.why.map((w) => w.sponsorId)).toEqual(['visit-rwanda']);
    expect(rowsOf('aston-villa', '2026-27')).toEqual([
      [1, 'Visit Rwanda', 'severe', 'front'],
      [2, 'Betano', 'unrated', 'sleeve'],
    ]);
    expect(p.departed).toEqual([]);
    expect(p.change?.kind).toBe('worse');
    expect(p.change?.text).toBe('Worse than last season: Visit Rwanda took the front');
  });

  it('2024/25 – 2025/26 is not rated: no why box, both sponsors unrated', () => {
    const p = period('aston-villa', '2024-25');
    expect(p.level).toBe('not-rated');
    expect(p.why).toEqual([]);
    expect(rowsOf('aston-villa', '2024-25')).toEqual([
      [1, 'Betano', 'unrated', 'front'],
      [2, 'Trade Nation', 'unrated', 'sleeve'],
    ]);
    expect(headline('aston-villa', '2024-25')).toEqual([
      'We haven’t rated this shirt yet: nobody has traced who owns Betano or Trade Nation.',
      null,
      '',
    ]);
  });
});

describe('headlineFor without kit.headline', () => {
  const bare = (id: string): Kit => {
    const k = structuredClone(kit(id));
    delete k.headline;
    return k;
  };
  const build = (id: string, isPast = false) => {
    const k = bare(id);
    return headlineFor(ds, k, sponsorRows(ds, k, null, { club: 'X', isPast }).rows, isPast);
  };

  it('uses the driving sponsor: highest tier, front winning ties', () => {
    expect(build('atletico-de-madrid-2026-27-home').text).toBe(
      'The shirt is Soaked: the back sponsor, Visit Rwanda, is paid for by the Government of Rwanda.',
    );
    expect(build('arsenal-2026-27-home').text).toBe(
      'The shirt is Stained: the front sponsor, Emirates, is owned by the Government of Dubai.',
    );
  });

  it('says "was" for past kits', () => {
    expect(build('arsenal-2017-18-home', true).text).toBe(
      'The shirt was Stained: the front sponsor, Emirates, is owned by the Government of Dubai.',
    );
  });

  it('counts the sponsors still to check when nothing is rated', () => {
    expect(build('aston-villa-2025-26-home').text).toBe(
      'We haven’t rated this shirt yet: 2 sponsors still need checking.',
    );
  });

  it('ignores a kit headline that no longer fits the rating', () => {
    const rows = (k: Kit) => sponsorRows(ds, k, null, { club: 'X', isPast: false }).rows;
    const rated = { ...bare('arsenal-2026-27-home'), headline: 'We haven’t rated this shirt yet.' };
    expect(headlineFor(ds, rated, rows(rated), false).text).toBe(
      'The shirt is Stained: the front sponsor, Emirates, is owned by the Government of Dubai.',
    );
    const unrated = { ...bare('aston-villa-2025-26-home'), headline: 'The shirt is {level}.' };
    expect(headlineFor(ds, unrated, rows(unrated), false).text).toBe(
      'We haven’t rated this shirt yet: 2 sponsors still need checking.',
    );
  });

  it('uses "part-owned by" for a sponsor a state only part-owns', () => {
    expect(build('newcastle-united-2026-27-home').text).toBe(
      'The shirt is Spotted: the sleeve sponsor, noon, is part-owned by the Public Investment Fund (Saudi Arabia).',
    );
  });
});

describe('whyBoxes', () => {
  it('never generates text: serious or severe sponsors without a why are listed as missing', () => {
    const k = kit('manchester-city-2026-27-home');
    const { rows } = sponsorRows(ds, k, null, { club: 'Man City', isPast: false });
    expect(whyBoxes(ds, rows)).toEqual({ boxes: [], missing: ['Etihad Airways'] });
  });
});

describe('scaleNote', () => {
  const periods = [
    { level: 'stained' as const, label: '2006/07 – 2017/18', isCurrent: false },
    { level: 'soaked' as const, label: '2018/19 – 2025/26', isCurrent: false },
    { level: 'stained' as const, label: '2026/27', isCurrent: true },
  ];
  it('today: here, was here (most recent period), nothing', () => {
    expect(scaleNote('Arsenal', 'stained', periods, 2)).toBe('Arsenal is here');
    expect(scaleNote('Arsenal', 'soaked', periods, 2)).toBe('Arsenal was here in 2018/19 – 2025/26');
    expect(scaleNote('Arsenal', 'clean', periods, 2)).toBeNull();
  });
  it('on an old shirt', () => {
    expect(scaleNote('Arsenal', 'soaked', periods, 1)).toBe('Arsenal was here in 2018/19 – 2025/26');
    expect(scaleNote('Arsenal', 'stained', periods, 1)).toBe('Arsenal is here now');
  });
});

describe('markerPosition', () => {
  // The numbers in design/source/Club-2col-v3.dc.html (photo 480×533).
  it('wide logo: hit area is the logo box, marker overlaps its left edge', () => {
    const m = markerPosition({ x: 0.5, y: 0.41, w: 0.4, h: 0.16 }, 480, 533, true);
    expect(m.size).toBe(48);
    expect([Math.round(m.left), Math.round(m.top)]).toEqual([106, 195]);
    expect([m.hit.left, Math.round(m.hit.top), Math.round(m.hit.width), Math.round(m.hit.height)]).toEqual([
      144, 176, 192, 85,
    ]);
  });

  it('small logo: 38px minimum hit area, marker centred above', () => {
    const m = markerPosition({ x: 0.865, y: 0.295, w: 0.07, h: 0.06 }, 480, 533, false);
    expect(Math.round(m.size)).toBe(44);
    expect([Math.round(m.left), Math.round(m.top)]).toEqual([393, 95]);
    expect([Math.round(m.hit.left), Math.round(m.hit.top), Math.round(m.hit.width), Math.round(m.hit.height)]).toEqual([
      392, 135, 46, 44,
    ]);
    const tiny = markerPosition({ x: 0.5, y: 0.5, w: 0.01, h: 0.01 }, 480, 533, false);
    expect([tiny.hit.width, tiny.hit.height]).toEqual([38, 38]);
  });

  it('keeps the marker inside the photo', () => {
    const m = markerPosition({ x: 0.1, y: 0.02, w: 0.2, h: 0.04 }, 480, 533, true);
    expect(m.left).toBe(0);
    expect(m.top).toBe(0);
  });
});

describe('actionIntroExamples', () => {
  it('starts with the club’s own drop, then up to three earlier drops by other clubs', () => {
    expect(actionIntroExamples(ds, ds.byId.club.get('arsenal')!)).toBe(
      'Visit Rwanda left Arsenal’s sleeve in 2026, and Bayern Munich, Schalke 04 and Man Utd have all dropped sponsors before',
    );
  });
  it('leaves the own drop out when there isn’t one', () => {
    expect(actionIntroExamples(ds, ds.byId.club.get('aston-villa')!)).toBe(
      'Bayern Munich, Schalke 04 and Man Utd have all dropped sponsors before',
    );
  });
});

describe('moneyFact', () => {
  it('says "Value not disclosed" when there is no value', () => {
    expect(moneyFact(ds, null)).toEqual({ main: 'Value not disclosed', sub: null });
  });
  it('only says when the deal runs to if that is in the future', () => {
    const vr = ds.deals.find((d) => d.id === 'arsenal-visit-rwanda')!;
    expect(moneyFact(ds, vr)).toEqual({ main: '£10m a year', sub: 'about $13m · The Athletic' });
  });
});

describe('factSheet', () => {
  it('lists every sponsor of every shirt, today’s first, with every claim and its source', () => {
    const f = factSheet(ds, 'arsenal')!;
    expect(f.sponsors.map((s) => [s.name, s.onTodaysShirt])).toEqual([
      ['Emirates', true],
      ['Deel', true],
      ['Visit Rwanda', false],
    ]);
    const vr = f.sponsors.find((s) => s.sponsorId === 'visit-rwanda')!;
    expect(vr.claims).toHaveLength(5);
    expect(vr.claims.every((c) => c.source?.name)).toBe(true);
    expect(f.headline).toBe('The shirt is Stained: the front sponsor, Emirates, is owned by the Government of Dubai.');
    expect(f.checked).toBe('24 Sep 2026');
  });
});

describe('every club has a page', () => {
  it('a kit without marked logos shows its photo and all its sponsors', () => {
    const t = page('newcastle-united');
    const now = t.periods[t.current];
    expect(now.shirt).toBe('photo');
    expect(now.photos.front).toMatch(/newcastle-united-2026-27-home-front-square\.jpg$/);
    expect(now.backHasSponsor).toBe(false);
    expect(now.rows.map((r) => r.name)).toEqual(['noon', 'KNOX Hydration']);
    expect(now.departed.map((d) => d.name)).toEqual(['Sela']);
    // The older kit has no photo at all.
    expect(t.periods[0].shirt).toBe('none');
  });

  it('a club with no shirt on file says so and asks for help', () => {
    const t = page('bayern-munich');
    expect(t.periods).toHaveLength(1);
    const p = t.periods[0];
    expect([p.hasKit, p.shirt, p.level, p.rows.length]).toEqual([false, 'none', 'not-rated', 0]);
    expect(p.headline.text).toBe('We haven’t recorded the sponsors on Bayern Munich’s shirt yet.');
    expect(t.act.raise).toEqual([]);
    expect(t.act.check).toMatchObject({ kind: 'club', name: 'Bayern Munich' });
  });

  it('only unknown clubs have no page', () => {
    expect(teamPage(ds, 'not-a-club')).toBeNull();
    expect(ds.clubs.every((c) => teamPage(ds, c.id))).toBe(true);
  });
});
