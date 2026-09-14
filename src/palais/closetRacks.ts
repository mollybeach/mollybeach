import { useSyncExternalStore } from "react";
import { CLOSET_LINES } from "./clothes";

/**
 * The order of the clothes on each of the closet's rails, shelves and racks.
 *
 * The code (clothes.ts) says where everything starts. The catalogue's Racks
 * page moves things along a rail or onto another one, and the closet follows
 * straight away. The rearrangement is kept in this browser, and "Copy
 * arrangement" copies it out, to be made the one everyone sees.
 *
 * The wide photographs and the tall one for phones have different rails, so
 * each has its own arrangement.
 */

export type Which = "wide" | "tall";
/** rail id → garment ids, first = front (the near end of the rail) */
export type RackOrder = Record<string, string[]>;

const KEY = "palais-closet-racks-v1";

const defaults = (which: Which): RackOrder =>
  Object.fromEntries(CLOSET_LINES[which].map((line) => [line.id, [...line.ids]]));

/** a saved arrangement, mended against the code: rails that no longer exist
    are dropped, and anything new goes where the code puts it */
function mend(which: Which, saved: RackOrder | undefined): RackOrder {
  const base = defaults(which);
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

function load(): Record<Which, RackOrder> {
  let saved: Partial<Record<Which, RackOrder>> = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    /* nothing saved, or unreadable */
  }
  return { wide: mend("wide", saved.wide), tall: mend("tall", saved.tall) };
}

let state = load();
const listeners = new Set<() => void>();

function commit(next: Record<Which, RackOrder>) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: it still works until the page reloads */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
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
  commit({ ...state, [which]: order });
}

export function resetRacks(which: Which) {
  commit({ ...state, [which]: defaults(which) });
}

export function racksChanged(which: Which) {
  return JSON.stringify(state[which]) !== JSON.stringify(defaults(which));
}
