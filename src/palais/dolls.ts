import { db } from "./layoutsDb";

/**
 * The Dolly Maker's calls to the palais-dolls function (DollyMaker.tsx): make a
 * character from photos and words, or edit an approved one. What comes back is
 * the character's plan (Doll) and the painted PNG, which is cut out and filed
 * in the browser like any made sticker (stickerCut.ts, madeStickers.ts).
 */

export const DOLL_ROLES = ["person", "outfit", "hair", "makeup", "shoes", "accessories", "fantasy", "style"] as const;
export type DollRole = (typeof DOLL_ROLES)[number];

export interface Doll {
  name: string;
  label: string;
  id: string;
  refs: { n: number; role: DollRole; use: string; ignore: string }[];
  identity: string;
  hasPerson: boolean;
  beauty: string;
  body: string;
  hair: string;
  makeup: string;
  outfit: string;
  shoes: string;
  accessories: string[];
  fantasy: string[];
  pose: string;
  style: string;
  keepExactly: string[];
  conflicts: string[];
  ambiguities: string[];
}

export type DollRef = { image: string; type: string; role?: DollRole };
type Got = { ok: true; doll: Doll; png: string } | { ok: false; why: string };

async function call(body: Record<string, unknown>): Promise<Got> {
  const sb = await db();
  const { data, error } = await sb.functions.invoke("palais-dolls", { body });
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
  return data as Got;
}

/** a character from the photos (each with the role it was given, if any) and the words */
export const makeDoll = (refs: DollRef[], description: string, name: string, keep: string) => call({ make: { refs, description, name, keep } });

/** change only what's asked of the approved character, with any more photos for the change */
export const editDoll = (image: string, doll: Doll, refs: DollRef[], instruction: string, locks: string[], extra: { image: string; type: string }[] = []) =>
  call({ edit: { image, doll, refs, instruction, locks, extra } });
