/**
 * The island maker at Brat Academy (IslandMaker.tsx): a few photos and a few
 * words in, a room of the Palais you can walk into out, with its own little
 * island for the map. The prompts are written out in docs/island-maker-prompts.md.
 *
 * Everything is asked of it by a signed-in member of the Palais
 * (palais_i_am_accepted: accepted by Molly, or on the board), one step at a
 * time, so no one request has to wait for more than one picture:
 *
 * - { plan: { name, description, photos: [{ image, type }] } } — Claude looks
 *   at the photos and the words and writes the room's plan (Spec): what's
 *   permanent in it, its colours, what must stay and what mustn't come in,
 *   the view outside, what each season does to it, and what its island looks
 *   like. The photos are kept in the private "room-photos" bucket, and the
 *   room is made (palais_made_rooms), "planned". Each member may plan
 *   ROOMS_A_DAY rooms a day.
 *
 * - { draw: { room, what } } — the image model paints one picture of the room
 *   and it's kept in the public "rooms" bucket:
 *     "master": the room itself, on the Palais's own floor and ceiling (the
 *       empty room templates), from the photos and the plan. Painting it again
 *       throws away everything painted from the old one.
 *     "island": the room's own exterior as a little island for the map,
 *       painted from the approved master (so it can be painted again without
 *       touching the room).
 *     "<season>-<desktop|mobile>": the master in a season, wide for a computer
 *       or recomposed tall for a phone.
 *   Once the master, the island and all eight seasons are there, the room is
 *   "ready", and anyone can walk into it. Each room may be painted
 *   DRAWS_A_ROOM times in all.
 *
 * The keys for Claude and OpenAI are the function's own secrets
 * (ANTHROPIC_API_KEY, OPENAI_API_KEY), and the service key that writes is
 * Supabase's. The empty room templates and the island template it paints on
 * are fetched from the site (PALAIS_SITE, https://mollybeach.app unless set).
 *
 * Deploy: supabase functions deploy palais-rooms
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

const PICTURES = "rooms";
const PHOTOS = "room-photos";
/** how many rooms a member may plan in a day */
const ROOMS_A_DAY = 2;
/** and how many pictures may be painted of one room, redrawn ones and all:
    ten to finish it, and a few to try again */
const DRAWS_A_ROOM = 16;
const MOST_PHOTOS = 4;
/** each photo sent in, as base64 */
const MOST_IN = 6 * 1024 * 1024;

const CLAUDE = "claude-opus-5-5";
const DRAWER = "gpt-image-2.5-sunburst";
const SITE = () => (Deno.env.get("PALAIS_SITE") ?? "https://mollybeach.app").replace(/\/$/, "");

const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
type Season = (typeof SEASONS)[number];
const DEVICES = ["desktop", "mobile"] as const;
type Device = (typeof DEVICES)[number];
/** everything a ready room has */
const ALL = ["master", "island", ...SEASONS.flatMap((s) => DEVICES.map((d) => `${s}-${d}`))];

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

/* ---- 1. Claude plans the room -------------------------------------------- */

interface Spec {
  ok: boolean;
  why: string;
  name: string;
  summary: string;
  architecture: string;
  permanentFeatures: string[];
  colors: string[];
  mustKeep: string[];
  mustExclude: string[];
  viewOutside: string;
  focalPoint: string;
  lighting: string;
  masterSeason: Season;
  seasons: Record<Season, string>;
  island: string;
}

const strings = { type: "array", items: { type: "string" } };
const SPEC_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "why", "name", "summary", "architecture", "permanentFeatures", "colors", "mustKeep", "mustExclude", "viewOutside", "focalPoint", "lighting", "masterSeason", "seasons", "island"],
  properties: {
    ok: { type: "boolean" },
    why: { type: "string" },
    name: { type: "string" },
    summary: { type: "string" },
    architecture: { type: "string" },
    permanentFeatures: strings,
    colors: strings,
    mustKeep: strings,
    mustExclude: strings,
    viewOutside: { type: "string" },
    focalPoint: { type: "string" },
    lighting: { type: "string" },
    masterSeason: { type: "string", enum: [...SEASONS] },
    seasons: {
      type: "object",
      additionalProperties: false,
      required: [...SEASONS],
      properties: Object.fromEntries(SEASONS.map((s) => [s, { type: "string" }])),
    },
    island: { type: "string" },
  },
};

