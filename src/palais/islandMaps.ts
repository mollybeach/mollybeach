import { useEffect, useState } from "react";
import { db, dbConfigured } from "./layoutsDb";

/**
 * The island maps the made rooms' islands are set out on (palais_island_maps),
 * shown on the World Map after its own two islands (WorldMap.tsx) and built
 * at Brat Academy's island maker (IslandMaker.tsx, Create map).
 *
 * Each is one empty painted island (an IslandMap here) with plots on it, which
 * room's island is on each plot, and the scenery set out on it. The newest is
 * the open one: members put their rooms' islands on its empty plots and dress
 * it while it fills. When its last plot's taken it's finished, and the next
 * one opens on a fresh copy of the empty island (palais-rooms does that).
 */

const ART = `${process.env.PUBLIC_URL}/palais_assets/modal_content/island_maker`;

export interface Plot {
  name: string;
  /** the middle of the plot, as a fraction of the square painting */
  x: number;
  y: number;
  water?: boolean;
  /** what's there, as a little picture on its button */
  icon: string;
}

export interface IslandMap {
  id: string;
  name: string;
  src: string;
  /** the painting's size, in pixels (it's square) */
  px: number;
  plots: Plot[];
}

/** the empty islands to build on. Each painting's plots were found by eye */
export const TEMPLATES: Record<string, IslandMap> = {
  sunset: {
    id: "sunset",
    name: "Sunset Isle",
    src: `${ART}/island_map_template.webp`,
    px: 1254,
    plots: [
      { name: "The summit", x: 0.459, y: 0.226, icon: "⛰️" },
      { name: "West terrace", x: 0.335, y: 0.329, icon: "🌿" },
      { name: "East terrace", x: 0.682, y: 0.325, icon: "🌸" },
      { name: "Cliffside", x: 0.861, y: 0.472, icon: "🪨" },
      { name: "The meadow", x: 0.287, y: 0.524, icon: "🌼" },
      { name: "The lagoon", x: 0.606, y: 0.585, water: true, icon: "🐚" },
      { name: "The beach", x: 0.51, y: 0.705, icon: "🏖️" },
      { name: "Out at sea", x: 0.51, y: 0.89, water: true, icon: "⛵" },
    ],
  },
};

/** a piece of scenery on a map: where its feet are (or, for sky, its
    middle), as a fraction of the painting, how much bigger or smaller than
    usual, and whether it's flipped */
export interface Placed {
  n: number;
  id: string;
  x: number;
  y: number;
  s: number;
  flip?: boolean;
}

export interface MapRow {
  n: number;
  template: string;
  /** which room's island is on each plot, by the plot's number */
  plots: Record<string, string>;
  decor: Placed[];
  full: boolean;
}

export const templateOf = (m: MapRow) => TEMPLATES[m.template] ?? TEMPLATES.sunset;
/** the first map, before the table's there or anything's been fetched */
export const EMPTY_MAP: MapRow = { n: 1, template: "sunset", plots: {}, decor: [], full: false };

let maps: MapRow[] = [];
let version = 0;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;
const changed = () => {
  version++;
  listeners.forEach((l) => l());
};

export function loadMaps(again = false) {
  if (!dbConfigured || (loading && !again)) return loading;
  loading = (async () => {
    try {
      const sb = await db();
      const { data } = await sb.from("palais_island_maps").select("n, template, plots, decor, full:is_full").order("n");
      maps = (data as MapRow[] | null) ?? [];
      changed();
    } catch {
      /* the table isn't there yet: just the first, empty one */
    }
  })();
  return loading;
}

/** every island map, the open one last */
export function useIslandMaps() {
  const [, setV] = useState(version);
  useEffect(() => {
    loadMaps();
    const on = () => setV(version);
    listeners.add(on);
    return () => {
      listeners.delete(on);
    };
  }, []);
  return maps.length ? maps : [EMPTY_MAP];
}

const keep = (m: MapRow) => {
  maps = [...maps.filter((x) => x.n !== m.n), m].sort((a, b) => a.n - b.n);
};

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const sb = await db();
  const { data, error } = await sb.functions.invoke("palais-rooms", { body });
  if (error) {
    let said: string | undefined;
    try {
      said = (await (error as { context?: Response }).context?.json())?.error;
    } catch {
      /* no body */
    }
    throw new Error(said ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** put your room's island on a plot of the open map (or move it there), or
    take it off with null */
export async function placeIsland(room: string, plot: number | null) {
  const got = await call<{ map: MapRow; next: MapRow | null }>({ place: { room, plot } });
  keep(got.map);
  if (got.next) keep(got.next);
  changed();
  return got;
}

/** the open map's scenery, as it now stands */
export async function dressMap(n: number, decor: Placed[]) {
  const got = await call<{ map: MapRow }>({ dress: { map: n, decor } });
  keep(got.map);
  changed();
  return got.map;
}

/** while the scenery's being moved about, the map as it stands here, before
    it's saved */
export function setLocalDecor(n: number, decor: Placed[]) {
  const m = maps.find((x) => x.n === n) ?? (n === EMPTY_MAP.n ? EMPTY_MAP : undefined);
  if (!m) return;
  keep({ ...m, decor });
  changed();
}
