// Cross-file checks the JSON Schemas can't express. Mirrors the data repo's scripts/validate.py so it and
// the site agree on what "valid" means. Errors fail the build; warnings are printed.
import type { RawDataset } from './schema';

export interface CheckResult {
  errors: string[];
  warnings: string[];
}

type Src = { name: string; url: string | null } | null | undefined;

export function checkDataset(d: RawDataset): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = {
    sports: new Set(d.sports.map((x) => x.id)),
    leagues: new Set(d.leagues.map((x) => x.id)),
    clubs: new Set(d.clubs.map((x) => x.id)),
    owners: new Set(d.owners.map((x) => x.id)),
    claims: new Set(d.claims.map((x) => x.id)),
    sponsors: new Set(d.sponsors.map((x) => x.id)),
  };

  for (const [kind, list] of Object.entries({
    sports: d.sports,
    leagues: d.leagues,
    clubs: d.clubs,
    owners: d.owners,
    claims: d.claims,
    sponsors: d.sponsors,
    kits: d.kits,
  })) {
    const seen = new Set<string>();
    for (const x of list) {
      if (seen.has(x.id)) errors.push(`${kind}: duplicate id "${x.id}"`);
      seen.add(x.id);
    }
  }

  const need = (kind: keyof typeof ids, v: string | null | undefined, where: string) => {
    if (v && !ids[kind].has(v)) errors.push(`${where}: unknown ${kind} id "${v}"`);
  };
  const sourced = (s: Src, where: string) => {
    if (!s) warnings.push(`${where}: no source yet`);
    else if (!s.url) warnings.push(`${where}: source "${s.name}" has no URL yet`);
  };

  for (const l of d.leagues) {
    need('sports', l.sportId, `leagues/${l.id}`);
    const count = d.clubs.filter((c) => c.leagueId === l.id).length;
    if (l.clubCount !== undefined && count > l.clubCount)
      errors.push(`leagues/${l.id}: ${count} clubs in clubs.json but clubCount is ${l.clubCount}`);
  }
  for (const c of d.clubs) {
    need('sports', c.sportId, `clubs/${c.id}`);
    need('leagues', c.leagueId, `clubs/${c.id}`);
  }
  for (const o of d.owners) need('owners', o.parentId, `owners/${o.id}`);
  const owners = new Map(d.owners.map((o) => [o.id, o]));
  const claims = new Map(d.claims.map((c) => [c.id, c]));
  const chain = (ownerId: string | null) => {
    const out: string[] = [];
    for (let o = ownerId; o && owners.has(o) && !out.includes(o); o = owners.get(o)!.parentId) out.push(o);
    return out;
  };
  for (const s of d.sponsors) {
    need('owners', s.ownerId, `sponsors/${s.id}`);
    for (const c of s.claimIds) need('claims', c, `sponsors/${s.id}`);
    if (s.tier !== 'unrated' && s.status !== 'rated')
      errors.push(`sponsors/${s.id}: tier "${s.tier}" needs status "rated"`);
    if (['concern', 'serious', 'severe'].includes(s.tier) && s.claimIds.length === 0)
      errors.push(`sponsors/${s.id}: tier "${s.tier}" needs at least one claim`);
    if (s.why) {
      // The why text may only rest on claims about an owner in the sponsor's own owner chain.
      const ownedBy = chain(s.ownerId);
      for (const id of s.why.claimIds) {
        const c = claims.get(id);
        if (!c) errors.push(`sponsors/${s.id}: why cites unknown claim "${id}"`);
        else if (!c.ownerIds.some((o) => ownedBy.includes(o)))
          errors.push(`sponsors/${s.id}: why cites claim "${id}", which is about a different owner`);
      }
      if (s.why.status !== 'reviewed') warnings.push(`sponsors/${s.id}: why text is a draft`);
    }
  }
  for (const c of d.claims) {
    for (const o of c.ownerIds) need('owners', o, `claims/${c.id}`);
    sourced(c.source, `claims/${c.id}`);
  }
  for (const k of d.kits) {
    const where = `kits/${k.id}`;
    need('clubs', k.clubId, where);
    for (const p of k.sponsors) {
      need('sponsors', p.sponsorId, where);
      if (p.hotspot && !p.side) errors.push(`${where}: sponsor "${p.sponsorId}" has a hotspot but no side`);
      const h = p.hotspot;
      if (h && ![h.x, h.y, h.w, h.h].every((v) => v >= 0 && v <= 1))
        errors.push(`${where}: hotspot for "${p.sponsorId}" must use fractions between 0 and 1`);
    }
    if (k.periodFrom && k.periodTo && k.periodFrom > k.periodTo) errors.push(`${where}: periodFrom is after periodTo`);
  }
  for (const x of d.deals) {
    need('clubs', x.clubId, `deals/${x.id}`);
    need('sponsors', x.sponsorId, `deals/${x.id}`);
    if (x.value) sourced(x.source, `deals/${x.id}`);
  }
  for (const x of d.changes) {
    need('clubs', x.clubId, `changes/${x.id}`);
    need('sponsors', x.sponsorId, `changes/${x.id}`);
    sourced(x.source, `changes/${x.id}`);
  }
  for (const x of d.dropped) {
    need('clubs', x.clubId, `dropped/${x.id}`);
    need('sponsors', x.sponsorId, `dropped/${x.id}`);
    sourced(x.source, `dropped/${x.id}`);
  }
  for (const c of d.contacts) need('clubs', c.clubId, `contacts/${c.clubId}`);

  return { errors, warnings };
}

/** Every asset path the data refers to, for an existence check against public/. */
export function assetPaths(d: RawDataset): { path: string; where: string }[] {
  const out: { path: string; where: string }[] = [];
  for (const c of d.clubs) if (c.crest) out.push({ path: c.crest, where: `clubs/${c.id}` });
  for (const k of d.kits) for (const p of Object.values(k.photos)) if (p) out.push({ path: p, where: `kits/${k.id}` });
  return out;
}
