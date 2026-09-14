import type { Place } from "./place";

/* every room turns through the same four seasons as the terrace */
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

/** what each room's photographs are called, which part of them to keep in
    view when the screen crops them, and whether there's one per season or
    just one for the whole year */
const ROOMS: Record<Exclude<Place, "palace">, { file: string; focus: string; seasons?: false }> = {
  // pink walls, lemon-papered shelves, Snoqualmie Falls through the window
  closet: { file: "closet", focus: "50% 60%" },
  // the house on the lake: marble fireplace, the red bridge, the dock, Rainier
  lakehouse: { file: "lakehouse", focus: "50% 55%" },
  // the blue lagoon under the northern lights
  lagoon: { file: "lagoon", focus: "50% 55%" },
  // the mossy rainforest conservatory: one photograph for now, all year
  rainwood: { file: "rainwood", focus: "50% 55%", seasons: false },
  // the festival stage on the canyon rim at sunset: one photograph for now
  gorge: { file: "amphitheatre", focus: "50% 55%", seasons: false },
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
  return (
    <div aria-hidden className={`palais-room palais-room--away palais-room--${place}`}>
      <div className="palais-seasons">
        {room.seasons === false ? (
          <img
            src={`${process.env.PUBLIC_URL}/palais/${room.file}.webp`}
            alt=""
            decoding="async"
            style={{ position: "absolute", inset: 0, objectPosition: room.focus }}
          />
        ) : (
          SEASONS.map((season) => (
          <img
            key={season}
            src={`${process.env.PUBLIC_URL}/palais/${room.file}-${season}.webp`}
            alt=""
            decoding="async"
            className={`palais-season palais-season--${season}`}
            style={{ objectPosition: room.focus }}
          />
          ))
        )}
      </div>
    </div>
  );
}
