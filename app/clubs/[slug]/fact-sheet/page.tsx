// A plain, print-friendly fact sheet for fan groups (UPDATE.md §7.6): the rating, why, every
// sponsor with its facts, and every claim with its source. Not designed; kept deliberately simple.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BASE_PATH } from '@/lib/config';
import { getDataset } from '@/lib/data';
import { factSheet } from '@/lib/data/team';
import { formatDate } from '@/lib/format';
import { LEVELS } from '@/lib/levels';
import { PrintButton } from './PrintButton';
import s from './FactSheet.module.css';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const ds = await getDataset();
  return ds.clubs.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = factSheet(await getDataset(), slug);
  return f ? { title: `${f.club.name}: fact sheet`, description: f.headline } : {};
}

/** 'behind-the-jersey.org/clubs/arsenal/' in print, so the sheet leads back to the page. */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '');

const dateOf = (d: string) => (/^\d{4}-\d{2}/.test(d) ? formatDate(d) : d);

function Source({ source }: { source: { name: string; date: string; url: string | null } }) {
  return (
    <span className={s.source}>
      {source.name}, {dateOf(source.date)}.{' '}
      {source.url ? (
        <a href={source.url} className={s.url}>
          {source.url}
        </a>
      ) : (
        <span className={s.noUrl}>Link to the document still to be added.</span>
      )}
    </span>
  );
}

export default async function FactSheetPage({ params }: Props) {
  const { slug } = await params;
  const f = factSheet(await getDataset(), slug);
  if (!f) notFound();
  const level = LEVELS[f.level];
  return (
    <main className={s.sheet}>
      <div className={s.bar}>
        <Link href={f.pageHref} className={s.back}>
          ← Back to {f.club.name}
        </Link>
        <PrintButton className={s.print} />
      </div>

      <header className={s.head}>
        <span className={s.kicker}>Behind the Jersey · fact sheet</span>
        <h1 className={s.title}>{f.club.name}</h1>
        <p className={s.meta}>
          {[f.club.league, `${f.kitLabel.replace(' ', ' shirt ')}`].filter(Boolean).join(' · ')} · Rating:{' '}
          <strong>{level.rated ? level.word : 'Not rated yet'}</strong> · Data checked {f.checked}
        </p>
      </header>

      <section className={s.block}>
        <p className={s.headline}>{f.headline}</p>
        {f.why.map((w) => (
          <p key={w} className={s.why}>
            <strong>Why is that a problem?</strong> {w}
          </p>
        ))}
      </section>

      {f.sponsors.map((sp) => (
        <section key={sp.sponsorId} id={sp.sponsorId} className={s.sponsor}>
          <h2 className={s.sponsorName}>{sp.name}</h2>
          <dl className={s.facts}>
            <dt>On the shirt</dt>
            <dd>
              {sp.where}
              {sp.onTodaysShirt ? '' : ' (an earlier shirt)'}
            </dd>
            <dt>Rating</dt>
            <dd>
              {sp.tierLabel}
              {sp.held && ' (on hold until a person reviews the evidence below)'}
            </dd>
            <dt>Who really pays</dt>
            <dd>{sp.ownerChain.length ? sp.ownerChain.join(' → ') : 'Not checked yet'}</dd>
            {sp.ownedThrough && (
              <>
                <dt>Owned through</dt>
                <dd>{sp.ownedThrough}</dd>
              </>
            )}
            <dt>Money (reported)</dt>
            <dd>
              {sp.money.main}
              {sp.money.sub && ` (${sp.money.sub})`}
              {sp.moneySource && (
                <>
                  <br />
                  <Source source={sp.moneySource} />
                </>
              )}
            </dd>
          </dl>
          {sp.verdict && !sp.held && <p className={s.text}>{sp.verdict}</p>}
          {sp.claims.length > 0 ? (
            <ol className={s.claims}>
              {sp.claims.map((c) => (
                <li key={c.id}>
                  <span className={s.text}>{c.text}</span>
                  {c.source ? <Source source={c.source} /> : <span className={s.noUrl}>Source still to be added.</span>}
                  {c.moreSources.map((m, j) => (
                    <Source key={j} source={m} />
                  ))}
                </li>
              ))}
            </ol>
          ) : (
            <p className={s.text}>
              {sp.tier === 'unrated'
                ? `We haven’t traced who owns ${sp.name} yet, so there is no rating.`
                : 'No claims recorded.'}
            </p>
          )}
        </section>
      ))}

      <footer className={s.foot}>
        <span>Ratings are illustrative until the method is final.</span>
        <span>
          {SITE}
          {BASE_PATH}
          {f.pageHref}
        </span>
      </footer>
    </main>
  );
}
