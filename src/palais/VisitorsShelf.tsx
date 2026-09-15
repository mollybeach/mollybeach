import { useCallback, useEffect, useRef, useState } from "react";
import { PLACE_NAMES, type Place } from "./place";
import { nameVisitor, visitLog, visitorProfiles, visitStats, type VisitLogEntry, type VisitorProfile, type VisitStats } from "./visits";
import { messageOf } from "./useCollection";

/**
 * The catalogue's visitor book: how many people have come to the Palais, how
 * many of them are different people, and where they came from. Only editors
 * see it; the database refuses everyone else.
 */

const RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 3650, label: "All time" },
];

const flag = (code: string | null) =>
  code && /^[A-Z]{2}$/i.test(code)
    ? String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "🌐";

const DEVICE_ICON: Record<string, string> = { phone: "📱", tablet: "📲", desktop: "💻" };
const deviceIcon = (d: string | null) => DEVICE_ICON[d ?? ""] ?? "❔";
const deviceName = (d: string | null) => (d ? d.charAt(0).toUpperCase() + d.slice(1) : "Unknown");

const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const placeName = (p: string) => PLACE_NAMES[p as Place] ?? p;

const dateOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** how often a visitor comes, in words */
function frequency(p: VisitorProfile) {
  if (p.visits <= 1) return "Came once";
  const spanDays = Math.max(1, (new Date(p.last_at).getTime() - new Date(p.first_at).getTime()) / 86_400_000);
  const perWeek = (p.visits / spanDays) * 7;
  if (p.days_active / (spanDays + 1) >= 0.6) return "Almost every day";
  if (perWeek >= 3) return "Several times a week";
  if (perWeek >= 1) return "About weekly";
  if (perWeek >= 0.25) return "A few times a month";
  return "Now and then";
}

const who = (name: string | null, visitor: string | null, isMe = false) => (isMe ? `${name ?? "Molly"} (me)` : name ?? (visitor ? `visitor ${visitor}` : "someone"));

const where = (v: { city: string | null; region: string | null; country: string | null }) => {
  const parts = [v.city, v.region, v.country].filter(Boolean) as string[];
  return parts.filter((x, i) => parts.indexOf(x) === i).join(", ") || "Somewhere";
};

