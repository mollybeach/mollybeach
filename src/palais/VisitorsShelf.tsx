import { useCallback, useEffect, useRef, useState } from "react";
import { PLACE_NAMES, type Place } from "./place";
import { VisitorMap } from "./VisitorMap";
import { nameVisitor, visitLog, visitorProfiles, visitStats, type VisitDoing, type VisitLogEntry, type VisitorProfile, type VisitStats } from "./visits";
import { messageOf } from "./useCollection";

/**
 * The catalogue's visitor book: how many people have come to the Palais, how
 * many of them are different people, and where they came from. Only editors
 * see it; the database refuses everyone else.
 */

export const VISIT_RANGES = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 3650, label: "All time" },
];

const RANGES = VISIT_RANGES;

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

/** what someone did inside, read back as a sentence: "opened the catalogue ·
    characters: Molly → Ella". People they scrolled past in a row are gathered
    up rather than listed one line each. */
function doingTrail(doings: VisitDoing[]) {
  const bits: string[] = [];
  for (const d of doings) {
    if (d.kind === "character") {
      const last = bits[bits.length - 1];
      if (last?.startsWith("characters: ")) bits[bits.length - 1] = `${last} → ${d.detail}`;
      else bits.push(`characters: ${d.detail}`);
    } else if (d.kind === "characters") {
      bits.push("opened the character catalogue");
    } else if (d.kind === "catalogue") {
      bits.push("opened the catalogue");
    } else if (d.kind === "record") {
      bits.push("put the record on");
    } else if (d.kind === "pictures") {
      bits.push("looked through the pictures");
    } else if (d.kind === "portrait-seen" || d.kind === "portrait-film") {
      // the ones they stopped on, gathered into one trail like the characters
      const word = d.kind === "portrait-film" ? "watched: " : "pictures: ";
      const last = bits[bits.length - 1];
      if (last?.startsWith(word)) bits[bits.length - 1] = `${last} → ${d.detail}`;
      else bits.push(`${word}${d.detail}`);
    } else if (d.kind === "portrait-try") {
      bits.push(d.detail ? `tried a word on the dresser · ${d.detail}` : "tried a word on the dresser");
    } else if (d.kind === "portrait") {
      bits.push(d.detail ? `put ${d.detail} in the dresser` : "put something in the dresser");
    } else if (d.kind === "letters") {
      bits.push(d.detail ? `opened the letters · ${d.detail}` : "opened the letters");
    } else {
      bits.push(d.detail ? `${d.kind}: ${d.detail}` : d.kind);
    }
  }
  return bits.join(" · ");
}

const mins = (sec: number | null | undefined) => {
  const n = sec ?? 0;
  if (!n) return "—";
  if (n < 60) return `${Math.round(n)}s`;
  if (n < 3600) return `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`;
  return `${Math.floor(n / 3600)}h ${Math.round((n % 3600) / 60)}m`;
};

const hour = (h: number | null) => (h === null ? "" : `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`);

const machineOf = (v: VisitLogEntry) =>
  [
    v.brand && v.model ? `${v.brand} ${v.model}` : v.brand ?? v.model,
    [v.os, v.os_version].filter(Boolean).join(" "),
    [v.browser, v.browser_version?.split(".")[0]].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" · ");

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

/** `only` fixes the stretch of time from outside (the /admin page has its own
    picker), which also takes this one's away */
