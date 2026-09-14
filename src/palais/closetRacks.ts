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
      const { data, error } = await sb.from(TABLE).select("closet, racks");
      if (error || !data) return;
      const next = { ...published };
      for (const row of data as { closet: Which; racks: RackOrder }[]) {
        if (row.closet === "wide" || row.closet === "tall") next[row.closet] = mend(row.closet, row.racks);
      }
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
export async function publishRacks(which: Which) {
  const racks = state[which];
  const sb = await db();
  const { error } = await sb.from(TABLE).upsert({ closet: which, racks }, { onConflict: "closet" });
  if (error) throw new Error(error.message);
  published = { ...published, [which]: racks };
  notify();
}
