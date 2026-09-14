import type { PropId } from "./props";

/**
 * Room decor and trinkets from Molly's Temu orders: candles, misters, towels,
 * perfumes and the like, cut out of the shop's product photos. They're in the
 * catalogue on their own shelf, and start out of every room, the palace
 * included, until they're put in.
 */
export const DECOR: PropId[] = [
  "decor-angel-candle",
  "decor-soy-candle",
  "decor-plant-mister-blue",
  "decor-plant-mister-mint",
  "decor-plant-mister-pink",
  "decor-angel-candle-lilac",
  "decor-carved-bell",
  "decor-fruit-towels",
  "decor-strawberry-towel",
  "decor-heart-towels",
  "decor-taper-candles",
  "decor-crystal-roses",
  "decor-cupid-candle-blue",
  "decor-cupid-candle-pink",
  "decor-pocket-watch",
  "decor-moon-kiss-art",
  "decor-glass-mister",
  "decor-crystal-prism",
  "decor-tissue-box-blue",
  "decor-botanical-postcards",
  "decor-flower-perfume",
  "decor-strawberry-glass",
  "decor-strawberry-molds",
  "decor-cherry-umbrella",
  "decor-strawberry-soaps",
  "decor-perfume-amber",
  "decor-perfume-bow",
  "decor-perfume-dreamland",
  "decor-heart-gift-box",
  "decor-perfume-pink",
];

export const DECOR_SET = new Set<string>(DECOR);
