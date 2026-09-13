import type { Styled } from "./styled";

/**
 * The room's timing.
 *
 * On arrival you see the terrace alone for INTRO_EMPTY seconds, then every
 * sticker materialises over ARRIVAL seconds. After that the big pieces take
 * turns vanishing.
 *
 * Every big piece is a "set": the piece itself plus everything standing on it
 * (the tea on the bed, the flacons on the coiffeuse, Blueberry on the settee),
 * so a set leaves and returns as one thing and nothing is left floating. The
 * trellises are sets too.
 *
 * A turn lasts about seven seconds and the sets start four seconds apart, so a
 * piece can still be on its way back as the next one leaves — at most two are
 * away at once. The order walks back and forth across the room.
 *
 * NOTE: the percentages in the palais-conjure keyframes (palais.css) are
 * worked out for CONJURE_CYCLE. Change one, recompute the other.
 */

/** seconds of empty terrace before anything appears */
export const INTRO_EMPTY = 4.5;

/** seconds the stickers take to materialise */
export const ARRIVAL = 3;

/** seconds for every set to have had its turn */
export const CONJURE_CYCLE = 36;

/** the order the pieces go in — alternating sides of the room */
export const SETS = [
  "bed",
  "trellisL",
  "vanity",
  "dresser",
  "trellisR",
  "chair",
  "settee",
  "cabinet",
  "armchair",
] as const;
export type SetName = (typeof SETS)[number];

/** the room settles for a few seconds after arriving before the first piece goes */
const FIRST = INTRO_EMPTY + ARRIVAL + 3;

export function conjureVars(set: SetName): Styled {
  const slot = CONJURE_CYCLE / SETS.length;
  return {
    "--conjure-dur": `${CONJURE_CYCLE}s`,
    "--conjure-delay": `${FIRST + SETS.indexOf(set) * slot}s`,
  };
}

export function arrivalVars(): Styled {
  return { "--arrive-delay": `${INTRO_EMPTY}s`, "--arrive-dur": `${ARRIVAL}s` };
}
