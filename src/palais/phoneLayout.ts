import phoneLayout from "./layouts/phone.json";
import autumnLayout from "./layouts/autumn.json";
import { SHELVES } from "./shelves";
import type { SeasonLayout } from "./arrangement";
import type { PropId } from "./props";
import type { Season } from "./seasons";

/**
 * The phone room's arrangement, and the rest of the catalogue on the phone.
 *
 * The catalogue lists what's in the room, and the phone room was set out with
 * only a couple of dozen things, so the rest of the stickers are placed on it
 * too (PHONE_EXTRAS), out of the room to begin with: turn one on in the
 * catalogue and it appears on the floor or the wall, ready to be dragged.
 *
 * Molly arranged the phone room (layouts/phone.json) and it serves every
 * season, with the season's own animals: the dogs in the pool only in spring
 * and summer, Brea and Molly's table in autumn.
 *
 * Phone layouts are measured on the photograph's frame (`.palais-frame`), not
 * the whole screen, so they hold on every phone: "Copy layout" records the
 * frame's size.
 */

/** where a sticker that isn't in the phone's own arrangement is put */
export interface Extra {
  id: PropId;
  /** width, % of the photograph's width */
  w: number;
  left: number;
  /** its feet, % up from the bottom of the photograph; or `top` for things on the wall */
  ground?: number;
  top?: number;
}

const ids = (key: string) => (SHELVES.find((s) => s.key === key)?.items ?? []) as PropId[];

/* everything the desktop room has, which is everything in the catalogue */
const ALL = Object.keys(autumnLayout.props) as PropId[];
/* the stickers PortraitTerrace.tsx sets out itself; the rest are PHONE_EXTRAS */
const PLACED = new Set<string>([
  "armchair-sage", "bed-iron", "cabinet-jewelry", "cat-blueberry-party", "cat-blueberry-running", "cats-birthday",
  "cats-roses", "dog-charlie-kiddie-pool", "dog-frisbee", "dog-maggie-frisbee", "dresser", "fall-table-brea-molly",
  "goat-bambi", "goats-pumpkin-ferdinand", "honeysuckle-tricycle", "lamp-porcelain", "lilac-bush", "pendant-opal",
  "perfume-collection", "planter-greek-head", "rose-bush", "teacups-collection", "trellis-ivy", "trellis-wisteria",
  "vanity", "wisteria-branch-lavender", "wisteria-branch-purple",
]);
const PENDANTS = new Set(ids("lights"));

function shelfOf(id: PropId) {
  return SHELVES.find((s) => (s.items as string[]).includes(id))?.key ?? "trinkets";
}

/** a size and a first spot for each kind of thing */
const KIND: Record<string, { w: number; ground?: number; top?: number }> = {
  furniture: { w: 34, ground: 20 },
  plants: { w: 20, ground: 22 },
  blossoms: { w: 30, ground: 30 },
  trellises: { w: 26, ground: 30 },
  wisteria: { w: 60, top: -3 },
  artwork: { w: 15, top: 30 },
  cats: { w: 15, ground: 8 },
  dogs: { w: 16, ground: 12 },
  goats: { w: 12, ground: 30 },
  people: { w: 40, ground: 18 },
  pillows: { w: 12, ground: 14 },
  teacups: { w: 7, ground: 16 },
  trinkets: { w: 8, ground: 12 },
};

export const PHONE_EXTRAS: Extra[] = (() => {
  const count: Record<string, number> = {};
  return ALL.filter((id) => !PLACED.has(id) && !PENDANTS.has(id)).map((id) => {
    const kind = shelfOf(id);
    const k = KIND[kind] ?? KIND.trinkets;
    const n = (count[kind] = (count[kind] ?? 0) + 1) - 1;
    // spread each kind across the room, a little staggered
    const left = 8 + ((n * 17) % (86 - k.w));
    return {
      id,
      w: k.w,
      left,
      ...(k.top !== undefined ? { top: k.top + (n % 3) * 4 } : { ground: (k.ground ?? 12) + (n % 3) * 3 }),
    };
  });
})();

/** the hanging lights not already hung on the phone */
export const PHONE_EXTRA_PENDANTS = ids("lights").filter((id) => !PLACED.has(id));

/* the phone's frame when the layout was made: the photograph (941 × 1672),
   scaled to cover the recorded stage (older copies recorded the screen; newer
   ones record the frame itself, which this leaves as it is) */
const FRAME = (() => {
  const { w, h } = phoneLayout.stage;
  const photo = 1672 / 941;
  return { w: Math.max(w, h / photo), h: Math.max(h, w * photo) };
})();

type Props = SeasonLayout["props"];

function base(): Props {
  const props: Props = {};
  // anything Molly's layout doesn't mention starts out of the room
  for (const e of PHONE_EXTRAS) props[e.id] = { shown: false, x: 0, y: 0, s: 1, z: 60 };
  for (const id of PHONE_EXTRA_PENDANTS) props[id] = { shown: false, x: 0, y: 0, s: 1, z: 95 };
  for (const [id, m] of Object.entries(phoneLayout.props)) props[id] = { ...m };
  return props;
}

function season(changes: Record<string, boolean>): SeasonLayout {
  const props = base();
  for (const [id, shown] of Object.entries(changes)) if (props[id]) props[id].shown = shown;
  return { stage: FRAME, props };
}

export const PHONE_LAYOUTS: Record<Season, SeasonLayout> = {
  spring: season({ "dog-maggie-frisbee": true, "dog-charlie-kiddie-pool": true }),
  summer: season({ "dog-maggie-frisbee": true, "dog-charlie-kiddie-pool": true }),
  autumn: season({ "dog-maggie-frisbee": false, "dog-charlie-kiddie-pool": false, "fall-table-brea-molly": true }),
  winter: season({ "dog-maggie-frisbee": false, "dog-charlie-kiddie-pool": false }),
};
