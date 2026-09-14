import { db, dbConfigured } from "./layoutsDb";

/**
 * Counting visitors to the Palais.
 *
 * Once per browser tab session, the home page records a visit: the city it
 * came from and the kind of device. The database counts unique visitors by a
 * salted hash of the IP address and never stores the address itself (see
 * supabase/migrations/…_palais_visits.sql).
 *
 * Where they came from is worked out in three ways, most reliable first: a
 * tag on the link (mollybeach.app/?from=discord), the app's own in-app
 * browser announcing itself (Instagram, LinkedIn, TikTok…), or the address of
 * the page that linked here. Texts, iMessage, WhatsApp and the Discord app
 * don't tell websites anything, so those only show up when the link is tagged.
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

/** friendly names for link tags and the sites that send people here */
const SITES: [RegExp, string][] = [
  [/(^|\.)instagram\.com$|^ig$|^insta/, "Instagram"],
  [/(^|\.)(facebook|fb)\.com$|^fb$|^facebook/, "Facebook"],
  [/(^|\.)messenger\.com$|^messenger/, "Messenger"],
  [/(^|\.)(twitter|x)\.com$|^t\.co$|^twitter|^x$/, "X / Twitter"],
  [/(^|\.)(discord|discordapp)\.(com|gg)$|^discord/, "Discord"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$|^linkedin|^li$/, "LinkedIn"],
  [/(^|\.)tiktok\.com$|^tiktok/, "TikTok"],
  [/(^|\.)snapchat\.com$|^snap/, "Snapchat"],
  [/(^|\.)reddit\.com$|^reddit/, "Reddit"],
  [/(^|\.)youtube\.com$|^youtu\.be$|^youtube|^yt$/, "YouTube"],
  [/(^|\.)pinterest\.|^pin\.it$|^pinterest/, "Pinterest"],
  [/(^|\.)threads\.net$|^threads/, "Threads"],
  [/(^|\.)bsky\.app$|^bluesky|^bsky/, "Bluesky"],
  [/(^|\.)whatsapp\.com$|^wa\.me$|^whatsapp|^wa$/, "WhatsApp"],
  [/(^|\.)t\.me$|telegram|^tg$/, "Telegram"],
  [/(^|\.)slack\.com$|^slack/, "Slack"],
  [/(^|\.)github\.com$|^github|^gh$/, "GitHub"],
  [/^imessage|^text|^sms|^messages/, "iMessage / texts"],
  [/^email|^mail|mail\.google\.com$|outlook\.|mail\.yahoo\.|^gmail/, "Email"],
  [/(^|\.)google\.|^google/, "Google"],
  [/(^|\.)bing\.com$|duckduckgo\.com$|(^|\.)yahoo\.|ecosia\.org$|search\.brave\.com$/, "Search"],
  [/(^|\.)chatgpt\.com$|openai\.com$|perplexity\.ai$|claude\.ai$|^chatgpt|^ai$/, "AI chat"],
  [/^resume|^cv/, "Résumé"],
];
const nameFor = (key: string) => SITES.find(([re]) => re.test(key))?.[1];

/** Android apps sometimes pass themselves along as android-app://com.whatsapp */
const ANDROID_APPS: Record<string, string> = {
  "com.whatsapp": "WhatsApp",
  "com.discord": "Discord",
  "org.telegram.messenger": "Telegram",
  "com.google.android.gm": "Email",
  "com.slack": "Slack",
  "com.linkedin.android": "LinkedIn",
  "com.instagram.android": "Instagram",
  "com.twitter.android": "X / Twitter",
  "com.reddit.frontpage": "Reddit",
  "com.google.android.googlequicksearchbox": "Google",
};

/** the app or site that sent this visitor, as best the browser can tell */
export function describeSource(
  search = window.location.search,
  referrer = document.referrer,
  ua = navigator.userAgent,
  host = window.location.host,
): string {
  // 1. a tagged link: ?from=discord, ?ref=… or ?utm_source=…
  const params = new URLSearchParams(search);
  const tag = (params.get("from") ?? params.get("ref") ?? params.get("utm_source") ?? params.get("source") ?? "").trim().toLowerCase();
  if (tag) return nameFor(tag) ?? tag.slice(0, 40);

  // 2. an app's in-app browser, which names itself
  if (/Instagram/.test(ua)) return "Instagram";
  if (/\bFB_IAB\/MESSENGER|MessengerForiOS|Orca-Android/.test(ua)) return "Messenger";
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(ua)) return "Facebook";
  if (/LinkedInApp/.test(ua)) return "LinkedIn";
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return "TikTok";
  if (/Snapchat/.test(ua)) return "Snapchat";
  if (/\bTwitter/.test(ua)) return "X / Twitter";
  if (/Discord/.test(ua)) return "Discord";
  if (/Pinterest/.test(ua)) return "Pinterest";
  if (/Line\//.test(ua)) return "LINE";
  if (/MicroMessenger/.test(ua)) return "WeChat";
  if (/Telegram/.test(ua)) return "Telegram";
  if (/Slack/.test(ua)) return "Slack";

  // 3. the page (or Android app) that linked here
  if (referrer) {
    try {
      const url = new URL(referrer);
      if (url.protocol === "android-app:") return ANDROID_APPS[url.host] ?? url.host;
      if (url.host && url.host !== host) {
        const bare = url.host.replace(/^www\./, "");
        return nameFor(bare) ?? bare;
      }
    } catch {
      /* not a readable address */
    }
  }
  return "Direct / unknown";
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
  const source = describeSource();
  // tidy a ?from=… tag out of the address bar once it's been read
  try {
    const url = new URL(window.location.href);
    const had = ["from", "ref", "utm_source", "utm_medium", "utm_campaign", "source"].filter((k) => url.searchParams.has(k));
    if (had.length) {
      had.forEach((k) => url.searchParams.delete(k));
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  } catch {
    /* leave the address alone */
  }
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
      p_source: source,
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
  sources?: { source: string; visits: number; unique: number }[];
  systems: { os: string; browser: string; visits: number; unique: number }[];
  countries: { country: string; code: string | null; visits: number; unique: number }[];
  cities: { city: string; region: string | null; country: string | null; code: string | null; lat: number | null; lon: number | null; visits: number; unique: number }[];
  recent: { at: string; city: string | null; region: string | null; country: string | null; code: string | null; page: string | null; referrer: string | null; device: string | null; os: string | null; browser: string | null; source?: string | null; visitor: string | null }[];
}

export async function visitStats(days = 30): Promise<VisitStats> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_visit_stats", { p_days: days });
  if (error) throw new Error(error.message);
  return data as VisitStats;
}
