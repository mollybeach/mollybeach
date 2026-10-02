import { db, dbConfigured } from "./layoutsDb";
import { visitSession } from "./visits";

/**
 * The portraits in the Boudoir dresser.
 *
 * The pictures aren't in the site: they're in a private Supabase bucket that
 * can't be read by address. The edge function palais-portraits checks the
 * letters word and signs a link for each one, good for ten minutes, so a link
 * that escapes the room goes dead on its own. Films hang there too, and play
 * in the frame like a picture.
 *
 * Anyone who knows the word can also put one in: the function signs a one-shot
 * upload link for that one file and the file goes straight from the browser to
 * the bucket, so a long film is never carried through the function.
 *
 * Until Molly has made the bucket and deployed the function, this comes back
 * empty and the dresser says so (BoudoirPictures.tsx).
 */

export type PortraitKind = "picture" | "film";

export interface Portrait {
  url: string;
  title: string;
  note?: string;
  kind: PortraitKind;
  /** its name in the bucket: what a note hangs off. The signed link changes
      every ten minutes, so it could never be the thing that names a picture. */
  path: string;
}

/** what someone said about one of them. Nobody types a name: the note is
    signed with whoever the visitor book says was reading (visits.ts), and with
    their name instead once Molly has given them one. */
export interface PortraitNote {
  id: number;
  at: string;
  path: string;
  visitor: string | null;
  author: string;
  /** true once that visitor has been given a name */
  named: boolean;
  /** left from this browser, so it can be taken back */
  mine: boolean;
  body: string;
}

export const portraitsConfigured = dbConfigured;

/** the bucket the pictures and films are kept in */
const DRAWER = "portraits";

const FILM = /\.(mp4|webm|mov|m4v)(\?|$)/i;

export async function readPortraits(key: string): Promise<Portrait[]> {
  const sb = await db();
  const { data, error } = await sb.functions.invoke("palais-portraits", { body: { key } });
  if (error) throw new Error(error.message);
  return ((data as { pictures?: Portrait[] } | null)?.pictures ?? [])
    .filter((p) => p?.url)
    // an older function doesn't say which it is, or which file it is; the
    // address still tells us both
    .map((p) => ({
      ...p,
      kind: p.kind ?? (FILM.test(p.url) ? "film" : "picture"),
      path: p.path ?? fileOf(p.url),
    }));
}

/** the file's name out of a signed link, for a function deployed before it
    started saying which file each picture is */
const fileOf = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() || url);
  } catch {
    return url;
  }
};

/* ------------------------------------------------ what people say about them */

/**
 * The notes left on the portraits. As private as the pictures: reading them
 * asks the database for the same word, and there is no way to read them
 * without it. One call brings back the whole drawer's worth, so the dresser
 * can show a count against each picture without asking again.
 */
export async function readNotes(key: string, path?: string): Promise<PortraitNote[]> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_portrait_notes", {
    p_key: key,
    p_path: path ?? null,
    p_session: visitSession(),
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as PortraitNote[];
}

export async function postNote(key: string, path: string, body: string): Promise<number> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_portrait_note_post", {
    p_key: key,
    p_path: path,
    p_body: body,
    p_session: visitSession(),
  });
  if (error) throw new Error(said(error));
  return data as number;
}

/** whoever left it, from the same browser, may take it back */
export async function dropNote(key: string, id: number): Promise<void> {
  const sb = await db();
  const { error } = await sb.rpc("palais_portrait_note_drop", {
    p_key: key,
    p_id: id,
    p_session: visitSession(),
  });
  if (error) throw new Error(said(error));
}

/** the sentence the database raised, without its plumbing in front */
const said = (e: { message?: string }) => {
  const raw = e.message ?? "";
  // a database that hasn't had the notes migration pasted into it yet
  if (/Could not find the function|does not exist/i.test(raw)) {
    return "The dresser doesn't keep notes yet — run the portrait-notes migration.";
  }
  return (raw || "That wouldn't go in.").replace(/^.*?:\s*/, "").replace(/^./, (c) => c.toUpperCase());
};

/* ------------------------------------------ the face of each film -------- */

/** a film's first frame, kept so the frame has something to show at once */
export interface Poster {
  poster: string;
  w: number | null;
  h: number | null;
}

/**
 * Every film's first frame, in one call with the drawer.
 *
 * A picture starts painting as it arrives; a film shows nothing until enough
 * of it is down to decode a frame, which on a slow line is a long black wait.
 * The stills are small enough to come back inline, so the frame can wear one
 * before the film has even been asked for.
 */
export async function readPosters(key: string): Promise<Record<string, Poster>> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_portrait_posters", { p_key: key });
  // a database that hasn't had the posters migration pasted into it yet just
  // has no faces for its films, which is how it was before
  if (error) return {};
  return (data ?? {}) as Record<string, Poster>;
}

/** give a film its face, the first time anybody watches it */
export async function keepPoster(key: string, path: string, poster: string, w: number, h: number): Promise<void> {
  const sb = await db();
  await sb.rpc("palais_portrait_poster_put", { p_key: key, p_path: path, p_poster: poster, p_w: w, p_h: h });
}

/** how wide a still is kept: enough for the frame, small enough to go inline */
const STILL = 480;

/**
 * Draw a film's first frame.
 *
 * On its own reel, not the one in the frame: reading pixels back out of a
 * video needs it fetched with CORS, and asking that of the film somebody is
 * actually watching would stop it playing altogether if the bucket ever said
 * no. A moment in rather than the very first frame, which is often black.
 */
