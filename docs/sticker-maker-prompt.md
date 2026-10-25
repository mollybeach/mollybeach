# The sticker maker's prompt

How a photo becomes a sticker in the Palais catalogue: the same steps used to
add stickers by hand, written out so the sticker maker at Brat Academy can do
them itself.

There are three steps, because no one model does the whole job:

1. **Claude looks at the photo** and says what the object is, what to keep,
   what to rebuild, and how it should be filed in the catalogue (a name, a
   label, a shelf, how big it really is). Claude reads images but can't draw
   them.
2. **An image model draws the cutout**: just the object, on a truly
   transparent background.
3. **The site finishes it**: it checks the transparency, removes any leftover
   background, trims and pads it, saves it as a WebP, and puts it on a shelf.
   This step is code, not a prompt, because a model can't be trusted to leave
   the background truly transparent.

---

## 1. Claude: look at the photo and describe the sticker

Sent to Claude with the uploaded photo and the list of shelves. It answers
with JSON only.

```text
You are cataloguing an object for a sticker collection. The user has
uploaded a photo of something they want turned into a sticker: a realistic
cutout of one object, with no background, no outline and no frame, that will
be placed into illustrated rooms alongside hundreds of other stickers.

Look at the photo and identify the ONE primary object: the thing the photo
is clearly of. Ignore the table, floor, wall, hands, other objects and
anything else around it.

Then answer with a single JSON object and nothing else:

{
  "ok": true,
  "object": "what it is, plainly, e.g. 'a hardcover book lying on its back'",
  "keep": [
    "every feature that must survive the cutout exactly: colours, materials,
     artwork, printed text and logos (quote the text exactly as printed),
     hardware, wear, the camera angle and perspective"
  ],
  "rebuild": [
    "any part that is cropped off, hidden behind something, or cut by the
     frame, and how it most plausibly continues; empty if nothing is missing"
  ],
  "remove": ["everything in the photo that is not the object"],
  "glass": false,
  "lit": false,
  "label": "a short lowercase caption in the collection's voice, starting
            with 'a' or 'an' unless it's a title, e.g. 'a spellbook of moon
            phases, purple galaxy cover and a brass clasp'",
  "id": "snake_case file name: what it is first, then what makes it this one,
         ending in _sticker, e.g.
         book_witchy_moon_phases_purple_galaxy_clasp_sticker",
  "shelf": "one key from the shelves list that fits best",
  "metres": 0.26,
  "plane": "near"
}

Rules:
- "metres" is the object's real-world WIDTH in metres as it sits in the
  photo (a paperback ~0.13, a guitar ~0.4, a sofa ~2). Estimate sensibly.
- "plane" is "near" for anything you'd hold or set on a table, "mid" for
  furniture, people and anything that stands on the floor, "fore" for
  foliage that hangs into the frame.
- "glass" is true for glass, crystal, mirrors and clear plastic, whose
  see-through parts must stay partly transparent. "lit" is true for candles,
  lamps and anything that gives off light.
- If the photo holds no clear single object, or the object is a real,
  identifiable person who isn't the uploader, or anything sexual, violent or
  hateful, answer {"ok": false, "why": "one plain sentence"} instead.
- Never invent text that isn't in the photo.
```

## 2. The image model: draw the cutout

Sent to the image-editing model with the uploaded photo. The `{…}` parts are
filled in from Claude's answer.

```text
Turn the attached photo into an isolated, photorealistic sticker of ONE
object: {object}.

OBJECT PRESERVATION
- Keep exactly: {keep}.
- Keep its original shape, proportions, colours, textures, materials,
  artwork, printed text and logos. Keep the original camera angle,
  perspective and three-dimensional look.
- Rebuild naturally, so the whole object is visible: {rebuild}.
- Remove everything else: {remove}.
- Do not redesign, stylise, simplify, cartoon or reinterpret the object.
  Don't add text, and don't correct or reword the text that's there.

BACKGROUND (critical)
- The background must be genuinely transparent: alpha = 0 for every pixel
  that isn't the object.
- No white, black, grey or coloured background. No checkerboard or
  transparency-grid pattern drawn in. No floor, table, surface, scenery or
  gradient.
- No shadow, cast shadow, glow, halo or reflection under or behind the
  object. The rooms it goes into add their own shadow.
- No fringe of the old background's colour along the edges.
{if glass: "- The see-through parts of the glass stay partly transparent;
  don't fill them in with white."}

STICKER LOOK
- A realistic product cutout, not a cartoon sticker. NO white outline,
  border, stroke, die-cut edge or frame of any kind.
- Clean edges that follow the object's real silhouette, softened by a pixel
  or two, never jagged and never blurred.
- Every corner and edge whole. Nothing cropped by the frame.
- The object centred, filling the canvas, with a small transparent margin.

OUTPUT
- PNG, RGBA, fully transparent background, the object's own aspect ratio,
  high resolution (the longest side at least 1024px).
- The object and nothing else: no extra objects, labels or decorations.
```

## 3. The site: finish and file it

Code, run on the model's PNG before it reaches the catalogue. These are the
same steps used for every sticker added by hand.

1. **Check it's really transparent.** The image must have an alpha channel,
   and the four corners must be fully transparent. If not, the model has
   drawn a background, so cut it out: flood-fill inwards from the edges
   through near-white, near-black or checkerboard pixels, and make those
   transparent. If there's still no clean cutout, refuse it and ask the
   person to try another photo, rather than file a sticker with a box
   round it.
2. **Clean the edge.** Grow the transparent area by 1–2px to take off any
   leftover halo, then soften the edge with a slight blur on the alpha only.
   Leave partial alpha in glass.
3. **Make sure it's one thing.** Drop any loose specks that aren't joined to
   the main shape, then check something is left: an empty or near-empty
   image is refused.
4. **Trim and pad.** Crop to the visible object, then add a transparent
   margin of about 2% on every side.
5. **Size it.** Scale so the longest side is 1000px (never scale up), with
   Lanczos resampling.
6. **Save it.** WebP with alpha, quality about 86. It should come out under
   about 300 KB.
7. **File it.** Show it to the person who made it, with Claude's `label` as
   the caption and Claude's `shelf` picked to start with. They can change the
   caption, and put it on any shelf in the catalogue or start a new one. Then
   save it as `{id}.webp` (add `_2`, `_3` and so on if the name is taken),
   with its `plane`, `metres`, `glass` and `lit`, and a note of who made it
   and when.

Where this runs: steps 1 and 2 in the `palais-stickers` Supabase function
(Claude Opus 5.5, then OpenAI's `gpt-image-2.5-sunburst`), step 3 in the
browser (`src/palais/stickerCut.ts`), and the filing back in the function.
