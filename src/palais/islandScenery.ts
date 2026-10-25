/**
 * The scenery for the island maker's island (IslandMaker.tsx): the stickers
 * cut from the Dreamy Mediterranean asset sheet (and the boat-and-rocks and
 * the statues-and-fountain ones), kept in
 * public/palais_assets/modal_content/island_maker/landscape_building_assets/,
 * one WebP each, named for what they are.
 *
 * Each has a shelf, how wide it's drawn (as a fraction of the island painting,
 * at the middle of it: things further back are drawn smaller), and whether
 * it's sky, which floats behind everything and doesn't shrink with distance,
 * or stands on the ground by its feet.
 */

export const SCENERY_DIR = `${process.env.PUBLIC_URL}/palais_assets/modal_content/island_maker/landscape_building_assets`;
export const scenerySrc = (id: string) => `${SCENERY_DIR}/${id}.webp`;

export interface Scenery {
  id: string;
  name: string;
  shelf: SceneryShelf;
  w: number;
  sky?: true;
}

export const SCENERY_SHELVES = ["Sky", "Trees & palms", "Flowers", "Water & rocks", "Bridges & paths", "Buildings"] as const;
export type SceneryShelf = (typeof SCENERY_SHELVES)[number];

const s = (id: string, name: string, shelf: SceneryShelf, w: number, sky?: true): Scenery => ({ id, name, shelf, w, ...(sky ? { sky } : {}) });

