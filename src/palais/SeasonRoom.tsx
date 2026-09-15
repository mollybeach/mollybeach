import type { Place } from "./place";
import { usePortrait } from "./PortraitTerrace";
import { LivingPhoto } from "./LivingPhoto";

/* every room turns through the same four seasons as the terrace */
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

/** what each room's photographs are called, which part of them to keep in
    view when the screen crops them, whether there's one per season or just
    one for the whole year, and whether there's a tall photograph for phones
    (`<file>-portrait.webp`), or a tall one per season
    (`<file>-portrait-<season>.webp`) */
const ROOMS: Record<Exclude<Place, "palace">, { file: string; focus: string; seasons?: false; portrait?: true | "seasons" }> = {
  // the kitchen off the terrace, whose marble bar the terrace only shows the end of
  kitchen: { file: "kitchen", focus: "50% 55%", seasons: false, portrait: true },
  // the bathroom through the arch on the terrace's right: rose wallpaper, a ruffled shower curtain, a painted sky; one photograph for now
  bathroom: { file: "bathroom", focus: "50% 60%", seasons: false, portrait: true },
  // a conservatory: glass and iron over the garden, full of blossom
  garden: { file: "garden", focus: "50% 55%", portrait: "seasons" },
  // pink walls, lemon-papered shelves, Snoqualmie Falls through the window
  closet: { file: "closet", focus: "50% 60%", portrait: true },
  // the house on the lake: marble fireplace, the red bridge, the dock, Rainier
  lakehouse: { file: "lakehouse", focus: "50% 55%", portrait: true },
  // the blue lagoon under the northern lights
  lagoon: { file: "lagoon", focus: "50% 55%", portrait: true },
  // the mossy rainforest conservatory: one photograph for now, all year
  rainwood: { file: "rainwood", focus: "50% 55%", seasons: false },
  // the festival stage on the canyon rim at sunset: one photograph for now
  gorge: { file: "amphitheatre", focus: "50% 55%", seasons: false },
  // the thermal bath over the old city of domes, canals and the volcano
  domes: { file: "domes", focus: "50% 55%", portrait: true },
  // the balcony over the jacaranda street at dusk
  jacaranda: { file: "jacaranda", focus: "50% 55%", portrait: true },
  // the glass pavilion half under the sea, looking into the reef: one photograph for now
  reef: { file: "reef", focus: "50% 55%", seasons: false, portrait: true },
  // the lacquered pavilion over the lantern-lit temple island at dusk
  lanterns: { file: "lanterns", focus: "50% 55%", portrait: "seasons" },
  // the white loggia over every beach at once
  shore: { file: "shore", focus: "50% 55%", portrait: true },
  // the glowworm grotto opening onto hobbit hills, a mountain and hot springs
  caves: { file: "caves", focus: "50% 55%", portrait: true },
  // Madeleine's room: pink panelled walls, a mosaic floor, and the sea at sunset through the arch; one photograph for now
  madeleine: { file: "madeleine", focus: "50% 60%", seasons: false, portrait: true },
  // the library: carved shelves to a painted sky, a spiral of books, the desk at the window over the lake
  library: { file: "library", focus: "50% 60%", portrait: "seasons" },
};

/**
 * A room of the Palais you can walk into from the world map: four photographs
 * of it, one per season (or one, for a room that doesn't change).
 *
 * It uses the terrace's season classes, so the same timeline turns it, and
 * "Skip" and "Pause" move every room at once. It's always on the page, and
 * only shows while you're in it (see place.ts).
 */
export function SeasonRoom({ place }: { place: Exclude<Place, "palace"> }) {
  const room = ROOMS[place];
  // on a phone held upright, the tall photograph(s) if the room has them
  const tall = usePortrait() && !!room.portrait;
  const tallSeasons = tall && room.portrait === "seasons";
  return (
    <div aria-hidden className={`palais-room palais-room--away palais-room--${place}`}>
      <div className="palais-seasons">
        {/* a single tall photograph is one picture for the whole year, even in
            a room whose wide photographs change with the seasons */}
        {room.seasons === false || (tall && !tallSeasons) ? (
          <img
            src={`${process.env.PUBLIC_URL}/palais/${room.file}${tall ? "-portrait" : ""}.webp`}
            alt=""
            decoding="async"
            style={{ position: "absolute", inset: 0, objectPosition: tall ? "50% 100%" : room.focus }}
          />
        ) : (
          SEASONS.map((season) => (
          <img
            key={season}
            src={`${process.env.PUBLIC_URL}/palais/${room.file}${tallSeasons ? "-portrait" : ""}-${season}.webp`}
            alt=""
            decoding="async"
            className={`palais-season palais-season--${season}`}
            style={{ objectPosition: tallSeasons ? "50% 100%" : room.focus }}
          />
          ))
        )}
        {/* the clouds drift and the water ripples (LivingPhoto.tsx); keyed so it
            starts afresh when a phone turns and the photographs change */}
        <LivingPhoto key={tall ? "tall" : "wide"} room={place} />
      </div>
    </div>
  );
}