export function VisitorsShelf() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState("");

  // every visitor, with how often they come (all time)
  const [people, setPeople] = useState<VisitorProfile[] | null>(null);
  const [peopleError, setPeopleError] = useState("");
  const loadPeople = useCallback(() => {
    visitorProfiles()
      .then((p) => {
        setPeople(p);
        setPeopleError("");
      })
      .catch((e) => setPeopleError(messageOf(e)));
  }, []);
  useEffect(loadPeople, [loadPeople]);

  // the visit log: every visit, a page at a time, as far back as you scroll
  const [only, setOnly] = useState<string | null>(null);
  const [log, setLog] = useState<VisitLogEntry[]>([]);
  const [logDone, setLogDone] = useState(false);
  const [logError, setLogError] = useState("");
  const loading = useRef(false);
  const more = useCallback(
    (reset = false) => {
      if (loading.current) return;
      loading.current = true;
      const before = reset ? undefined : log[log.length - 1]?.id;
      visitLog(before, only)
        .then((page) => {
          setLog((l) => (reset ? page : [...l, ...page]));
          setLogDone(page.length < 50);
          setLogError("");
        })
        .catch((e) => setLogError(messageOf(e)))
        .finally(() => {
          loading.current = false;
        });
    },
    [log, only],
  );
  // start again when the filter changes
  const lastOnly = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (lastOnly.current === only) return;
    lastOnly.current = only;
    setLog([]);
    setLogDone(false);
    loading.current = false;
    more(true);
  }, [only, more]);
  // load the next page when the end of the log scrolls into view
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const el = end.current;
    if (!el || logDone) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && more(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, logDone, log.length]);

  const rename = async (p: VisitorProfile) => {
    const name = window.prompt(`Name for visitor ${p.visitor} (leave empty to remove the name)`, p.name ?? "");
    if (name === null) return;
    try {
      await nameVisitor(p.visitor, name, p.is_me);
      loadPeople();
      setLog([]);
      lastOnly.current = undefined;
      setOnly((o) => o);
      more(true);
    } catch (e) {
      setPeopleError(messageOf(e));
    }
  };

  const needsMigration = (e: string) => /does not exist|Could not find/i.test(e);

  useEffect(() => {
    let live = true;
    setError("");
    visitStats(days)
      .then((s) => live && setStats(s))
      .catch((e) => live && setError(messageOf(e)));
    return () => {
      live = false;
    };
  }, [days]);

  const max = Math.max(1, ...(stats?.by_day.map((d) => d.visits) ?? [1]));
  const period = RANGES.find((r) => r.days === days)?.label ?? "";

  return (
    <div className="cat-looks vis">
      <nav className="cat-seasons" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            className={`cat-season${days === r.days ? " is-on" : ""}`}
            aria-pressed={days === r.days}
            onClick={() => setDays(r.days)}
          >
            {r.label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="cat-error" role="alert">
          {/does not exist|Could not find/i.test(error)
            ? "Visitor counting isn't set up yet: run the palais_visits SQL in Supabase."
            : error}
        </p>
      )}

      {!stats && !error && <p className="cat-note">Counting visitors…</p>}

      {stats && (
        <>
          <div className="vis-tiles">
            <div className="vis-tile">
              <span className="vis-num">{stats.period.unique.toLocaleString()}</span>
              <span className="vis-label">unique visitors · {period}</span>
            </div>
            <div className="vis-tile">
              <span className="vis-num">{stats.period.visits.toLocaleString()}</span>
              <span className="vis-label">visits · {period}</span>
            </div>
            <div className="vis-tile vis-tile--soft">
              <span className="vis-num">{stats.all_time.unique.toLocaleString()}</span>
              <span className="vis-label">unique, all time ({stats.all_time.visits.toLocaleString()} visits)</span>
            </div>
          </div>

          {stats.by_day.length > 1 && (
            <section className="vis-card">
              <h3>♡ Visits per day</h3>
              <div className="vis-bars" role="img" aria-label={`Visits per day over ${period}`}>
                {stats.by_day.map((d) => (
                  <span
                    key={d.day}
                    className="vis-bar"
                    style={{ height: `${Math.max(4, (d.visits / max) * 100)}%` }}
                    title={`${d.day}: ${d.visits} visits, ${d.unique} unique`}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="vis-card">
            <h3>🔗 Where they came from</h3>
            {stats.sources?.length || stats.me?.visits ? (
              <ul className="vis-list vis-list--sources">
                {!!stats.me?.visits && (
                  <li className="vis-me">
                    <span>
                      Me
                      <small>
                        {stats.me.visits} visit{stats.me.visits === 1 ? "" : "s"} · {Math.round((stats.me.visits / Math.max(1, stats.period.visits)) * 100)}%
                      </small>
                    </span>
                    <b>1</b>
                  </li>
                )}
                {(stats.sources ?? []).map((s) => (
                  <li key={s.source}>
                    <span>
                      {s.source}
                      <small>
                        {s.visits} visit{s.visits === 1 ? "" : "s"} · {Math.round((s.visits / Math.max(1, stats.period.visits)) * 100)}%
                      </small>
                    </span>
                    <b>{s.unique}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cat-note">No visits with a source yet.</p>
            )}
            <p className="vis-hint">
              iMessage, WhatsApp and the Discord app don't pass this along. To see them, share a tagged link like{" "}
              <code>mollybeach.app/?from=discord</code>.
            </p>
          </section>

          <section className="vis-card">
            <h3>🗺️ Where they went on the map</h3>
            {stats.places?.length ? (
              <ul className="vis-list">
                {stats.places.map((p) => (
                  <li key={p.place}>
                    <span>
                      {placeName(p.place)}
                      <small>
                        {p.visits} time{p.visits === 1 ? "" : "s"}
                      </small>
                    </span>
                    <b>{p.unique}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cat-note">No map walks recorded yet{stats.places ? "" : " (run the visitor names SQL to start)"}.</p>
            )}
          </section>

          <div className="vis-cols">
            <section className="vis-card">
              <h3>📱 Devices</h3>
              {stats.devices?.length ? (
                <ul className="vis-list">
                  {stats.devices.map((d) => (
                    <li key={d.device}>
                      <span>
                        {deviceIcon(d.device)} {deviceName(d.device)}
                        <small>
                          {d.visits} visit{d.visits === 1 ? "" : "s"} ·{" "}
                          {Math.round((d.visits / Math.max(1, stats.period.visits)) * 100)}%
                        </small>
                      </span>
                      <b>{d.unique}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">No visits yet.</p>
              )}
            </section>
            <section className="vis-card">
              <h3>🧭 System &amp; browser</h3>
              {stats.systems?.length ? (
                <ul className="vis-list">
                  {stats.systems.map((s) => (
                    <li key={`${s.os}-${s.browser}`}>
                      <span>
                        {s.os} · {s.browser}
                      </span>
                      <b>{s.unique}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">No visits yet.</p>
              )}
            </section>
          </div>

          <div className="vis-cols">
            <section className="vis-card">
              <h3>🌍 Countries</h3>
              {stats.countries.length ? (
                <ul className="vis-list">
                  {stats.countries.map((c) => (
                    <li key={c.country}>
                      <span>
                        {flag(c.code)} {c.country}
                      </span>
                      <b>{c.unique}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">No visits yet.</p>
              )}
            </section>
            <section className="vis-card">
              <h3>📍 Cities</h3>
              {stats.cities.length ? (
                <ul className="vis-list">
                  {stats.cities.map((c) => (
                    <li key={`${c.city}-${c.code}`}>
                      <span>
                        {flag(c.code)} {c.city}
                        {c.region ? `, ${c.region}` : ""}
                      </span>
                      <b>{c.unique}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">No cities yet.</p>
              )}
            </section>
          </div>

          <section className="vis-card">
            <h3>👥 Visitors</h3>
            {peopleError && (
              <p className="cat-error" role="alert">
                {needsMigration(peopleError) ? "Visitor profiles aren't set up yet: run supabase/migrations/20260915120000_palais_visitor_names.sql." : peopleError}
              </p>
            )}
            {people && !people.length && <p className="cat-note">No visitors yet.</p>}
            {people && people.length > 0 && (
              <ul className="vis-people">
                {people.map((p) => (
                  <li key={p.visitor} className={`vis-person${p.is_me ? " is-me" : ""}${only === p.visitor ? " is-on" : ""}`}>
                    <div className="vis-person-head">
                      <strong>{who(p.name, p.visitor, p.is_me)}</strong>
                      <span className="vis-freq">{frequency(p)}</span>
                    </div>
                    <p>
                      <b>{p.visits}</b> visit{p.visits === 1 ? "" : "s"} on {p.days_active} day{p.days_active === 1 ? "" : "s"} · {p.last_30} in the last 30 days
                    </p>
                    <p>
                      First {dateOf(p.first_at)} · last {ago(p.last_at)}
                    </p>
                    {p.places.length > 0 && <p>📍 {p.places.map((x) => `${flag(x.code)} ${x.name}`).join(" · ")}</p>}
                    {p.map_places.length > 0 && <p>🗺️ {p.map_places.map((x) => `${placeName(x.place)} ×${x.visits}`).join(" · ")}</p>}
                    {p.sources.length > 0 && <p>🔗 {p.sources.map((x) => x.name).join(" · ")}</p>}
                    {p.devices.length > 0 && (
                      <p>
                        {p.devices.map((d) => `${deviceIcon(d.device)} ${[d.os, d.browser].filter(Boolean).join(" ")}`).join(" · ")}
                      </p>
                    )}
                    <div className="vis-person-actions">
                      <button type="button" className="cat-mini" onClick={() => setOnly(only === p.visitor ? null : p.visitor)}>
                        {only === p.visitor ? "Show everyone" : "Their visits"}
                      </button>
                      <button type="button" className="cat-mini" onClick={() => rename(p)}>
                        {p.name ? "Rename" : "Name"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="vis-card">
            <h3>✦ {only ? `Visits by ${who(people?.find((p) => p.visitor === only)?.name ?? null, only)}` : "Every visit"}</h3>
            {logError && (
              <p className="cat-error" role="alert">
                {needsMigration(logError) ? "The visit log isn't set up yet: run supabase/migrations/20260915120000_palais_visitor_names.sql." : logError}
              </p>
            )}
            <ul className="vis-list vis-list--recent">
              {/* until the migration is run, the last 40 visits the old way */}
              {needsMigration(logError) &&
                stats.recent.map((v, i) => (
                  <li key={`old-${i}`}>
                    <span>
                      {flag(v.code)} {where(v)}
                      <small>
                        {v.visitor ? `visitor ${v.visitor} · ` : ""}
                        {deviceIcon(v.device)} {[deviceName(v.device), v.os, v.browser].filter(Boolean).join(" · ")}
                        {v.source ? ` · via ${v.source}` : ""}
                      </small>
                    </span>
                    <time dateTime={v.at}>{ago(v.at)}</time>
                  </li>
                ))}
              {log.map((v) => (
                <li key={v.id}>
                  <span>
                    {flag(v.code)} {where(v)}
                    <small>
                      <b className={v.is_me ? "vis-name is-me" : "vis-name"}>{who(v.name, v.visitor, v.is_me)}</b>
                      {" · "}
                      {deviceIcon(v.device)} {[deviceName(v.device), v.os, v.browser].filter(Boolean).join(" · ")}
                      {v.source ? ` · via ${v.source}` : v.referrer ? ` · from ${v.referrer}` : ""}
                    </small>
                    {v.places.length > 0 && <small>🗺️ {v.places.map(placeName).join(" → ")}</small>}
                  </span>
                  <time dateTime={v.at} title={new Date(v.at).toLocaleString()}>
                    {ago(v.at)}
                  </time>
                </li>
              ))}
              {!logDone && !logError && (
                <li ref={end} className="vis-more">
                  <span>Loading more visits…</span>
                </li>
              )}
              {logDone && log.length > 0 && (
                <li className="vis-more">
                  <span>That's every visit.</span>
                </li>
              )}
              {logDone && !log.length && !logError && (
                <li className="vis-more">
                  <span>No visits yet.</span>
                </li>
              )}
            </ul>
          </section>
          <p className="cat-signin-line">
            IP addresses aren't stored; each visitor is a scrambled code. Visits from localhost aren't counted.
          </p>
        </>
      )}
    </div>
  );
}