export const SCENERY: Scenery[] = [
  s("sky_mountains_long", "Mountain range", "Sky", 0.5, true),
  s("sky_mountain_peak", "Snowy peak", "Sky", 0.32, true),
  s("sky_sun_setting", "Setting sun", "Sky", 0.15, true),
  s("sky_cloud_long", "Long cloud", "Sky", 0.28, true),
  s("sky_cloud_double", "Two clouds", "Sky", 0.3, true),
  s("sky_cloud_puff", "Puffy cloud", "Sky", 0.19, true),

  s("tree_jacaranda", "Jacaranda", "Trees & palms", 0.12),
  s("tree_cherry_blossom", "Cherry blossom", "Trees & palms", 0.085),
  s("tree_umbrella_pine", "Umbrella pine", "Trees & palms", 0.1),
  s("tree_cypress", "Cypress", "Trees & palms", 0.03),
  s("tree_cypress_cluster", "Cypress grove", "Trees & palms", 0.09),
  s("palm_tall", "Tall palm", "Trees & palms", 0.065),
  s("palm_trio", "Three palms", "Trees & palms", 0.09),
  s("palm_pair_small", "Little palms", "Trees & palms", 0.05),
  s("palm_single", "Palm", "Trees & palms", 0.05),
  s("palm_with_cypress", "Palm & cypresses", "Trees & palms", 0.05),
  s("palm_coconut", "Coconut palm", "Trees & palms", 0.07),
  s("tree_cypress_flowered", "Cypress in flowers", "Trees & palms", 0.045),
  s("cactus_garden_tall", "Cactus garden", "Trees & palms", 0.1),
  s("cactus_agave_cluster", "Cactus & agave", "Trees & palms", 0.07),
  s("cactus_prickly_pear", "Prickly pear", "Trees & palms", 0.07),

  s("bush_bougainvillea_low", "Bougainvillea", "Flowers", 0.045),
  s("bush_bougainvillea_mound", "Bougainvillea mound", "Flowers", 0.07),
  s("bush_bougainvillea_arch", "Bougainvillea spray", "Flowers", 0.055),
  s("bush_hydrangea", "Hydrangeas", "Flowers", 0.07),
  s("bush_flowers_mixed", "Flower bed", "Flowers", 0.09),
  s("garland_wisteria_curtain", "Wisteria curtain", "Flowers", 0.1),
  s("garland_wisteria_long", "Wisteria garland", "Flowers", 0.12),
  s("garland_wisteria_mound", "Wisteria mound", "Flowers", 0.11),
  s("bush_bougainvillea_tree", "Bougainvillea tree", "Flowers", 0.08),
  s("bush_hibiscus", "Hibiscus", "Flowers", 0.08),
  s("bush_pink_blooms_rocks", "Pink blooms", "Flowers", 0.085),
  s("bush_white_blooms_rocks", "White blooms", "Flowers", 0.085),
  s("bush_pink_low_rocks", "Little pink bed", "Flowers", 0.07),
  s("bush_hydrangea_blue", "Blue hydrangeas", "Flowers", 0.075),
  s("bush_agave_rocks", "Agave", "Flowers", 0.065),

  s("waterfall_rocks_twin", "Twin falls", "Water & rocks", 0.2),
  s("waterfall_lagoon", "Waterfall lagoon", "Water & rocks", 0.16),
  s("waterfall_small_pool", "Little falls", "Water & rocks", 0.11),
  s("rocks_falls_a", "Falls in the rocks", "Water & rocks", 0.1),
  s("rocks_falls_b", "Rock pool falls", "Water & rocks", 0.1),
  s("beach_cove_lagoon", "Sandy cove", "Water & rocks", 0.17),
  s("lagoon_palm_islet", "Palm islet", "Water & rocks", 0.11),
  s("rocks_pair", "Two rocks", "Water & rocks", 0.05),
  s("rocks_cluster", "Rocks", "Water & rocks", 0.07),
  s("rock_spire", "Rock spire", "Water & rocks", 0.05),
  s("rock_spire_tall", "Tall rock spire", "Water & rocks", 0.045),
  s("grotto_glowing_waterfall", "Glowing grotto", "Water & rocks", 0.22),
  s("cliffs_waterfall_terrace", "Waterfall cliffs", "Water & rocks", 0.3),
  s("boat_sailboat_red", "Sailboat", "Water & rocks", 0.06),

  s("bridge_stone_flowered", "Flowered bridge", "Bridges & paths", 0.14),
  s("bridge_stone_lanterns", "Lantern bridge", "Bridges & paths", 0.15),
  s("bridge_red_lacquer", "Red bridge", "Bridges & paths", 0.12),
  s("dock_wooden_lanterns", "Dock", "Bridges & paths", 0.07),
  s("staircase_grand_flowered", "Grand staircase", "Bridges & paths", 0.18),
  s("balustrade_planters", "Balustrade", "Bridges & paths", 0.1),
  s("balcony_hanging_flowers", "Flowered terrace", "Bridges & paths", 0.12),
  s("stone_lantern_posts", "Lantern posts", "Bridges & paths", 0.04),

  s("gazebo_dark_dome", "Gazebo", "Buildings", 0.13),
  s("glasshouse_dome", "Glasshouse", "Buildings", 0.13),
  s("fountain_garden", "Fountain garden", "Buildings", 0.13),
  s("villa_blue_dome", "Blue-domed villa", "Buildings", 0.08),
  s("palace_blue_domes", "Blue-domed palace", "Buildings", 0.2),
  s("palace_magenta_domes", "Magenta palace", "Buildings", 0.13),
  s("pavilion_waterside_jacaranda", "Waterside pavilion", "Buildings", 0.22),
  s("arcade_flowered", "Flowered arcade", "Buildings", 0.09),
  s("arcade_flowered_columns", "Colonnade", "Buildings", 0.09),
  s("arch_gateway_flowered", "Gateway", "Buildings", 0.1),
  s("arch_small_flowered", "Little arch", "Buildings", 0.045),
  s("arch_pavilion_lantern", "Lantern arch", "Buildings", 0.065),
  s("fountain_courtyard_statues", "Fountain courtyard", "Buildings", 0.24),
  s("tunnel_railway_cactus", "Railway tunnel", "Buildings", 0.25),
  s("statue_maiden_garland", "Statue in a garland", "Buildings", 0.045),
  s("statue_seated_flowers", "Seated statue", "Buildings", 0.045),
  s("statue_cherub_flowers", "Statue with a cherub", "Buildings", 0.045),
  s("statue_maiden_bouquet", "Statue with a bouquet", "Buildings", 0.045),
];

export const sceneryById = new Map(SCENERY.map((x) => [x.id, x]));
