// Zod mirror of the JSON Schemas in Beyond-The-Jersey/data (schema/*.schema.json, one per record).
// Keep the two in step: the JSON Schemas are the contract, these are what the site validates
// against at build time.
import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ids are ASCII kebab-case');
const season = z.string().regex(/^[0-9]{4}(-[0-9]{2})?$/, 'seasons are YYYY-YY or YYYY');

export const LEVEL_IDS = ['not-rated', 'clean', 'spotted', 'stained', 'soaked'] as const;
export const TIER_IDS = ['unrated', 'none', 'concern', 'serious', 'severe'] as const;
export const PLACEMENTS = [
  'front',
  'back',
  'sleeve',
  'patch',
  'shorts',
  'stadium',
  'partner',
  'league-partner',
  'training-kit',
] as const;

export const levelId = z.enum(LEVEL_IDS);
export const tierId = z.enum(TIER_IDS);
export const placement = z.enum(PLACEMENTS);

export const source = z
  .object({
    name: z.string(),
    date: z.string(),
    url: z.string().nullable(),
    note: z.string().optional(),
    /** A short label for small source lines, e.g. 'SportsPro' next to a deal value. */
    short: z.string().optional(),
  })
  .strict();

export const level = z
  .object({
    id: levelId,
    order: z.number().int(),
    label: z.string(),
    meter: z.number().int().min(0).max(4),
    definition: z.string(),
    /** The one-line meaning in the team page's rating-scale tooltip. Falls back to definition. */
    plain: z.string().optional(),
    colors: z
      .object({
        text: z.string(),
        fill: z.string(),
        band: z.string(),
        bandText: z.string(),
        border: z.string().optional(),
      })
      .strict(),
  })
  .strict();

export const tier = z
  .object({
    id: tierId,
    score: z.number().int().nullable(),
    label: z.string(),
    color: z.string(),
    fill: z.string().optional(),
    description: z.string(),
  })
  .strict();

export const sport = z
  .object({ id, label: z.string(), status: z.enum(['active', 'not-mapped']), aliases: z.array(z.string()) })
  .strict();

export const league = z
  .object({
    id,
    aliases: z.array(z.string()),
    sportId: id,
    name: z.string(),
    country: z.string().optional(),
    clubCount: z.number().int().optional(),
    season: z.string().optional(),
    status: z.enum(['partial', 'complete', 'not-started']),
    frontOfShirtTotal: z
      .object({
        amount: z.number(),
        currency: z.string(),
        unit: z.string(),
        per: z.string(),
        usdApprox: z.number(),
        source: source.nullable(),
      })
      .strict()
      .optional(),
    notes: z.array(z.string()),
  })
  .strict();

const PLACEHOLDER = /X{3,}|\.\.\.|example\./i;
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Where "Tell {club}" sends people. Only a checked, sourced address; never a guess. */
export const clubContact = z
  .object({
    kind: z.enum(['supporter-liaison', 'contact-page']),
    email: z
      .string()
      .regex(EMAIL, 'not a valid ASCII email address')
      .refine((v) => !PLACEHOLDER.test(v), 'placeholder values are not allowed')
      .optional(),
    url: z
      .string()
      .regex(/^https:\/\//, 'contact pages must be https URLs')
      .refine((v) => !PLACEHOLDER.test(v), 'placeholder values are not allowed')
      .optional(),
    source: z.string().min(3),
  })
  .strict()
  .refine((c) => Boolean(c.email || c.url), 'a contact needs an email or a url');

export const club = z
  .object({
    id,
    name: z.string(),
    shortName: z.string(),
    code: z.string(),
    sportId: id,
    leagueId: id.nullable(),
    country: z.string().nullable(),
    crest: z.string().nullable(),
    aliases: z.array(z.string()),
    hasTeamPageDesign: z.boolean().optional(),
    contact: clubContact.nullable().optional(),
  })
  .strict();

export const owner = z
  .object({
    id,
    name: z.string(),
    type: z.enum(['state', 'state-fund', 'listed-company', 'private-company', 'unknown']),
    country: z.string().optional(),
    via: z.string().optional(),
    note: z.string().optional(),
    parentId: id.nullable(),
  })
  .strict();

export const claim = z
  .object({
    id,
    ownerIds: z.array(id).min(1),
    text: z.string(),
    short: z.string().optional(),
    source: source.nullable(),
    reviewed: z.boolean(),
  })
  .strict();

export const sponsorWhy = z
  .object({
    /** The "Why is that a problem?" paragraph. Written only from the claims below. */
    text: z.string(),
    claimIds: z.array(id).min(1),
    /** The one sentence used in the "Tell {club}" draft message. */
    messageLine: z.string().optional(),
    status: z.enum(['draft', 'reviewed']),
  })
  .strict();

export const sponsor = z
  .object({
    id,
    name: z.string(),
    ownerId: id.nullable(),
    ownership: z.enum(['owned', 'part-owned']).nullable(),
    tier: tierId,
    status: z.enum(['rated', 'unrated', 'being-rated']),
    verdict: z.string().nullable(),
    claimIds: z.array(id),
    aliases: z.array(z.string()),
    note: z.string().optional(),
    /** 'owned by' (default) or 'paid for by', for sentences about the owner. */
    ownerVerb: z.enum(['owned by', 'paid for by']).optional(),
    why: sponsorWhy.optional(),
  })
  .strict();

export const hotspot = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).strict();

export const kitSponsor = z
  .object({
    sponsorId: id,
    placement,
    side: z.enum(['front', 'back']).optional(),
    hotspot: hotspot.optional(),
    /** Unused since the v3 team page; kept so older data still validates. */
    cardSlot: z.enum(['L', 'R', 'T']).optional(),
    source: source.nullable().optional(),
  })
  .strict();

