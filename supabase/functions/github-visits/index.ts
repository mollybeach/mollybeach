/**
 * The visitor badge and the "mollybeach.app" button on the GitHub profile
 * (README.md).
 *
 * GitHub asks for these images every time someone opens the profile. The badge
 * counts the view in the github_visits table and draws the running total; the
 * button just goes to the site. Both wear one of Molly's floral patterns and
 * turn through them (florals.ts), so the profile looks a little different every
 * time it's opened.
 *
 * GitHub fetches README images through its own proxy, so the request comes
 * from GitHub's servers rather than the reader: there's no city, browser or
 * way to tell readers apart. It counts views, honestly labelled as such.
 *
 *   …/github-visits                  the counter
 *   …/github-visits?art=link         the button through to the site
 *   …/github-visits?badge=palais     a counter of its own, for another repo
 *   …/github-visits?style=plain      just the number
 *   …/github-visits?floral=maroon    hold it to one pattern
 *   …/github-visits?peek=1           the total without counting the view
 */

import { FLORALS, floralFor, floralNamed, type Floral } from "./florals.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const FONT = "'Segoe UI',Ubuntu,Helvetica,Arial,sans-serif";

const digits = (n: number) => n.toLocaleString("en-US");

/** the pattern, the veil over it and the two rims: the same dress on both pictures */
const dressing = (f: Floral, w: number, h: number, r: number) => `
  <defs>
    <clipPath id="pill"><rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="${r}"/></clipPath>
    <linearGradient id="veil" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${f.ink}" stop-opacity=".78"/>
      <stop offset="62%" stop-color="${f.ink}" stop-opacity=".42"/>
      <stop offset="100%" stop-color="${f.ink}" stop-opacity=".18"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".26"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="ink" x="-30%" y="-60%" width="160%" height="240%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${f.ink}" flood-opacity=".9"/>
    </filter>
  </defs>
  <g clip-path="url(#pill)">
    <image x="3" y="3" width="${w - 6}" height="${h - 6}" preserveAspectRatio="xMidYMid slice" href="${f.uri}"/>
    <rect x="3" y="3" width="${w - 6}" height="${h - 6}" fill="url(#veil)"/>
    <rect x="3" y="3" width="${w - 6}" height="${(h - 6) / 2.2}" fill="url(#gloss)"/>
  </g>
  <rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="${r}" fill="none" stroke="${f.gold}" stroke-width="2.4"/>
  <rect x="4.4" y="4.4" width="${w - 8.8}" height="${h - 8.8}" rx="${r - 1.4}" fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width="1.1"/>`;

/** the counter */
function card(count: number, label: string, f: Floral) {
  const text = digits(count);
  const w = Math.max(172, 100 + text.length * 15);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="46" viewBox="0 0 ${w} 46" role="img" aria-label="${label}: ${text}">
${dressing(f, w, 46, 20)}
  <g filter="url(#ink)">
    <path d="M24 33s-8-4.8-8-10.7a4.4 4.4 0 0 1 8-2.6 4.4 4.4 0 0 1 8 2.6C32 28.2 24 33 24 33Z" fill="#fff" fill-opacity=".97"/>
    <text x="44" y="19.5" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#ffe9b8" letter-spacing=".8">${label.toUpperCase()}</text>
    <text x="44" y="35" font-family="${FONT}" font-size="18" font-weight="800" fill="#fff">${text}</text>
  </g>
</svg>`;
}

/** the button through to the site */
function link(f: Floral) {
  const w = 300;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="62" viewBox="0 0 ${w} 62" role="img" aria-label="Visit mollybeach.app">
${dressing(f, w, 62, 26)}
  <g filter="url(#ink)">
    <path d="M32 41s-8-4.8-8-10.7a4.4 4.4 0 0 1 8-2.6 4.4 4.4 0 0 1 8 2.6C40 36.2 32 41 32 41Z" fill="#fff" fill-opacity=".97"/>
    <text x="52" y="35.5" font-family="${FONT}" font-size="17" font-weight="800" fill="#ffffff">mollybeach.app</text>
    <text x="52" y="48" font-family="${FONT}" font-size="9.5" font-weight="600" fill="#ffe9b8" letter-spacing=".7">PORTFOLIO &amp; THE PALAIS</text>
    <path d="M266 31h14m-5.5-5.5L280 31l-5.5 5.5" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

/** just the number, for tucking into a line of text */
const plain = (count: number, label: string, f: Floral) => {
  const text = digits(count);
  const w = 26 + text.length * 13;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="26" viewBox="0 0 ${w} 26" role="img" aria-label="${label}: ${text}">
  <text x="2" y="19" font-family="${FONT}" font-size="17" font-weight="800" fill="${f.ink}">♡ ${text}</text>
</svg>`;
};

const picture = (body: string) =>
  new Response(body, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      // GitHub's proxy caches what it's allowed to: ask it not to, so the
      // number moves, the pattern turns, and every view is counted
      "cache-control": "no-cache, no-store, must-revalidate, max-age=0",
      pragma: "no-cache",
      expires: "0",
      "access-control-allow-origin": "*",
    },
  });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const badge = (url.searchParams.get("badge") ?? "profile").toLowerCase().slice(0, 40);
  const label = url.searchParams.get("label")?.slice(0, 24) ?? "visitors";
  const peek = url.searchParams.get("peek") === "1";
  const style = url.searchParams.get("style");
  const asked = floralNamed(url.searchParams.get("floral"));

  // the button counts nothing; it only goes to the site
  if (url.searchParams.get("art") === "link") {
    return picture(link(asked ?? floralFor(Math.random() * FLORALS.length)));
  }

  let count = 0;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${peek ? "github_view_count" : "github_record_view"}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(
        peek
          ? { p_badge: badge }
          : {
              p_badge: badge,
              p_ua: req.headers.get("user-agent"),
              p_referrer: req.headers.get("referer"),
            },
      ),
    });
    const data = await res.json();
    count = typeof data === "number" ? data : Number(data ?? 0);
  } catch {
    count = 0;
  }

  // the count picks the pattern, so every view moves it along one
  const wearing = asked ?? floralFor(count);
  return picture(style === "plain" ? plain(count, label, wearing) : card(count, label, wearing));
});
