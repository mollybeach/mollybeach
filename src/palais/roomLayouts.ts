import autumnLayout from "./layouts/autumn.json";
import { BUNDLED_LAYOUTS, hiddenOf, type SeasonLayout } from "./arrangement";
import { PHONE_LAYOUTS } from "./phoneLayout";
import { PROPS } from "./props";
import { DECOR_SET } from "./decor";
import type { Device, SavedLayout } from "./layoutsDb";
import type { Place } from "./place";
import type { Season } from "./seasons";

/**
 * Which layout each room wears.
 *
 * Every room on the map has the same catalogue of stickers, and its own
 * layout for each season on a computer and on a phone: eight per room. The
 * room's default for a season and device, saved in the collection
 * (layoutsDb.ts), wins; then, for the palace, the layouts in the code; any
 * other room with nothing saved starts empty, ready to be dressed from the
 * catalogue.
 */

/** every sticker there is */
export const ALL_STICKERS: string[] = Array.from(new Set([...Object.keys(PROPS), ...Object.keys(autumnLayout.props)]));

/** a room with nothing in it */
export const EMPTY_LAYOUT: SeasonLayout = { stage: { w: 1, h: 1 }, props: {} };

export type LayoutSource = "saved" | "code" | "empty";

export interface RoomLook {
  layout: SeasonLayout;
  source: LayoutSource;
  saved?: SavedLayout;
}

export function defaultLook(saved: SavedLayout[], place: Place, season: Season, device: Device): RoomLook {
  const mine = saved.find((l) => (l.place ?? "palace") === place && l.season === season && l.device === device && l.is_default);
  if (mine) return { layout: mine, source: "saved", saved: mine };
  if (place === "palace") {
    const code = device === "phone" ? PHONE_LAYOUTS[season] : BUNDLED_LAYOUTS[season];
    if (code) return { layout: code, source: "code" };
  }
  return { layout: EMPTY_LAYOUT, source: "empty" };
}

/** what a layout leaves out of a room. In the palace a sticker the layout
    doesn't mention stays in (the code's layouts list only some); in every
    other room it stays out. */
export function hiddenFor(layout: SeasonLayout, place: Place): string[] {
  if (place === "palace") {
    // the room decor came later than the code's layouts: out unless a layout puts it in
    const decorOut = Array.from(DECOR_SET).filter((id) => !layout.props[id]);
    return [...hiddenOf(layout), ...decorOut];
  }
  return ALL_STICKERS.filter((id) => !layout.props[id]?.shown);
}

/** the stickers a layout puts in a room */
export const shownIn = (layout: SeasonLayout) =>
  Object.entries(layout.props)
    .filter(([, m]) => m.shown)
    .map(([id]) => id);

/** whether the room as captured differs from a layout: what's in it, and
    where the things in it are, allowing for a different stage size */
export function differs(now: SeasonLayout, layout: SeasonLayout, place: Place): boolean {
  const hidden = new Set(hiddenFor(layout, place));
  const ids = new Set([...Object.keys(now.props), ...Object.keys(layout.props)]);
  for (const id of Array.from(ids)) {
    const a = now.props[id];
    if (!a) continue;
    const wasShown = !hidden.has(id);
    if (a.shown !== wasShown) return true;
    if (!a.shown) continue;
    const b = layout.props[id] ?? { x: 0, y: 0, s: 1, z: a.z, shown: true };
    if (Math.abs(a.x / now.stage.w - b.x / layout.stage.w) > 0.002) return true;
    if (Math.abs(a.y / now.stage.h - b.y / layout.stage.h) > 0.002) return true;
    if (Math.abs((a.s ?? 1) - (b.s ?? 1)) > 0.01) return true;
    if (layout.props[id] && a.z !== b.z) return true;
  }
  return false;
}
