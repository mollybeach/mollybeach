import type { SeasonLayout } from "./arrangement";
import type { Device } from "./layoutsDb";
import { PLACE_NAMES, type Place } from "./place";
import { propSpec, propSrc, type PropId } from "./props";
import { defaultLook, shownIn, type RoomLook } from "./roomLayouts";
import { SEASON_NAMES, type Season } from "./seasons";
import type { Collection } from "./useCollection";

export const SEASON_EMOJI: Record<Season, string> = { spring: "🌷", summer: "☀️", autumn: "🍂", winter: "❄️" };
export const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const DEVICES: { key: Device; name: string; emoji: string }[] = [
  { key: "desktop", name: "Computer", emoji: "💻" },
  { key: "phone", name: "Phone", emoji: "📱" },
];

const labelOf = (id: string) => {
  try {
    return propSpec(id as PropId).label;
  } catch {
    return id;
  }
};

const SOURCE: Record<RoomLook["source"], string> = {
  saved: "★ Saved default",
  code: "From the code",
  empty: "Empty",
};

/**
 * The catalogue's Seasons page: the room's eight layouts, one for each season
 * on a computer and on a phone, and the stickers each one puts in the room.
 *
 * Any of this device's four can be tried on. Signed in, Molly can save the room
 * as it is now into any of them (Done saves it into the season it's in).
 */
export function SeasonsShelf({
  place,
  season,
  device,
  collection,
  wearing,
  owner,
  busy,
  onWear,
  onSaveTo,
}: {
  place: Place;
  season: Season;
  device: Device;
  collection: Collection;
  wearing: SeasonLayout | undefined;
  owner: boolean;
  busy: boolean;
  onWear: (layout: SeasonLayout) => void;
  onSaveTo: (season: Season) => void;
}) {
  return (
    <div className="season-page">
      <p className="rack-intro">
        {PLACE_NAMES[place]} has a layout for each season, on a computer and on a phone. It's {SEASON_EMOJI[season]}{" "}
        {season} now, on a {device === "phone" ? "phone" : "computer"}.
      </p>
      {DEVICES.map((d) =>
        SEASON_NAMES.map((s) => {
          const look = defaultLook(collection.saved, place, s, d.key);
          const ids = shownIn(look.layout);
          const here = d.key === device;
          const isNow = here && s === season;
          const worn = here && wearing === look.layout;
          return (
            <section key={`${d.key}-${s}`} className={`cat-shelf season-shelf${isNow ? " is-now" : ""}`}>
              <div className="cat-shelf-head">
                <h3>
                  <span aria-hidden>{SEASON_EMOJI[s]}</span> {titleCase(s)} · <span aria-hidden>{d.emoji}</span> {d.name}
                </h3>
                {isNow && <span className="cat-now">now</span>}
                <span className={`season-source season-source--${look.source}`}>{SOURCE[look.source]}</span>
                <span className="cat-shelf-count">{ids.length}</span>
              </div>
              {ids.length ? (
                <ul className="season-grid">
                  {ids.map((id) => (
                    <li key={id} title={labelOf(id)}>
                      <img src={propSrc(id as PropId)} alt={labelOf(id)} loading="lazy" decoding="async" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="season-empty">Nothing in this one yet.</p>
              )}
              <div className="cat-look-actions season-actions">
                {here ? (
                  <>
                    <button type="button" className="cat-mini" disabled={worn} onClick={() => onWear(look.layout)}>
                      {worn ? "Wearing" : "Try on"}
                    </button>
                    {owner && (
                      <button type="button" className="cat-mini cat-mini--hot" disabled={busy} onClick={() => onSaveTo(s)}>
                        Save the room as {s}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="season-hint">Open the site on a {d.key === "phone" ? "phone" : "computer"} to arrange this one.</span>
                )}
              </div>
            </section>
          );
        }),
      )}
    </div>
  );
}
