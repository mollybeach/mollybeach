import { useEffect, useState } from "react";
import { db, dbConfigured } from "./layoutsDb";
import type { Season } from "./seasons";

/**
 * The rooms made at Brat Academy's island maker (IslandMaker.tsx), and the
 * one you're standing in when you're in one (MadeRoom.tsx).
 *
 * They live in Supabase (palais_made_rooms, and the public "rooms" bucket),
 * not in the code, so they're fetched when they're first wanted and kept
 * here: the ready ones, which anyone can walk into at #made/<id>, and the
 * maker's own unfinished ones, so they can come back and finish them.
 *
 * Planning and painting go through the palais-rooms function, which holds the
 * keys for Claude and OpenAI and checks the maker is a member.
 */

export const DEVICES = ["desktop", "mobile"] as const;
export type RoomDevice = (typeof DEVICES)[number];
export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];
/** every picture a ready room has, in the order they're painted */
export const ALL_PICTURES = ["master", "island", ...SEASON_ORDER.flatMap((s) => DEVICES.map((d) => `${s}-${d}`))];
/** the room's seasons, painted from the master before its island is designed */
export const SEASON_PICTURES = SEASON_ORDER.flatMap((s) => DEVICES.map((d) => `${s}-${d}`));

export interface MadeRoom {
  id: string;
  name: string;
  description: string;
  /** the story its maker told of it */
  story?: string;
  spec: { summary?: string; blurb?: string; [k: string]: unknown };
  pictures: Record<string, string>;
  /** what the maker said of its island */
  island_notes?: string;
  /** how many photos it was made from, and how many more its island had
      (only the function says) */
  photo_count?: number;
  island_photo_count?: number;
  status: "planned" | "ready";
  made_by: string | null;
  made_by_name: string | null;
  created_at: string;
}

const COLUMNS = "id, name, description, story, spec, pictures, status, made_by, made_by_name, created_at";

let rooms: MadeRoom[] = [];
let version = 0;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

const changed = () => {
  version++;
  listeners.forEach((l) => l());
};

function put(room: MadeRoom) {
  rooms = [...rooms.filter((r) => r.id !== room.id), room].sort((a, b) => a.created_at.localeCompare(b.created_at));
  changed();
}

/** fetch the rooms: the ready ones, and (signed in) your own */
export function loadRooms(again = false) {
  if (!dbConfigured || (loading && !again)) return loading;
  loading = (async () => {
    try {
      const sb = await db();
      const { data } = await sb.from("palais_made_rooms").select(COLUMNS).order("created_at");
      rooms = (data as MadeRoom[] | null) ?? [];
      changed();
    } catch {
      /* the table isn't there yet: no made rooms */
    }
  })();
  return loading;
}

/** the made rooms, re-rendering when they change */
export function useMadeRooms() {
  const [, setV] = useState(version);
  useEffect(() => {
    loadRooms();
    const on = () => setV(version);
    listeners.add(on);
    return () => {
      listeners.delete(on);
    };
  }, []);
  return rooms;
}

export const readyRooms = () => rooms.filter((r) => r.status === "ready");
export const roomById = (id: string) => rooms.find((r) => r.id === id);

/** the signed-in member's own id, to tell their rooms from everyone else's */
export function useMyId(signedIn: boolean) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    if (!signedIn || !dbConfigured) return setId(null);
    let gone = false;
    db()
      .then((sb) => sb.auth.getSession())
      .then(({ data }) => !gone && setId(data.session?.user.id ?? null))
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, [signedIn]);
  return id;
}

/** walk into a made room */
export function goMade(id: string) {
  window.location.hash = `made/${id}`;
}

/* ---- the machine --------------------------------------------------------- */

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const sb = await db();
  const { data, error } = await sb.functions.invoke("palais-rooms", { body });
  if (error) {
    // the function's own words, when it gave any
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

/** send the photos and words to be planned into a room, or hear why not */
export async function planRoom(name: string, description: string, photos: { image: string; type: string }[], story = "") {
  const got = await call<{ ok: true; room: MadeRoom } | { ok: false; why: string }>({ plan: { name, description, story, photos } });
  if (got.ok) put(got.room);
  return got;
}

/** paint one picture of a room: "master", "island", or "<season>-<desktop|mobile>";
    the island with what's said of it, any more photos for it, and the
    scenery picked to be on it */
export async function paintRoom(id: string, what: string, island?: { notes: string; photos: { image: string; type: string }[]; scenery: string[] }, changes?: string) {
  const got = await call<{ room: MadeRoom }>({ draw: { room: id, what, ...(island ? { island } : {}), ...(changes ? { changes } : {}) } });
  put(got.room);
  return got.room;
}
