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
  organization_name?: string;
  asn?: number;
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

const PHONE_MAKERS: [RegExp, string][] = [
  [/^(mi|redmi|poco|xiaomi|m[0-9]{4}|2[0-9]{6}|22[0-9]{5}|23[0-9]{5}|24[0-9]{5}|25[0-9]{5})/i, "Xiaomi"],
  [/^(sm-|gt-|sch-|galaxy)/i, "Samsung"],
  [/^(pixel|gm[0-9]|g[0-9a-z]{4}$)/i, "Google"],
  [/^(cph[0-9]|oppo|pd[a-z0-9]{2})/i, "OPPO"],
  [/^(ne[0-9]|kb[0-9]|le[0-9]{4}|in[0-9]{4}|oneplus|dn[0-9])/i, "OnePlus"],
  [/^(vivo|v[0-9]{4}[a-z])/i, "vivo"],
  [/^(rmx[0-9]|realme)/i, "realme"],
  [/^(moto|xt[0-9]{4})/i, "Motorola"],
  [/^(nokia|ta-[0-9]{4})/i, "Nokia"],
  [/^(lm-[a-z][0-9]|lg-)/i, "LG"],
  [/^(ane|ele|vog|lya|mar|jny|nen|bla|wgr|eml|cdy|mrd|stk|jkm|pot|yal|noh|tas|lio|els|ana|nam|anp|ags|honor|hma|hry|jsn|lld|mha|par|rne|sne|vce|vtr|was)/i, "Huawei / Honor"],
  [/^(asus|zs[0-9]{3}|ai[0-9]{4})/i, "ASUS"],
  [/^(sony|xq-|so-[0-9]|g8[0-9]{3})/i, "Sony"],
  [/^(nothing|a0[0-9]{2}$|a142|a059|a065)/i, "Nothing"],
  [/^(tecno|infinix|itel)/i, "Transsion"],
  [/^(fp[0-9]|fairphone)/i, "Fairphone"],
];

const makerOf = (model: string) => PHONE_MAKERS.find(([re]) => re.test(model))?.[1] ?? null;

function versionFrom(ua: string, browser: string) {
  const at = (re: RegExp) => ua.match(re)?.[1] ?? null;
  if (browser === "Edge") return at(/Edg\/([\d.]+)/);
  if (browser === "Opera") return at(/OPR\/([\d.]+)/);
  if (browser === "Samsung") return at(/SamsungBrowser\/([\d.]+)/);
  if (browser === "Firefox") return at(/(?:Firefox|FxiOS)\/([\d.]+)/);
  if (browser === "Chrome") return at(/(?:Chrome|CriOS)\/([\d.]+)/);
  if (browser === "Safari") return at(/Version\/([\d.]+)/);
  return null;
}

function osVersionFrom(ua: string) {
  const m =
    ua.match(/Android (\d+(?:\.\d+)*)/) ??
    ua.match(/(?:iPhone )?OS (\d+(?:[._]\d+)*) like Mac/) ??
    ua.match(/Mac OS X (\d+(?:[._]\d+)*)/) ??
    ua.match(/Windows NT (\d+(?:\.\d+)*)/) ??
    ua.match(/CrOS \S+ (\d+(?:\.\d+)*)/);
  if (!m) return null;
  const v = m[1].replace(/_/g, ".");
  if (/Windows NT/.test(m[0])) return { "10.0": "10 or 11", "6.3": "8.1", "6.2": "8", "6.1": "7" }[v] ?? v;
  return v;
}

const engineOf = (ua: string) =>
  /Gecko\/|Firefox|FxiOS/.test(ua) && !/like Gecko/.test(ua.replace(/Firefox.*/, ""))
    ? "Gecko"
    : /Chrome|Chromium|CriOS|Edg\/|OPR\//.test(ua)
      ? "Blink"
      : /AppleWebKit/.test(ua)
        ? "WebKit"
        : "Other";

