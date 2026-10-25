/**
 * The sticker maker at Brat Academy (StickerMaker.tsx): a photo in, a sticker
 * in the catalogue out. The steps are written out in docs/sticker-maker-prompt.md.
 *
 * Two things can be asked of it, both by a signed-in member of the Palais
 * (palais_i_am_accepted: accepted by Molly, or on the board):
 *
 * - { make: { image, type, shelves } } — Claude looks at the photo and says
 *   what the object is, what to keep and rebuild, and how to file it (a name,
 *   a caption, a shelf, how big it really is); then OpenAI's image model draws
 *   the object alone on a transparent background. Both answers go back to the
 *   room, which cleans the cutout up and shows it. Each member gets MAKES_A_DAY
 *   of these: every one is a Claude call and an image.
 *
 * - { file: { image, sticker, shelf } } — the finished sticker (a WebP, cleaned
 *   up in the browser), put in the public "stickers" bucket and on its shelf in
 *   the catalogue: one already there, or a new one made for it.
 *
 * The keys for Claude and OpenAI are the function's own secrets
 * (ANTHROPIC_API_KEY, OPENAI_API_KEY), and the service key that writes is
 * Supabase's. None of them is ever in the site or the repo.
 *
 * Deploy: supabase functions deploy palais-stickers
 *         supabase secrets set ANTHROPIC_API_KEY=… OPENAI_API_KEY=…
 */

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

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

const BUCKET = "stickers";
/** how many photos a member may send to be made in a day */
const MAKES_A_DAY = 10;
/** the photo sent in, and the finished sticker filed, as base64 */
const MOST_IN = 8 * 1024 * 1024;
const MOST_FILED = 2 * 1024 * 1024;

const CLAUDE = "claude-opus-5-5";
/** OpenAI's precise image editor, which can give back a truly transparent PNG */
const DRAWER = "gpt-image-2.5-sunburst";

const PLANES = ["haze", "far", "mid", "near", "fore"] as const;

/* ---- who's asking -------------------------------------------------------- */

interface Member {
  id: string;
  name: string;
}

async function memberOf(req: Request): Promise<Member | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const asThem = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: who } = await asThem.auth.getUser();
  if (!who.user) return null;
  const { data: accepted } = await asThem.rpc("palais_i_am_accepted");
  if (accepted !== true) return null;
  const meta = who.user.user_metadata ?? {};
  return { id: who.user.id, name: String(meta.full_name ?? meta.name ?? who.user.email ?? "a member").slice(0, 80) };
}

const service = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

/* ---- 1. Claude looks at the photo ---------------------------------------- */

interface Look {
  ok: boolean;
  why: string;
  object: string;
  keep: string[];
  rebuild: string[];
  remove: string[];
  glass: boolean;
  lit: boolean;
  label: string;
  id: string;
  shelf: string;
  metres: number;
  plane: (typeof PLANES)[number];
}

const LOOK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "why", "object", "keep", "rebuild", "remove", "glass", "lit", "label", "id", "shelf", "metres", "plane"],
  properties: {
    ok: { type: "boolean" },
    why: { type: "string" },
    object: { type: "string" },
    keep: { type: "array", items: { type: "string" } },
    rebuild: { type: "array", items: { type: "string" } },
    remove: { type: "array", items: { type: "string" } },
    glass: { type: "boolean" },
    lit: { type: "boolean" },
    label: { type: "string" },
    id: { type: "string" },
    shelf: { type: "string" },
    metres: { type: "number" },
    plane: { type: "string", enum: [...PLANES] },
  },
};

const lookPrompt = (shelves: { key: string; name: string }[]) => `You are cataloguing an object for a sticker collection. The user has uploaded a photo of something they want turned into a sticker: a realistic cutout of one object, with no background, no outline and no frame, that will be placed into illustrated rooms alongside hundreds of other stickers.

Look at the photo and identify the ONE primary object: the thing the photo is clearly of. Ignore the table, floor, wall, hands, other objects and anything else around it.

Fill in every field:
- ok: true if there is one clear object to make into a sticker.
- why: empty when ok is true; otherwise one plain sentence saying why not.
- object: what it is, plainly, e.g. "a hardcover book lying on its back".
- keep: every feature that must survive the cutout exactly: colours, materials, artwork, printed text and logos (quote the text exactly as printed), hardware, wear, the camera angle and perspective.
- rebuild: any part that is cropped off, hidden behind something or cut by the frame, and how it most plausibly continues. Empty if nothing is missing.
- remove: everything in the photo that is not the object.
- glass: true for glass, crystal, mirrors and clear plastic, whose see-through parts must stay partly transparent.
- lit: true for candles, lamps and anything that gives off light.
- label: a short lowercase caption in the collection's voice, starting with "a" or "an" unless it's a title, e.g. "a spellbook of moon phases, purple galaxy cover and a brass clasp".
- id: a snake_case file name, what it is first and then what makes it this one, ending in _sticker, e.g. "book_witchy_moon_phases_purple_galaxy_clasp_sticker". Lowercase letters, digits and underscores only, at most 90 characters.
- shelf: the key of the shelf below it fits best.
- metres: the object's real-world WIDTH in metres as it sits in the photo (a paperback about 0.13, a guitar about 0.4, a sofa about 2).
- plane: "near" for anything you'd hold or set on a table, "mid" for furniture, people and anything that stands on the floor, "fore" for foliage that hangs into the frame.

If the photo holds no clear single object, or the object is a real, identifiable person, or anything sexual, violent or hateful, set ok to false, say why, and leave the other fields empty, false or zero.

Never invent text that isn't in the photo.

The shelves:
${shelves.map((s) => `- ${s.key}: ${s.name}`).join("\n")}`;