const planPrompt = (name: string, description: string, photos: number) => `You are the room designer for Palais, a whimsical interactive world of luxurious palace rooms. A visitor wants a room of their own. They've sent ${photos} reference photo${photos === 1 ? "" : "s"} and this description:

Name they gave it: ${name || "(none)"}
"""
${description || "(no description: go by the photos)"}
"""

Study every photo. Work out what they're actually referencing: architecture, furniture shapes, cabinetry, wall treatments, doors and windows, textiles, colours, light fittings, decorative details, a landscape or view, meaningful personal objects. Their written description wins wherever it disagrees with a photo. Ignore what's incidental: people, clutter, screenshots, camera or browser UI, text, logos, photographic artifacts.

Every Palais room shares a cream mosaic floor with a dark botanical inlay and an ornate cream-and-gold ceiling with a painted sky. Those are fixed. You're designing the room between them.

Write the plan an image model will paint from, in every field:
- ok: true if this can be a room. False if the photos are of a real, identifiable person and nothing else, or anything sexual, violent or hateful.
- why: empty when ok; otherwise one plain sentence why not.
- name: the room's name for the map, title case, at most 40 characters, e.g. "The Strawberry Parlour". Use theirs, tidied, if they gave one.
- summary: two or three sentences describing the finished room.
- architecture: the room's walls, proportions, arches, windows and doors, and where each is, left to right.
- permanentFeatures: the large permanent things that belong in the painting itself (counters, built-ins, a bed, a fireplace, shelving, a bath), each with where it stands. Leave small movable objects out: the site adds those later as stickers.
- colors: the palette, as named colours.
- mustKeep: the specific things from the photos and the words that must appear.
- mustExclude: what must never appear (always include people, text, UI and labels).
- viewOutside: what's seen through the windows or openings.
- focalPoint: what the eye lands on.
- lighting: the light, warm and cinematic.
- masterSeason: the season that shows the room off best, before the others are painted.
- seasons: for each season, one or two sentences on what changes in this room (the view, plants, light, a little seasonal dressing), never the architecture. Summer is mostly green, with fewer flowers than spring. No snow indoors unless the room is open to the air.
- island: what the room looks like as a little floating island on the Palais's map, like the others there: the building or room set on a craggy island of rock, greenery and flowers, with water round it. Say what's on the island and what its ground and water are like, to suit the room.`;

async function planRoom(name: string, description: string, photos: { image: string; type: string }[]): Promise<Spec> {
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  const response = await client.beta.messages.create({
    model: CLAUDE,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: SPEC_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          ...photos.map((p) => ({ type: "image" as const, source: { type: "base64" as const, media_type: p.type as "image/jpeg", data: p.image } })),
          { type: "text", text: planPrompt(name, description, photos.length) },
        ],
      },
    ],
  });
  if (response.stop_reason === "refusal") return { ok: false, why: "Those photos can't be made into a room." } as Spec;
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude didn't answer");
  return JSON.parse(text.text) as Spec;
}

/* ---- 2. the image model paints it ---------------------------------------- */

const list = (items: string[] | undefined, none: string) => (items?.length ? items.join("; ") : none);

const specText = (s: Spec, description: string) => `ROOM SPEC
- Name: ${s.name}
- In the visitor's words: ${description || "(see the photos)"}
- The room: ${s.summary}
- Architecture: ${s.architecture}
- Permanent features: ${list(s.permanentFeatures, "none beyond the architecture")}
- Colours: ${list(s.colors, "the photos' own")}
- Must keep: ${list(s.mustKeep, "what the photos show")}
- Must exclude: ${list(s.mustExclude, "people, text, UI, labels")}
- View outside: ${s.viewOutside}
- Focal point: ${s.focalPoint}
- Lighting: ${s.lighting}`;

const PALAIS = `CORE PALAIS ARCHITECTURE (constant in every room)
- Luxurious, whimsical palace atmosphere; highly detailed, realistic but slightly dreamlike rendering; ornate European, Rococo-inspired detail where it suits.
- Warm, cinematic lighting and a strong sense of depth. Architectural realism, not a flat illustration.
- The signature cream mosaic floor with the dark botanical inlay, and the signature ornate cream-and-gold ceiling with painted sky and gilded ornament, exactly as in the template.
- No text, UI, buttons, borders, labels, people or interface elements of any kind.`;

