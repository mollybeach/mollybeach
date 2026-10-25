/**
 * The Dolly Maker at Brat Academy (DollyMaker.tsx): photos and a few words in,
 * a full-body Palais character out, as a transparent sticker for the
 * catalogue's Characters shelf. The prompts are written out in
 * docs/dolly-maker-prompts.md.
 *
 * Everything is asked of it by a signed-in member of the Palais
 * (palais_i_am_accepted), one step at a time:
 *
 * - { make: { refs: [{ image, type, role? }], description, name?, keep? } } —
 *   Claude reads the photos and the words into the character's plan (Doll):
 *   what each photo is for, who the person is, what they wear, their hair,
 *   make-up, accessories, pose and beauty styling, and anything unclear; then
 *   the image model paints the character from the photos and the plan, on a
 *   transparent background, full length.
 *
 * - { edit: { image, doll, refs, instruction, locks?, extra? } } — the image
 *   model changes only what's asked of the approved character, from the
 *   character itself, the person's own photo (so the face stays theirs) and
 *   any more photos for the change (`extra`), and Claude brings the plan up
 *   to date.
 *
 * The finished picture is cut out, checked and sized in the browser
 * (stickerCut.ts) and filed in the catalogue by palais-stickers, as every made
 * sticker is. Each member may paint DOLLS_A_DAY pictures a day, made or edited.
 *
 * Deploy: supabase functions deploy palais-dolls
 */

import Anthropic from "npm:@anthropic-ai/sdk";
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

/** pictures painted a day, made or edited, by each member */
const DOLLS_A_DAY = 12;
const MOST_REFS = 6;
const MOST_IN = 6 * 1024 * 1024;

const CLAUDE = "claude-opus-5-5";
const DRAWER = "gpt-image-2.5-sunburst";
/** a standing character, the shape every Palais character sticker is */
const SIZE = "1024x1536";

const ROLES = ["person", "outfit", "hair", "makeup", "shoes", "accessories", "fantasy", "style"] as const;
type Role = (typeof ROLES)[number];

/* ---- who's asking -------------------------------------------------------- */

interface Member {
  id: string;
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
  return { id: who.user.id };
}

const service = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

/* ---- the character's plan (Prompt D: the reference interpreter) ---------- */

interface Doll {
  ok: boolean;
  why: string;
  name: string;
  label: string;
  id: string;
  refs: { n: number; role: Role; use: string; ignore: string }[];
  identity: string;
  hasPerson: boolean;
  beauty: string;
  body: string;
  hair: string;
  makeup: string;
  outfit: string;
  shoes: string;
  accessories: string[];
  fantasy: string[];
  pose: string;
  style: string;
  keepExactly: string[];
  conflicts: string[];
  ambiguities: string[];
}

const strings = { type: "array", items: { type: "string" } };
const DOLL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "why", "name", "label", "id", "refs", "identity", "hasPerson", "beauty", "body", "hair", "makeup", "outfit", "shoes", "accessories", "fantasy", "pose", "style", "keepExactly", "conflicts", "ambiguities"],
  properties: {
    ok: { type: "boolean" },
    why: { type: "string" },
    name: { type: "string" },
    label: { type: "string" },
    id: { type: "string" },
    refs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["n", "role", "use", "ignore"],
        properties: { n: { type: "integer" }, role: { type: "string", enum: [...ROLES] }, use: { type: "string" }, ignore: { type: "string" } },
      },
    },
    identity: { type: "string" },
    hasPerson: { type: "boolean" },
    beauty: { type: "string" },
    body: { type: "string" },
    hair: { type: "string" },
    makeup: { type: "string" },
    outfit: { type: "string" },
    shoes: { type: "string" },
    accessories: strings,
    fantasy: strings,
    pose: { type: "string" },
    style: { type: "string" },
    keepExactly: strings,
    conflicts: strings,
    ambiguities: strings,
  },
};