async function describeMachine() {
  const nav = navigator as Navigator & {
    userAgentData?: { getHighEntropyValues?: (h: string[]) => Promise<Record<string, unknown>> };
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
    standalone?: boolean;
  };
  const ua = navigator.userAgent;
  const { device, os, browser } = describeDevice();

  let model: string | null = null;
  let osVersion: string | null = null;
  let browserVersion: string | null = null;
  try {
    const hints = await nav.userAgentData?.getHighEntropyValues?.(["model", "platformVersion", "uaFullVersion", "fullVersionList"]);
    if (hints) {
      model = (hints.model as string) || null;
      osVersion = (hints.platformVersion as string) || null;
      const list = (hints.fullVersionList as { brand: string; version: string }[] | undefined)?.filter((b) => !/Not.?A.?Brand/i.test(b.brand));
      browserVersion = (hints.uaFullVersion as string) || list?.[list.length - 1]?.version || null;
    }
  } catch {
    model = null;
  }
  if (!model) model = ua.match(/;\s*([A-Za-z0-9_+ -]+)\s*(?:Build\/|\))/)?.[1]?.trim() ?? null;
  if (model && /^(K|wv|Linux|Android|U)$/i.test(model)) model = null;

  const brand = os === "iPhone" || os === "iPad" || os === "Mac" ? "Apple" : model ? makerOf(model) : /MiuiBrowser/i.test(ua) ? "Xiaomi" : null;
  const media = (q: string) => {
    try {
      return window.matchMedia(q).matches;
    } catch {
      return false;
    }
  };
  const net = nav.connection ?? {};
  const landscape = window.innerWidth > window.innerHeight;

  return {
    device,
    os,
    browser,
    brand,
    model,
    osVersion: osVersion ?? osVersionFrom(ua),
    browserVersion: browserVersion ?? versionFrom(ua, browser),
    engine: engineOf(ua),
    screenW: Math.round(window.screen?.width ?? 0) || null,
    screenH: Math.round(window.screen?.height ?? 0) || null,
    viewportW: Math.round(window.innerWidth) || null,
    viewportH: Math.round(window.innerHeight) || null,
    dpr: Math.round((window.devicePixelRatio ?? 1) * 100) / 100,
    orientation: landscape ? "landscape" : "portrait",
    language: navigator.language ?? null,
    languages: (navigator.languages ?? []).slice(0, 6).join(",") || null,
    tzOffset: -new Date().getTimezoneOffset(),
    cores: navigator.hardwareConcurrency ?? null,
    memory: nav.deviceMemory ?? null,
    touch: navigator.maxTouchPoints ?? 0,
    connection: net.effectiveType ?? null,
    downlink: net.downlink ?? null,
    saveData: net.saveData ?? null,
    colorScheme: media("(prefers-color-scheme: dark)") ? "dark" : "light",
    reducedMotion: media("(prefers-reduced-motion: reduce)"),
    installed: media("(display-mode: standalone)") || nav.standalone === true,
  };
}

const tagsIn = (search: string) => {
  const p = new URLSearchParams(search);
  return {
    tag: (p.get("from") ?? p.get("ref") ?? p.get("source") ?? p.get("utm_source") ?? "").trim().slice(0, 40) || null,
    medium: p.get("utm_medium")?.trim().slice(0, 40) || null,
    campaign: p.get("utm_campaign")?.trim().slice(0, 60) || null,
    term: p.get("utm_term")?.trim().slice(0, 60) || null,
    content: p.get("utm_content")?.trim().slice(0, 60) || null,
  };
};

const ownZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
};

const referrerPath = () => {
  try {
    if (!document.referrer) return null;
    const u = new URL(document.referrer);
    return u.host === window.location.host ? null : (u.pathname + u.search).slice(0, 200);
  } catch {
    return null;
  }
};

let watching = false;
let seen = 0;
let lastTick = Date.now();
let pagesSeen = 1;

export function countPage() {
  pagesSeen += 1;
}

