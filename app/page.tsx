import { ChangeCard, DroppedCard, LeagueRow, SectionHeading } from '@/components/Cards';
import { CrestBadge } from '@/components/CrestBadge';
import { LevelMeter } from '@/components/Level';
import { CodeIcon } from '@/components/LogoMark';
import { RotatingHeadline } from '@/components/RotatingHeadline';
import { SearchBox } from '@/components/search/SearchBox';
import { Container, SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { AGENT_GUIDE_URL, claimClubHref, CONTRIBUTING_URL, REPO_URL, repoHref } from '@/lib/config';
import { getDataset } from '@/lib/data';
import {
  clubsToCheck,
  coverage,
  featuredDropped,
  latestChanges,
  leagueSummary,
  leaguesForSport,
} from '@/lib/data/derive';
import type { LevelId } from '@/lib/data/schema';
import { buildSearchIndex } from '@/lib/data/search-index';
import { listJoin } from '@/lib/format';
import { LEVELS } from '@/lib/levels';
import s from './landing.module.css';

const TRIES = ['Arsenal', 'Premier League', 'Visit Rwanda', 'Formula 1', 'Real Madrid'];

const STEPS = [
  {
    title: 'Collect',
    who: 'Agent',
    color: 'var(--text-4)',
    text: 'Who is on every shirt this season: front, back and sleeve.',
    foot: 'Every club, every season',
  },
  {
    title: 'Trace',
    who: 'Agent',
    color: 'var(--text-4)',
    text: 'Who owns each sponsor, all the way up to a state or a fund.',
    foot: 'Company registries, reports',
  },
  {
    title: 'Find evidence',
    who: 'Agent + you',
    color: 'var(--spotted-text)',
    text: 'Human-rights reports tied to that owner. Every claim gets a source.',
    foot: 'UN, NGOs, courts, press',
  },
  {
    title: 'Review',
    who: 'Person',
    color: 'var(--good)',
    text: 'A person checks each claim and source before anything counts.',
    foot: 'Nothing goes live unchecked',
  },
  {
    title: 'Publish',
    who: 'Automatic',
    color: 'var(--text-4)',
    text: 'The rating goes live and the change is logged for everyone to see.',
    foot: 'Full history, public',
  },
];

const DEFINITIONS: [LevelId, string][] = [
  ['clean', 'Checked. Nothing found.'],
  ['spotted', 'A lesser link to a state.'],
  ['stained', 'A serious sponsor on the front.'],
  ['soaked', 'A severe sponsor, or two serious ones.'],
];

const WAYS = [
  {
    title: 'Run our agents',
    text: 'Point our pipeline at a club nobody has checked yet and open a pull request with what it finds.',
    cta: 'Read the guide',
    href: AGENT_GUIDE_URL,
  },
  {
    title: 'Bring your own agent',
    text: 'Any agent can help if it writes our evidence format: one claim, one source, one file.',
    cta: 'See the format',
    href: CONTRIBUTING_URL,
  },
  {
    title: 'Check a club by hand',
    text: 'No code needed. Pick a club, note who sponsors it and who owns them, and link your sources.',
    cta: 'Pick a club',
    href: '#pick-a-club',
  },
];

export default async function Landing() {
  const ds = await getDataset();
  const cov = coverage(ds);
  const index = buildSearchIndex(ds);
  const changes = latestChanges(ds, 4);
  const dropped = featuredDropped(ds);
  const soccer = leaguesForSport(ds, 'soccer').map((l) => leagueSummary(ds, l.id));
  const { pick: todo, more, leagues: todoLeagues, notStarted } = clubsToCheck(ds, 16);

  return (
    <>
      <SiteHeader variant="landing" />
      <main>
        <Container>
          <section className={s.hero} aria-label="Search">
            <span className={s.kicker}>
              {cov.ratedClubs} clubs rated · {cov.mappedLeagues} leagues mapped · updated {cov.updated}
            </span>
            <RotatingHeadline />
            <p className={s.lede}>
              Type a club, a league, a sport or a sponsor. We trace every sponsor back to who really pays, and rate how
              much blood is on the money.
            </p>
            <SearchBox index={index} variant="hero" tries={TRIES} />
            <div className={s.key} aria-label="Blood levels">
              <span className={s.keyLabel}>Blood level</span>
              {(['clean', 'spotted', 'stained', 'soaked'] as const).map((l) => (
                <span key={l} className={s.keyItem}>
                  <LevelMeter level={l} size="key" />
                  <span className={s.keyWord} style={{ color: LEVELS[l].text }}>
                    {LEVELS[l].word}
                  </span>
                </span>
              ))}
              <a href="#how" className={s.keyLink}>
                How we rate →
              </a>
            </div>
          </section>

          <section className={s.section} style={{ marginTop: 24 }} aria-labelledby="just-changed">
            <SectionHeading
              id="just-changed"
              title="Just changed"
              sub="Sponsors come and go every summer. This is what moved, and which way."
              link={{ href: repoHref('/tree/main/data/changes'), label: 'Every change, with sources →' }}
            />
            <div className={s.grid4}>
              {changes.map((c) => (
                <ChangeCard key={c.id} c={c} />
              ))}
            </div>
          </section>

          <section className={s.section} aria-labelledby="dropped">
            <SectionHeading
              id="dropped"
              title="They dropped it"
              sub="Clubs can change, and these ones did. Say thanks, and ask your own club to be next."
              subWidth={720}
              link={{ href: '#contribute', label: 'Know a club that changed? Tell us →', tone: 'good' }}
            />
            <div className={s.grid3}>
              {dropped.map((d) => (
                <DroppedCard key={d.id} d={d} />
              ))}
            </div>
          </section>

          <section className={s.section} style={{ gap: 22 }} aria-labelledby="leagues">
            <SectionHeading
              id="leagues"
              title="League by league"
              sub="Every club gets a slot, worst first. Dashed means nobody has checked it yet."
              link={{ href: '/soccer/premier-league/', label: 'All sports and leagues →' }}
            />
            <div className={s.leagues}>
              {soccer.map((l) => (
                <LeagueRow key={l.id} league={l} />
              ))}
            </div>
          </section>

          <section id="how" className={s.section} aria-labelledby="how-title">
            <SectionHeading
              id="how-title"
              kicker="How we rate"
              title="Not a hunch. The same five steps for every shirt."
              sub="Agents do the legwork, people check it, and every claim links to its source. Anyone can see every step on GitHub."
              subWidth={760}
            />
            <ol className={s.steps}>
              {STEPS.map((st, i) => (
                <li key={st.title} className={s.step}>
                  <span className={s.stepTop}>
                    <span className={s.stepN}>{i + 1}</span>
                    <span className={s.who} style={{ color: st.color, borderColor: st.color }}>
                      {st.who}
                    </span>
                  </span>
                  <span className={s.stepTitle}>{st.title}</span>
                  <span className={s.stepText}>{st.text}</span>
                  <span className={s.stepFoot}>{st.foot}</span>
                </li>
              ))}
            </ol>
            <div className={s.defs}>
              <span className={s.defsLabel} id="levels-mean">
                What the levels mean
              </span>
              <ul className={s.defsGrid} aria-labelledby="levels-mean">
                {DEFINITIONS.map(([l, text]) => (
                  <li key={l} className={s.def}>
                    <LevelMeter level={l} size="def" />
                    <span className={s.defText}>
                      <span className={s.defWord} style={{ color: LEVELS[l].text }}>
                        {LEVELS[l].word}
                      </span>
                      <span className={s.defLine}>{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section id="contribute" className={`${s.section} ${s.help}`} aria-labelledby="help-title">
            <div className={s.helpLeft}>
              <span className={s.helpKicker}>Open data · open pipelines · open agents</span>
              <h2 id="help-title" className={s.helpTitle}>
                Help us check every shirt
              </h2>
              <p className={s.helpText}>
                All the data, the pipelines and the agents are public on GitHub. Pick the way that suits you. A person
                reviews every claim before it goes live.
              </p>
              <ol className={s.ways}>
                {WAYS.map((w, i) => (
                  <li key={w.title} className={s.way}>
                    <span className={s.wayN}>{i + 1}</span>
                    <span className={s.wayText}>
                      <span className={s.wayTitle}>{w.title}</span>
                      <span className={s.wayBody}>{w.text}</span>
                    </span>
                    <a href={w.href} className={s.wayCta}>
                      {w.cta}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
            <div className={s.helpRight}>
              <span className={s.pickLabel} id="pick-a-club">
                Nobody has checked these yet · pick one
              </span>
              <div className={s.chips}>
                {todo.map((c) => (
                  <a key={c.id} href={claimClubHref(c.name)} title={c.name} className={s.clubChip}>
                    <CrestBadge crest={c.crest} initials={c.initials} size={28} />
                    {c.shortName}
                  </a>
                ))}
              </div>
              {(more > 0 || notStarted.length > 0) && (
                <span className={s.more}>
                  {more > 0 && `Plus ${more} more clubs and teams across ${todoLeagues} leagues and competitions. `}
                  {notStarted.length > 0 && `Nobody has started the ${listJoin(notStarted)} yet.`}
                </span>
              )}
              <div className={s.helpButtons}>
                <a href={repoHref()} className={s.primary}>
                  <CodeIcon />
                  Open the repo on GitHub
                </a>
                <a href={repoHref('#readme')} className={s.secondary}>
                  Read the contributor guide
                </a>
                <span className={s.org}>{REPO_URL.replace(/^https?:\/\//, '')}</span>
              </div>
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter variant="landing" />
    </>
  );
}