const interpretPrompt = (refs: { role?: string }[], description: string, name: string, keep: string, editing?: { doll: Doll; instruction: string }) => `You are the reference interpreter for the Palais Dolly Maker: a magical fashion studio where visitors turn themselves, a friend, or an imaginary person into a full-body character sticker for the Palais world. The Palais look is photorealistic, glamorous, whimsical and fashion-forward, with storybook elegance: real people photographed in extraordinary fashion, never cartoons or video-game avatars.

${editing ? `You are UPDATING an existing character. Here is its current plan:\n${JSON.stringify(editing.doll, null, 2)}\n\nThe visitor's edit: """${editing.instruction}"""\n\nChange only what the edit asks for and keep every other field exactly as it is.` : `The visitor sent ${refs.length} photo${refs.length === 1 ? "" : "s"}, numbered from 1 in the order attached.${refs.some((r) => r.role) ? `\nRoles they gave: ${refs.map((r, i) => `${i + 1}: ${r.role || "(let you decide)"}`).join("; ")}.` : ""}

Name they gave it: ${name || "(none)"}
What they want:
"""
${description || "(nothing written: go by the photos)"}
"""
${keep ? `Keep exactly: """${keep}"""` : ""}`}

Study every photo and decide what each is for: "person" (whose face and identity the character is), "outfit", "hair", "makeup", "shoes", "accessories", "fantasy" (wings, halos, crowns, horns, tails…) or "style" (colour, mood, fashion direction only). A role they gave wins. For each, say exactly what to take from it, and what to ignore (backgrounds, other people, clutter, text, the photo's own pose and lighting).

Only the PERSON photo gives the character a face. When an outfit, hair, shoes, accessories or fantasy photo shows somebody else wearing it, that's a different person: take only the thing they wear (the dress, the shoes, the wings…) and put it on the character, who keeps the person photo's own face, head, skin tone and identity. In that photo's "ignore", always say "the wearer's face, head, skin and body". The result is the first person in the second person's outfit, with the first person's head, never the other way round and never a blend of the two faces.

Fill in every field:
- ok: false only if the request is sexual, sexualises a minor, is violent or hateful, or would put a real public figure's face on the character without it being the visitor themself; otherwise true.
- why: empty when ok; otherwise one plain sentence why not.
- name: the character's name, title case, at most 30 characters: theirs if given, or a pretty one that suits.
- label: a short lowercase caption for the catalogue, e.g. "a gothic princess in black tulle with feathered wings".
- id: snake_case, starting "character_", ending "_sticker", lowercase letters, digits and underscores, at most 80 characters, e.g. "character_gothic_princess_black_wings_sticker".
- refs: one entry per photo, by number (1 = the first attached).
- identity: if there's a person photo, the features that make them recognisable and must survive: face shape, eye shape and colour, brows, nose, lips, skin tone, freckles or marks, and anything else distinctive. Empty if there's no person.
- hasPerson: whether a person photo sets the identity.
- beauty: the editorial beauty styling to give them, as their own glamorous self, not a different face. By default for an adult feminine character, unless they say otherwise: a tall, elegant, slim-looking fashion silhouette, graceful posture, long beautiful flowing hair if no hairstyle is asked for and it suits, flattering light, beautifully detailed eyes, luminous skin with real texture, refined make-up. Never apply adult feminine conventions where they don't suit the character, or against the visitor's wishes. If they want exact likeness, say so: fidelity wins over beautifying.
- body: proportions and build, flattering and anatomically real, as asked.
- hair: length, colour, volume, texture, parting, fringe, curls or waves, braids or updo, hair accessories.
- makeup: eyes, lashes, liner, shadow, blush, lips.
- outfit: the clothing, reconstructed in detail from its reference: silhouette, neckline, sleeves, waist, fabric, colour, pattern, embroidery, lace, closures, ruffles, bows, train, draping, worn genuinely on the body.
- shoes: exactly which and how, or a pair that suits if none is given. Always visible.
- accessories: each piece and where it goes (jewellery, bags, hats, crowns).
- fantasy: each fantasy element and how it attaches (wings from the shoulder blades, a halo above the head…). Only what was asked for: never add wings, crowns or sparkles unasked.
- pose: the pose. By default: standing upright, front-facing or gently three-quarter, relaxed and graceful, arms resting loosely at the sides clear of the clothes, feet naturally placed and fully visible.
- style: the overall direction (gothic, romantic, vintage, fairy, futuristic, everyday…), from what they asked.
- keepExactly: anything that must be reproduced exactly.
- conflicts: instructions that contradict each other or a photo, and how you resolved each (their words win).
- ambiguities: only what genuinely needs asking them; usually empty.`;

