// path: src/components/Profiles.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from '../palais/LayoutsShelf';
import { useCollection, messageOf } from '../palais/useCollection';
import { mergeByName, type MergedProfile } from '../palais/VisitorsShelf';
import { nameVisitor, visitLog, visitorProfiles, type VisitLogEntry, type VisitorProfile } from '../palais/visits';
import { PLACE_NAMES, type Place } from '../palais/place';
import { paletteOf, useFloral } from '../palais/florals';
import '../palais/palais.css';

/**
 * mollybeach.app/admin/profiles — one visitor at a time, read back to Molly as
 * their own little dossier. Behind the same sign-in as the visitor book: the
 * numbers all come from functions the database only answers for editors, so a
 * stranger who opens this page sees a sign-in form and nothing else.
 *
 * Pick someone from the drawer and it fetches every visit they've ever made
 * (across all the codes they've come in under) and lays out when they come, how
 * often, where from, which rooms they walk and on what.
 */

/* small local copies of the visitor book's helpers, so this page matches it
   without adding exports to VisitorsShelf.tsx (see there for the originals) */

const flag = (code: string | null) =>
  code && /^[A-Z]{2}$/i.test(code)
    ? String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : '🌐';

const DEVICE_ICON: Record<string, string> = { phone: '📱', tablet: '📲', desktop: '💻' };
const deviceIcon = (d: string | null) => DEVICE_ICON[d ?? ''] ?? '❔';

const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const mins = (sec: number | null | undefined) => {
  const n = sec ?? 0;
  if (!n) return '—';
  if (n < 60) return `${Math.round(n)}s`;
  if (n < 3600) return `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`;
  return `${Math.floor(n / 3600)}h ${Math.round((n % 3600) / 60)}m`;
};

const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const who = (name: string | null, visitor: string | null, isMe = false) =>
  isMe ? `${name ?? 'Molly'} (me)` : name ?? (visitor ? `visitor ${visitor}` : 'someone');

/** the pages of the portfolio, which are stops on the same walk as the rooms */
const PAGE_NAMES: Record<string, string> = {
  home: 'the Palais',
  overview: 'Overview',
  portfolio: 'Overview',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  awards: 'Awards',
  certifications: 'Certifications',
  resume: 'Resume',
  admin: 'the visitor book',
  profiles: 'the profiles page',
  'closet/dress': 'the dress form',
  dressform: 'the dress form',
};

const placeName = (p: string) =>
  PLACE_NAMES[p as Place] ?? PAGE_NAMES[p.replace(/^(page-|\/|#)/, '')] ?? p;

const when = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

/* ------------------------------------------------ the visitor's own clock -- */

type Basis = 'zone' | 'offset' | 'utc';

/** the hour and calendar day a visit fell on in the VISITOR'S local time, not
    ours. Three ways, most trustworthy first: their IANA timezone (America/
    Lima…), the raw minute offset they sent, or — failing both — UTC. */
function localParts(e: VisitLogEntry): { hour: number; day: string; basis: Basis } | null {
  const d = new Date(e.at);
  if (Number.isNaN(d.getTime())) return null;

  if (e.timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: e.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
      }).formatToParts(d);
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
      let hour = parseInt(get('hour'), 10);
      if (!Number.isFinite(hour)) throw new Error('no hour');
      if (hour === 24) hour = 0; // some engines render midnight as 24
      return { hour, day: `${get('year')}-${get('month')}-${get('day')}`, basis: 'zone' };
    } catch {
      /* an unknown zone name: fall through to the offset */
    }
  }

  if (e.tz_offset != null) {
    const shifted = new Date(d.getTime() + e.tz_offset * 60000);
    return { hour: shifted.getUTCHours(), day: shifted.toISOString().slice(0, 10), basis: 'offset' };
  }

  return { hour: d.getUTCHours(), day: d.toISOString().slice(0, 10), basis: 'utc' };
}

const BASIS_NOTE: Record<Basis, string> = {
  zone: 'their timezone',
  offset: 'the offset they sent',
  utc: 'UTC (no timezone on record)',
};

/** add up the strings, dropping the blanks, tallest first */
function tally(items: (string | null | undefined)[]): { label: string; n: number }[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = (it ?? '').trim();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => ({ label, n }));
}

