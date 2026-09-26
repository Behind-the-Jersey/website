'use client';

import Link from 'next/link';
import { fill, TEAM_COPY } from '@/lib/copy/team-page';
import { sponsorCheckHref } from '@/lib/config';
import type { DepartedRowView, MoneyFact, SourceRef, SponsorRowView } from '@/lib/data/team';
import { TIERS } from '@/lib/levels';
import { Chevron } from './icons';
import { SponsorMarker } from './SponsorMarker';
import s from './Team.module.css';

const C = TEAM_COPY.sponsors;

export const rowButtonId = (key: string) => `row-${key}`;

function SourceLink({ source, className }: { source: SourceRef; className: string }) {
  return source.url ? (
    <a href={source.url} className={className} target="_blank" rel="noopener noreferrer">
      {source.label} ↗
    </a>
  ) : (
    <span className={className}>{source.label}</span>
  );
}

function Money({ money }: { money: MoneyFact }) {
  return (
    <div className={s.fact}>
      <span className={s.factLabel}>{C.moneyLabel}</span>
      <span className={s.factValue}>{money.main}</span>
      {money.sub && <span className={s.factSub}>{money.sub}</span>}
    </div>
  );
}

function Payer({ payer }: { payer: string | null }) {
  return payer ? (
    <strong className={s.payerName}>{payer}</strong>
  ) : (
    <span className={s.notChecked}>{C.notChecked}</span>
  );
}

function TierChip({ row }: { row: SponsorRowView }) {
  const t = TIERS[row.tier];
  return (
    <span className={`${s.chip} ${row.tier === 'unrated' ? s.chipUnrated : ''}`} style={{ color: t.color }}>
      {t.label}
    </span>
  );
}

function Detail({ row, factSheetHref }: { row: SponsorRowView; factSheetHref: string }) {
  // Nothing known yet: the design's "we haven't traced who owns it" panel. A sponsor on hold
  // (owner and evidence known, rating under review) gets the full panel below instead.
  if (!row.rated && !row.payer && row.evidence.length === 0) {
    return (
      <div className={`${s.detail} ${s.detailOne}`}>
        <span className={s.detailText}>
          {fill(C.unratedDetail, { sponsor: row.name })}{' '}
          <a href={sponsorCheckHref(row.name)} className={s.helpLink}>
            {C.helpLink}
          </a>
        </span>
      </div>
    );
  }
  return (
    <div className={s.detail}>
      <div className={s.facts}>
        <div className={`${s.fact} ${s.factPayer}`}>
          <span className={s.factLabel}>{C.payerLabel}</span>
          <span className={s.factValue}>{row.payer}</span>
        </div>
        <Money money={row.money} />
        {row.ownedThrough && (
          <div className={s.fact}>
            <span className={s.factLabel}>{C.ownedThroughLabel}</span>
            <span className={s.factValue}>{row.ownedThrough}</span>
          </div>
        )}
      </div>
      <div className={s.evidence}>
        {row.held && (
          <span className={s.detailText}>
            <strong>{C.heldLead}</strong> {fill(C.heldDetail, { sponsor: row.name })}
          </span>
        )}
        {row.evidence.map((e, i) => (
          <div key={i} className={s.evidenceItem}>
            <span className={s.detailText}>
              <strong>{C.evidenceLead}</strong> {e.text}
            </span>
            {e.source && <SourceLink source={e.source} className={s.evidenceSource} />}
            {e.moreSources.map((m, j) => (
              <SourceLink key={j} source={m} className={s.evidenceSource} />
            ))}
          </div>
        ))}
        {row.evidence.length === 0 && row.verdict && <span className={s.detailText}>{row.verdict}</span>}
        <Link href={`${factSheetHref}#${row.sponsorId}`} className={s.allSources}>
          {fill(C.allSources, { sponsor: row.name })}
        </Link>
      </div>
    </div>
  );
}

export function SponsorList({
  rows,
  departed,
  open,
  highlight,
  factSheetHref,
  onToggle,
  onHighlight,
}: {
  rows: SponsorRowView[];
  departed: DepartedRowView[];
  open: Set<string>;
  highlight: string | null;
  factSheetHref: string;
  onToggle: (key: string) => void;
  onHighlight: (key: string | null) => void;
}) {
  return (
    <div className={s.list}>
      <div className={`${s.cols} ${s.listHeader}`} aria-hidden="true">
        {C.columns.map((c, i) => (
          <span key={i} className={i === 2 ? s.colPayer : undefined}>
            {c}
          </span>
        ))}
      </div>
      {rows.map((r) => {
        const isOpen = open.has(r.key);
        return (
          <div
            key={r.key}
            className={s.row}
            data-hl={highlight === r.key || undefined}
            onPointerEnter={() => onHighlight(r.key)}
            onPointerLeave={() => onHighlight(null)}
            onFocus={() => onHighlight(r.key)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && onHighlight(null)}
          >
            <button
              type="button"
              id={rowButtonId(r.key)}
              className={`${s.cols} ${s.rowButton}`}
              aria-expanded={isOpen}
              aria-controls={`panel-${r.key}`}
              onClick={() => onToggle(r.key)}
            >
              <span className={s.cellMarker}>
                <SponsorMarker n={r.number} tier={r.tier} size={30} />
              </span>
              <span className={s.nameCell}>
                <span className={s.sponsorName}>{r.name}</span>
                <span className={s.placement}>{r.placementText}</span>
              </span>
              <span className={`${s.payer} ${s.colPayer}`}>
                <Payer payer={r.payer} />
              </span>
              <TierChip row={r} />
              <span className={s.chevron}>
                <Chevron />
              </span>
            </button>
            <div id={`panel-${r.key}`} hidden={!isOpen}>
              {isOpen && <Detail row={r} factSheetHref={factSheetHref} />}
            </div>
          </div>
        );
      })}
      {rows.length === 0 && departed.length === 0 && <p className={s.listEmpty}>{C.empty}</p>}
      {departed.map((d) => {
        const isOpen = open.has(d.key);
        return (
          <div key={d.key} className={`${s.row} ${s.rowGone}`}>
            <button
              type="button"
              id={rowButtonId(d.key)}
              className={`${s.cols} ${s.rowButton}`}
              aria-expanded={isOpen}
              aria-controls={`panel-${d.key}`}
              onClick={() => onToggle(d.key)}
            >
              <span className={s.cellMarker}>
                <span className={s.goneTick} aria-hidden="true">
                  ✓
                </span>
                <span className="visually-hidden">{C.gone}:</span>
              </span>
              <span className={s.nameCell}>
                <span className={`${s.sponsorName} ${s.goneName}`}>{d.name}</span>
                <span className={s.placement}>{d.placementText}</span>
              </span>
              <span className={`${s.payer} ${s.colPayer}`}>{d.payer}</span>
              <span className={`${s.chip} ${s.chipGone}`}>{d.leftChip}</span>
              <span className={s.chevron}>
                <Chevron />
              </span>
            </button>
            <div id={`panel-${d.key}`} hidden={!isOpen}>
              {isOpen && (
                <div className={s.detail}>
                  <div className={s.facts}>
                    {d.payer && (
                      <div className={`${s.fact} ${s.factPayer}`}>
                        <span className={s.factLabel}>{C.payerLabel}</span>
                        <span className={s.factValue}>{d.payer}</span>
                      </div>
                    )}
                    <Money money={d.money} />
                  </div>
                  <span className={s.detailText}>
                    {d.goneLine}
                    {d.whyLine && ` ${d.whyLine}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