async function interpret(content: Anthropic.Beta.Messages.BetaContentBlockParam[], text: string): Promise<Doll> {
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  const response = await client.beta.messages.create({
    model: CLAUDE,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: DOLL_SCHEMA } },
    messages: [{ role: "user", content: [...content, { type: "text", text }] }],
  });
  if (response.stop_reason === "refusal") return { ok: false, why: "That can't be made into a character." } as Doll;
  const out = response.content.find((b) => b.type === "text");
  if (!out || out.type !== "text") throw new Error("Claude didn't answer");
  return JSON.parse(out.text) as Doll;
}

/* ---- the painting (Prompts A and B) -------------------------------------- */

const list = (xs: string[] | undefined, none: string) => (xs?.length ? xs.join("; ") : none);

const STANDARD = `STANDARD SIZE (every Palais character is the same, so they stand together in a room)
- A tall portrait canvas. The whole character fills its height: the very top of the hair, hat, crown, halo or wings about 3% below the top edge, the soles of the shoes about 3% above the bottom edge.
- Drawn as a person of ordinary adult height (about 1.77 m), standing at full length: nothing cropped, nothing shrunk into the middle.
- Wide wings, trains or skirts may reach out sideways, but stay wholly inside the canvas.`;

const STICKER = `TRANSPARENT STICKER (critical)
- A genuinely transparent background: alpha 0 for everything that isn't the character.
- No white, black or grey background; no checkerboard drawn in; no scenery, floor, pedestal or shadow on the ground; no outline, white border or frame; no text, captions or watermark.
- Fine edges kept: individual strands of hair, feathers, lace and sheer fabric, with see-through parts left partly transparent.
- Clean silhouette, every finger and accessory whole.`;

const LOOK = `THE PALAIS LOOK
Photorealistic, glamorous, whimsical, fashion-forward, with magical storybook elegance: a real person photographed in extraordinary fashion by a high-end editorial studio. Extremely detailed realistic face and expressive eyes; luminous skin with natural texture; soft, flattering beauty lighting; dimensional hair with defined strands; luxurious fabrics with real folds, stitching, sheen and embroidery; realistic anatomy and hands. Never a cartoon, anime, flat illustration, game model, plastic skin, stiff mannequin or exaggerated doll-like body. It must not look like separate pictures pasted together.`;

const dollText = (d: Doll) => `THE CHARACTER: ${d.name}
- Identity${d.hasPerson ? " (from the person photo, must stay recognisable)" : ""}: ${d.identity || "an imagined person, to suit the description"}
- Beauty styling: ${d.beauty}
- Body: ${d.body}
- Hair: ${d.hair}
- Make-up: ${d.makeup}
- Outfit: ${d.outfit}
- Shoes: ${d.shoes}
- Accessories: ${list(d.accessories, "none beyond what's above")}
- Fantasy elements: ${list(d.fantasy, "none: add none")}
- Pose: ${d.pose}
- Style: ${d.style}
- Keep exactly: ${list(d.keepExactly, "nothing beyond the above")}`;

const refText = (d: Doll) =>
  d.refs.length
    ? `THE ATTACHED PHOTOS, by number in the order attached\n${d.refs.map((r) => `- ${r.n}: ${r.role.toUpperCase()}. Take: ${r.use}${r.ignore ? ` Ignore: ${r.ignore}` : ""}`).join("\n")}`
    : "No photos: imagine the character from the description.";