async function look(image: string, type: string, shelves: { key: string; name: string }[]): Promise<Look> {
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  const response = await client.beta.messages.create({
    model: CLAUDE,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: LOOK_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: type as "image/jpeg", data: image } },
          { type: "text", text: lookPrompt(shelves) },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") {
    return { ok: false, why: "That photo can't be made into a sticker." } as Look;
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude didn't answer");
  return JSON.parse(text.text) as Look;
}

/* ---- 2. the image model draws the cutout --------------------------------- */

const list = (items: string[], none: string) => (items.length ? items.join("; ") : none);

const drawPrompt = (l: Look) => `Turn the attached photo into an isolated, photorealistic sticker of ONE object: ${l.object}.

OBJECT PRESERVATION
- Keep exactly: ${list(l.keep, "everything about the object as photographed")}.
- Keep its original shape, proportions, colours, textures, materials, artwork, printed text and logos. Keep the original camera angle, perspective and three-dimensional look.
- Rebuild naturally, so the whole object is visible: ${list(l.rebuild, "nothing is missing")}.
- Remove everything else: ${list(l.remove, "everything that isn't the object")}.
- Do not redesign, stylise, simplify, cartoon or reinterpret the object. Don't add text, and don't correct or reword the text that's there.

BACKGROUND (critical)
- The background must be genuinely transparent: alpha = 0 for every pixel that isn't the object.
- No white, black, grey or coloured background. No checkerboard or transparency-grid pattern drawn in. No floor, table, surface, scenery or gradient.
- No shadow, cast shadow, glow, halo or reflection under or behind the object. The rooms it goes into add their own shadow.
- No fringe of the old background's colour along the edges.${l.glass ? "\n- The see-through parts of the glass stay partly transparent; don't fill them in with white." : ""}

STICKER LOOK
- A realistic product cutout, not a cartoon sticker. NO white outline, border, stroke, die-cut edge or frame of any kind.
- Clean edges that follow the object's real silhouette, softened by a pixel or two, never jagged and never blurred.
- Every corner and edge whole. Nothing cropped by the frame.
- The object centred, filling the canvas, with a small transparent margin.

OUTPUT
- PNG, RGBA, fully transparent background, the object's own aspect ratio, high resolution.
- The object and nothing else: no extra objects, labels or decorations.`;

async function draw(image: string, type: string, l: Look): Promise<string> {
  const bytes = Uint8Array.from(atob(image), (c) => c.charCodeAt(0));
  const form = new FormData();
  form.append("model", DRAWER);
  form.append("image", new Blob([bytes], { type }), `photo.${type.split("/")[1] ?? "jpg"}`);
  form.append("prompt", drawPrompt(l));
  form.append("background", "transparent");
  form.append("output_format", "png");
  form.append("quality", "medium");
  form.append("size", "auto");
  form.append("n", "1");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `the image model answered ${res.status}`);
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error("the image model sent nothing back");
  return b64;
}

/* ---- filing -------------------------------------------------------------- */

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34);

/** a sticker's id, made safe and not already taken */
async function freeId(sb: SupabaseClient, wanted: string): Promise<string> {
  let base = wanted
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/_sticker(_\d+)?$/, "")
    .slice(0, 80);
  if (!base) base = "made";
  const { data } = await sb.from("palais_stickers").select("id").like("id", `${base}_sticker%`);
  const taken = new Set((data ?? []).map((r: { id: string }) => r.id));
  if (!taken.has(`${base}_sticker`)) return `${base}_sticker`;
  for (let n = 2; ; n++) if (!taken.has(`${base}_sticker_${n}`)) return `${base}_sticker_${n}`;
}

interface Filing {
  image: string;
  type: string;
  sticker: { id: string; label: string; plane: string; metres: number | null; glass: boolean; lit: boolean };
  shelf: { key: string } | { name: string; emoji?: string };
}

