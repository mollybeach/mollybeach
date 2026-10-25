# The island maker's prompts

The island maker at Brat Academy (`src/palais/IslandMaker.tsx`) builds a room
from a visitor's photos and words, and that room's island for the map. A room
and its island are one destination: one row in `palais_made_rooms`, its
pictures listed by what they are.

```
photos + description
  → plan (Claude: the room spec)
  → master room (the Palais's empty room template + the photos)   ← looked at, painted again until it's right
  → its island (the master + the island template + the photos)
  → 4 seasons × desktop and mobile (each season's template + the master + the photos)
```

The prompts themselves live in `supabase/functions/palais-rooms/index.ts`
(`planPrompt`, `masterPrompt`, `seasonPrompt`, `islandPrompt`), so this file
says what each one is for rather than repeating them:

- **The plan.** Claude studies every photo and the description and writes the
  room spec: architecture, permanent features, colours, what must stay and
  what must never come in, the view outside, the focal point, the light, the
  season to paint the master in, what each season changes, and what the
  island is like. Every picture after is painted from it, so nothing relies on
  the image model re-reading the photos alone.
- **The master room.** Painted on the empty room template
  (`public/palais_assets/modal_content/island_maker/room_templates/`), so the
  cream mosaic floor and the cream-and-gold painted ceiling are the Palais's
  own. It becomes the source of truth. Painting it again throws away
  everything painted from the old one.
- **The seasons.** Each is the master with time passed, never redesigned: the
  season's own template sets the light, and the phone pictures are
  recomposed, not cropped. Summer is green, with fewer flowers than spring.
- **The island.** The room's exterior, not a cutaway of the inside: the
  building, estate or landscape that would hold this interior, in its own
  architectural style, with a way in. It's painted onto the island template
  (`island_sticker_template_generic.png`), which fixes the framing, camera,
  scale, rock and water every made island shares, so they sit together on the
  map. It can be painted again without touching the room.

## Later: an empty island to build on

The island the rooms are set out on (`island_map_template.webp`) was painted
by hand. To let people paint their own, the prompt to start from:

> Create one large, square fantasy island landscape that will hold eight
> Palais rooms' islands. Square, 2048 × 2048 or more, seen from 35-45° above,
> the whole landmass comfortably in view: ocean touching the left, right and
> bottom edges, sunset clouds and distant scenery reaching the top. No margins,
> vignette or border. Painterly realism, turquoise and sapphire water, pink,
> peach and gold sunset light, lush gardens and flowering trees, natural rock,
> waterfalls. Varied, physically believable geography: hills, forests,
> terraces, cliffs, streams, a lagoon, beaches and coves, with enough land
> for eight destinations. Give it eight open, unobstructed regions at
> different heights, among gardens, forest, cliffs, lagoon and beach, well
> apart, that read as natural open ground: no grey circles, numbers or
> identical platforms. (Follow the placement guide if one is attached.) Build
> nothing on it: no rooms, castles, houses or ruins, no labels, pins or UI.

Its eight regions are then found by eye and written into `MAPS` in
IslandMaker.tsx, as Sunset Isle's are. After people arrange their islands, a
last painting pass over the whole map could blend each one's edges (its falls,
paths and shoreline) into the land.