/** Prompt A: the master character */
const makePrompt = (d: Doll) => `Create one full-body character for Palais, a whimsical, luxurious interactive fashion world, as a transparent sticker that will be placed and moved about inside its rooms.

${refText(d)}

${d.hasPerson ? `IDENTITY FIRST
The character IS the person in the person photo: keep their recognisable face, eye shape, nose, lips, skin tone and distinguishing features. Make them a glamorous, beautifully styled version of themselves, never a different, generic face. Their photo's pose, lighting, clothing and background don't carry over unless asked.

` : ""}COMBINING THE PHOTOS
Only the person photo gives the character a face. If any other photo shows somebody wearing the outfit, shoes, hair or accessories, take only what they wear and dress the character in it: the character keeps the person photo's face, head, skin tone and identity, never the wearer's, and never a blend of the two. It's the first person wearing the second person's outfit.
Rebuild the clothing from its photo as genuinely worn on this body, with real fit, tension, folds and movement, never pasted flat. Hair grows naturally from the head and falls realistically over the shoulders and clothes. Shoes match the feet and the angle. Jewellery sits, scales and catches light correctly. Wings attach at the shoulder blades with real depth; a halo floats in place above the head.

${dollText(d)}

${LOOK}

${STANDARD}

${STICKER}`;

/** Prompt B: change only what's asked of the approved character */
const editPrompt = (d: Doll, instruction: string, locks: string[], hasPersonRef: boolean, extra: number) => `Edit an approved Palais character. The FIRST attached image is the character as approved: the source of truth.${hasPersonRef ? " The SECOND is the person's own photo: their face must stay theirs." : ""}${extra ? ` The last ${extra} ${extra === 1 ? "is a new reference" : "are new references"} for this edit (a garment, shoes, hair, an accessory or wings to use): reconstruct what the edit asks for from ${extra === 1 ? "it" : "them"}, genuinely worn, in the Palais look. If someone in ${extra === 1 ? "it" : "them"} is wearing it, take only what they wear: the character keeps their own face, never the wearer's.` : ""}

THE EDIT, in the visitor's words
"""
${instruction}
"""

CHANGE ONLY THAT
Everything the edit doesn't mention stays exactly as it is in the first image: the face and identity, skin tone, hairstyle, body and proportions, pose, every piece of the outfit, shoes, accessories and fantasy elements, colours, materials, lighting and rendering style. If the edit changes the shoes, don't touch the face, dress, hair or body; if it lengthens the hair, keep the same person and clothes; if it enlarges the wings, keep their design, colour and texture.
${locks.length ? `Locked, never to change: ${locks.join("; ")}.` : ""}

${dollText(d)}

${LOOK}

${STANDARD}