export function VisitorsShelf({ forDays }: { forDays?: number } = {}) {
  const [own, setDays] = useState(30);
  const days = forDays ?? own;
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
  /* Molly is in the feed every day, which buries everybody else, so her own
     visits are kept out of it. The button by the heading brings them back. */
  const [hideMe, setHideMe] = useState(true);
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

  /* everybody else's visits, unless the button says otherwise */
  const feed = hideMe && !only ? log.filter((v) => !v.is_me) : log;
  const max = Math.max(1, ...(stats?.by_day.map((d) => d.visits) ?? [1]));
  const period = RANGES.find((r) => r.days === days)?.label ?? "";

  return (
    <div className="cat-looks vis">
      {!forDays && (
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
      )}

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
            <h4>🚪 Came in through</h4>
            {stats.landings?.length ? (
              <ul className="vis-list">
                {stats.landings.map((l) => (
                  <li key={l.landing}>
                    <span>
                      {l.room ?? l.landing}
                      <small>
                        {l.landing === "/" ? "the front door" : `mollybeach.app/${l.landing}`} · {l.visits} visit
                        {l.visits === 1 ? "" : "s"}
                      </small>
                    </span>
                    <b>{l.unique}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cat-note">No arrivals recorded yet{stats.landings ? "" : " (run the front doors SQL to start)"}.</p>
            )}
            <p className="vis-hint">
              A link straight to a room — <code>mollybeach.app/lakehouse</code> — lands someone there rather than in the
              palace, and shows up here.
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
                        {p.seconds ? ` · about ${mins(p.seconds)} each` : ""}
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

          {!!stats.time && (
            <section className="vis-card">
              <h3>⏱ How long they stay</h3>
              <ul className="vis-list">
                <li>
                  <span>Typical visit</span>
                  <b>{mins(stats.time.median_seconds)}</b>
                </li>
                <li>
                  <span>Longest visit</span>
                  <b>{mins(stats.time.longest_seconds)}</b>
                </li>
                <li>
                  <span>
                    Quick glances<small>under 10 seconds</small>
                  </span>
                  <b>{stats.time.glances}</b>
                </li>
              </ul>
            </section>
          )}

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
              <h3>🏷️ Makes &amp; models</h3>
              {stats.makes?.length ? (
                <ul className="vis-list">
                  {stats.makes.map((m) => (
                    <li key={`${m.brand}-${m.model}`}>
                      <span>
                        {m.brand}
                        {m.model ? <small>{m.model}</small> : null}
                      </span>
                      <b>{m.unique}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">No makes yet: phones only tell us from the next visit on.</p>
              )}
            </section>
            <section className="vis-card">
              <h3>🖥 Screens</h3>
              {stats.screens?.length ? (
                <ul className="vis-list">
                  {stats.screens.map((sc) => (
                    <li key={sc.size}>
                      <span>{sc.size}</span>
                      <b>{sc.unique}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">No screens yet.</p>
              )}
            </section>
          </div>

          <div className="vis-cols">
            <section className="vis-card">
              <h3>🛡 Likely VPNs</h3>
              {stats.vpn?.visits ? (
                <ul className="vis-list">
                  <li>
                    <span>
                      Visits that look like a VPN
                      <small>of {stats.period.visits} in this stretch</small>
                    </span>
                    <b>{stats.vpn.visits}</b>
                  </li>
                  {stats.vpn.networks.map((n, i) => (
                    <li key={i}>
                      <span>
                        {n.network ?? "Unknown network"}
                        <small>{n.why}</small>
                      </span>
                      <b>{n.visits}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">Nothing looks like a VPN{stats.vpn ? "" : " yet (run the visitor SQL)"}.</p>
              )}
              <p className="vis-hint">A guess, not proof: offices, travellers and Apple's Private Relay set it off too.</p>
            </section>
            <section className="vis-card">
              <h3>🗣 Languages</h3>
              {stats.languages?.length ? (
                <ul className="vis-list">
                  {stats.languages.map((l) => (
                    <li key={l.language}>
                      <span>{l.language}</span>
                      <b>{l.unique}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cat-note">No languages yet.</p>
              )}
            </section>
            <section className="vis-card">
              <h3>📶 Connection &amp; taste</h3>
              <ul className="vis-list">
                {(stats.connections ?? []).map((c) => (
                  <li key={c.connection}>
                    <span>
                      {c.connection}
                      {c.downlink ? <small>about {c.downlink} Mbps</small> : null}
                    </span>
                    <b>{c.visits}</b>
                  </li>
                ))}
                {!!stats.tastes && (
                  <>
                    <li>
                      <span>Dark mode</span>
                      <b>{stats.tastes.dark}</b>
                    </li>
                    <li>
                      <span>Light mode</span>
                      <b>{stats.tastes.light}</b>
                    </li>
                    <li>
                      <span>Less motion</span>
                      <b>{stats.tastes.reduced_motion}</b>
                    </li>
                    <li>
                      <span>Added to a home screen</span>
                      <b>{stats.tastes.installed}</b>
                    </li>
                  </>
                )}
              </ul>
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

          {/* the two long lists start folded: the page opens as a summary
              rather than a wall of visits */}
          <details className="vis-card vis-fold">
            <summary>
              <h3>👥 Visitors{people?.length ? ` · ${people.length}` : ""}</h3>
            </summary>
            {peopleError && (
              <p className="cat-error" role="alert">
                {needsMigration(peopleError) ? "Visitor profiles aren't set up yet: run supabase/migrations/20260915120000_palais_visitor_id.sql." : peopleError}
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
                    <p>
                      ⏱ {mins(p.total_seconds)} in all · longest {mins(p.longest_seconds)}
                      {p.busiest_hour !== null ? ` · usually around ${hour(p.busiest_hour)}` : ""}
                    </p>
                    {(p.timezone || p.language || p.network) && (
                      <p>🕰 {[p.timezone, p.language, p.network].filter(Boolean).join(" · ")}</p>
                    )}
                    {p.vpn_visits > 0 && (
                      <p>
                        <b className="vis-vpn">🛡 {p.vpn_visits === p.visits ? "Always" : `${p.vpn_visits} of ${p.visits} visits`}</b> looks like a VPN
                      </p>
                    )}
                    {p.places.length > 0 && <p>📍 {p.places.map((x) => `${flag(x.code)} ${x.name}`).join(" · ")}</p>}
                    {p.map_places.length > 0 && (
                      <p>🗺️ {p.map_places.map((x) => `${placeName(x.place)} ×${x.visits}${x.seconds ? ` (${mins(x.seconds)})` : ""}`).join(" · ")}</p>
                    )}
                    {p.sources.length > 0 && <p>🔗 {p.sources.map((x) => x.name).join(" · ")}</p>}
                    {p.devices.map((d, i) => (
                      <p key={i}>
                        {deviceIcon(d.device)}{" "}
                        {[
                          d.brand && d.model ? `${d.brand} ${d.model}` : d.brand ?? d.model,
                          [d.os, d.os_version].filter(Boolean).join(" "),
                          [d.browser, d.browser_version?.split(".")[0]].filter(Boolean).join(" "),
                          d.screen,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ))}
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
          </details>

          <details className="vis-card vis-fold">
            <summary>
              <h3>✦ {only ? `Visits by ${who(people?.find((p) => p.visitor === only)?.name ?? null, only)}` : "Every visit"}</h3>
            </summary>
            {!only && (
              <p className="vis-person-actions">
                <button type="button" className="cat-mini" onClick={() => setHideMe((v) => !v)} aria-pressed={!hideMe}>
                  {hideMe ? "Show my own visits" : "Hide my own visits"}
                </button>
              </p>
            )}
            {logError && (
              <p className="cat-error" role="alert">
                {needsMigration(logError) ? "The visit log isn't set up yet: run supabase/migrations/20260915120000_palais_visitor_id.sql." : logError}
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
              {feed.map((v) => (
                <li key={v.id}>
                  <span>
                    {flag(v.code)} {where(v)}
                    <small>
                      <b className={v.is_me ? "vis-name is-me" : "vis-name"}>{who(v.name, v.visitor, v.is_me)}</b>
                      {" · "}
                      {deviceIcon(v.device)} {machineOf(v) || deviceName(v.device)}
                      {v.source ? ` · via ${v.source}` : v.referrer ? ` · from ${v.referrer}` : ""}
                    </small>
                    {(v.network || v.vpn) && (
                      <small>
                        {v.vpn ? <b className="vis-vpn">🛡 {v.vpn}</b> : null}
                        {v.vpn && v.network ? " · " : ""}
                        {v.network}
                      </small>
                    )}
                    <small>
                      {[
                        v.seconds ? `stayed ${mins(v.seconds)}` : null,
                        v.pages && v.pages > 1 ? `${v.pages} pages` : null,
                        v.screen ? `screen ${v.screen}` : null,
                        v.viewport ? `window ${v.viewport}` : null,
                        v.dpr && v.dpr !== 1 ? `${v.dpr}×` : null,
                        v.language,
                        v.color_scheme === "dark" ? "dark mode" : null,
                        v.installed ? "home screen" : null,
                        v.connection,
                        v.cores ? `${v.cores} cores` : null,
                        v.memory ? `${v.memory} GB` : null,
                        v.timezone,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                    {v.landing && v.landing !== "/" && <small>🚪 came in at {placeName(v.landing.replace(/^#/, ""))}</small>}
                    {v.places.length > 0 && <small>🗺️ {v.places.map(placeName).join(" → ")}</small>}
                    {v.doings?.length > 0 && <small>✿ {doingTrail(v.doings)}</small>}
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
              {logDone && feed.length > 0 && (
                <li className="vis-more">
                  <span>{hideMe && !only ? "That's every visit but mine." : "That's every visit."}</span>
                </li>
              )}
              {logDone && !feed.length && !logError && (
                <li className="vis-more">
                  <span>No visits yet.</span>
                </li>
              )}
            </ul>
          </details>

          <section className="vis-card">
            <h3>🌍 Where in the world</h3>
            <VisitorMap cities={stats.cities} total={stats.cities_total} />
          </section>
          <p className="cat-signin-line">
            IP addresses aren't stored; each visitor is a scrambled code. Visits from localhost aren't counted.
          </p>
        </>
      )}
    </div>
  );
}
