import { useEffect, useState } from "react";
import type { SeasonLayout } from "./arrangement";
import { db, dbConfigured, type Device } from "./layoutsDb";
import type { Place } from "./place";
import type { Season } from "./seasons";

/**
 * The things people have put in the rooms (palais_placements).
 *
 * Molly's own arrangement of a room is its saved layout, which only she can
 * change. Anyone signed in can put things in too: each is a placement, one
 * sticker in one room, for one season, on one kind of screen, with who put it
 * there. A room wears Molly's layout with the placements laid over it
 * (withPlacements).
 *
 * What's Molly's is locked: nobody else can pick it up, resize it or take it
 * out (isLocked, which Draggable.tsx and Catalogue.tsx ask). Everything else
 * anyone signed in can move, resize or take out, and it's kept as soon as
 * it's changed (keepChanges). Signed out, the rooms can be looked at but not
 * changed.
 */

export const OWNER_NAME = "mollybeach";

export interface Placement {
  id: number;
  place: Place;
  season: Season;
  device: Device;
  prop: string;
  x: number;
  y: number;
  s: number;
  z: number;
  stage_w: number;
  stage_h: number;
  added_by: string | null;
  added_by_name: string | null;
}

const TABLE = "palais_placements";
const COLUMNS = "id, place, season, device, prop, x, y, s, z, stage_w, stage_h, added_by, added_by_name";

/* ---- what's been put in, room by room ------------------------------------ */

const byPlace = new Map<Place, Placement[]>();
const loading = new Map<Place, Promise<void>>();
let version = 0;
const listeners = new Set<() => void>();
const changed = () => {
  version++;
  listeners.forEach((l) => l());
};

function load(place: Place) {
  if (!dbConfigured || loading.has(place)) return;
  loading.set(
    place,
    (async () => {
      try {
        const sb = await db();
        const { data } = await sb.from(TABLE).select(COLUMNS).eq("place", place);
        byPlace.set(place, (data as Placement[] | null) ?? []);
        changed();
      } catch {
        /* the table isn't there yet: nothing's been put in */
      }
    })(),
  );
}

/** the placements in a room, re-rendering when they've been fetched */
export function usePlacements(place: Place) {
  const [, setV] = useState(version);
  useEffect(() => {
    load(place);
    const on = () => setV(version);
    listeners.add(on);
    return () => {
      listeners.delete(on);
    };
  }, [place]);
  return version;
}

export const placementsFor = (place: Place, season: Season, device: Device) =>
  (byPlace.get(place) ?? []).filter((p) => p.season === season && p.device === device);

/** Molly's layout with what others have put in laid over it. Anything Molly
    has in the room stays hers, where she put it. */
export function withPlacements(layout: SeasonLayout, list: Placement[]): SeasonLayout {
  if (!list.length) return layout;
  const stage = layout.stage.w > 1 ? layout.stage : { w: list[0].stage_w, h: list[0].stage_h };
  const props = { ...layout.props };
  for (const p of list) {
    if (layout.props[p.prop]?.shown) continue;
    const kx = stage.w / p.stage_w;
    const ky = stage.h / p.stage_h;
    props[p.prop] = { shown: true, x: p.x * kx, y: p.y * ky, s: p.s, z: p.z };
  }
  return { ...layout, stage, props };
}

/* ---- who may change what, in the room you're in ------------------------- */

interface RoomNow {
  place: Place;
  season: Season;
  device: Device;
  /** what Molly's own layout has in the room */
  mine: Set<string>;
  /** Molly, signed in */
  owner: boolean;
  signedIn: boolean;
}
let room: RoomNow | null = null;

/** StickerToggle.tsx keeps this up to date as you walk about and sign in */
export const setRoomNow = (next: RoomNow) => {
  room = next;
};

/** whether this sticker may not be changed by whoever's looking */
export function isLocked(id: string) {
  if (!room) return false;
  if (room.owner) return false;
  if (!room.signedIn) return true;
  return room.mine.has(id);
}

/** who put a sticker in the room you're in: Molly, someone else, or nobody yet */
export function addedBy(id: string): string | null {
  if (!room) return null;
  if (room.mine.has(id)) return OWNER_NAME;
  const p = placementsFor(room.place, room.season, room.device).find((q) => q.prop === id);
  return p ? p.added_by_name || "someone" : null;
}

/* ---- keeping what's changed --------------------------------------------- */

const near = (a: number, b: number, by: number) => Math.abs(a - b) <= by;

/**
 * Keep what's changed in the room: compares the room as it stands (capture)
 * with what's been put in, and writes the difference. Anything Molly's is
 * left to her own Done. Something Molly puts in herself is hers too, kept by
 * her Done, so only what was already someone else's is kept here for her.
 */
let queue: Promise<void> = Promise.resolve();
export function keepChanges(now: SeasonLayout) {
  // one at a time, so a quick put-in-then-move doesn't put it in twice
  queue = queue.then(() => keep(now)).catch(() => {});
  return queue;
}

async function keep(now: SeasonLayout) {
  const at = room;
  if (!at || !at.signedIn || !dbConfigured) return;
  const sb = await db();
  const { data: session } = await sb.auth.getSession();
  const me = session.session?.user;
  if (!me) return;
  const meta = me.user_metadata ?? {};
  const name = String(meta.full_name ?? meta.name ?? me.email?.split("@")[0] ?? "someone").slice(0, 80);

  const here = new Map(placementsFor(at.place, at.season, at.device).map((p) => [p.prop, p]));
  const writes: Promise<unknown>[] = [];

  for (const [prop, m] of Object.entries(now.props)) {
    if (at.mine.has(prop)) continue;
    const was = here.get(prop);
    if (!m.shown) {
      if (!was) continue;
      writes.push(Promise.resolve(sb.from(TABLE).delete().eq("id", was.id)));
      byPlace.set(at.place, (byPlace.get(at.place) ?? []).filter((p) => p.id !== was.id));
      continue;
    }
    const spot = { x: m.x, y: m.y, s: m.s ?? 1, z: m.z ?? 0, stage_w: now.stage.w, stage_h: now.stage.h };
    if (was) {
      const kx = now.stage.w / was.stage_w;
      const ky = now.stage.h / was.stage_h;
      if (near(was.x * kx, m.x, 1) && near(was.y * ky, m.y, 1) && near(was.s, spot.s, 0.01) && was.z === spot.z) continue;
      writes.push(Promise.resolve(sb.from(TABLE).update(spot).eq("id", was.id)));
      Object.assign(was, spot);
    } else if (!at.owner) {
      const row = { place: at.place, season: at.season, device: at.device, prop, ...spot, added_by: me.id, added_by_name: name };
      writes.push(
        Promise.resolve(
          sb
            .from(TABLE)
            .insert(row)
            .select(COLUMNS)
            .single()
            .then(({ data }) => {
              if (data) byPlace.set(at.place, [...(byPlace.get(at.place) ?? []), data as Placement]);
            }),
        ),
      );
    }
  }
  await Promise.all(writes);
}

/** what Molly's Done keeps as her own: the room as it stands, less what other
    people have put in, which stays theirs (taken out of her layout, so it
    comes back laid over it) */
export function withoutOthers(now: SeasonLayout): SeasonLayout {
  const at = room;
  if (!at) return now;
  const theirs = new Set(placementsFor(at.place, at.season, at.device).map((p) => p.prop));
  if (!theirs.size) return now;
  const props = { ...now.props };
  theirs.forEach((id) => {
    if (props[id] && !at.mine.has(id)) props[id] = { ...props[id], shown: false };
  });
  return { ...now, props };
}