${STICKER}`;

async function paint(images: Blob[], prompt: string): Promise<string> {
  const form = new FormData();
  form.append("model", DRAWER);
  images.forEach((b, n) => form.append("image[]", b, `in-${n}.${(b.type.split("/")[1] || "png").replace("jpeg", "jpg")}`));
  form.append("prompt", prompt);
  form.append("background", "transparent");
  form.append("output_format", "png");
  form.append("quality", "high");
  form.append("size", SIZE);
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

async function paintFresh(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: DRAWER, prompt, background: "transparent", output_format: "png", quality: "high", size: SIZE, n: 1 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `the image model answered ${res.status}`);
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error("the image model sent nothing back");
  return b64;
}

/* ---- the door ------------------------------------------------------------ */

type Ref = { image: string; type: string; role?: string };
const blobOf = (r: { image: string; type: string }) => new Blob([Uint8Array.from(atob(r.image), (c) => c.charCodeAt(0))], { type: r.type });
const imageBlock = (r: Ref) => ({ type: "image" as const, source: { type: "base64" as const, media_type: r.type as "image/jpeg", data: r.image } });

function checkRefs(refs: unknown): Ref[] | string {
  const list = (Array.isArray(refs) ? refs : []).slice(0, MOST_REFS) as Ref[];
  for (const r of list) {
    if (!r?.image || !/^image\/(jpeg|png|webp)$/.test(r.type)) return "Send JPEG, PNG or WebP photos.";
    if (r.image.length > MOST_IN * 1.37) return "One of those photos is too big. Try a smaller one.";
    if (r.role && !(ROLES as readonly string[]).includes(r.role)) r.role = undefined;
  }
  return list;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply({ error: "POST only" }, 405);
  const who = await memberOf(req);
  if (!who) return reply({ error: "The Dolly Maker is for members: sign in, and once you're accepted it's yours." }, 401);

  let body: {
    make?: { refs: Ref[]; description: string; name?: string; keep?: string };
    edit?: { image: string; doll: Doll; refs: Ref[]; instruction: string; locks?: string[]; extra?: Ref[] };
  };
  try {
    body = await req.json();
  } catch {
    return reply({ error: "That wasn't JSON." }, 400);
  }

  // a few a day each: every one's a picture from OpenAI
  const sb = service();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await sb.from("palais_doll_draws").select("id", { count: "exact", head: true }).eq("made_by", who.id).gte("at", since);
  if ((count ?? 0) >= DOLLS_A_DAY) return reply({ error: `That's ${DOLLS_A_DAY} dolls today. The machine needs a rest: come back tomorrow.` }, 429);

  try {
    if (body.make) {
      const refs = checkRefs(body.make.refs);
      if (typeof refs === "string") return reply({ error: refs }, 400);
      const description = String(body.make.description ?? "").trim().slice(0, 2000);
      if (!refs.length && !description) return reply({ error: "Send a photo or say who you'd like to make." }, 400);
      const doll = await interpret(refs.map(imageBlock), interpretPrompt(refs, description, String(body.make.name ?? "").trim().slice(0, 40), String(body.make.keep ?? "").trim().slice(0, 600)));
      if (!doll.ok) return reply({ ok: false, why: doll.why || "That can't be made into a character." });
      await sb.from("palais_doll_draws").insert({ made_by: who.id, what: "make" });
      const png = refs.length ? await paint(refs.map(blobOf), makePrompt(doll)) : await paintFresh(makePrompt(doll));
      return reply({ ok: true, doll, png });
    }

    if (body.edit) {
      const refs = checkRefs(body.edit.refs);
      if (typeof refs === "string") return reply({ error: refs }, 400);
      const instruction = String(body.edit.instruction ?? "").trim().slice(0, 800);
      if (!instruction) return reply({ error: "Say what to change." }, 400);
      if (!body.edit.image || body.edit.image.length > MOST_IN * 1.37) return reply({ error: "Send the character to edit." }, 400);
      const locks = (Array.isArray(body.edit.locks) ? body.edit.locks : []).map(String).slice(0, 12);
      // the plan brought up to date with the edit, then the picture changed to match
      const doll = await interpret([], interpretPrompt([], "", "", "", { doll: body.edit.doll, instruction }));
      if (!doll.ok) return reply({ ok: false, why: doll.why || "That edit can't be made." });
      await sb.from("palais_doll_draws").insert({ made_by: who.id, what: "edit" });
      const person = doll.hasPerson ? refs.find((_, i) => body.edit!.doll.refs?.find((r) => r.n === i + 1)?.role === "person") : undefined;
      const extra = checkRefs(body.edit.extra);
      if (typeof extra === "string") return reply({ error: extra }, 400);
      const more = extra.slice(0, 3);
      const images = [blobOf({ image: body.edit.image, type: "image/png" }), ...(person ? [blobOf(person)] : []), ...more.map(blobOf)];
      const png = await paint(images, editPrompt(doll, instruction, locks, !!person, more.length));
      return reply({ ok: true, doll, png });
    }
  } catch (e) {
    if (e instanceof Anthropic.APIError) return reply({ error: `Claude couldn't look at it (${e.status}). Try again in a moment.` }, 502);
    return reply({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
  return reply({ error: "Ask it to make a doll or to edit one." }, 400);
});