const masterPrompt = (s: Spec, description: string, photos: number) => `Paint the MASTER design of a new room in Palais, a whimsical interactive world. It becomes the one source of truth that every seasonal and phone version is later painted from.

THE ATTACHED IMAGES
- The FIRST image is the Palais room template: an empty palace room. Keep its floor and its ceiling exactly as they are (pattern, colour, ornament, perspective) and keep its camera position and height. Design the room between them: replace the empty walls, windows and openings with this room.
- The other ${photos} image${photos === 1 ? " is the visitor's reference" : "s are the visitor's references"}. Don't collage them in. Take the features the spec names and build them into one coherent room. Don't copy people, clutter, text, logos, screenshots or photographic artifacts from them.

${specText(s, description)}

${PALAIS}

COMPOSITION
- A wide landscape view, as if standing naturally inside the room: floor in the foreground, the ceiling's architecture above, the important features clearly readable, the left and right sides balanced.
- The site shows it at 16:9, so keep everything important clear of the top and bottom edges.
- Leave open floor and wall: characters, stickers and controls are added on top later. Little foreground furniture.
- Large permanent furniture belongs in the painting; small movable objects don't (they're added later as stickers).
- Make every decision clearly (architecture, proportions, furniture, windows and doors, fixtures, focal point), because every later picture must reproduce this exact room.
- Paint it in ${s.masterSeason}, without seasonal decorations unless the room itself calls for them.

It should look like a finished environment from a luxurious fantasy life-simulation game: real enough to live in, magical enough to belong in Palais.`;

const SEASON_LOOK: Record<Season, string> = {
  spring: `SPRING: fresh. Flowering trees outside, blossom, delicate new greenery, soft pink, lavender and white botanical accents, fresh spring sunlight, a few petals where they'd fall. The most floral season, but never smothering the architecture.`,
  summer: `SUMMER: lush. Rich green foliage, strong healthy plants, full tree canopies, warm sunlight, vivid natural colour. Primarily GREEN: noticeably fewer flowers than spring. Where the room's palette names a flower colour, keep that colour rather than adding new ones.`,
  autumn: `AUTUMN: orange, amber, copper, gold, burgundy and muted red foliage; fallen leaves only where they'd really fall; warmer, lower sunlight; richer amber reflections inside; a slightly cosier mood. No drifts of leaves across an indoor floor unless the room is open to the outdoors.`,
  winter: `WINTER: snow outside, bare or snow-laden branches, cool blue-white light outdoors against warmer light indoors, a little frost where it'd form. No snow inside an enclosed room. Water outdoors may look colder or partly frozen.`,
};

const seasonPrompt = (s: Spec, description: string, season: Season, device: Device, photos: number) => `Paint the ${season.toUpperCase()} ${device === "desktop" ? "DESKTOP" : "MOBILE"} picture of an existing Palais room, from its approved MASTER design.

THE ATTACHED IMAGES
- The FIRST image is the Palais room template for ${season}${device === "mobile" ? " on a phone" : ""}: its floor, ceiling, camera and ${season} light are what this picture's frame and atmosphere should match.
- The SECOND image is the MASTER design of this room: the absolute visual source of truth.${photos ? `\n- The rest are the visitor's original references, only to keep details faithful.` : ""}

CRITICAL CONSISTENCY RULE
This is the SAME room as the master, with time passed. Do not redesign it. Keep exactly: the architecture, floor, ceiling, permanent furniture, cabinetry, wall treatments, doors, windows, arches, proportions, the fixtures and where they are, the major decorative details, the camera height and the room's whole identity. Never invent different furniture, change the layout, the floor pattern or the ceiling, move windows, add doors, remove important objects or change the building's style.

${specText(s, description)}

THIS SEASON
${SEASON_LOOK[season]}
In this room: ${s.seasons?.[season] ?? ""}

