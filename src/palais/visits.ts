import { db, dbConfigured } from "./layoutsDb";

/**
 * Counting visitors to the Palais.
 *
 * Once per browser tab session, the home page records a visit: the city it
 * came from and the kind of device. The database counts unique visitors by a
 * salted hash of the IP address and never stores the address itself (see
 * supabase/migrations/…_palais_visits.sql).
 *
 * The city comes from a free lookup (get.geojs.io) that the visitor's browser
 * calls. If that's blocked, the visit is still counted, just without a place.
 * Nothing is recorded while developing on localhost.
 */

const SESSION_KEY = "palais-visit";

interface Geo {
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
}

async function lookUp(): Promise<Geo> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: ctl.signal });
    return r.ok ? ((await r.json()) as Geo) : {};
  } catch {
    return {};
  } finally {
    clearTimeout(t);
  }
}

/** phone, tablet or desktop, and the system and browser, read from the
    browser's own description of itself rather than the screen size */
export function describeDevice(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints ?? 0) {
  // iPads ask for desktop pages and call themselves Macs, but Macs have no touchscreen
  const iPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
  const tablet = iPad || (/Android/.test(ua) && !/Mobile/.test(ua)) || /Tablet|Silk|Kindle/i.test(ua);
  const phone = !tablet && /iPhone|iPod|Android.*Mobile|Mobile|Mobi/i.test(ua);

  const os = iPad
    ? "iPad"
    : /iPhone|iPod/.test(ua)
      ? "iPhone"
      : /Android/.test(ua)
        ? "Android"
        : /CrOS/.test(ua)
          ? "ChromeOS"
          : /Windows/.test(ua)
            ? "Windows"
            : /Macintosh|Mac OS X/.test(ua)
              ? "Mac"
              : /Linux/.test(ua)
                ? "Linux"
                : "Other";

  const browser = /Instagram/.test(ua)
    ? "Instagram"
    : /FBAN|FBAV/.test(ua)
      ? "Facebook"
      : /LinkedInApp/.test(ua)
        ? "LinkedIn"
        : /Edg\//.test(ua)
          ? "Edge"
          : /OPR\/|Opera/.test(ua)
            ? "Opera"
            : /SamsungBrowser/.test(ua)
              ? "Samsung"
              : /Firefox|FxiOS/.test(ua)
                ? "Firefox"
                : /Chrome|CriOS|Chromium/.test(ua)
                  ? "Chrome"
                  : /Safari/.test(ua)
                    ? "Safari"
                    : "Other";

  return { device: tablet ? "tablet" : phone ? "phone" : "desktop", os, browser };
}

const referrerHost = () => {
  try {
    const host = document.referrer ? new URL(document.referrer).host : "";
    return host && host !== window.location.host ? host : null;
  } catch {
    return null;
  }
};

const num = (s?: string) => {
  const n = s === undefined ? NaN : Number(s);
  return Number.isFinite(n) ? n : null;
};

export async function recordVisit() {
  if (!dbConfigured) return;
  if (process.env.NODE_ENV !== "production") return;

  let session: string | null = null;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    session = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, session);
  } catch {
    session = crypto.randomUUID?.() ?? String(Math.random()).slice(2);
  }

  const geo = await lookUp();
  const { device, os, browser } = describeDevice();
  try {
    const sb = await db();
    await sb.rpc("palais_record_visit", {
      p_session: session,
      p_page: window.location.hash || "/",
      p_referrer: referrerHost(),
      p_city: geo.city ?? null,
      p_region: geo.region ?? null,
      p_country: geo.country ?? null,
      p_country_code: geo.country_code ?? null,
      p_lat: num(geo.latitude),
      p_lon: num(geo.longitude),
      p_timezone: geo.timezone ?? null,
      p_device: device,
      p_os: os,
      p_browser: browser,
    });
  } catch {
    /* counting visitors must never break the page */
  }
}

export interface VisitStats {
  days: number;
  all_time: { visits: number; unique: number };
  period: { visits: number; unique: number };
  today: { visits: number; unique: number };
  by_day: { day: string; visits: number; unique: number }[];
  devices: { device: string; visits: number; unique: number }[];
  systems: { os: string; browser: string; visits: number; unique: number }[];
  countries: { country: string; code: string | null; visits: number; unique: number }[];
  cities: { city: string; region: string | null; country: string | null; code: string | null; lat: number | null; lon: number | null; visits: number; unique: number }[];
  recent: { at: string; city: string | null; region: string | null; country: string | null; code: string | null; page: string | null; referrer: string | null; device: string | null; os: string | null; browser: string | null; visitor: string | null }[];
}

export async function visitStats(days = 30): Promise<VisitStats> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_visit_stats", { p_days: days });
  if (error) throw new Error(error.message);
  return data as VisitStats;
}
