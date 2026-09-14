import { useEffect, useState } from "react";
import { visitStats, type VisitStats } from "./visits";
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

export function VisitorsShelf() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState("");

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
            <h3>✦ Latest visits</h3>
            {stats.recent.length ? (
              <ul className="vis-list vis-list--recent">
                {stats.recent.map((v, i) => (
                  <li key={i}>
                    <span>
                      {flag(v.code)} {[v.city, v.country].filter(Boolean).join(", ") || "Somewhere"}
                      <small>
                        {deviceIcon(v.device)} {[deviceName(v.device), v.os, v.browser].filter(Boolean).join(" · ")}
                        {v.referrer ? ` · from ${v.referrer}` : ""}
                        {v.page && v.page !== "/" ? ` · ${v.page}` : ""}
                        {v.visitor ? ` · visitor ${v.visitor}` : ""}
                      </small>
                    </span>
                    <time dateTime={v.at}>{ago(v.at)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cat-note">No visits yet.</p>
            )}
          </section>
          <p className="cat-signin-line">
            IP addresses aren't stored; each visitor is a scrambled code. Visits from localhost aren't counted.
          </p>
        </>
      )}
    </div>
  );
}
