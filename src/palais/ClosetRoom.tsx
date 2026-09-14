/* the closet through the year, the same four seasons as the terrace */
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

/**
 * The closet: pink walls, lemon-papered shelves, and Snoqualmie Falls through
 * the window, in four seasons.
 *
 * It uses the terrace's season classes, so the same timeline turns it, and
 * "Skip" and "Pause" move both rooms at once. It's always on the page, under
 * the terrace or over it depending on which room you're in (see place.ts).
 */
export function ClosetRoom() {
  return (
    <div aria-hidden className="palais-room palais-room--closet">
      <div className="palais-seasons">
        {SEASONS.map((season) => (
          <img
            key={season}
            src={`${process.env.PUBLIC_URL}/palais/closet-${season}.webp`}
            alt=""
            decoding="async"
            className={`palais-season palais-season--${season}`}
            style={{ objectPosition: "50% 60%" }}
          />
        ))}
      </div>
    </div>
  );
}
