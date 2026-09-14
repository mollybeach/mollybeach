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
  "bottle_candle_holder_dripping_wax_cobalt_blue_sticker",
  "bottle_vase_lowell_embossed_pothos_cutting_green_glass_antique_sticker",
  "bottle_candle_holder_embossed_dripping_wax_red_pink_sticker",
  "bottle_vase_pothos_cutting_embossed_green_glass_sticker",
  "bottle_perfume_crystal_stopper_enamel_floral_purple_vintage_sticker",
  "brush_makeup_rose_enamel_leaves_gold_sticker",
  "planter_hanging_macrame_woven_basket_string_of_pearls_sticker",
  "box_trinket_round_portrait_cream_gold_vintage_sticker",
  "lamp_aladdin_genie_pink_enamel_gold_jeweled_sticker",
  "candle_cherub_angel_seated_pastel_blue_sticker",
  "box_incense_burner_wood_lattice_moon_stars_brass_sticker",
  "bottle_dropper_apothecary_glass_emerald_green_sticker",
  "jar_trinket_cut_glass_lidded_blush_pink_sticker",
  "box_trinket_jasperware_cameo_powder_blue_sticker",
  "plant_snake_sansevieria_white_pot_sticker",
  "candle_cherub_angel_seated_mint_green_sticker",
  "bottle_glass_embossed_medallion_dusty_rose_pink_sticker",
  "candlestick_ornate_drip_candle_mint_green_sticker",
  "planter_pot_embossed_floral_medallion_off_white_sticker",
  "planter_pot_hand_painted_purple_flowers_saucer_sticker",
  "candlestick_glass_bubble_stem_green_taper_ivory_sticker",
  "cup_vanity_pressed_glass_amber_perfume_tubes_sticker",
  "tray_trinket_porcelain_gilt_medallion_cobalt_blue_sticker",
  "box_incense_burner_wood_lattice_moon_stars_upright_sticker",
];

/** everything that starts out of the rooms and is set out along the terrace's front */
export const LOOSE: PropId[] = [...DECOR, ...MORE_TRINKETS];

export const DECOR_SET = new Set<string>(LOOSE);
