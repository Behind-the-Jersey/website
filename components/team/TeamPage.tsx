'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CrestBadge } from '@/components/CrestBadge';
import { Arrow, ARROWS, BrandMark } from '@/components/LogoMark';
import { fill, TEAM_COPY } from '@/lib/copy/team-page';
import { IS_DEV } from '@/lib/config';
import type { TeamPageView, WhyBoxView } from '@/lib/data/team';
import { LEVELS } from '@/lib/levels';
import { ActNow } from './ActNow';
import { RatingScale } from './RatingScale';
import { ShirtPanel } from './ShirtPanel';
import { rowButtonId, SponsorList } from './SponsorList';
import { TravelBack } from './TravelBack';
import s from './Team.module.css';

const C = TEAM_COPY;

/** The period containing a season like '2020-21', for ?season= links. */
function periodFor(team: TeamPageView, season: string | null): number | null {
  if (!season || !/^\d{4}(-\d{2})?$/.test(season)) return null;
  const i = team.periods.findIndex((p) => p.from <= season && season <= p.to);
  return i >= 0 ? i : null;
}

const firstRow = (team: TeamPageView, i: number) => new Set(team.periods[i].rows.slice(0, 1).map((r) => r.key));

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Names that fit next to the rating scale on one or two lines; longer ones put the scale below. */
const fitsBesideScale = (name: string) => {
  const words = name.split(/\s+/);
  return words.length <= 2 && words.every((w) => w.length <= 8);
};

function Explainer() {
  const [before, rest] = C.explainer.text.split('{clean}');
  const [middle, after] = rest.split('{soaked}');
  return (
    <section aria-label="What this page is" className={s.explainer}>
      <BrandMark size={36} />
      <p className={s.explainerText}>
        <strong>{C.explainer.lead}</strong> {before}
        <strong>Clean</strong>
        {middle}
        <strong className={s.soakedWord}>Soaked</strong>
        {after}
      </p>
      <Link href="/#how" className={s.pillLink}>
        {C.explainer.button}
      </Link>
    </section>
  );
}

function WhyBox({ why }: { why: WhyBoxView }) {
  const parts = why.text.split(/(sportswashing)/i);
  return (
    <div className={s.why}>
      <p>
        <strong>{C.why.lead}</strong> {parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}{' '}
        {why.source &&
          (why.source.url ? (
            <a href={why.source.url} className={s.whySource} target="_blank" rel="noopener noreferrer">
              {why.source.label} ↗
            </a>
          ) : (
            <span className={s.whySource}>{why.source.label}</span>
          ))}
      </p>
    </div>
  );
}

/**
 * The v3 team page (handover/update-v3/UPDATE.md): what the site is, how bad this shirt is, why,
 * every sponsor with its evidence, and what you can do. The shirt with numbered markers and the
 * seasons sit on the right. Rows and markers highlight each other; a marker opens its row.
 */
export function TeamPage({ team, showCrest }: { team: TeamPageView; showCrest: boolean }) {
  const [shown, setShown] = useState(team.current);
  const [open, setOpen] = useState(() => firstRow(team, team.current));
  const [highlight, setHighlight] = useState<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const p = team.periods[shown];

  const show = useCallback(
    (i: number) => {
      setShown(i);
      setOpen(firstRow(team, i));
      setHighlight(null);
    },
    [team],
  );

  // ?season= after hydration, and on back/forward.
  useEffect(() => {
    const read = () => periodFor(team, new URLSearchParams(window.location.search).get('season'));
    const i = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL once after hydration
    if (i !== null && i !== team.current) show(i);
    const onPop = () => show(read() ?? team.current);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [team, show]);

  const select = (i: number) => {
    if (i === shown) return;
    const target = team.periods[i];
    window.history.pushState(null, '', target.isCurrent ? window.location.pathname : `?season=${target.key}`);
    show(i);
    // On a phone the seasons are at the bottom: go back up to the shirt that changed.
    const top = titleRef.current?.getBoundingClientRect().top ?? 0;
    if (window.matchMedia('(max-width: 899px)').matches && top < 0)
      titleRef.current?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** A logo on the shirt: open its row, bring it into view and move focus to it. */
  const pick = (key: string) => {
    setOpen((prev) => new Set(prev).add(key));
    requestAnimationFrame(() => {
      const b = document.getElementById(rowButtonId(key));
      b?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      b?.focus({ preventScroll: true });
    });
  };

  const h = p.headline;
  const stacked = !fitsBesideScale(team.club.name);

  return (
    <>
      <Explainer />
      <div className={s.grid}>
        <div className={s.left}>
          <div ref={titleRef} className={`${s.titleRow} ${stacked ? s.titleStacked : ''}`}>
            <div className={s.titleMain}>
              {showCrest && (
                <CrestBadge
                  crest={team.club.crest}
                  initials={team.club.initials}
                  size={72}
                  alt={`${team.club.name} crest`}
                  className={s.crest}
                />
              )}
              <div className={s.titleText}>
                <h1 className={s.name}>{team.club.name}</h1>
                <span className={s.sub}>
                  {[team.club.league, p.hasKit && `${p.kitType} shirt ${p.label}`].filter(Boolean).join(' · ')}
                </span>
              </div>
            </div>
            <RatingScale level={p.level} club={team.club.shortName} plain={team.levelPlain} notes={p.notes} />
          </div>

          {!p.isCurrent && (
            <p className={s.pastNotice}>
              {fill(C.travel.pastNotice, { period: p.label })}{' '}
              <a
                href="./"
                onClick={(e) => {
                  e.preventDefault();
                  select(team.current);
                }}
              >
                {C.travel.pastNoticeLink}
              </a>
            </p>
          )}

          <p className={s.headline}>
            {h.before}
            {h.level && <span style={{ color: LEVELS[h.level].text }}>{LEVELS[h.level].word}</span>}
            {h.after}
          </p>

          {p.why.map((w) => (
            <WhyBox key={w.sponsorId} why={w} />
          ))}
          {IS_DEV &&
            p.whyMissing.map((n) => (
              <span key={n} className={`dev-todo ${s.devTodo}`}>
                TODO: {n} is rated concern or worse but has no why text in sponsors.json
              </span>
            ))}

          {p.change && (
            <span
              className={s.change}
              style={{ color: p.change.kind === 'better' ? 'var(--good)' : 'var(--soaked-text)' }}
            >
              <Arrow d={ARROWS[p.change.kind]} color="currentColor" />
              {p.change.text}
            </span>
          )}

          <section aria-labelledby="sponsors-title" className={s.sponsors}>
            <div className={s.sponsorsHead}>
              <h2 id="sponsors-title" className={s.h2}>
                {C.sponsors.title}
              </h2>
              {p.rows.length > 0 && (
                <span className={s.sponsorsSub}>{p.shirt === 'marked' ? C.sponsors.sub : C.sponsors.subNoMarkers}</span>
              )}
            </div>
            <SponsorList
              rows={p.rows}
              departed={p.departed}
              open={open}
              highlight={highlight}
              factSheetHref={team.factSheetHref}
              onToggle={toggle}
              onHighlight={setHighlight}
            />
          </section>

          <div className={s.actWrap}>
            <ActNow act={team.act} club={team.club} factSheetHref={team.factSheetHref} />
          </div>
        </div>

        <div className={s.right}>
          <ShirtPanel club={team.club.name} period={p} highlight={highlight} onHighlight={setHighlight} onPick={pick} />
          {team.periods.length > 1 && <TravelBack periods={team.periods} shown={shown} onSelect={select} />}
        </div>
      </div>
    </>
  );
}
