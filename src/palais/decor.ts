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
  "can_watering_garden_metal_blush_pink_sticker",
  "mister_plant_spray_bottle_embossed_glass_ombre_turquoise_pink_antique_sticker",
];

/** trinkets and a plant added later: on the Trinkets and House plants shelves,
    not Room decor, but out of every room at first like the decor */
export const MORE_TRINKETS: PropId[] = [
  "decor-pink-gilt-box",
  "decor-jade-buddha",
  "decor-stone-deity-head",
  "decor-gilt-bell",
  "decor-green-glass-insulator",
  "decor-pink-glass-jar",
  "decor-ivy-bottle",
  "bottle_glass_jar_embossed_aqua_vintage_sticker",
  "suncatcher_stained_glass_hanging_scalloped_floral_turquoise_sticker",
  "mirror_wall_arch_ornate_gold_vintage_sticker",
  "radiator_heater_cast_iron_ribbed_white_vintage_sticker",
  "shelf_rack_garden_three_tier_scrollwork_glass_white_sticker",
  "bottle_glass_embossed_decanter_peach_pink_vintage_sticker",
  "flute_glass_champagne_tall_cobalt_blue_sticker",
  "goblet_glass_wine_aqua_turquoise_sticker",
  "bottle_glass_gin_sealed_green_vintage_sticker",
];

/** everything that starts out of the rooms and is set out along the terrace's front */
export const LOOSE: PropId[] = [...DECOR, ...MORE_TRINKETS];

export const DECOR_SET = new Set<string>(LOOSE);