${
  device === "desktop"
    ? `FORMAT: DESKTOP
- A wide landscape picture, keeping the master's composition as closely as possible. The site shows it at 16:9, so keep what matters clear of the top and bottom edges.
- Keep the open floor and wall for the site's stickers and controls. Don't zoom in.`
    : `FORMAT: MOBILE
- A tall portrait picture. Do NOT just crop the middle of the master.
- Recompose the same room for a narrow frame: keep what matters from BOTH sides of the master (the landmarks, furniture, windows and the focal point), compressing the perspective and moving things naturally so the whole room still reads.
- It should feel like a portrait photograph taken in the same room, not a crop. Don't redesign or swap objects to make them fit.`
}

${PALAIS}

One picture, never a collage or contact sheet. No people, text, UI or labels.`;

const islandPrompt = (s: Spec, description: string, photos: number) => `You are the architectural world-building artist for Palais, a whimsical, luxurious interactive fantasy world. Design the miniature exterior island of one room: it goes on the Palais world map as the way into that room.

THE ATTACHED IMAGES
- The FIRST image is the approved MASTER design of the room's interior: with the spec below, the primary source of truth.
- The SECOND image is the Palais ISLAND TEMPLATE, the standard every room's island is painted to. Keep its canvas and framing, its camera angle and height, its scale, its light, its painterly finish, and the way its island sits: craggy pale rock, falls and turquoise water lapping round a wavy edge, the whole thing floating on transparency. Replace its architecture, gardens and planting with this room's own exterior, and reshape its ground as this room needs.${photos ? `
- The rest are the visitor's own references.` : ""}

${specText(s, description)}
- The island, as planned: ${s.island}

PRIMARY OBJECTIVE
A complete, beautiful, highly detailed miniature fantasy island that feels like the natural exterior home of this room, recognisable as belonging to it before anyone clicks it. Do NOT paste the interior onto a piece of land: imagine the building, estate, garden or landscape that would hold this interior.

1. INTERIOR INTO EXTERIOR. Read the room's architectural style, materials, signature colours, window and door shapes, columns, arches and motifs, light, what's seen through its windows, and its purpose, and invent the matching exterior: if it has great arched windows, so does the outside; if it overlooks a lake, the island has that lake; its palette runs through the architecture, gardens and ornament. Don't invent an unrelated building. It's an exterior, not a cutaway: show inside only through windows or open architecture, where it's lovely.
2. ITS OWN PERSONALITY. A gothic room stays gothic, a tropical one tropical, a Japanese-inspired one keeps its own architecture. Don't turn every room into the same Mediterranean palace.
3. PALAIS STYLE. Extremely detailed painterly fantasy realism; luxurious, whimsical architecture; warm sunset light; rich turquoise and sapphire water; pink, peach, lavender and gold highlights; intricate gardens, natural rock, lush botanical detail, waterfalls, terraces, paths and coves; dreamlike but physically coherent.
4. COMPOSITION. One complete, self-contained island on a square canvas, seen from an elevated three-quarter view, about 35-45 degrees above the horizon. The main building is the focal point, the landscape frames it, and a natural coastline or terrain edge goes all the way round. The whole island is in view: no cropped buildings, cliffs, trees or falls; no horizon or background scenery. Fill the canvas as the template's island does. Within that footprint its ground can rise, fall and spread as suits the room (a hilltop, cliffs, a cove, terraces), so it isn't a copy of the template's.
5. NATURE. Only what suits this room (cliffs, gardens, cypresses, jacarandas, wisteria, palms, alpine plants, waterfalls, rivers, pools, coves, bridges, terraces, paths, fountains, sea rocks), grown out of the architecture. Waterfalls fall from believable heights, bridges join real places, and paths and stairs lead to the entrances.
6. THE WAY IN. A recognisable entrance, doorway, staircase, gate or path, built naturally into the exterior, not oversized.
7. CONSISTENT WITH EVERY PALAIS ISLAND. The template's elevated three-quarter camera, perspective and architectural scale; warm sunlight from the upper right with soft shadows to the lower left; comparable detail and painterly finish.
8. TRUE TRANSPARENT BACKGROUND. A genuine alpha channel: everything beyond the island's own outer silhouette is fully transparent. No white, black or checkerboard background, no rectangle of sky, no sticker outline or white border, no drop-shadow halo. Keep the water, cliffs, gardens and architecture that belong to the island, and the delicate details: leaves, railings, falls.
9. NEVER. Text, labels or the room's name; UI or map markers; sticker borders; people or characters; buildings unrelated to the room; a generic grass platform; big unrelated mountains or skies; anything that contradicts the approved room.