function watchStay() {
  if (watching) return;
  watching = true;
  const tick = () => {
    const now = Date.now();
    if (document.visibilityState === "visible") seen += Math.min(60_000, now - lastTick);
    lastTick = now;
  };
  const send = async () => {
    tick();
    let session: string | null = null;
    try {
      session = sessionStorage.getItem(SESSION_KEY);
    } catch {
      return;
    }
    if (!session) return;
    try {
      const sb = await db();
      await sb.rpc("palais_touch_visit", { p_session: session, p_seconds: Math.round(seen / 1000), p_pages: pagesSeen });
    } catch {
      return;
    }
  };
  setInterval(send, 30_000);
  document.addEventListener("visibilitychange", () => {
    tick();
    if (document.visibilityState === "hidden") void send();
  });
  window.addEventListener("pagehide", () => void send());
}

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
  const machine = await describeMachine();
  const source = describeSource();
  const marks = tagsIn(window.location.search);
  const fromPath = referrerPath();
  const landing = window.location.hash || "/";
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
      p_device: machine.device,
      p_os: machine.os,
      p_browser: machine.browser,
      p_source: source,
      p_brand: machine.brand,
      p_model: machine.model,
      p_os_version: machine.osVersion,
      p_browser_version: machine.browserVersion,
      p_engine: machine.engine,
      p_screen_w: machine.screenW,
      p_screen_h: machine.screenH,
      p_viewport_w: machine.viewportW,
      p_viewport_h: machine.viewportH,
      p_dpr: machine.dpr,
      p_orientation: machine.orientation,
      p_language: machine.language,
      p_languages: machine.languages,
      p_tz_offset: machine.tzOffset,
      p_cores: machine.cores,
      p_memory: machine.memory,
      p_touch: machine.touch,
      p_connection: machine.connection,
      p_downlink: machine.downlink,
      p_save_data: machine.saveData,
      p_color_scheme: machine.colorScheme,
      p_reduced_motion: machine.reducedMotion,
      p_installed: machine.installed,
      p_landing: landing,
      p_referrer_path: fromPath,
      p_tag: marks.tag,
      p_utm_medium: marks.medium,
      p_utm_campaign: marks.campaign,
      p_utm_term: marks.term,
      p_utm_content: marks.content,
      p_network: geo.organization_name ?? null,
      p_asn: geo.asn ?? null,
      p_zone: ownZone(),
    });
    watchStay();
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
  me?: { name: string | null; visits: number };
  vpn?: { visits: number; networks: { network: string | null; why: string; visits: number }[] };
  networks?: { network: string; visits: number; unique: number }[];
  places?: { place: string; visits: number; unique: number; seconds: number }[];
  time?: { median_seconds: number; longest_seconds: number; glances: number };
  by_hour?: { hour: number; visits: number }[];
  makes?: { brand: string; model: string | null; visits: number; unique: number }[];
  screens?: { size: string; visits: number; unique: number }[];
  languages?: { language: string; visits: number; unique: number }[];
  connections?: { connection: string; visits: number; downlink: number | null }[];
  campaigns?: { tag: string | null; medium: string | null; campaign: string | null; visits: number }[];
  tastes?: { dark: number; light: number; reduced_motion: number; installed: number; save_data: number };
  systems: { os: string; browser: string; visits: number; unique: number }[];
  countries: { country: string; code: string | null; visits: number; unique: number }[];
  cities: { city: string; region: string | null; country: string | null; code: string | null; lat: number | null; lon: number | null; visits: number; unique: number }[];
  recent: { at: string; city: string | null; region: string | null; country: string | null; code: string | null; page: string | null; referrer: string | null; device: string | null; os: string | null; browser: string | null; source?: string | null; visitor: string | null }[];
}

let placeQueue: Promise<void> = Promise.resolve();

export function recordPlace(place: string) {
  if (!dbConfigured || process.env.NODE_ENV !== "production") return;
  placeQueue = placeQueue.then(async () => {
    let session: string | null = null;
    for (let i = 0; i < 20 && !session; i++) {
      try {
        session = sessionStorage.getItem(SESSION_KEY);
      } catch {
        return;
      }
      if (!session) await new Promise((r) => setTimeout(r, 250));
    }
    if (!session) return;
    try {
      const sb = await db();
      await sb.rpc("palais_record_place", { p_session: session, p_place: place });
    } catch {
      return;
    }
  });
}

/**
 * What someone is doing inside: opening the catalogue, opening the character
 * catalogue, stopping on a character. Same shape as recordPlace — it waits for
 * the session the visit was recorded under, and never speaks up on localhost.
 */
let doingQueue: Promise<void> = Promise.resolve();

