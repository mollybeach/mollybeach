/**
 * Where a visitor to the Palais is, worked out on the server.
 *
 * The visit log asks the visitor's own browser to look itself up at
 * get.geojs.io (src/palais/visits.ts). Safari on an iPhone increasingly blocks
 * that — it treats IP-location services as fingerprinting — so a link opened
 * from Messages, which opens in Safari, came in with no city at all.
 *
 * This asks the same service from here instead, for the address the request
 * came from. The browser only ever talks to Molly's own Supabase, which
 * nothing blocks. The address is used for the lookup and then dropped: it is
 * not stored, logged, or handed back.
 *
 * visits.ts asks this alongside the browser's own lookup, and uses it only
 * when that one comes back empty.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const reply = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** the fields the visit log keeps, and nothing else — in particular not the address */
const KEEP = ["city", "region", "country", "country_code", "latitude", "longitude", "timezone", "organization_name", "asn"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "").trim();
  // only something that looks like an address goes into the lookup's URL
  if (!/^[0-9a-fA-F:.]{3,45}$/.test(ip)) return reply({});

  try {
    const r = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return reply({});
    const found = await r.json();
    const out: Record<string, unknown> = {};
    for (const k of KEEP) if (found[k] != null && found[k] !== "") out[k] = found[k];
    return reply(out);
  } catch {
    return reply({});
  }
});
