import { useSyncExternalStore } from "react";
import { CLOSET_LINES } from "./clothes";
import { db, dbConfigured } from "./layoutsDb";

/**
 * The order of the clothes on each of the closet's rails, shelves and racks.
 *
 * The default everyone sees is kept in Supabase (table palais_closet_racks,
 * see supabase/migrations); until it has loaded, or without a database, the
 * order written in clothes.ts is used. Anyone can rearrange the closet from
 * the catalogue's Racks page, and the closet follows straight away, but only
 * for them and only until they reload. When Molly, signed in, rearranges it
 * and clicks Done, her arrangement is saved as the new default.
 *
 * The wide photographs and the tall one for phones have different rails, so
 * each has its own arrangement.
 */

export type Which = "wide" | "tall";
/** rail id → garment ids, first = front (the near end of the rail) */
export type RackOrder = Record<string, string[]>;
/** where a piece has been dragged from its spot, as percentages of the closet
    photograph's width and height; its size; and its stacking order, if it was
    brought forward */
export interface PieceMove {
  x: number;
  y: number;
  s: number;
  z?: number;
}
export type ClosetMoves = Record<string, PieceMove>;

const TABLE = "palais_closet_racks";

const fromCode = (which: Which): RackOrder =>
  Object.fromEntries(CLOSET_LINES[which].map((line) => [line.id, [...line.ids]]));

/** an arrangement, mended against the code: rails that no longer exist are
    dropped, clothes that are gone are skipped, and anything new goes where
    the code puts it */
function mend(which: Which, saved: RackOrder | undefined): RackOrder {
  const base = fromCode(which);
  if (!saved) return base;
  const known = new Set(Object.values(base).flat());
  const seen = new Set<string>();
  const out: RackOrder = {};
  /* A rail the saved arrangement has never heard of keeps what the code hangs
     on it. Without this a new rail could never appear: the old arrangement
     still lists those pieces somewhere else, claims them first, and the new
     rail comes up empty — which is what happened to the window hooks on a
     phone. Once the closet is saved again the rail is in the arrangement like
     any other, and what Molly did with it stands. */
  for (const [lineId, ids] of Object.entries(base)) {
    if (saved[lineId]) continue;
    out[lineId] = ids.filter((id) => !seen.has(id) && seen.add(id));
  }
  for (const lineId of Object.keys(base)) {
    if (out[lineId]) continue;
    out[lineId] = (saved[lineId] ?? []).filter((id) => known.has(id) && !seen.has(id) && seen.add(id));
  }
  for (const [lineId, ids] of Object.entries(base)) {
    for (const id of ids) if (!seen.has(id)) out[lineId].push(id);
  }
  return out;
}

const same = (a: RackOrder, b: RackOrder) => JSON.stringify(a) === JSON.stringify(b);

/** the default (from the database, once loaded) */
let published: Record<Which, RackOrder> = { wide: fromCode("wide"), tall: fromCode("tall") };
/** what the closet is showing right now */
let state = published;
/** where the clothes have been dragged, by default (the database) */
let publishedMoves: Record<Which, ClosetMoves> = { wide: {}, tall: {} };
/** the clothes taken out of the closet, by default (the database); the same
    on computers and phones */
