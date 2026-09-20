/**
 * The portraits in the Boudoir dresser, handed out one signed link at a time.
 *
 * The pictures live in a private Supabase Storage bucket ("portraits"), so
 * nothing in it can be fetched by its address: there is no public URL to find,
 * guess or pass on. This asks the database whether the word someone typed is
 * the one that opens the letters (palais_letters_open — the word itself is
 * never here, only its hash, in palais_private), and only then signs a link
 * for each picture, good for ten minutes.
 *
 * The service key that does the signing is Supabase's own, out of the
 * function's environment. It is never in the site, never in the repo.
 *
 * Captions are optional: drop files in the bucket and they show up in the
 * order they're named. A row in palais_portraits for a path gives it a title,
 * a line underneath and a place in the order.
 *
 * Deploy: supabase functions deploy palais-portraits
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const BUCKET = "portraits";
const MINUTES = 10;
const PICTURE = /\.(jpe?g|png|webp|gif|avif)$/i;

/** "01_molly_and_ella.webp" → "Molly and Ella" */
const nameOf = (file: string) =>
  file
    .replace(PICTURE, "")
    .replace(/^\d+[-_. ]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase()) || "Untitled";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "post a word" }, 405);

  let word = "";
  try {
    word = (await req.json())?.key ?? "";
  } catch {
    return reply({ error: "post a word" }, 400);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // the same word as the letters, checked against the hash in the database
  const { data: opens, error: asked } = await sb.rpc("palais_letters_open", { p_key: word });
  if (asked) return reply({ error: "the dresser is stuck" }, 500);
  if (!opens) return reply({ error: "that word does not open the dresser" }, 401);

  const { data: files, error: listed } = await sb.storage
    .from(BUCKET)
    .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
  if (listed) return reply({ error: "the dresser is empty" }, 500);

  const paths = (files ?? []).filter((f) => PICTURE.test(f.name)).map((f) => f.name);
  if (!paths.length) return reply({ pictures: [] });

  // captions and an order, for any picture that has been given them
  const { data: said } = await sb.from("palais_portraits").select("path, title, note, sort");
  const told = new Map((said ?? []).map((r) => [r.path as string, r]));

  const { data: signed, error: signing } = await sb.storage
    .from(BUCKET)
    .createSignedUrls(paths, MINUTES * 60);
  if (signing) return reply({ error: "the dresser is stuck" }, 500);

  const pictures = (signed ?? [])
    .filter((s) => s.signedUrl && !s.error)
    .map((s) => {
      const path = (s.path ?? "") as string;
      const extra = told.get(path);
      return {
        url: s.signedUrl as string,
        title: (extra?.title as string) || nameOf(path),
        note: (extra?.note as string) ?? undefined,
        sort: (extra?.sort as number) ?? null,
        path,
      };
    })
    .sort((a, b) =>
      a.sort !== null && b.sort !== null ? a.sort - b.sort
      : a.sort !== null ? -1
      : b.sort !== null ? 1
      : a.path.localeCompare(b.path),
    )
    .map(({ url, title, note }) => ({ url, title, note }));

  return reply({ pictures });
});
