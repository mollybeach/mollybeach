import { useState } from "react";
import type { SeasonLayout } from "./arrangement";
import type { Device } from "./layoutsDb";
import { PLACE_NAMES, type Place } from "./place";
import { propSpec, propSrc, type PropId } from "./props";
import { ALL_STICKERS, defaultLook, hiddenFor, type RoomLook } from "./roomLayouts";
import { SEASON_NAMES, type Season } from "./seasons";
import { stock } from "./shelves";
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

/** the stickers a look puts in the room: every sticker that has a picture
    and isn't left out */
function inLook(layout: SeasonLayout, place: Place, pool: string[]) {
  const out = new Set(hiddenFor(layout, place));
  return pool.filter((id) => !out.has(id));
}

/** a drop-down of the stickers not in a layout, as little pictures by shelf, to add one with a tap */
function AddMenu({ missing, onAdd, onClose }: { missing: string[]; onAdd: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? missing.filter((id) => labelOf(id).toLowerCase().includes(q) || id.includes(q)) : missing;
  const shelves = stock(shown);
  return (
    <div className="season-add" role="dialog" aria-label="Add a sticker">
      <div className="season-add-head">
        <input
          className="cat-input season-add-search"
          type="search"
          placeholder="Search stickers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="button" className="cat-mini" onClick={onClose}>
          Done
        </button>
      </div>
      {shelves.length ? (
        shelves.map(({ shelf, items }) => (
          <div key={shelf.key} className="season-add-shelf">
            <p className="season-add-name">
              <span aria-hidden>{shelf.emoji}</span> {shelf.name}
            </p>
            <ul className="season-grid season-grid--add">
              {items.map((id) => (
                <li key={id}>
                  <button type="button" title={`Add ${labelOf(id)}`} aria-label={`Add ${labelOf(id)}`} onClick={() => onAdd(id)}>
                    <img src={propSrc(id as PropId)} alt="" loading="lazy" decoding="async" />
                    <span aria-hidden className="season-add-plus">+</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p className="season-empty">{q ? "Nothing by that name." : "Everything's already in this one."}</p>
      )}
    </div>
  );
}

/**
 * The catalogue's Seasons page: the room's eight layouts, one for each season
 * on a computer and on a phone, and the stickers each one puts in the room.
 *
 * Each has a + that drops down the stickers it hasn't got, as little pictures.
 * On this device, picking one puts it straight into the room (trying that
 * season's layout on first, if it's another season), to be saved with Done.
 * The other device's layouts aren't on screen, so for Molly, signed in, a pick
 * there is added to that layout in the collection at once.
 */
export function SeasonsShelf({
  place,
  season,
  device,
  collection,
  wearing,
  owner,
  busy,
  stickers,
  hidden,
  onWear,
  onPutIn,
  onAddTo,
  onSaveTo,
}: {
  place: Place;
  season: Season;
  device: Device;
  collection: Collection;
  wearing: SeasonLayout | undefined;
  owner: boolean;
  busy: boolean;
  /** every sticker in the room on this device, shown or not */
  stickers: string[];
  /** the stickers taken out of the room right now */
  hidden: Set<string>;
  onWear: (layout: SeasonLayout) => void;
  onPutIn: (ids: string[]) => void;
  onAddTo: (season: Season, device: Device, ids: string[]) => void;
  onSaveTo: (season: Season) => void;
}) {
  const [adding, setAdding] = useState<string | null>(null);
  const pool = stickers.length ? stickers : ALL_STICKERS;

  return (
    <div className="season-page">
      <p className="rack-intro">
        {PLACE_NAMES[place]} has a layout for each season, on a computer and on a phone. It's {SEASON_EMOJI[season]}{" "}
        {season} now, on a {device === "phone" ? "phone" : "computer"}. Tap + to add a sticker.
      </p>
      {DEVICES.map((d) =>
        SEASON_NAMES.map((s) => {
          const key = `${d.key}-${s}`;
          const look = defaultLook(collection.saved, place, s, d.key);
          const here = d.key === device;
          const isNow = here && s === season;
          const worn = here && wearing === look.layout;
          // the one on screen shows the room as it is, including anything just added
          const ids = worn ? pool.filter((id) => !hidden.has(id)) : inLook(look.layout, place, pool);
          const has = new Set(ids);
          const missing = pool.filter((id) => !has.has(id));
          const canAdd = here || owner;
          return (
            <section key={key} className={`cat-shelf season-shelf${isNow ? " is-now" : ""}${worn ? " is-worn" : ""}`}>
              <div className="cat-shelf-head">
                <h3>
                  <span aria-hidden>{SEASON_EMOJI[s]}</span> {titleCase(s)} · <span aria-hidden>{d.emoji}</span> {d.name}
                </h3>
                {isNow && <span className="cat-now">now</span>}
                <span className={`season-source season-source--${look.source}`}>{SOURCE[look.source]}</span>
                <span className="cat-shelf-count">{ids.length}</span>
                {canAdd && (
                  <button
                    type="button"
                    className={`season-plus${adding === key ? " is-open" : ""}`}
                    aria-expanded={adding === key}
                    aria-label={`Add a sticker to ${s} on a ${d.name.toLowerCase()}`}
                    disabled={busy && !here}
                    onClick={() => {
                      if (adding === key) return setAdding(null);
                      // adding to another season on this device: wear it first, so the room shows it
                      if (here && !worn) onWear(look.layout);
                      setAdding(key);
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              {adding === key && (
                <AddMenu
                  missing={missing}
                  onClose={() => setAdding(null)}
                  onAdd={(id) => (here ? onPutIn([id]) : onAddTo(s, d.key, [id]))}
                />
              )}
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
                  <span className="season-hint">
                    {owner
                      ? `Stickers added here go straight into this layout. Open the site on a ${d.key === "phone" ? "phone" : "computer"} to move them.`
                      : `Open the site on a ${d.key === "phone" ? "phone" : "computer"} to arrange this one.`}
                  </span>
                )}
              </div>
            </section>
          );
        }),
      )}
    </div>
  );
}
