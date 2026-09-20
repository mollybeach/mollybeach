import { db, dbConfigured } from "./layoutsDb";

/**
 * The portraits in the Boudoir dresser.
 *
 * The pictures aren't in the site: they're in a private Supabase bucket that
 * can't be read by address. The edge function palais-portraits checks the
 * letters word and signs a link for each one, good for ten minutes, so a link
 * that escapes the room goes dead on its own.
 *
 * Until Molly has made the bucket and deployed the function, this comes back
 * empty and the dresser shows the pictures bundled in the code instead
 * (BoudoirPictures.tsx).
 */

export interface Portrait {
  url: string;
  title: string;
  note?: string;
}

export const portraitsConfigured = dbConfigured;

export async function readPortraits(key: string): Promise<Portrait[]> {
  const sb = await db();
  const { data, error } = await sb.functions.invoke("palais-portraits", { body: { key } });
  if (error) throw new Error(error.message);
  return ((data as { pictures?: Portrait[] } | null)?.pictures ?? []).filter((p) => p?.url);
}