async function file(sb: SupabaseClient, who: Member, f: Filing) {
  if (!/^image\/(webp|png)$/.test(f.type)) return reply({ error: "A sticker goes in as a WebP or a PNG." }, 400);
  if (f.image.length > MOST_FILED * 1.37) return reply({ error: "That sticker is too big to file." }, 413);
  const label = String(f.sticker.label ?? "").trim().slice(0, 160);
  if (!label) return reply({ error: "A sticker wants a caption." }, 400);
  const plane = (PLANES as readonly string[]).includes(f.sticker.plane) ? f.sticker.plane : "near";
  const metres = Number(f.sticker.metres) > 0 && Number(f.sticker.metres) <= 20 ? Number(f.sticker.metres) : null;

  // the shelf: one there already, or a new one made for it
  let shelf: string;
  let made: { key: string; name: string; emoji: string } | null = null;
  if ("key" in f.shelf) {
    shelf = String(f.shelf.key);
    if (!/^[a-z0-9-]{1,40}$/.test(shelf)) return reply({ error: "That isn't a shelf." }, 400);
  } else {
    const name = String(f.shelf.name ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name) return reply({ error: "A new shelf wants a name." }, 400);
    const emoji = String(f.shelf.emoji ?? "").trim().slice(0, 8) || "✨";
    const { data: same } = await sb.from("palais_sticker_shelves").select("key, name, emoji").ilike("name", name).maybeSingle();
    if (same) {
      shelf = same.key;
    } else {
      shelf = `made-${slug(name) || "shelf"}`;
      const { data: clash } = await sb.from("palais_sticker_shelves").select("key").eq("key", shelf).maybeSingle();
      if (clash) shelf = `${shelf.slice(0, 30)}-${Date.now().toString(36).slice(-4)}`;
      const { error } = await sb.from("palais_sticker_shelves").insert({ key: shelf, name, emoji, made_by: who.id });
      if (error) return reply({ error: error.message }, 500);
      made = { key: shelf, name, emoji };
    }
  }

  const id = await freeId(sb, f.sticker.id);
  const ext = f.type === "image/png" ? "png" : "webp";
  const path = `${id}.${ext}`;
  const bytes = Uint8Array.from(atob(f.image), (c) => c.charCodeAt(0));
  const up = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: f.type, upsert: false });
  if (up.error) return reply({ error: up.error.message }, 500);
  const src = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const row = { id, label, plane, metres, glass: !!f.sticker.glass, lit: !!f.sticker.lit, shelf, src, made_by: who.id, made_by_name: who.name };
  const { data, error } = await sb.from("palais_stickers").insert(row).select().single();
  if (error) {
    await sb.storage.from(BUCKET).remove([path]);
    return reply({ error: error.message }, 500);
  }
  return reply({ sticker: data, shelf: made });
}

/* ---- the door ------------------------------------------------------------ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "POST only" }, 405);

  const who = await memberOf(req);
  if (!who) return reply({ error: "The sticker maker is for members: sign in, and once you're accepted it's yours." }, 401);

  let body: { make?: { image: string; type: string; shelves: { key: string; name: string }[] }; file?: Filing };
  try {
    body = await req.json();
  } catch {
    return reply({ error: "That wasn't JSON." }, 400);
  }
  const sb = service();

  if (body.make) {
    const { image, type } = body.make;
    if (!image || !/^image\/(jpeg|png|webp)$/.test(type)) return reply({ error: "Send a JPEG, PNG or WebP photo." }, 400);
    if (image.length > MOST_IN * 1.37) return reply({ error: "That photo is too big. Try a smaller one." }, 413);
    const shelves = (Array.isArray(body.make.shelves) ? body.make.shelves : [])
      .filter((s) => s && /^[a-z0-9-]{1,40}$/.test(String(s.key)))
      .slice(0, 120)
      .map((s) => ({ key: String(s.key), name: String(s.name).slice(0, 40) }));

    // a few a day each
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await sb.from("palais_sticker_makes").select("id", { count: "exact", head: true }).eq("made_by", who.id).gte("at", since);
    if ((count ?? 0) >= MAKES_A_DAY) return reply({ error: `That's ${MAKES_A_DAY} stickers today. The machine needs a rest: come back tomorrow.` }, 429);
    await sb.from("palais_sticker_makes").insert({ made_by: who.id });

    try {
      const l = await look(image, type, shelves);
      if (!l.ok) return reply({ ok: false, why: l.why || "That photo can't be made into a sticker." });
      const png = await draw(image, type, l);
      return reply({
        ok: true,
        png,
        sticker: {
          id: l.id,
          label: l.label,
          plane: l.plane,
          metres: l.metres > 0 ? l.metres : null,
          glass: l.glass,
          lit: l.lit,
          shelf: shelves.some((s) => s.key === l.shelf) ? l.shelf : null,
        },
      });
    } catch (e) {
      if (e instanceof Anthropic.APIError) return reply({ error: `Claude couldn't look at it (${e.status}). Try again in a moment.` }, 502);
      return reply({ error: e instanceof Error ? e.message : String(e) }, 502);
    }
  }

  if (body.file) return file(sb, who, body.file);

  return reply({ error: "Ask it to make or to file." }, 400);
});
