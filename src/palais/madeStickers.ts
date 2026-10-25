import { useEffect, useState } from "react";
import type { PropSpec } from "./props";
import { db, dbConfigured } from "./layoutsDb";

/**
 * The stickers made at Brat Academy's sticker maker (StickerMaker.tsx), and
 * the shelves made for them.
 *
 * They live in Supabase (palais_stickers, palais_sticker_shelves, and the
 * public "stickers" bucket), not in the code, so they're fetched once when
 * the Palais opens and kept here. Everything that reads the catalogue asks
 * here too: propSpec and propSrc (props.ts) for their captions and pictures,
 * stock (shelves.ts) for their shelves, hiddenFor (roomLayouts.ts) so they
 * start out of every room until someone puts them in, and the rooms
 * themselves (PalaisHome.tsx, PortraitTerrace.tsx), which set them out.
 *
 * Making and filing go through the palais-stickers function, which holds the
 * keys for Claude and OpenAI and checks the maker is a member.
 */

export interface MadeSticker {
  id: string;
  label: string;
  plane: NonNullable<PropSpec["plane"]>;
  metres: number | null;
  glass: boolean;
  lit: boolean;
  shelf: string;
  src: string;
  made_by_name: string | null;
  created_at: string;
}

export interface MadeShelf {
  key: string;
  name: string;
  emoji: string;
}

let stickers: MadeSticker[] = [];
let shelves: MadeShelf[] = [];
const byId = new Map<string, MadeSticker>();
let version = 0;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function changed() {
  byId.clear();
  stickers.forEach((s) => byId.set(s.id, s));
  version++;
  listeners.forEach((l) => l());
}

/** fetch the made stickers and shelves, once */
function load() {
  if (loading || !dbConfigured) return;
  loading = (async () => {
    try {
      const sb = await db();
      const [s, sh] = await Promise.all([
        sb.from("palais_stickers").select("id, label, plane, metres, glass, lit, shelf, src, made_by_name, created_at").order("created_at"),
        sb.from("palais_sticker_shelves").select("key, name, emoji").order("created_at"),
      ]);
      stickers = (s.data as MadeSticker[] | null) ?? [];
      shelves = (sh.data as MadeShelf[] | null) ?? [];
      changed();
    } catch {
      /* the tables aren't there yet: no made stickers */
    }
  })();
}

/** the made stickers and shelves, re-rendering when they change */
export function useMadeStickers() {
  const [, setV] = useState(version);
  useEffect(() => {
    load();
    const on = () => setV(version);
    listeners.add(on);
    return () => {
      listeners.delete(on);
    };
  }, []);
  return { stickers, shelves, version };
}

export const madeIds = () => stickers.map((s) => s.id);
export const madeShelves = () => shelves;
export const madeOn = (shelf: string) => stickers.filter((s) => s.shelf === shelf).map((s) => s.id);
export const isMade = (id: string) => byId.has(id);

export function madeSpec(id: string): PropSpec | undefined {
  const s = byId.get(id);
  if (!s) return undefined;
  return { label: s.label, plane: s.plane, metres: s.metres ?? undefined, glass: s.glass || undefined, lit: s.lit || undefined };
}
export const madeSrc = (id: string) => byId.get(id)?.src;

/* ---- the machine --------------------------------------------------------- */

/** what Claude made of the photo, to be looked over before it's filed */
export interface Draft {
  id: string;
  label: string;
  plane: MadeSticker["plane"];
  metres: number | null;
  glass: boolean;
  lit: boolean;
  /** the shelf Claude thought it belongs on, if it's one of those offered */
  shelf: string | null;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const sb = await db();
  const { data, error } = await sb.functions.invoke("palais-stickers", { body });
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

/** send a photo to be made: Claude's reading of it and the drawn cutout, or why not */
export function makeSticker(image: string, type: string, offered: { key: string; name: string }[]) {
  return call<{ ok: true; png: string; sticker: Draft } | { ok: false; why: string }>({ make: { image, type, shelves: offered } });
}

/** file the finished sticker on a shelf (one there, or a new one), and put it in the catalogue */
export async function fileSticker(image: string, type: string, sticker: Draft, shelf: { key: string } | { name: string; emoji: string }) {
  const got = await call<{ sticker: MadeSticker; shelf: MadeShelf | null }>({ file: { image, type, sticker, shelf } });
  stickers = [...stickers, got.sticker];
  if (got.shelf) shelves = [...shelves, got.shelf];
  changed();
  return got;
}
