import { db, dbConfigured } from "./layoutsDb";

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
    // an older function doesn't say which it is; the address still tells us
    .map((p) => ({ ...p, kind: p.kind ?? (FILM.test(p.url) ? "film" : "picture") }));
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
