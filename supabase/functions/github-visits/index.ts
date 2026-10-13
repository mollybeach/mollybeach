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
 *   …/github-visits?art=note         a line of writing in the dotted ribbon
 *   …/github-visits?badge=palais     a counter of its own, for another repo
 *   …/github-visits?style=plain      just the number
 *   …/github-visits?floral=maroon    hold it to one pattern
 *   …/github-visits?peek=1           the total without counting the view
 */

import { FLORALS, floralFor, floralNamed, type Floral } from "./florals.ts";
import { JEWELS, note, plaque } from "./plaque.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const digits = (n: number) => n.toLocaleString("en-US");

/** the stone and rim this pattern lends the plaque */
const stone = (f: Floral) => ({ jewel: JEWELS[f.key] ?? "#1a8f8a", gold: f.gold, pattern: f.uri, ink: f.ink });

/** the counter, in the same frame the portfolio's page titles wear */
const card = (count: number, label: string, f: Floral) =>
  plaque({
    lines: [`✿ ${label.toUpperCase()} ${digits(count)} ✿`],
    label: `${label}: ${digits(count)}`,
    width: Math.max(360, 250 + digits(count).length * 16 + label.length * 12),
    ...stone(f),
  });

/** the button through to the site */
const link = (f: Floral) =>
  plaque({
    lines: ["✿ mollybeach.app ✿", "PORTFOLIO &amp; THE PALAIS"],
    label: "Visit mollybeach.app",
    ...stone(f),
  });

/** just the number, for tucking into a line of text */
const plain = (count: number, label: string, f: Floral) => {
  const text = digits(count);
  const w = 26 + text.length * 13;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="26" viewBox="0 0 ${w} 26" role="img" aria-label="${label}: ${text}">
  <text x="2" y="19" font-family="'Roboto Mono',ui-monospace,monospace" font-size="17" font-weight="800" fill="${f.ink}">♡ ${text}</text>
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

  // a line of writing in the catalogue's dotted ribbon; counts nothing either
  if (url.searchParams.get("art") === "note") {
    const f = asked ?? floralFor(Math.floor(Math.random() * FLORALS.length));
    const said = url.searchParams.get("text")?.slice(0, 160) ??
      "mollybeach.app is the Palais: a dollhouse portfolio you can rearrange, room by room.";
    return picture(note({ text: said, ink: f.ink, pattern: f.uri }));
  }

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