export const kitChange = z.object({ kind: z.enum(['worse', 'better']), text: z.string(), badge: z.string() }).strict();

export const kit = z
  .object({
    id: z.string(),
    clubId: id,
    season: season.nullable(),
    kitType: z.enum(['home', 'away', 'third']),
    periodLabel: z.string(),
    periodFrom: season.nullable(),
    periodTo: season.nullable(),
    photos: z
      .object({ front: z.string().optional(), back: z.string().optional(), square: z.string().optional() })
      .strict(),
    sponsors: z.array(kitSponsor),
    sponsorsComplete: z.boolean(),
    summary: z.string().nullable(),
    change: kitChange.nullable(),
    levelOverride: levelId.optional(),
    /** The sentence under the club name; '{level}' is replaced by the level word. Past kits use 'was'. */
    headline: z.string().optional(),
    /** One line for "Travel back in time". */
    shortLine: z.string().optional(),
  })
  .strict();

export const money = z
  .object({
    amount: z.number(),
    currency: z.enum(['GBP', 'EUR', 'USD']),
    unit: z.string(),
    per: z.string(),
    upTo: z.boolean(),
    usdApprox: z.number().nullable(),
  })
  .strict();

export const deal = z
  .object({
    id,
    clubId: id.nullable(),
    orgName: z.string().nullable(),
    /** For deals with an organisation rather than a club (orgName), the league or competition it belongs to. */
    leagueId: id.nullable().optional(),
    sponsorId: id,
    placement,
    from: season.nullable(),
    to: season.nullable(),
    value: money.nullable(),
    source: source.nullable(),
    note: z.string().optional(),
    /** YYYY-MM, when the deal ended at a known month ('Gone since June 2026'). */
    endedOn: z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}$/, 'endedOn is YYYY-MM')
      .optional(),
  })
  .strict();

export const change = z
  .object({
    id: z.string(),
    date: z.string(),
    datePrecision: z.enum(['day', 'month', 'year']),
    clubId: id,
    sponsorId: id,
    kind: z.enum(['worse', 'better', 'renewed', 'being-rated', 'new']),
    levelAfter: levelId,
    title: z.string(),
    text: z.string(),
    source: source.nullable(),
  })
  .strict();

export const dropped = z
  .object({
    id,
    year: z.number().int(),
    clubId: id.nullable(),
    orgName: z.string().optional(),
    /** For items about an organisation rather than a club (orgName), the league or competition it belongs to. */
    leagueId: id.nullable().optional(),
    sponsorId: id.nullable(),
    what: z.string(),
    text: z.string(),
    source: source.nullable(),
    featured: z.boolean(),
    todo: z.string().optional(),
  })
  .strict();

export const contactChannel = z
  .object({
    type: z.enum(['email', 'contact-form', 'x', 'instagram', 'facebook', 'phone', 'website']),
    value: z
      .string()
      .min(3)
      .refine((v) => !PLACEHOLDER.test(v), 'placeholder values are not allowed'),
    label: z.string().optional(),
    source: z.object({ name: z.string(), url: z.string().regex(/^https?:\/\//), date: z.string() }).strict(),
  })
  .strict()
  .refine((c) => c.type !== 'email' || EMAIL.test(c.value), 'not a valid ASCII email address');

export const contact = z
  .object({
    clubId: id,
    channels: z.array(contactChannel),
    lastChecked: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  })
  .strict();

export const meta = z
  .object({
    schemaVersion: z.literal(1),
    updatedAt: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
    generatedBy: z.string().optional(),
    sourceCommit: z.string().optional(),
  })
  .strict();

export const rawDataset = z.object({
  meta,
  levels: z.array(level),
  tiers: z.array(tier),
  sports: z.array(sport),
  leagues: z.array(league),
  clubs: z.array(club),
  owners: z.array(owner),
  claims: z.array(claim),
  sponsors: z.array(sponsor),
  kits: z.array(kit),
  deals: z.array(deal),
  changes: z.array(change),
  dropped: z.array(dropped),
  contacts: z.array(contact),
});

export type LevelId = z.infer<typeof levelId>;
export type TierId = z.infer<typeof tierId>;
export type Placement = z.infer<typeof placement>;
export type Source = z.infer<typeof source>;
export type Level = z.infer<typeof level>;
export type Tier = z.infer<typeof tier>;
export type Sport = z.infer<typeof sport>;
export type League = z.infer<typeof league>;
export type Club = z.infer<typeof club>;
export type ClubContact = z.infer<typeof clubContact>;
export type SponsorWhy = z.infer<typeof sponsorWhy>;
export type Owner = z.infer<typeof owner>;
export type Claim = z.infer<typeof claim>;
export type Sponsor = z.infer<typeof sponsor>;
export type Hotspot = z.infer<typeof hotspot>;
export type KitSponsor = z.infer<typeof kitSponsor>;
export type Kit = z.infer<typeof kit>;
export type Money = z.infer<typeof money>;
export type Deal = z.infer<typeof deal>;
export type Change = z.infer<typeof change>;
export type Dropped = z.infer<typeof dropped>;
export type Contact = z.infer<typeof contact>;
export type ContactChannel = z.infer<typeof contactChannel>;
export type Meta = z.infer<typeof meta>;
export type RawDataset = z.infer<typeof rawDataset>;

/** The file names a data source must provide (without .json). */
export const DATA_FILES = Object.keys(rawDataset.shape) as (keyof RawDataset)[];