/** keyed tally that keeps a sample row, so cities can carry their flag */
function tallyBy<T>(items: T[], key: (t: T) => string | null): { key: string; n: number; sample: T }[] {
  const m = new Map<string, { n: number; sample: T }>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    const cur = m.get(k);
    if (cur) cur.n += 1;
    else m.set(k, { n: 1, sample: it });
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1].n - a[1].n)
    .map(([k, v]) => ({ key: k, n: v.n, sample: v.sample }));
}

const machineOf = (v: VisitLogEntry) =>
  [
    v.brand && v.model ? `${v.brand} ${v.model}` : v.brand ?? v.model,
    [v.os, v.os_version].filter(Boolean).join(' '),
    [v.browser, v.browser_version?.split('.')[0]].filter(Boolean).join(' '),
    v.screen,
  ]
    .filter(Boolean)
    .join(' · ');

/* the stops someone walked, read off a log row (strings or {place,seconds}) */
const stopsOf = (places: VisitLogEntry['places']) =>
  places.map((s) => (typeof s === 'string' ? s : s.place));

/* ---- the little bar walls, reusing the visitor book's styles -------------- */

/** the hours of the day they come, in their own local time */
function Hours({ hours }: { hours: number[] }) {
  const most = Math.max(1, ...hours);
  return (
    <div className="adm-hours adm-hours--all" role="img" aria-label="Visits by hour of the day, their local time">
      {hours.map((n, h) => (
        <span key={h} title={`${when(h)}: ${n} visit${n === 1 ? '' : 's'}`}>
          <i style={{ height: `${Math.max(3, (n / most) * 100)}%` }} />
          <small>{when(h)}</small>
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- the page ---- */

async function loadAllVisits(ids: string[]): Promise<VisitLogEntry[]> {
  const out: VisitLogEntry[] = [];
  for (const id of ids) {
    let before: number | undefined;
    // page back through this id's visits until a short page, capped so a
    // runaway can never hang the page
    for (let page = 0; page < 40; page++) {
      const batch = await visitLog(before, id);
      out.push(...batch);
      if (batch.length < 50) break;
      before = batch[batch.length - 1].id;
    }
  }
  return out;
}

export default function Profiles() {
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

  const signedIn = Boolean(collection.editor?.canSave);

  const [people, setPeople] = useState<VisitorProfile[] | null>(null);
  const [peopleError, setPeopleError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const [log, setLog] = useState<VisitLogEntry[] | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState('');
  const [naming, setNaming] = useState(false);

  // every visitor, folded so the codes one person comes in under are one row
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    visitorProfiles()
      .then((p) => live && setPeople(p))
      .catch((e) => live && setPeopleError(messageOf(e)));
    return () => {
      live = false;
    };
  }, [signedIn]);

  const folk = useMemo<MergedProfile[] | null>(() => (people ? mergeByName(people) : null), [people]);

  // open on the most-active visitor (mergeByName already sorts by visits desc)
  useEffect(() => {
    if (folk && folk.length && !selected) setSelected(folk[0].visitor);
  }, [folk, selected]);

  const merged = folk?.find((m) => m.visitor === selected) ?? null;

  // when a visitor is picked, fetch every visit across all their ids
  useEffect(() => {
    if (!merged) return;
    let live = true;
    setLog(null);
    setLogError('');
    setLogLoading(true);
    loadAllVisits(merged.ids)
      .then((entries) => {
        if (!live) return;
        entries.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
        setLog(entries);
      })
      .catch((e) => live && setLogError(messageOf(e)))
      .finally(() => live && setLogLoading(false));
    return () => {
      live = false;
    };
    // merged is re-found each render, so key the fetch on the id and its codes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, merged?.ids.join('|')]);

  // name (or rename) the visitor from here, the way the visitor book does it
  const rename = async () => {
    if (!merged) return;
    // anyone named Molly is counted as Molly, however it is typed: her address
    // changes often enough that she arrives as a new code every few days
    const name = window.prompt(
      `Name for visitor ${merged.visitor} — call them Molly to hide their visits behind “Show my own visits”, or leave empty to remove the name`,
      merged.name ?? '',
    );
    if (name === null) return;
    const isMe = merged.is_me || /molly/i.test(name.trim());
    const ids = merged.ids;
    setNaming(true);
    try {
      // this card is one person folded from several codes, so the name goes on
      // every id they've come in under, to keep them grouped under it
      for (const id of ids) await nameVisitor(id, name, isMe);
      const fresh = await visitorProfiles();
      setPeople(fresh);
      // keep the same person selected, whichever code now leads their card
      const mine = mergeByName(fresh).find((m) => m.ids.some((id) => ids.includes(id)));
      if (mine) setSelected(mine.visitor);
    } catch (e) {
      setPeopleError(messageOf(e));
    } finally {
      setNaming(false);
    }
  };

  if (!collection.configured) {
    return (
      <div className="palais adm" style={stones}>
        <h1>Visitor profiles</h1>
        <p className="cat-note">The database isn't set up in this copy of the site (.env.local).</p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="palais adm adm--gate" style={stones}>
        <div className="adm-gate">
          <h1>✦ Visitor profiles</h1>
          <p className="cat-note">
            {collection.editor
              ? 'Signed in, but this account isn’t an editor, so the profiles stay shut.'
              : 'Molly’s corner. Sign in to read a visitor’s profile.'}
          </p>
          <SignIn editor={collection.editor} onError={setPeopleError} label="Sign in" />
          {peopleError && (
            <p className="cat-error" role="alert">
              {peopleError}
            </p>
          )}
        </div>
      </div>
    );
  }

  const needsMigration = (e: string) => /does not exist|Could not find/i.test(e);

  // everything the selected visitor's visits add up to
  const parts = log ? (log.map(localParts).filter(Boolean) as { hour: number; day: string; basis: Basis }[]) : [];
  const hours = Array.from({ length: 24 }, (_, h) => parts.filter((p) => p.hour === h).length);
  const basis = (tally(parts.map((p) => p.basis))[0]?.label as Basis | undefined) ?? 'utc';
  // the hour they come most, in their own local time
  const peakHour = hours.some((n) => n > 0) ? hours.indexOf(Math.max(...hours)) : null;

  // visits over time: a bar per day, or per week once the span runs long
  const dayKeys = parts.map((p) => p.day).sort();
  const spanDays =
    dayKeys.length > 1
      ? Math.round((Date.parse(dayKeys[dayKeys.length - 1]) - Date.parse(dayKeys[0])) / 86_400_000) + 1
      : 1;
  const weekly = spanDays > 90;
  const weekStart = (key: string) => {
    const d = new Date(`${key}T00:00:00Z`);
    const diff = (d.getUTCDay() + 6) % 7; // Monday = 0
    d.setUTCDate(d.getUTCDate() - diff);
    return d.toISOString().slice(0, 10);
  };
  const overTime = (() => {
    if (!dayKeys.length) return [] as { bucket: string; n: number }[];
    const m = new Map<string, number>();
    for (const day of dayKeys) {
      const bucket = weekly ? weekStart(day) : day;
      m.set(bucket, (m.get(bucket) ?? 0) + 1);
    }
    // fill the gaps so a quiet stretch reads as a gap, not a missing bar
    const first = weekly ? weekStart(dayKeys[0]) : dayKeys[0];
    const last = weekly ? weekStart(dayKeys[dayKeys.length - 1]) : dayKeys[dayKeys.length - 1];
    const bars: { bucket: string; n: number }[] = [];
    const step = weekly ? 7 : 1;
    const cursor = new Date(`${first}T00:00:00Z`);
    const end = new Date(`${last}T00:00:00Z`);
    for (let guard = 0; cursor <= end && guard < 800; guard++) {
      const key = cursor.toISOString().slice(0, 10);
      bars.push({ bucket: key, n: m.get(key) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + step);
    }
    return bars;
  })();
  const overMax = Math.max(1, ...overTime.map((b) => b.n));

  // where from
  const cities = log
    ? tallyBy(log, (v) => (v.city || v.region || v.country ? `${v.city ?? ''}|${v.region ?? ''}|${v.country ?? ''}|${v.code ?? ''}` : null))
    : [];
  const countries = log ? tallyBy(log, (v) => (v.country ? `${v.country}|${v.code ?? ''}` : null)) : [];

  // rooms and pages walked: where they landed, every stop, and the page field
  const walked = log
    ? tally(log.flatMap((v) => [v.landing, ...stopsOf(v.places), v.page].filter(Boolean) as string[]))
    : [];

  // devices, as whole machines
  const devices = log ? tallyBy(log, machineOf) : [];
  const sources = log ? tally(log.map((v) => v.source)) : [];

  const totalSeconds = log ? log.reduce((s, v) => s + (v.seconds ?? 0), 0) : 0;
  const longest = log ? Math.max(0, ...log.map((v) => v.seconds ?? 0)) : 0;
  const daysActive = new Set(parts.map((p) => p.day)).size;
  const firstAt = log && log.length ? log[log.length - 1].at : null;
  const lastAt = log && log.length ? log[0].at : null;

  return (
    <div className="palais adm adm-profile" style={stones}>
      <header className="adm-head">
        <h1>✦ Visitor profiles</h1>
        <nav className="cat-seasons" aria-label="Elsewhere">
          <Link to="/admin" className="cat-season">
            ♡ Visitor book
          </Link>
        </nav>
      </header>

      {peopleError && (
        <p className="cat-error" role="alert">
          {needsMigration(peopleError)
            ? 'Visitor profiles aren’t set up yet: run supabase/migrations/20260915120000_palais_visitor_id.sql.'
            : peopleError}
        </p>
      )}

      {!folk && !peopleError && <p className="cat-note">Reading the visitors…</p>}
      {folk && !folk.length && <p className="cat-note">No visitors yet.</p>}

      {folk && folk.length > 0 && (
        <>
          <label className="adm-pick">
            <span className="adm-pick-label">Whose profile</span>
            <select value={selected ?? ''} onChange={(e) => setSelected(e.target.value)}>
              {folk.map((p) => (
                <option key={p.visitor} value={p.visitor}>
                  {who(p.name, p.visitor, p.is_me)} — {p.visits} visit{p.visits === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </label>

          {merged && (
            <div className="adm-profile-who">
              <strong>{who(merged.name, merged.visitor, merged.is_me)}</strong>
              <button type="button" className="cat-mini" onClick={rename} disabled={naming}>
                {naming ? '…' : merged.name ? 'Rename' : 'Name'}
              </button>
            </div>
          )}

          {merged && (merged.timezone || merged.language || merged.network || merged.ids.length > 1) && (
            <div className="adm-dossier">
              {merged.ids.length > 1 && (
                <div className="adm-dossier-row">
                  <span className="adm-dossier-key">🔖 {merged.ids.length} ids</span>
                  <span className="adm-dossier-ids">
                    {merged.ids.map((id) => (
                      <code key={id} className="adm-id">
                        {id}
                      </code>
                    ))}
                  </span>
                </div>
              )}
              {merged.timezone && (
                <div className="adm-dossier-row">
                  <span className="adm-dossier-key">🕰 Timezone</span>
                  <span className="adm-dossier-val">{merged.timezone}</span>
                </div>
              )}
              {merged.language && (
                <div className="adm-dossier-row">
                  <span className="adm-dossier-key">🗣 Language</span>
                  <span className="adm-dossier-val">{merged.language}</span>
                </div>
              )}
              {merged.network && (
                <div className="adm-dossier-row">
                  <span className="adm-dossier-key">🌐 Network</span>
                  <span className="adm-dossier-val">{merged.network}</span>
                </div>
              )}
            </div>
          )}

          {logError && (
            <p className="cat-error" role="alert">
              {needsMigration(logError)
                ? 'The visit log isn’t set up yet: run supabase/migrations/20260915120000_palais_visitor_id.sql.'
                : logError}
            </p>
          )}

          {logLoading && <p className="cat-note">Loading every visit…</p>}

          {log && !logLoading && !log.length && !logError && (
            <p className="cat-note">No visits on record for this visitor.</p>
          )}

          {log && log.length > 0 && (
            <div className="cat-looks vis">
              <div className="vis-tiles">
                <div className="vis-tile">
                  <span className="vis-num">{log.length.toLocaleString()}</span>
                  <span className="vis-label">visits</span>
                </div>
                <div className="vis-tile">
                  <span className="vis-num">{daysActive.toLocaleString()}</span>
                  <span className="vis-label">days active</span>
                </div>
                <div className="vis-tile vis-tile--soft">
                  <span className="vis-num" style={{ fontSize: '1.05rem' }}>
                    {firstAt ? dateOf(firstAt) : '—'}
                  </span>
                  <span className="vis-label">first seen</span>
                </div>
                <div className="vis-tile vis-tile--soft">
                  <span className="vis-num" style={{ fontSize: '1.05rem' }}>
                    {lastAt ? ago(lastAt) : '—'}
                  </span>
                  <span className="vis-label">last seen</span>
                </div>
                <div className="vis-tile vis-tile--soft">
                  <span className="vis-num" style={{ fontSize: '1.05rem' }}>
                    {mins(totalSeconds)}
                  </span>
                  <span className="vis-label">time in all</span>
                </div>
                <div className="vis-tile vis-tile--soft">
                  <span className="vis-num" style={{ fontSize: '1.05rem' }}>
                    {mins(longest)}
                  </span>
                  <span className="vis-label">longest visit</span>
                </div>
              </div>

              <section className="vis-card">
                <h3>🕰 What time they come</h3>
                {peakHour !== null && (
                  <p className="adm-usually">
                    Usually comes around <b>{when(peakHour)}</b>
                  </p>
                )}
                <Hours hours={hours} />
                <p className="vis-hint">Hour of the day in {BASIS_NOTE[basis]}.</p>
              </section>

              {overTime.length > 1 && (
                <section className="vis-card">
                  <h3>♡ Visits over time</h3>
                  <div
                    className="vis-bars"
                    role="img"
                    aria-label={`Visits per ${weekly ? 'week' : 'day'} from ${overTime[0].bucket} to ${overTime[overTime.length - 1].bucket}`}
                  >
                    {overTime.map((b) => (
                      <span
                        key={b.bucket}
                        className="vis-bar"
                        style={{ height: `${Math.max(4, (b.n / overMax) * 100)}%` }}
                        title={`${weekly ? 'week of ' : ''}${b.bucket}: ${b.n} visit${b.n === 1 ? '' : 's'}`}
                      />
                    ))}
                  </div>
                  <p className="vis-hint">
                    {weekly ? 'One bar per week' : 'One bar per day'} · {overTime[0].bucket} → {overTime[overTime.length - 1].bucket}
                  </p>
                </section>
              )}

              <div className="vis-cols">
                <section className="vis-card">
                  <h3>📍 Cities</h3>
                  {cities.length ? (
                    <ul className="vis-list">
                      {cities.map((c) => {
                        const [city, region, country, code] = c.key.split('|');
                        const label = [city, region, country].filter(Boolean).join(', ') || 'Somewhere';
                        return (
                          <li key={c.key}>
                            <span>
                              {flag(code || null)} {label}
                            </span>
                            <b>{c.n}</b>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="cat-note">No places on record.</p>
                  )}
                </section>
                <section className="vis-card">
                  <h3>🌍 Countries</h3>
                  {countries.length ? (
                    <ul className="vis-list">
                      {countries.map((c) => {
                        const [country, code] = c.key.split('|');
                        return (
                          <li key={c.key}>
                            <span>
                              {flag(code || null)} {country}
                            </span>
                            <b>{c.n}</b>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="cat-note">No countries on record.</p>
                  )}
                </section>
              </div>

              <section className="vis-card">
                <h3>🚪 Rooms &amp; pages they walked</h3>
                {walked.length ? (
                  <ul className="vis-list">
                    {walked.map((w) => (
                      <li key={w.label}>
                        <span>{placeName(w.label)}</span>
                        <b>{w.n}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cat-note">No walks on record.</p>
                )}
              </section>

              <div className="vis-cols">
                <section className="vis-card">
                  <h3>📱 Devices</h3>
                  {devices.length ? (
                    <ul className="vis-list">
                      {devices.map((d) => {
                        const sample = d.sample;
                        return (
                          <li key={d.key}>
                            <span>
                              {deviceIcon(sample.device)} {d.key}
                            </span>
                            <b>{d.n}</b>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="cat-note">No devices on record.</p>
                  )}
                </section>
                <section className="vis-card">
                  <h3>🔗 Sources</h3>
                  {sources.length ? (
                    <ul className="vis-list">
                      {sources.map((s) => (
                        <li key={s.label}>
                          <span>{s.label}</span>
                          <b>{s.n}</b>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cat-note">No sources on record.</p>
                  )}
                </section>
              </div>

              <p className="cat-signin-line">
                Every visit under {merged?.ids.length ?? 1} code{(merged?.ids.length ?? 1) === 1 ? '' : 's'}. IP addresses
                aren’t stored; each visitor is a scrambled code.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
