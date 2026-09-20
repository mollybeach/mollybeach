import { createContext } from "react";

/**
 * The things just put into the room from the catalogue.
 *
 * A sticker's place in a room comes from the layout, or, for the loose decor,
 * from a scatter along the front of the terrace — which means something put in
 * can land behind the settee, or off where nobody is looking. Anything in here
 * stands in the middle of the view instead, so it's always found straight
 * away; the number is its turn, so a second and third don't hide the first.
 *
 * It empties when the room or the season changes, and when a thing is taken
 * out again — after that a sticker is wherever it was dragged to.
 */
export const JustPlaced = createContext<Map<string, number>>(new Map());
