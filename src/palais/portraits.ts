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
