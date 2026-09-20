import { db, dbConfigured } from "./layoutsDb";

/**
 * The letters in the library's desk drawer.
 *
 * Nobody signs in for these. A reader types the word, and it goes with every
 * request: the database checks it against a hash and refuses everything
 * without it (supabase/migrations/…_palais_letters.sql). Writing asks for a
 * name, which is kept at the bottom of the letter, and lets that name tidy up
 * its own letters afterwards.
 */

export interface Letter {
  id: number;
  at: string;
  edited: string | null;
  author: string;
  title: string;
  body: string;
  seal: string | null;
  pinned: boolean;
}

export const lettersConfigured = dbConfigured;

/** is there a word to know yet? (false before Molly has set one) */
export async function lettersReady(): Promise<boolean> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_letters_key_set");
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function lettersOpen(key: string): Promise<boolean> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_letters_open", { p_key: key });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function readLetters(key: string): Promise<Letter[]> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_letters", { p_key: key });
  if (error) throw new Error(error.message);
  return (data ?? []) as Letter[];
}

export async function postLetter(key: string, author: string, title: string, body: string, seal: string | null) {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_letter_post", {
    p_key: key,
    p_author: author,
    p_title: title,
    p_body: body,
    p_seal: seal,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export async function editLetter(key: string, id: number, author: string, title: string, body: string) {
  const sb = await db();
  const { error } = await sb.rpc("palais_letter_edit", {
    p_key: key,
    p_id: id,
    p_author: author,
    p_title: title,
    p_body: body,
  });
  if (error) throw new Error(error.message);
}

/* the word and the name are remembered in this browser only, so a reader
   doesn't have to type them every time they open the drawer */
const KEY = "palais-letters-key";
const NAME = "palais-letters-name";

export const remembered = (what: "key" | "name") => {
  try {
    return localStorage.getItem(what === "key" ? KEY : NAME) ?? "";
  } catch {
    return "";
  }
};

export const remember = (what: "key" | "name", value: string | null) => {
  try {
    if (value) localStorage.setItem(what === "key" ? KEY : NAME, value);
    else localStorage.removeItem(what === "key" ? KEY : NAME);
  } catch {
    /* a private window: they'll type it again next time */
  }
};