export function grabFirstFrame(url: string): Promise<{ poster: string; w: number; h: number } | null> {
  return new Promise((done) => {
    let settled = false;
    const reel = document.createElement("video");
    const give = (v: { poster: string; w: number; h: number } | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reel.removeAttribute("src");
      reel.load();
      done(v);
    };
    const timer = setTimeout(() => give(null), 20000);
    const draw = () => {
      try {
        const w = reel.videoWidth;
        const h = reel.videoHeight;
        if (!w || !h) return give(null);
        const scale = Math.min(1, STILL / Math.max(w, h));
        const card = document.createElement("canvas");
        card.width = Math.max(1, Math.round(w * scale));
        card.height = Math.max(1, Math.round(h * scale));
        const ink = card.getContext("2d");
        if (!ink) return give(null);
        ink.drawImage(reel, 0, 0, card.width, card.height);
        // a bucket that sent no CORS headers taints the canvas and this throws
        give({ poster: card.toDataURL("image/webp", 0.72), w: card.width, h: card.height });
      } catch {
        give(null);
      }
    };
    reel.crossOrigin = "anonymous";
    reel.muted = true;
    reel.playsInline = true;
    reel.preload = "auto";
    reel.onloadeddata = () => {
      try {
        reel.currentTime = Math.min(0.25, (reel.duration || 1) / 10);
      } catch {
        draw();
      }
    };
    reel.onseeked = draw;
    reel.onerror = () => give(null);
    reel.src = url;
  });
}

/* ------------------------------------------- what shape each one is ------ */

/**
 * The shape of each picture, remembered in this browser.
 *
 * The dresser can't hang a picture until it knows how tall it is, and asking
 * the picture itself means waiting for the whole of it to come down the wire —
 * on aeroplane wifi, a minute of rabbits before anything is seen. So the shape
 * is written down the first time and the frame is built from memory after
 * that, with the picture painting into it as it arrives.
 *
 * The names of the pictures are private, so what is written down is a number
 * taken from the name rather than the name itself: enough to know one again,
 * nothing anybody could read.
 */
const SHAPES = "palais-portrait-shapes-v1";

const tag = (path: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < path.length; i += 1) {
    h ^= path.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
};

const readShapes = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(SHAPES) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
};

export const knownShape = (path: string): number | undefined => readShapes()[tag(path)];

export function rememberShape(path: string, ratio: number): void {
  if (!path || !ratio || !Number.isFinite(ratio)) return;
  try {
    const all = readShapes();
    all[tag(path)] = Math.round(ratio * 1000) / 1000;
    localStorage.setItem(SHAPES, JSON.stringify(all));
  } catch {
    /* no storage: the dresser measures again next time */
  }
}

/** what the dresser will take, for the file picker and for saying no kindly */
export const PORTRAIT_TYPES = "image/*,video/*";
export const PORTRAIT_NAME = /\.(jpe?g|png|webp|gif|avif|mp4|webm|mov|m4v)$/i;

/**
 * Put one in. The word is checked by the function, which signs a link for this
 * one file and nothing else; the file itself never passes through it.
 */
export async function addPortrait(key: string, file: File): Promise<void> {
  if (!PORTRAIT_NAME.test(file.name)) {
    throw new Error("The dresser takes pictures and films — jpg, png, webp, gif, mp4, webm or mov.");
  }
  const sb = await db();
  const { data, error } = await sb.functions.invoke("palais-portraits", {
    body: { key, add: { name: file.name, type: file.type, size: file.size } },
  });
  if (error) {
    // the function says why in the body; supabase-js only hands back the shape
    const said = await readTrouble(error);
    throw new Error(said || "The dresser wouldn't take it.");
  }
  const slip = data as { path?: string; token?: string; pictures?: unknown } | null;
  if (!slip?.path || !slip.token) {
    // the function that answered is the one from before it could take them
    throw new Error(
      slip && "pictures" in slip
        ? "The dresser can't take new ones yet — deploy palais-portraits."
        : "The dresser wouldn't take it.",
    );
  }

  const { error: sending } = await sb.storage
    .from(DRAWER)
    .uploadToSignedUrl(slip.path, slip.token, file, {
      contentType: file.type || undefined,
    });
  if (sending) throw new Error(sending.message || "It didn't get there. Try again?");

  /* and a buzz on Discord, if Molly has pointed it at one
     (20260921130000_palais_portrait_ping.sql). It is only worth sending once
     the file is really in the bucket, which is why it happens here and not in
     the function that signed the link. If it doesn't go, the picture is in
     all the same — a missed buzz is no reason to say the upload failed. */
  try {
    await sb.rpc("palais_portrait_ping", {
      p_key: key,
      p_name: file.name,
      p_kind: FILM.test(file.name) ? "film" : "picture",
    });
  } catch {
    /* it went in; nobody was told */
  }
}

/** the sentence the function sent back, out of whatever supabase-js threw */
async function readTrouble(error: unknown): Promise<string> {
  const res = (error as { context?: Response })?.context;
  try {
    const said = await res?.clone().json();
    if (typeof said?.error === "string") return said.error.replace(/^./, (c: string) => c.toUpperCase()) + ".";
  } catch {
    /* it wasn't json; the plain message will do */
  }
  return (error as { message?: string })?.message ?? "";
}
