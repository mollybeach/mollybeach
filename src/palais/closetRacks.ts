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
  for (const lineId of Object.keys(base)) {
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
/** fetch the default from the database, once */
export function loadPublished() {
  if (!dbConfigured) return Promise.resolve();
  loading ??= (async () => {
    try {
      const sb = await db();
      // moves and hidden come with a later migration: without them, just the rails
      let res = await sb.from(TABLE).select("closet, racks, moves, hidden");
      if (res.error) res = await sb.from(TABLE).select("closet, racks");
      const { data, error } = res;
      if (error || !data) return;
      const next = { ...published };
      const nextMoves = { ...publishedMoves };
      let nextHidden: string[] | undefined;
      for (const row of data as { closet: Which; racks: RackOrder; moves?: ClosetMoves; hidden?: string[] }[]) {
        if (row.closet === "wide" || row.closet === "tall") {
          next[row.closet] = mend(row.closet, row.racks);
          nextMoves[row.closet] = row.moves ?? {};
          // both rows keep the same list; the wide one wins if they ever differ
          if (Array.isArray(row.hidden) && (row.closet === "wide" || !nextHidden)) nextHidden = row.hidden;
        }
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

/** whether the closet has been rearranged since the default */
export function racksChanged(which: Which) {
  return !same(state[which], published[which]);
}

/** save the closet as it is now as the default everyone sees (editors only;
    the database refuses anyone else) */
export async function publishRacks(which: Which, moves?: ClosetMoves, hidden?: Set<string>) {
  const racks = state[which];
  const list = hidden ? sorted(hidden) : undefined;
  const sb = await db();
  const rows: Record<string, unknown>[] = [{ closet: which, racks, ...(moves ? { moves } : {}), ...(list ? { hidden: list } : {}) }];
  // what's taken out is the same on computers and phones, so the other row gets it too
  const other: Which = which === "wide" ? "tall" : "wide";
  if (list) rows.push({ closet: other, racks: state[other], hidden: list });
  const { error } = await sb.from(TABLE).upsert(rows, { onConflict: "closet" });
  if (error) {
    if ((moves || list) && /moves|hidden/.test(error.message)) {
      throw new Error("the closet table has no room for moved or taken-out clothes yet: run supabase/migrations/20260914150000_palais_closet_moves.sql");
    }
    throw new Error(error.message);
  }
  published = { ...published, [which]: racks, ...(list ? { [other]: state[other] } : {}) };
  if (moves) publishedMoves = { ...publishedMoves, [which]: moves };
  if (list) publishedHidden = list;
  notify();
}