Create a place that belongs to the room, not just a sticker that resembles it.`;

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't fetch ${url} (${res.status})`);
  return await res.blob();
}

const template = (device: Device, season: Season) => `${SITE()}/palais_assets/modal_content/island_maker/room_templates/room-template-${device}-${season}.webp`;
/** the standard every made room's island is painted to: its framing, angle, scale, rock and water */
const ISLAND_TEMPLATE = () => `${SITE()}/palais_assets/modal_content/island_maker/island_sticker_template_generic.png`;

async function paint(images: Blob[], prompt: string, size: string, transparent: boolean): Promise<Uint8Array> {
  const form = new FormData();
  form.append("model", DRAWER);
  images.forEach((b, n) => form.append("image[]", b, `in-${n}.${(b.type.split("/")[1] || "png").replace("jpeg", "jpg")}`));
  form.append("prompt", prompt);
  if (transparent) form.append("background", "transparent");
  form.append("output_format", "webp");
  form.append("output_compression", "86");
  form.append("quality", "medium");
  form.append("size", size);
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
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/* ---- the rooms ----------------------------------------------------------- */

interface RoomRow {
  id: string;
  name: string;
  description: string;
  spec: Spec;
  photos: string[];
  pictures: Record<string, string>;
  status: "planned" | "ready";
  made_by: string | null;
  made_by_name: string | null;
  created_at: string;
  ready_at: string | null;
}
const COLUMNS = "id, name, description, spec, photos, pictures, status, made_by, made_by_name, created_at, ready_at";
/** what goes back to the browser: everything but where the photos are kept */
const shown = ({ photos: _photos, ...r }: RoomRow) => r;

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 38);