let publishedHidden: string[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// arrangements used to be kept in the browser; the database has taken over
try {
  localStorage.removeItem("palais-closet-racks-v1");
} catch {
  /* no storage */
}

let loading: Promise<void> | undefined;

/* Where the clothes have been dragged and which are taken out are kept in the
   same row as the rails, inside its racks: under MOVES and HIDDEN, beside the
   rail ids. So they need no extra columns, and save on the table as it is. */
const MOVES = "__moves";
const HIDDEN = "__hidden";
/* The closet on a phone was laid out again — the window's hooks, the bays
   brought forward, the rails moved apart — and an arrangement saved before
   that describes a closet that no longer exists: everything ends up heaped at
   the back. So a saved phone arrangement is only followed once it has been
   saved against this layout; older ones are set aside and the phone gets the
   closet as the code arranges it. Saving from the Racks page marks it, and
   from then on what Molly arranges stands. */
const LAYOUT = "__layout";
const LAYOUT_NOW = 2;
type StoredRacks = Record<string, unknown>;

/** fetch the default from the database, once */
export function loadPublished() {
  if (!dbConfigured) return Promise.resolve();
  loading ??= (async () => {
    try {
      const sb = await db();
      const { data, error } = await sb.from(TABLE).select("closet, racks");
      if (error || !data) return;
      const next = { ...published };
      const nextMoves = { ...publishedMoves };
      let nextHidden: string[] | undefined;
      for (const row of data as { closet: Which; racks: StoredRacks | null }[]) {
        if (row.closet !== "wide" && row.closet !== "tall") continue;
        const { [MOVES]: moves, [HIDDEN]: hidden, [LAYOUT]: version, ...rails } = row.racks ?? {};
        const stale = row.closet === "tall" && version !== LAYOUT_NOW;
        next[row.closet] = stale ? fromCode("tall") : mend(row.closet, rails as RackOrder);
        nextMoves[row.closet] = !stale && moves && typeof moves === "object" ? (moves as ClosetMoves) : {};
        // both rows keep the same list; the wide one wins if they ever differ
        if (Array.isArray(hidden) && (row.closet === "wide" || !nextHidden)) nextHidden = hidden as string[];
      }
      if (nextHidden) publishedHidden = nextHidden;
      publishedMoves = nextMoves;
      // anything not yet rearranged picks up the default
      state = {
        wide: same(state.wide, published.wide) ? next.wide : state.wide,
        tall: same(state.tall, published.tall) ? next.tall : state.tall,
      };
      published = next;
      notify();
    } catch {
      /* the closet keeps the order in the code */
    }
  })();
  return loading;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  void loadPublished();
  return () => {
    listeners.delete(l);
  };
};

export function useRackOrder(which: Which): RackOrder {
  return useSyncExternalStore(subscribe, () => state[which]);
}

/** the clothes taken out of the closet, by default */
export function useClosetHiddenDefault(): string[] {
  return useSyncExternalStore(subscribe, () => publishedHidden);
}

const sorted = (ids: Iterable<string>) => Array.from(ids).sort();

/** whether the clothes taken out differ from the default */
export function hiddenChanged(hidden: Set<string>) {
  return JSON.stringify(sorted(hidden)) !== JSON.stringify(sorted(publishedHidden));
}

/** where the clothes have been dragged to, by default */
export function useClosetMoves(which: Which): ClosetMoves {
  return useSyncExternalStore(subscribe, () => publishedMoves[which]);
}

/** where every piece in the closet on screen has been dragged to and how big
    it's been made, measured on the photograph's frame */
export function closetMovesNow(stage: HTMLElement): ClosetMoves {
  const frame = stage.querySelector<HTMLElement>(".palais-closet-frame");
  if (!frame) return {};
  const r = frame.getBoundingClientRect();
  const out: ClosetMoves = {};
  frame.querySelectorAll<HTMLElement>("[data-prop]").forEach((el) => {
    const cs = getComputedStyle(el);
    const [tx = "0", ty = "0"] = cs.translate === "none" ? [] : cs.translate.split(" ");
    const x = r.width ? Math.round(((parseFloat(tx) || 0) / r.width) * 100000) / 1000 : 0;
    const y = r.height ? Math.round(((parseFloat(ty) || 0) / r.height) * 100000) / 1000 : 0;
    const s = Math.round((parseFloat(cs.scale) || 1) * 1000) / 1000;
    // brought forward by dragging: Draggable notes where it sat first
    const raised = el.dataset.z0 !== undefined && cs.zIndex !== el.dataset.z0;
    if (!x && !y && s === 1 && !raised) return;
    out[el.dataset.prop!] = { x, y, s, ...(raised ? { z: Number(cs.zIndex) || 0 } : {}) };
  });
  return out;
}

/** whether the clothes have been dragged about since the default */
export function movesChanged(which: Which, now: ClosetMoves) {
  return JSON.stringify(now) !== JSON.stringify(publishedMoves[which]);
}

/** move a piece to `index` on rail `toLine` (it may be the rail it's on) */
export function movePiece(which: Which, id: string, toLine: string, index: number) {
  const order: RackOrder = Object.fromEntries(Object.entries(state[which]).map(([k, v]) => [k, [...v]]));
  let from: string | undefined;
  let at = -1;
  for (const [lineId, ids] of Object.entries(order)) {
    const i = ids.indexOf(id);
    if (i >= 0) {
      from = lineId;
      at = i;
      ids.splice(i, 1);
      break;
    }
  }
  if (!order[toLine]) return;
  // taking it out shifts everything after it along by one
  const to = from === toLine && at < index ? index - 1 : index;
  order[toLine].splice(Math.max(0, Math.min(to, order[toLine].length)), 0, id);
  state = { ...state, [which]: order };
  notify();
}

/** back to the default */
export function resetRacks(which: Which) {
  state = { ...state, [which]: published[which] };
  notify();
}

/** lay the closet out the way the code arranges it, ready to be saved over a
    stale default (the saved arrangement wins over the code otherwise: see
    mend, which lets whatever is already placed keep its piece) */
export function freshFromCode(which: Which) {
  state = { ...state, [which]: fromCode(which) };
  notify();
}

/** whether the closet has been rearranged since the default */
export function racksChanged(which: Which) {
  return !same(state[which], published[which]);
}

/** save the closet as it is now as the default everyone sees (editors only;
    the database refuses anyone else) */
export async function publishRacks(which: Which, moves?: ClosetMoves, hidden?: Set<string>) {
  const other: Which = which === "wide" ? "tall" : "wide";
  const nextMoves = { ...publishedMoves, ...(moves ? { [which]: moves } : {}) };
  const nextHidden = hidden ? sorted(hidden) : publishedHidden;
  const row = (w: Which): { closet: Which; racks: StoredRacks } => ({
    closet: w,
    racks: { ...state[w], [MOVES]: nextMoves[w], [HIDDEN]: nextHidden, [LAYOUT]: LAYOUT_NOW },
  });
  const sb = await db();
  // what's taken out is the same on computers and phones, so both rows get it
  const rows = hidden ? [row(which), row(other)] : [row(which)];
  const { error } = await sb.from(TABLE).upsert(rows, { onConflict: "closet" });
  if (error) throw new Error(error.message);
  published = { ...published, [which]: state[which], ...(hidden ? { [other]: state[other] } : {}) };
  publishedMoves = nextMoves;
  publishedHidden = nextHidden;
  notify();
}
