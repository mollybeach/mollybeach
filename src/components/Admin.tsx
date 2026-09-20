// path: src/components/Admin.tsx
import React, { useEffect, useState } from 'react';
import { VisitorsShelf } from '../palais/VisitorsShelf';
import { SignIn } from '../palais/LayoutsShelf';
import { useCollection, messageOf } from '../palais/useCollection';
import { githubStats, visitStats, type GithubStats, type VisitStats } from '../palais/visits';
import { paletteOf, useFloral } from '../palais/florals';
import '../palais/palais.css';

/**
 * mollybeach.app/admin — the visitor book, behind the same sign-in as the
 * Palais catalogue. Everything here comes from functions the database only
 * answers for editors, so a stranger who opens this page sees a sign-in form
 * and nothing else.
 *
 * It shows the same visitor book as the catalogue's ☆ Visitors page, plus the
 * numbers that don't fit in a drawer: the hours of the day people come, how
 * they're finding the site, and the GitHub profile's own counter.
 */

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 365, label: 'A year' },
  { days: 3650, label: 'All time' },
];

const when = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/** the hours of the day people come, as a little wall of bars */
function Hours({ hours }: { hours: { hour: number; visits: number }[] }) {
  const by = new Map(hours.map((h) => [h.hour, h.visits]));
  const most = Math.max(1, ...hours.map((h) => h.visits));
  return (
    <div className="adm-hours" role="img" aria-label="Visits by hour of the day">
      {Array.from({ length: 24 }, (_, h) => {
        const n = by.get(h) ?? 0;
        return (
          <span key={h} title={`${when(h)}: ${n} visit${n === 1 ? '' : 's'}`}>
            <i style={{ height: `${Math.max(3, (n / most) * 100)}%` }} />
            <small>{h % 6 === 0 ? when(h) : ''}</small>
          </span>
        );
      })}
    </div>
  );
}

export default function Admin() {
  const collection = useCollection();
  // the same stones as the catalogue: the sidebar's for the rims, the footer's
  // for what's filled in
  const rim = paletteOf(useFloral('sidebar').now);
  const fill = paletteOf(useFloral('footer').now);
  const stones = {
    ['--cat-jewel-side' as string]: rim.jewel,
    ['--cat-jewel' as string]: fill.jewel,
    ['--cat-ink' as string]: fill.ink,
    ['--cat-ink-side' as string]: rim.ink,
  } as React.CSSProperties;
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [github, setGithub] = useState<GithubStats | null>(null);
  const [error, setError] = useState('');
  const [githubError, setGithubError] = useState('');
  const signedIn = Boolean(collection.editor?.canSave);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    visitStats(days)
      .then((s) => live && setStats(s))
      .catch((e) => live && setError(messageOf(e)));
    githubStats(days)
      .then((g) => live && setGithub(g))
      .catch((e) => live && setGithubError(messageOf(e)));
    return () => {
      live = false;
    };
  }, [days, signedIn]);

  if (!collection.configured) {
    return (
      <div className="palais adm" style={stones}>
        <h1>Visitors</h1>
        <p className="cat-note">The database isn't set up in this copy of the site (.env.local).</p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="palais adm adm--gate" style={stones}>
        <div className="adm-gate">
          <h1>♡ Visitors</h1>
          <p className="cat-note">
            {collection.editor
              ? 'Signed in, but this account isn’t an editor, so the visitor book stays shut.'
              : 'Molly’s corner. Sign in to see who’s been by.'}
          </p>
          <SignIn editor={collection.editor} onError={setError} label="Sign in" />
          {error && (
            <p className="cat-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="palais adm" style={stones}>
      <header className="adm-head">
        <h1>♡ Visitors</h1>
        <nav className="cat-seasons" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              className={`cat-season${days === r.days ? ' is-on' : ''}`}
              aria-pressed={days === r.days}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <p className="cat-error" role="alert">
          {error}
        </p>
      )}

      <div className="cat-looks vis">

        {!!stats?.by_hour?.length && (
          <section className="vis-card">
            <h3>🕰 What time they come</h3>
            <Hours hours={stats.by_hour} />
          </section>
        )}

        {!!stats?.campaigns?.length && (
          <section className="vis-card">
            <h3>🏷️ Tagged links</h3>
            <ul className="vis-list">
              {stats.campaigns.map((c, i) => (
                <li key={i}>
                  <span>
                    {c.tag ?? c.campaign ?? c.medium}
                    <small>{[c.medium, c.campaign].filter(Boolean).join(' · ') || 'no campaign'}</small>
                  </span>
                  <b>{c.visits}</b>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!!stats?.networks?.length && (
          <section className="vis-card">
            <h3>🌐 Their internet providers</h3>
            <ul className="vis-list">
              {stats.networks.map((n) => (
                <li key={n.network}>
                  <span>{n.network}</span>
                  <b>{n.unique}</b>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="vis-card">
          <h3>🐙 The GitHub profile</h3>
          {githubError ? (
            <p className="cat-note">
              {/does not exist|Could not find/i.test(githubError)
                ? 'The GitHub counter isn’t set up yet: run supabase/migrations/20260915180000_github_visits.sql in the mollybeach repo.'
                : githubError}
            </p>
          ) : !github ? (
            <p className="cat-note">Counting…</p>
          ) : (
            <>
              <div className="vis-tiles">
                <div className="vis-tile">
                  <span className="vis-num">{github.period.toLocaleString()}</span>
                  <span className="vis-label">views · {RANGES.find((r) => r.days === days)?.label}</span>
                </div>
                <div className="vis-tile">
                  <span className="vis-num">{github.today.toLocaleString()}</span>
                  <span className="vis-label">views today</span>
                </div>
                <div className="vis-tile vis-tile--soft">
                  <span className="vis-num">{github.all_time.toLocaleString()}</span>
                  <span className="vis-label">views since {day(github.first_at)}</span>
                </div>
              </div>
              {github.badges.length > 0 && (
                <ul className="vis-list">
                  {github.badges.map((b) => (
                    <li key={b.badge}>
                      <span>
                        {b.badge}
                        <small>last {new Date(b.last_at).toLocaleString()}</small>
                      </span>
                      <b>{b.views}</b>
                    </li>
                  ))}
                </ul>
              )}
              <p className="vis-hint">
                GitHub fetches README images through its own proxy, so these are views, not people: no city, no browser,
                no telling one reader from another.
              </p>
            </>
          )}
        </section>
      </div>

      {/* the same visitor book as the catalogue's ☆ Visitors page */}
      <VisitorsShelf forDays={days} />
    </div>
  );
}