async function plan(sb: SupabaseClient, who: Member, body: { name?: string; description?: string; photos?: { image: string; type: string }[] }) {
  const name = String(body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const description = String(body.description ?? "").trim().slice(0, 2000);
  const photos = (Array.isArray(body.photos) ? body.photos : []).slice(0, MOST_PHOTOS);
  if (!photos.length) return reply({ error: "Send at least one photo of what you'd like the room to be." }, 400);
  for (const p of photos) {
    if (!p?.image || !/^image\/(jpeg|png|webp)$/.test(p.type)) return reply({ error: "Send JPEG, PNG or WebP photos." }, 400);
    if (p.image.length > MOST_IN * 1.37) return reply({ error: "One of those photos is too big. Try a smaller one." }, 413);
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await sb.from("palais_room_draws").select("id", { count: "exact", head: true }).eq("made_by", who.id).eq("what", "plan").gte("at", since);
  if ((count ?? 0) >= ROOMS_A_DAY) return reply({ error: `That's ${ROOMS_A_DAY} rooms today. The machine needs a rest: come back tomorrow.` }, 429);
  await sb.from("palais_room_draws").insert({ made_by: who.id, what: "plan" });

  const spec = await planRoom(name, description, photos);
  if (!spec.ok) return reply({ ok: false, why: spec.why || "Those photos can't be made into a room." });

  const title = (spec.name || name || "A New Room").slice(0, 60);
  const id = `${slug(title) || "room"}-${crypto.randomUUID().slice(0, 6)}`;
  const kept: string[] = [];
  for (const [n, p] of photos.entries()) {
    const path = `${id}/photo-${n + 1}.${p.type.split("/")[1].replace("jpeg", "jpg")}`;
    const bytes = Uint8Array.from(atob(p.image), (c) => c.charCodeAt(0));
    const up = await sb.storage.from(PHOTOS).upload(path, bytes, { contentType: p.type, upsert: true });
    if (up.error) return reply({ error: up.error.message }, 500);
    kept.push(path);
  }
  const { data, error } = await sb
    .from("palais_made_rooms")
    .insert({ id, name: title, description, spec, photos: kept, made_by: who.id, made_by_name: who.name })
    .select(COLUMNS)
    .single();
  if (error) return reply({ error: error.message }, 500);
  return reply({ ok: true, room: shown(data as RoomRow) });
}

async function draw(sb: SupabaseClient, who: Member, body: { room?: string; what?: string }) {
  const what = String(body.what ?? "");
  if (!ALL.includes(what)) return reply({ error: "Paint the master, the island, or a season." }, 400);
  const { data: row } = await sb.from("palais_made_rooms").select(COLUMNS).eq("id", String(body.room ?? "")).maybeSingle();
  const room = row as RoomRow | null;
  if (!room) return reply({ error: "There's no such room." }, 404);
  if (room.made_by !== who.id) return reply({ error: "Only the room's maker can paint it." }, 403);
  if (what !== "master" && !room.pictures.master) return reply({ error: "Paint the master first." }, 409);

  const { count } = await sb.from("palais_room_draws").select("id", { count: "exact", head: true }).eq("room", room.id);
  if ((count ?? 0) >= DRAWS_A_ROOM) return reply({ error: `That room's been painted ${DRAWS_A_ROOM} times, which is all it gets.` }, 429);
  await sb.from("palais_room_draws").insert({ made_by: who.id, room: room.id, what });

  const photos = await Promise.all(
    room.photos.map(async (path) => {
      const { data, error } = await sb.storage.from(PHOTOS).download(path);
      if (error || !data) throw new Error(`Couldn't read the photo ${path}`);
      return data;
    }),
  );
  const master = () => fetchBlob(room.pictures.master);

  let bytes: Uint8Array;
  if (what === "master") {
    bytes = await paint([await fetchBlob(template("desktop", room.spec.masterSeason ?? "spring")), ...photos], masterPrompt(room.spec, room.description, photos.length), "1536x1024", false);
  } else if (what === "island") {
    const refs = photos.slice(0, 3);
    bytes = await paint([await master(), await fetchBlob(ISLAND_TEMPLATE()), ...refs], islandPrompt(room.spec, room.description, refs.length), "1024x1024", true);
  } else {
    const [season, device] = what.split("-") as [Season, Device];
    const refs = photos.slice(0, 2);
    bytes = await paint([await fetchBlob(template(device, season)), await master(), ...refs], seasonPrompt(room.spec, room.description, season, device, refs.length), device === "desktop" ? "1536x1024" : "1024x1536", false);
  }

  // a fresh name each time, so a picture painted again isn't the old one from a cache
  const path = `${room.id}/${what}-${Date.now().toString(36)}.webp`;
  const up = await sb.storage.from(PICTURES).upload(path, bytes, { contentType: "image/webp", upsert: false });
  if (up.error) return reply({ error: up.error.message }, 500);
  const src = sb.storage.from(PICTURES).getPublicUrl(path).data.publicUrl;

  // a new master: what was painted from the old one no longer matches it
  const old = what === "master" ? Object.values(room.pictures) : room.pictures[what] ? [room.pictures[what]] : [];
  const pictures = what === "master" ? { master: src } : { ...room.pictures, [what]: src };
  const ready = ALL.every((k) => pictures[k]);
  const { data, error } = await sb
    .from("palais_made_rooms")
    .update({ pictures, status: ready ? "ready" : "planned", ready_at: ready ? room.ready_at ?? new Date().toISOString() : null })
    .eq("id", room.id)
    .select(COLUMNS)
    .single();
  if (error) return reply({ error: error.message }, 500);
  const gone = old.map((u) => u.split(`/${PICTURES}/`)[1]).filter(Boolean);
  if (gone.length) await sb.storage.from(PICTURES).remove(gone);
  return reply({ room: shown(data as RoomRow) });
}

/* ---- the door ------------------------------------------------------------ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "POST only" }, 405);

  const who = await memberOf(req);
  if (!who) return reply({ error: "The island maker is for members: sign in, and once you're accepted it's yours." }, 401);

  let body: { plan?: Parameters<typeof plan>[2]; draw?: Parameters<typeof draw>[2] };
  try {
    body = await req.json();
  } catch {
    return reply({ error: "That wasn't JSON." }, 400);
  }
  const sb = service();
  try {
    if (body.plan) return await plan(sb, who, body.plan);
    if (body.draw) return await draw(sb, who, body.draw);
  } catch (e) {
    if (e instanceof Anthropic.APIError) return reply({ error: `Claude couldn't look at it (${e.status}). Try again in a moment.` }, 502);
    return reply({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
  return reply({ error: "Ask it to plan a room or to paint one." }, 400);
});
