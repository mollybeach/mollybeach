# The Dolly Maker's prompts

The Dolly Maker at Brat Academy (`src/palais/DollyMaker.tsx`) turns a visitor,
a friend or an imagined person into a full-body Palais character: a
transparent sticker for the catalogue's Characters shelf. The prompts live in
`supabase/functions/palais-dolls/index.ts`; this says what each is for.

```
photos (each with a role, or left to work out) + who they should be
  → D. the interpreter (Claude): the character's plan (Doll)
  → A. the master character (the image model, from the photos and the plan)
  → B. edits, as many as wanted: only what's asked changes, from the approved
       character and the person's own photo, with chosen parts locked
  → C. the finisher (in the browser): cut out, checked, sized, filed
```

- **D. The interpreter** (`interpretPrompt`) decides what each photo is for
  (person, outfit, hair, make-up, shoes, accessories, fantasy, style), what to
  take from it and what to ignore, and writes the plan: identity, beauty
  styling, body, hair, make-up, outfit, shoes, accessories, fantasy elements,
  pose, style, what to keep exactly, and any conflicts or real questions. On an
  edit it updates the plan with only that change.
- **A. The master character** (`makePrompt`) keeps the person recognisably
  themselves while styling them as a glamorous version of themselves, rebuilds
  the clothes as truly worn, and holds to the Palais look: photorealistic,
  glamorous, whimsical fashion editorial, never a cartoon or game avatar. It
  adds no wings, crowns or sparkles unasked.
- **B. The editor** (`editPrompt`) changes only what's asked, from the
  approved picture (and the person's photo, so the face stays theirs), with
  the visitor's locks (face, hair, body, pose, outfit…) held fast.
- **C. The finisher** is `finishSticker` in `src/palais/stickerCut.ts`: it
  checks the picture really is transparent, and cuts away any background the
  model drew, cleans the edge and drops stray specks.

## One height for everyone

Every character stands the same in a room. The prompts ask for the whole
figure to fill the canvas height, from just under the top edge (hair, hat,
halo or wings) to just over the bottom (the soles), as a person of ordinary
adult height. The finished sticker is sized to **1400 px tall**, like the
cast's own (`public/palais_assets/cast_characters/`), and filed at the cast's
standing height: its width in metres is `width × 1.77 ÷ height`, so it comes
out 1.77 m tall beside everyone else (`props.ts`).
