import type { PropId } from "./props";
import { DECOR } from "./decor";

/**
 * The catalogue: every sticker in the room, sorted onto shelves.
 *
 * Anything placed in the room but not named on a shelf lands in Trinkets, so
 * a new sticker always shows up somewhere without this list being updated.
 */

export interface Shelf {
  key: string;
  name: string;
  /** a little picture for the tab */
  emoji: string;
  items: PropId[];
}

export const SHELVES: Shelf[] = [
  {
    key: "furniture",
    name: "Furniture",
    emoji: "🛋️",
    items: [
      "bed-iron",
      "dresser",
      "armchair-sage",
      "loveseat",
      "vanity",
      "chair-vanity",
      "cabinet-jewelry",
      "shelf_rack_garden_three_tier_scrollwork_glass_white_sticker",
      "radiator_heater_cast_iron_ribbed_white_vintage_sticker",
      "cabinet_china_peach_pink_jadeite_pink_depression_glass_sticker",
      "dresser_five_drawer_light_oak_scalloped_gold_pulls_sticker",
      "shelf_wall_geometric_diamond_gold_frame_three_tier_white_sticker",
      "stool_strawberry_red_glazed_sticker",
      "sofa_sectional_chaise_blush_pink_pillows_sticker",
      "rug_floral_tufted_grey_multicolour_flowers_sticker",
      "vanity_oak_scalloped_round_mirror_sticker",
      "cabinet_apothecary_cream_many_drawers_novelty_knobs_sticker",
      "bed_french_cream_cherry_print_pink_bedding_sticker",
      "shelf_wall_picture_ledge_oak_vinyl_records_hers_mitski_top_sticker",
      "shelf_wall_picture_ledge_oak_vinyl_records_puberty_be_the_cowboy_bottom_sticker",
      "rug_cat_tufted_peach_flowers_sticker",
      "telescope_refractor_tripod_navy_blue_meade_sticker",
    ],
  },
  { key: "trellises", name: "Trellises", emoji: "🌿", items: ["trellis-wisteria", "trellis-ivy"] },
  {
    key: "plants",
    name: "House plants",
    emoji: "🪴",
    items: [
      "monstera-crystal",
      "dracaena",
      "fiddle-leaf-fig",
      "planter-greek-head",
      "decor-ivy-bottle",
      "bottle_vase_lowell_embossed_pothos_cutting_green_glass_antique_sticker",
      "bottle_vase_pothos_cutting_embossed_green_glass_sticker",
      "planter_hanging_macrame_woven_basket_string_of_pearls_sticker",
      "plant_snake_sansevieria_white_pot_sticker",
      "planter_pot_embossed_floral_medallion_off_white_sticker",
      "planter_pot_hand_painted_purple_flowers_saucer_sticker",
      "shelf_wall_long_trailing_pothos_watering_can_column_fairy_lights_sticker",
      "shelf_wall_long_pothos_teacups_string_of_pearls_fairy_lights_sticker",
      "shelf_corner_ivy_green_bottle_teacup_fairy_lights_sticker",
      "shelf_corner_pothos_basket_red_bottle_fairy_lights_sticker",
    ],
  },
  {
    key: "blossoms",
    name: "Blossoms",
    emoji: "🌸",
    items: ["jacaranda", "hydrangea-bush", "lilac-bush", "rose-bush", "arch-roses"],
  },
  {
    key: "wisteria",
    name: "Wisteria",
    emoji: "💜",
    items: ["wisteria-branch-lavender", "wisteria-branch-purple", "wisteria-vine", "wisteria-garland"],
  },
  {
    key: "cats",
    name: "Cats",
    emoji: "🐱",
    items: [
      "cats-birthday",
      "cat-blueberry-running",
      "cat-blueberry-sitting",
      "cat-blueberry-party",
      "cat-blueberry-monstera",
      "cat-strawberry",
      "cat-strawberry-roses",
      "cat-strawberry-window",
      "kitten-strawberry",
      "cats-roses",
      "cats-toilet",
      "kittens-christmas",
      "cat-honeysuckle",
      "honeysuckle-tricycle",
      "honeysuckle-clock",
      "honeysuckle-sewing",
      "honeysuckle-bow",
      "honeysuckle-bow-alt",
    ],
  },
  {
    key: "artwork",
    name: "Artwork",
    emoji: "🖼️",
    items: [
      "mirror-glass-floral",
      "mirror-glass-blue",
      "mirror-glass-tulip",
      "relief-gold-frame",
      "panel-four-seasons",
      "cherub-gilded",
      "plaque-ivory",
      "plaque-rose-wood",
      "plaque-wood-dark",
      "mirror_wall_arch_ornate_gold_vintage_sticker",
      "mirror_wall_oval_ornate_gold_crest_vintage_sticker",
      "suncatcher_stained_glass_hanging_scalloped_floral_turquoise_sticker",
      "artwork_framed_line_drawing_woman_braids_black_white_sticker",
      "artwork_framed_print_woman_blue_leaves_sticker",
      "artwork_framed_print_red_poppies_pink_sticker",
      "artwork_framed_vogue_cover_art_deco_sticker",
    ],
  },
  {
    key: "lights",
    name: "Hanging lights",
    emoji: "💡",
    items: ["pendant-opal", "pendant-cameo", "pendant-opal-antique", "garland_ivy_vine_fairy_lights_sticker"],
  },
  { key: "people", name: "People", emoji: "👯‍♀️", items: ["fall-table-brea-molly"] },
  { key: "dogs", name: "Dogs", emoji: "🐶", items: ["dog-maggie-frisbee", "dog-charlie-kiddie-pool", "dog-frisbee"] },
  { key: "goats", name: "Goats", emoji: "🐐", items: ["goat-bambi", "goats-pumpkin-ferdinand"] },
  { key: "pillows", name: "Pillows", emoji: "🎀", items: ["pillow-floral", "pillow-lace", "pillow-bolster"] },
  {
    key: "teacups",
    name: "Teacups",
    emoji: "☕",
    items: [
      "teacups-collection",
      "teacup-rose",
      "teacup-sage",
      "teacup-turquoise",
      "teacup-blush",
      "teacup-blue-gilt",
      "teacup-multicolor",
      "teacup-rosebud",
      "teacup-rosebud-mini",
    ],
  },
  {
    key: "ornaments",
    name: "Ornaments",
    emoji: "🎄",
    items: [
      "ornament_reflector_rounded_magenta_sticker",
      "ornament_teardrop_frosted_glitter_orange_sticker",
      "ornament_ball_hand_painted_red_flower_silver_sticker",
      "ornament_grape_cluster_purple_sticker",
      "ornament_ball_pink_ribbon_bow_turquoise_sticker",
      "ornament_pinecone_quilted_pink_sticker",
      "ornament_ball_painted_leaf_red_sticker",
      "ornament_grape_cluster_cobalt_blue_sticker",
      "ornament_reflector_saucer_silver_sticker",
      "ornament_finial_onion_glitter_stripes_green_silver_large_sticker",
      "ornament_ball_reflector_magenta_large_sticker",
      "ornament_pickle_glass_lime_green_sticker",
      "ornament_santa_claus_glass_pink_sticker",
      "ornament_ball_painted_stripes_red_green_silver_sticker",
      "ornament_ball_turquoise_small_sticker",
      "ornament_santa_claus_red_pink_ribbon_sticker",
      "ornament_ball_shiny_purple_sticker",
      "ornament_berry_cluster_red_sticker",
      "ornament_ball_worn_silver_blue_spots_sticker",
      "ornament_finial_onion_glitter_stripes_green_silver_small_sticker",
      "ornament_strawberry_frosted_coral_red_sticker",
      "ornament_ball_reflector_magenta_small_sticker",
      "ornament_strawberry_small_red_sticker",
    ],
  },
  {
    key: "kitchen",
    name: "Kitchen",
    emoji: "☕",
    items: [
      "coffee_maker_drip_smeg_retro_pink_sticker",
      "espresso_machine_smeg_retro_cream_sticker",
      "microwave_insignia_retro_mint_teal_sticker",
      "stove_range_smeg_victoria_lavender_sticker",
    ],
  },
  { key: "decor", name: "Room decor", emoji: "🕯️", items: DECOR },
  /* everything else in the room — the gilded medallion, the jasperware and
     the woman at her lyre land here rather than in Artwork */
  { key: "trinkets", name: "Trinkets", emoji: "💎", items: [] },
];

/** what starts out of the room: the blossoms, the teacups, the pillows and
    the frisbee dog, as Molly left it; everything else starts in it */
export const HIDDEN_AT_FIRST: string[] = [
  ...["blossoms", "teacups", "pillows"].flatMap((key) => SHELVES.find((s) => s.key === key)!.items),
  "dog-frisbee",
];

/** each shelf's items that are actually in this room, trinkets catching the rest */
export function stock(inRoom: string[]): { shelf: Shelf; items: string[] }[] {
  const named = new Set(SHELVES.flatMap((s) => s.items as string[]));
  return SHELVES.map((shelf) => ({
    shelf,
    items:
      shelf.key === "trinkets"
        ? inRoom.filter((id) => !named.has(id))
        : (shelf.items as string[]).filter((id) => inRoom.includes(id)),
  })).filter((s) => s.items.length > 0);
}
