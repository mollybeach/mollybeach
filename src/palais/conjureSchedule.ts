import type { Styled } from "./styled";

/**
 * The furniture takes turns vanishing.
 *
 * Every big piece is a "set": the piece itself plus everything standing on it
 * (the tea on the bed, the flacons on the coiffeuse, Blueberry on the settee),
 * so a set leaves and returns as one thing and nothing is ever left floating.
 *
 * The sets share one long cycle and each is given its own ten-second window in
 * it, so exactly one piece is away at any moment and the room never empties.
 * The order walks back and forth across the room rather than sweeping one way.
 */

/** seconds for every set to have had its turn */
export const CONJURE_CYCLE = 70;

/** the order the pieces go in — alternating sides of the room */
export const SETS = ["bed", "vanity", "dresser", "chair", "settee", "cabinet", "armchair"] as const;
export type SetName = (typeof SETS)[number];

/** seconds of stillness on page load before the first piece goes */
const FIRST = 4;

export function conjureVars(set: SetName): Styled {
  const slot = CONJURE_CYCLE / SETS.length;
  return {
    "--conjure-dur": `${CONJURE_CYCLE}s`,
    "--conjure-delay": `${FIRST + SETS.indexOf(set) * slot}s`,
  };
}