export function noteDoing(kind: string, detail?: string) {
  if (!dbConfigured || process.env.NODE_ENV !== "production") return;
  doingQueue = doingQueue.then(async () => {
    let session: string | null = null;
    for (let i = 0; i < 20 && !session; i++) {
      try {
        session = sessionStorage.getItem(SESSION_KEY);
      } catch {
        return;
      }
      if (!session) await new Promise((r) => setTimeout(r, 250));
    }
    if (!session) return;
    try {
      const sb = await db();
      await sb.rpc("palais_note_doing", { p_session: session, p_kind: kind, p_detail: detail ?? null });
    } catch {
      return;
    }
  });
}

export interface VisitDoing {
  kind: string;
  detail: string | null;
  at: string;
}

export interface VisitLogEntry {
  id: number;
  at: string;
  city: string | null;
  region: string | null;
  country: string | null;
  code: string | null;
  page: string | null;
  referrer: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  source: string | null;
  visitor: string | null;
  name: string | null;
  is_me: boolean;
  places: string[];
  timezone: string | null;
  landing: string | null;
  referrer_path: string | null;
  tag: string | null;
  campaign: string | null;
  medium: string | null;
  os_version: string | null;
  browser_version: string | null;
  engine: string | null;
  brand: string | null;
  model: string | null;
  screen: string | null;
  viewport: string | null;
  dpr: number | null;
  orientation: string | null;
  language: string | null;
  languages: string | null;
  tz_offset: number | null;
  cores: number | null;
  memory: number | null;
  touch: number | null;
  connection: string | null;
  downlink: number | null;
  save_data: boolean | null;
  color_scheme: string | null;
  reduced_motion: boolean | null;
  installed: boolean | null;
  seconds: number | null;
  pages: number | null;
  last_seen: string | null;
  network: string | null;
  asn: number | null;
  zone: string | null;
  /** why this visit looks like a VPN, or null if it doesn't */
  vpn: string | null;
  /** what they opened and who they stopped on, in order */
  doings: VisitDoing[];
}

export async function visitLog(before?: number, visitor?: string | null, limit = 50): Promise<VisitLogEntry[]> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_visit_log", { p_before: before ?? null, p_limit: limit, p_visitor: visitor ?? null });
  if (error) throw new Error(error.message);
  return (data ?? []) as VisitLogEntry[];
}

export interface VisitorProfile {
  visitor: string;
  name: string | null;
  is_me: boolean;
  visits: number;
  days_active: number;
  first_at: string;
  last_at: string;
  last_7: number;
  last_30: number;
  note: string | null;
  total_seconds: number;
  longest_seconds: number;
  busiest_hour: number | null;
  timezone: string | null;
  language: string | null;
  network: string | null;
  vpn_visits: number;
  sources: { name: string; visits: number }[];
  places: { name: string; code: string | null; visits: number }[];
  map_places: { place: string; visits: number; seconds: number }[];
  devices: {
    device: string | null;
    os: string | null;
    os_version: string | null;
    browser: string | null;
    browser_version: string | null;
    brand: string | null;
    model: string | null;
    screen: string | null;
    visits: number;
  }[];
}

export async function visitorProfiles(): Promise<VisitorProfile[]> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_visitor_profiles");
  if (error) throw new Error(error.message);
  return (data ?? []) as VisitorProfile[];
}

export async function nameVisitor(visitor: string, name: string, isMe = false, note?: string | null) {
  const sb = await db();
  const { error } = await sb.rpc("palais_name_visitor", { p_prefix: visitor, p_name: name, p_is_me: isMe, p_note: note ?? null });
  if (error) throw new Error(error.message);
}

export interface GithubStats {
  days: number;
  all_time: number;
  period: number;
  today: number;
  first_at: string | null;
  badges: { badge: string; views: number; last_at: string }[];
  by_day: { day: string; views: number }[];
  via: { via: string; views: number }[];
}

/** how many people have looked at the GitHub profile (the badge in its README) */
export async function githubStats(days = 30): Promise<GithubStats> {
  const sb = await db();
  const { data, error } = await sb.rpc("github_view_stats", { p_days: days });
  if (error) throw new Error(error.message);
  return data as GithubStats;
}

export async function visitStats(days = 30): Promise<VisitStats> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_visit_stats", { p_days: days });
  if (error) throw new Error(error.message);
  return data as VisitStats;
}
