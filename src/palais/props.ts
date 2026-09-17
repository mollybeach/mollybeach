/**
 * The furnishings.
 *
 * Every entry is a transparent WebP in /public/props, imported from Molly's
 * sticker set (see import_props.py). `label` is the alt text and the caption
 * shown on hover.
 *
 * `plane` is where the object stands in the room, and it drives the whole
 * look — scale, haze, saturation, and how hard the shadow falls:
 *
 *   haze — beyond the arches, bleached into the daylight
 *   far  — the far end of the gallery, slightly cool and soft
 *   mid  — the middle of the room
 *   near — standing right in front of you, full contrast
 *   fore — cropped by the viewport, oversized, a little out of focus
 */

export type Plane = "haze" | "far" | "mid" | "near" | "fore";

export interface PropSpec {
  label: string;
  plane?: Plane;
  /** lit from inside — candles, lamps */
  lit?: boolean;
  /** catches the window rather than the candles — glass, mirrors */
  glass?: boolean;
  /** an animated image: its first frame is no guide to where it is, so it's
      picked up by its whole box */
  animated?: boolean;
  /** how wide it really is, in metres, so it comes out of the catalogue to scale */
  metres?: number;
}

/** keeps each key's literal type while checking every entry is a PropSpec */
const catalogue = <T extends Record<string, PropSpec>>(t: T) => t;

export const PROPS = catalogue({
  /* ---- the garden, brought indoors ------------------------------------- */
  "wisteria-branch-lavender": { label: "wisteria, come in through the arch", plane: "fore" },
  "wisteria-branch-purple": { label: "a heavier branch of wisteria", plane: "fore" },
  "wisteria-vine": { label: "wisteria, hanging down", plane: "fore" },
  "wisteria-garland": { label: "a garland of wisteria along the cornice", plane: "fore" },
  "trellis-ivy": { label: "an iron trellis, taken by ivy", plane: "mid" },
  "trellis-wisteria": { label: "an iron trellis, taken by wisteria", plane: "mid" },
  "hydrangea-bush": { label: "a hydrangea, growing out of the parquet", plane: "mid" },
  "hydrangea-bouquet": { label: "hydrangeas, cut", plane: "near" },
  "monstera-crystal": { label: "a monstera in a pot of crystals", plane: "near" },
  "planter-greek-head": { label: "a money tree growing out of a Greek head", plane: "near" },

  /* ---- furniture -------------------------------------------------------- */
  vanity: { label: "the coiffeuse, and her trifold mirror", plane: "near" },
  "chair-vanity": { label: "the garden chair that sits at the coiffeuse", plane: "near" },
  loveseat: { label: "the lavender settee", plane: "near" },
  "armchair-sage": { label: "the sage wingback", plane: "near" },
  dresser: { label: "a dresser of very many small drawers", plane: "mid" },
  "cabinet-jewelry": { label: "the jewellery cabinet", plane: "mid" },
  "bed-iron": { label: "an iron bed, in gingham", plane: "mid" },

  /* ---- mirrors & glass -------------------------------------------------- */
  "mirror-glass-floral": { label: "a stained-glass mirror, in flower", glass: true, plane: "mid" },
  "mirror-glass-blue": { label: "a stained-glass mirror, art nouveau", glass: true, plane: "mid" },
  "mirror-glass-tulip": { label: "a stained-glass mirror, tulips", glass: true, plane: "mid" },
  "mirror-trellis": { label: "a mirror behind ivy and wisteria", glass: true, plane: "mid" },
  "mirror-tabletop": { label: "the little oval mirror off the vanity", glass: true, plane: "near" },
  "mirror-hand": { label: "a hand mirror", glass: true, plane: "near" },
  "urn-glass": { label: "a pressed-glass urn, pale green", glass: true, plane: "near" },
  "flask-horseshoe": { label: "a blue glass horseshoe flask", glass: true, plane: "near" },

  /* ---- light ------------------------------------------------------------ */
  "candle-pillar": { label: "a rococo pillar candle, dripping", lit: true, plane: "near" },
  "candle-rose-portrait": { label: "a portrait candle", lit: true, plane: "near" },
  "candles-bottles": { label: "candles in wine bottles", lit: true, plane: "near" },
  "candle-cherub": { label: "a sleeping cherub, in wax", lit: true, plane: "near" },
  "pendant-cameo": { label: "a cameo pendant light", lit: true, plane: "mid" },
  "pendant-opal": { label: "an opal globe pendant, in brass", lit: true, plane: "mid" },
  "pendant-opal-antique": { label: "an antique opal pendant", lit: true, plane: "mid" },
  "lamp-porcelain": { label: "a porcelain lamp, in flower", lit: true, plane: "near" },

  /* ---- scent ------------------------------------------------------------ */
  "perfume-cloud": { label: "a flacon shaped like a cloud", plane: "near" },
  "perfume-daisy": { label: "Daisy Dream", plane: "near" },
  "perfume-flora": { label: "Flora — Gorgeous Gardenia", plane: "near" },
  brushes: { label: "the brushes, in lavender", plane: "near" },
  "tissue-holder": { label: "a rococo tissue holder, which is very silly", plane: "near" },
  "music-box-egg": { label: "a crowned egg that plays a tune", plane: "near" },

  /* ---- tea -------------------------------------------------------------- */
  "teacups-collection": { label: "the whole company of teacups", plane: "near" },
  "teacup-rose": { label: "a rose teacup and saucer", plane: "near" },
  "teacup-sage": { label: "a sage Wedgwood cup", plane: "near" },
  "tea-caddy": { label: "a blue-and-gold tea caddy", plane: "near" },
  "plate-blue-gold": { label: "the Three Graces, cobalt and gilt", plane: "mid" },
  "purse-porcelain": { label: "a porcelain purse", plane: "near" },

  /* ---- on the walls ----------------------------------------------------- */
  "cherub-gilded": { label: "a cherub with gilded wings", plane: "mid" },
  "relief-gold-frame": { label: "bisque lovers in a rococo frame", plane: "mid" },
  "medallion-lady": { label: "a gilded portrait medallion", plane: "mid" },
  "cameo-jasperware": { label: "blue jasperware", plane: "mid" },
  "plaque-lyre": { label: "a woman at her lyre", plane: "mid" },
  "plaque-ivory": { label: "an ivory cameo", plane: "mid" },
  "plaque-rose-wood": { label: "a cameo in rose and wood", plane: "mid" },
  "plaque-wood-dark": { label: "an art-nouveau cameo, burnt into wood", plane: "mid" },

  /* ---- soft furnishings ------------------------------------------------- */
  "pillow-floral": { label: "an embroidered cushion", plane: "near" },
  "pillow-lace": { label: "a lace cushion", plane: "near" },
  "pillow-bolster": { label: "a bolster, in roses", plane: "near" },
  "book-tiffany": { label: "Tiffany blue", plane: "near" },

  /* ---- the cats --------------------------------------------------------- */
  "cat-blueberry-sitting": { label: "Blueberry, sitting", plane: "near" },
  "cat-blueberry-party": { label: "Blueberry, in a party hat", plane: "near" },
  "cat-blueberry-monstera": { label: "Blueberry, asleep in the monstera", plane: "near" },
  "cat-blueberry-running": { label: "Blueberry, running", plane: "near" },
  "cat-strawberry": { label: "Strawberry", plane: "near" },
  "cat-strawberry-window": { label: "Strawberry at the window", plane: "near" },
  "cat-strawberry-roses": { label: "Strawberry, and a jug of roses", plane: "near" },
  "cat-honeysuckle": { label: "Honeysuckle", plane: "near" },

  /* ---- more scent, for the coiffeuse ------------------------------------ */
  "perfume-collection": { label: "the whole tray of flacons", plane: "near" },
  "perfume-butterfly": { label: "a flacon with a butterfly for a stopper", plane: "near" },
  "trinket-box": { label: "a trinket box, with a courting couple on the lid", plane: "near" },

  /* ---- the garden that matches this terrace ----------------------------- */
  jacaranda: { label: "a jacaranda in flower", plane: "mid" },
  "lilac-bush": { label: "a lilac bush", plane: "mid" },
  "rose-bush": { label: "an apricot rose bush", plane: "mid" },
  "arch-roses": { label: "a rose arch", plane: "mid" },

  /* ---- the cats, together ----------------------------------------------- */
  "cats-roses": { label: "Blueberry and Strawberry, with roses", plane: "near" },
  "cats-birthday": { label: "Blueberry and Strawberry, at a birthday", plane: "near" },
  "cats-toilet": { label: "Blueberry and Strawberry, on the floral loo", plane: "near" },
  "kitten-strawberry": { label: "Strawberry, sitting by a window", plane: "near" },
  "kittens-christmas": { label: "Blueberry and Strawberry, at Christmas", plane: "near" },
  "honeysuckle-tricycle": { label: "Honeysuckle on a tricycle", plane: "near" },
  "honeysuckle-bow": { label: "Honeysuckle in a wreath", plane: "near" },
  "honeysuckle-bow-alt": { label: "Honeysuckle in a red bow", plane: "near" },
  "honeysuckle-clock": { label: "Honeysuckle and the mantel clock", plane: "near" },
  "honeysuckle-sewing": { label: "Honeysuckle at the sewing machine", plane: "near" },
  /** animated: cut out of a video of her catching a frisbee */
  "dog-frisbee": { label: "catching the frisbee", plane: "mid", animated: true },
  "fall-table-brea-molly": { label: "Brea and Molly with their cats, at the autumn table", plane: "mid" },
  "goat-bambi": { label: "Bambi, grazing in her red collar", plane: "mid" },
  "goats-pumpkin-ferdinand": { label: "Pumpkin and Ferdinand", plane: "mid" },
  "dog-maggie-frisbee": { label: "Maggie, swimming with her frisbee", plane: "mid" },
  "dog-charlie-kiddie-pool": { label: "Charlie in the kiddie pool, with floaties", plane: "mid" },
  "honeysuckle-sewing-floral": { label: "Honeysuckle, and the floral", plane: "near" },

  /* ---- more tea --------------------------------------------------------- */
  "teacup-turquoise": { label: "a turquoise teacup, in daisies", plane: "near" },
  "teacup-blush": { label: "a blush-pink teacup, gilded", plane: "near" },
  "teacup-blue-gilt": { label: "a gilt teacup with a blue rim", plane: "near" },
  "teacup-multicolor": { label: "a teacup in morning glories", plane: "near" },
  "teacup-rosebud": { label: "a flared rosebud teacup", plane: "near" },
  "teacup-rosebud-mini": { label: "a little mint rosebud cup", plane: "near" },
  "egg-cobalt": { label: "a cobalt egg, crowned", plane: "near" },

  /* ---- houseplants ------------------------------------------------------ */
  dracaena: { label: "a dracaena in a tiled pot", plane: "mid" },
  "fiddle-leaf-fig": { label: "a fiddle-leaf fig in a blush pot", plane: "mid" },

  /* ---- more for the walls ----------------------------------------------- */
  "panel-four-seasons": { label: "Mucha — the four seasons", plane: "mid" },
  "fresco-panel": { label: "a baroque frame, with cherubs", plane: "mid" },

  /* ---- room decor and trinkets, from Molly's Temu orders (decor.ts) ------ */
  "decor-angel-candle": { label: "a little blue angel candle", plane: "near" },
  "decor-soy-candle": { label: "a veiled lady, in peach soy wax", plane: "near" },
  "decor-plant-mister-blue": { label: "a turquoise glass plant mister", glass: true, plane: "near" },
  "decor-plant-mister-mint": { label: "a mint glass plant mister", glass: true, plane: "near" },
  "decor-plant-mister-pink": { label: "a pink glass plant mister", glass: true, plane: "near" },
  "decor-angel-candle-lilac": { label: "a lilac sleeping angel candle", plane: "near" },
  "decor-carved-bell": { label: "a carved brass bell", plane: "near" },
  "decor-fruit-towels": { label: "towels embroidered with fruit", plane: "near" },
  "decor-strawberry-towel": { label: "a strawberry hand towel", plane: "near" },
  "decor-heart-towels": { label: "towels with little red hearts", plane: "near" },
  "decor-taper-candles": { label: "flickering taper candles", lit: true, plane: "near" },
  "decor-crystal-roses": { label: "crystal roses", plane: "near" },
  "decor-cupid-candle-blue": { label: "a pensive cupid candle, in blue", plane: "near" },
  "decor-cupid-candle-pink": { label: "a pensive cupid candle, in pink", plane: "near" },
  "decor-pocket-watch": { label: "a goddess pocket watch", plane: "near" },
  "decor-moon-kiss-art": { label: "a girl kissing the moon, framed", plane: "mid" },
  "decor-glass-mister": { label: "an ombré glass mister", glass: true, plane: "near" },
  "decor-crystal-prism": { label: "a crystal prism", glass: true, plane: "near" },
  "decor-tissue-box-blue": { label: "a gilded powder-blue tissue box", plane: "near" },
  "decor-botanical-postcards": { label: "botanical postcards", plane: "mid" },
  "decor-flower-perfume": { label: "a perfume with a flower stopper", plane: "near" },
  "decor-strawberry-glass": { label: "a strawberry glass, with a straw", glass: true, plane: "near" },
  "decor-strawberry-molds": { label: "strawberry ice moulds", plane: "near" },
  "decor-cherry-umbrella": { label: "a cherry blossom umbrella", plane: "near" },
  "decor-strawberry-soaps": { label: "strawberry soaps", plane: "near" },
  "decor-perfume-amber": { label: "an amber eau de parfum", glass: true, plane: "near" },
  "decor-perfume-bow": { label: "a perfume with a black bow", glass: true, plane: "near" },
  "decor-perfume-dreamland": { label: "Dreamland, in pink daisies", glass: true, plane: "near" },
  "decor-heart-gift-box": { label: "a heart in a gift box", plane: "near" },
  "decor-perfume-pink": { label: "a pink perfume and its box", glass: true, plane: "near" },
  "decor-pink-gilt-box": { label: "a pink box with gilt peonies", plane: "near" },
  "decor-jade-buddha": { label: "a green jade Buddha", plane: "near" },
  "decor-stone-deity-head": { label: "a carved stone head", plane: "near" },
  "decor-gilt-bell": { label: "a brass bell, enamelled in green", plane: "near" },
  "decor-green-glass-insulator": { label: "an emerald glass insulator", glass: true, plane: "near" },
  "decor-pink-glass-jar": { label: "a pink depression-glass jar", glass: true, plane: "near" },
  "decor-ivy-bottle": { label: "ivy in an old glass bottle", plane: "near" },

  /* ---- from the garden set: files named main-noun-first, ending _sticker -- */
  suncatcher_stained_glass_hanging_scalloped_floral_turquoise_sticker: { label: "a stained-glass suncatcher, in flower", glass: true, plane: "mid" },
  bottle_glass_jar_embossed_aqua_vintage_sticker: { label: "an aqua glass bottle, embossed", glass: true, plane: "near" },
  radiator_heater_cast_iron_ribbed_white_vintage_sticker: { label: "an old cast-iron radiator", plane: "mid", metres: 0.9 },
  shelf_rack_garden_three_tier_scrollwork_glass_white_sticker: { label: "a white scrollwork garden shelf", plane: "mid", metres: 0.9 },
  mirror_wall_arch_ornate_gold_vintage_sticker: { label: "an arched gilt mirror", glass: true, plane: "mid" },
  mirror_wall_oval_ornate_gold_crest_vintage_sticker: { label: "an oval gilt mirror with a carved crest", glass: true, plane: "mid", metres: 0.6 },
  telescope_refractor_tripod_navy_blue_meade_sticker: { label: "a navy blue Meade telescope on its tripod", plane: "near", metres: 0.85 },
  telescope_refractor_tripod_navy_blue_meade_facing_left_sticker: { label: "a navy blue Meade telescope, pointing left", plane: "near", metres: 0.85 },
  dresser_walnut_mid_century_drawers_tapered_legs_sticker: { label: "a walnut mid-century chest of drawers", plane: "mid", metres: 0.8 },
  wardrobe_antique_mahogany_mirror_door_drawers_sticker: { label: "an antique mahogany wardrobe with a mirrored door", glass: true, plane: "mid", metres: 1.9 },
  sofa_sectional_chaise_slipcover_grey_rolled_arms_sticker: { label: "a grey slipcovered sectional sofa with a chaise", plane: "near", metres: 2.6 },
  sofa_sectional_chaise_slipcover_grey_rolled_arms_angled_left_sticker: { label: "a grey slipcovered sectional, turned a little left", plane: "near", metres: 2.6 },
  sofa_sectional_chaise_slipcover_grey_rolled_arms_angled_chaise_right_sticker: { label: "a grey slipcovered sectional, angled, chaise on the right", plane: "near", metres: 2.6 },
  sofa_sectional_chaise_slipcover_grey_rolled_arms_side_view_sticker: { label: "a grey slipcovered sectional, turned side-on", plane: "near", metres: 2.3 },
  saxophone_alto_brass_vintage_gold_sticker: { label: "a vintage gold brass saxophone", plane: "near", metres: 0.7 },
  hat_propeller_noogler_blue_yellow_red_green_sticker: { label: "a Noogler propeller hat", plane: "near", metres: 0.3 },
  ghost_sheet_navy_bow_books_candlestick_sticker: { label: "a friendly ghost carrying books and a candle", lit: true, plane: "near", metres: 0.7 },
  computer_imac_purple_back_view_sticker: { label: "a purple iMac, seen from the back", plane: "near", metres: 0.55 },
  computer_imac_g3_lime_green_keyboard_mouse_sticker: { label: "a lime iMac G3 with its keyboard and mouse", glass: true, plane: "near", metres: 0.6 },
  computer_imac_g3_lime_green_front_facing_sticker: { label: "a lime iMac, facing you", lit: true, plane: "near", metres: 0.45 },
  artwork_framed_abstract_splatter_painting_blue_green_gold_frame_sticker: { label: "an abstract blue and green splatter painting in a gilt frame", plane: "mid", metres: 0.7 },
  artwork_framed_abstract_pour_painting_pink_blue_black_gold_frame_sticker: { label: "an abstract pink and blue pour painting on black, in a gilt frame", plane: "mid", metres: 0.7 },
  can_watering_garden_metal_blush_pink_sticker: { label: "a blush-pink watering can", plane: "near" },
  mister_plant_spray_bottle_embossed_glass_ombre_turquoise_pink_antique_sticker: { label: "an embossed ombré glass plant mister", glass: true, plane: "near" },
  bottle_glass_embossed_decanter_peach_pink_vintage_sticker: { label: "an embossed peach glass decanter", glass: true, plane: "near" },
  flute_glass_champagne_tall_cobalt_blue_sticker: { label: "a cobalt blue champagne flute", glass: true, plane: "near" },
  goblet_glass_wine_aqua_turquoise_sticker: { label: "an aqua wine glass", glass: true, plane: "near" },
  bottle_glass_gin_sealed_green_vintage_sticker: { label: "a green glass gin bottle with a red seal", glass: true, plane: "near" },
  bottle_candle_holder_dripping_wax_cobalt_blue_sticker: { label: "a candle in a cobalt bottle, dripping wax", lit: true, plane: "near" },
  bottle_vase_lowell_embossed_pothos_cutting_green_glass_antique_sticker: { label: "a pothos cutting in an old Lowell bottle", plane: "near" },
  bottle_candle_holder_embossed_dripping_wax_red_pink_sticker: { label: "a candle in a red embossed bottle, dripping wax", lit: true, plane: "near" },
  bottle_vase_pothos_cutting_embossed_green_glass_sticker: { label: "a pothos cutting in a green glass bottle", plane: "near" },
  bottle_perfume_crystal_stopper_enamel_floral_purple_vintage_sticker: { label: "a purple enamel perfume bottle, crystal stopper", plane: "near" },
  brush_makeup_rose_enamel_leaves_gold_sticker: { label: "a gold rose makeup brush", plane: "near" },
  planter_hanging_macrame_woven_basket_string_of_pearls_sticker: { label: "string of pearls in a macramé hanger", plane: "near" },
  box_trinket_round_portrait_cream_gold_vintage_sticker: { label: "a round cream-and-gilt trinket box with a portrait", plane: "near" },
  lamp_aladdin_genie_pink_enamel_gold_jeweled_sticker: { label: "a pink enamel Aladdin lamp", plane: "near" },
  lamp_bankers_desk_green_glass_shade_brass_pull_chain_sticker: { label: "a banker's lamp, green glass on brass", lit: true, plane: "near", metres: 0.26 },

  /* ---- the characters (CharacterCatalog.tsx), who can stand in any room ---- */
  character_molly_sticker: { label: "Molly", plane: "near", metres: 0.55 },
  character_kate_sticker: { label: "Kate", plane: "near", metres: 0.55 },
  character_leonardo_sticker: { label: "Leonardo", plane: "near", metres: 0.6 },
  character_brea_sticker: { label: "Brea", plane: "near", metres: 0.45 },
  character_madeleine_sticker: { label: "Madeleine", plane: "near", metres: 0.5 },
  character_moselle_sticker: { label: "Moselle", plane: "near", metres: 0.5 },
  character_kayenat_sticker: { label: "Kayenat", plane: "near", metres: 0.55 },
  character_ella_sticker: { label: "Ella", plane: "near", metres: 0.8 },
  character_sarah_sticker: { label: "Sarah", plane: "near", metres: 0.72 },

  /* ---- the desert, from the Sunliner's stretch of it ------------------- */
  jackrabbit_desert_black_tailed_standing_sticker: { label: "a jackrabbit, all ears", plane: "near", metres: 0.6 },
  tortoise_desert_walking_sticker: { label: "a desert tortoise, walking somewhere", plane: "near", metres: 0.38 },
  fox_kit_desert_standing_sticker: { label: "a kit fox, out at dusk", plane: "near", metres: 0.8 },
  roadrunner_desert_running_sticker: { label: "a roadrunner, mid-stride", plane: "near", metres: 0.56 },
  ocotillo_agave_cluster_flowering_red_sticker: { label: "ocotillo in flower over an agave", plane: "mid", metres: 2.4 },
  cactus_golden_barrel_agave_cluster_sticker: { label: "a golden barrel cactus and an agave", plane: "mid", metres: 1.3 },
  cactus_prickly_pear_cluster_fruiting_sticker: { label: "a prickly pear in fruit", plane: "mid", metres: 2 },
  cactus_saguaro_cholla_desert_cluster_sticker: { label: "a saguaro with cholla at its feet", plane: "mid", metres: 2.6 },
  candle_cherub_angel_seated_pastel_blue_sticker: { label: "a blue cherub candle", plane: "near" },
  box_incense_burner_wood_lattice_moon_stars_brass_sticker: { label: "a wooden incense box with moons and stars", plane: "near" },
  bottle_dropper_apothecary_glass_emerald_green_sticker: { label: "a green glass dropper bottle", glass: true, plane: "near" },
  jar_trinket_cut_glass_lidded_blush_pink_sticker: { label: "a pink cut-glass trinket jar", glass: true, plane: "near" },
  box_trinket_jasperware_cameo_powder_blue_sticker: { label: "a blue jasperware cameo box", plane: "near" },
  plant_snake_sansevieria_white_pot_sticker: { label: "a snake plant in a white pot", plane: "near" },
  candle_cherub_angel_seated_mint_green_sticker: { label: "a mint cherub candle", plane: "near" },
  bottle_glass_embossed_medallion_dusty_rose_pink_sticker: { label: "a pink embossed glass bottle", glass: true, plane: "near" },
  candlestick_ornate_drip_candle_mint_green_sticker: { label: "a mint candlestick, dripping wax", plane: "near" },
  planter_pot_embossed_floral_medallion_off_white_sticker: { label: "a white embossed planter", plane: "near" },
  planter_pot_hand_painted_purple_flowers_saucer_sticker: { label: "a hand-painted flower pot and saucer", plane: "near" },
  candlestick_glass_bubble_stem_green_taper_ivory_sticker: { label: "a green glass candlestick with an ivory taper", glass: true, plane: "near" },
  cup_vanity_pressed_glass_amber_perfume_tubes_sticker: { label: "an amber glass vanity cup of perfume tubes", glass: true, plane: "near" },
  tray_trinket_porcelain_gilt_medallion_cobalt_blue_sticker: { label: "a blue porcelain trinket tray", plane: "near" },
  box_incense_burner_wood_lattice_moon_stars_upright_sticker: { label: "a wooden incense box, stood on end", plane: "near" },
  coffee_maker_drip_smeg_retro_pink_sticker: { label: "a pink Smeg drip coffee maker", plane: "near", metres: 0.3 },
  espresso_machine_smeg_retro_cream_sticker: { label: "a cream Smeg espresso machine", plane: "near", metres: 0.32 },
  microwave_insignia_retro_mint_teal_sticker: { label: "a mint Insignia microwave", plane: "near", metres: 0.5 },
  stove_range_smeg_victoria_lavender_sticker: { label: "a lavender Smeg range cooker", plane: "near", metres: 1.1 },
  cabinet_china_peach_pink_jadeite_pink_depression_glass_sticker: { label: "a peach china cabinet of jadeite and pink glass", glass: true, plane: "mid", metres: 1.1 },
  dresser_five_drawer_light_oak_scalloped_gold_pulls_sticker: { label: "a light oak five-drawer dresser", plane: "mid", metres: 0.85 },
  shelf_wall_geometric_diamond_gold_frame_three_tier_white_sticker: { label: "a gold diamond wall shelf", plane: "mid", metres: 0.75 },
  shelf_wall_long_trailing_pothos_watering_can_column_fairy_lights_sticker: { label: "a long shelf of trailing pothos and fairy lights", lit: true, plane: "mid", metres: 1.9 },
  shelf_wall_long_pothos_teacups_string_of_pearls_fairy_lights_sticker: { label: "a long shelf of pothos, teacups and fairy lights", lit: true, plane: "mid", metres: 1.9 },
  shelf_corner_ivy_green_bottle_teacup_fairy_lights_sticker: { label: "a corner shelf of ivy and fairy lights", lit: true, plane: "mid", metres: 0.9 },
  shelf_corner_pothos_basket_red_bottle_fairy_lights_sticker: { label: "a corner shelf of pothos and a red bottle", lit: true, plane: "mid", metres: 0.9 },
  garland_ivy_vine_fairy_lights_sticker: { label: "an ivy garland with fairy lights", lit: true, plane: "fore", metres: 1.3 },
  artwork_framed_line_drawing_woman_braids_black_white_sticker: { label: "a framed line drawing of a woman with braids", plane: "mid", metres: 0.55 },
  box_trinket_octagonal_cobalt_blue_gold_roses_sticker: { label: "a cobalt box with gold roses", plane: "near" },
  candlestick_glass_olive_green_lit_ivory_candle_left_sticker: { label: "a lit candle in a green glass candlestick", lit: true, glass: true, plane: "near" },
  candlestick_glass_olive_green_lit_ivory_candle_right_sticker: { label: "another lit candle in a green glass candlestick", lit: true, glass: true, plane: "near" },
  book_the_game_changing_attorney_michael_mogill_sticker: { label: "The Game Changing Attorney, by Michael Mogill", plane: "near" },
  book_hot_girl_crochet_rose_svane_sticker: { label: "Hot Girl Crochet, by Rose Svane", plane: "near" },
  book_world_travel_anthony_bourdain_sticker: { label: "World Travel, by Anthony Bourdain", plane: "near" },
  book_hundred_years_war_on_palestine_rashid_khalidi_sticker: { label: "The Hundred Years' War on Palestine, by Rashid Khalidi", plane: "near" },
  book_grc_engineering_for_aws_aj_yawn_sticker: { label: "GRC Engineering for AWS, by AJ Yawn", plane: "near" },
  tin_tarot_golden_art_nouveau_sticker: { label: "a Golden Art Nouveau tarot tin", plane: "near" },
  wall_pocket_porcelain_violets_gold_trim_sticker: { label: "a porcelain wall pocket with violets", plane: "near" },
  stool_strawberry_red_glazed_sticker: { label: "a red strawberry stool", plane: "near", metres: 0.42 },
  sofa_sectional_chaise_blush_pink_pillows_sticker: { label: "a blush pink sectional sofa", plane: "near", metres: 2.6 },
  rug_floral_tufted_grey_multicolour_flowers_sticker: { label: "a grey rug of tufted flowers", plane: "near", metres: 2.2 },
  vanity_oak_scalloped_round_mirror_sticker: { label: "an oak vanity with a round mirror", glass: true, plane: "near", metres: 1.1 },
  cabinet_apothecary_cream_many_drawers_novelty_knobs_sticker: { label: "a cream apothecary chest of little drawers", plane: "mid", metres: 1.1 },
  bed_french_cream_cherry_print_pink_bedding_sticker: { label: "a cream French bed with cherries", plane: "near", metres: 1.7 },
  artwork_framed_print_woman_blue_leaves_sticker: { label: "a framed print of a woman in blue leaves", plane: "mid", metres: 0.6 },
  artwork_framed_print_red_poppies_pink_sticker: { label: "a framed print of red poppies", plane: "mid", metres: 0.6 },
  shelf_wall_picture_ledge_oak_vinyl_records_hers_mitski_top_sticker: { label: "an oak ledge of records: Hers, Bury Me at Makeout Creek", plane: "mid", metres: 1.4 },
  shelf_wall_picture_ledge_oak_vinyl_records_puberty_be_the_cowboy_bottom_sticker: { label: "an oak ledge of records: Puberty 2, Be the Cowboy", plane: "mid", metres: 1.4 },
  rug_cat_tufted_peach_flowers_sticker: { label: "a peach tufted cat rug with flowers", plane: "near", metres: 0.9 },
  artwork_framed_vogue_cover_art_deco_sticker: { label: "a framed Art Deco Vogue cover", plane: "mid", metres: 0.5 },
  book_the_game_changing_attorney_michael_mogill_hardcover_sticker: { label: "The Game Changing Attorney, standing", plane: "near" },
  book_hot_girl_crochet_rose_svane_hardcover_sticker: { label: "Hot Girl Crochet, standing", plane: "near" },
  book_world_travel_anthony_bourdain_hardcover_sticker: { label: "World Travel, standing", plane: "near" },
  /* ---- antique glass Christmas ornaments -------------------------------- */
  ornament_reflector_rounded_magenta_sticker: { label: "a magenta reflector ornament", glass: true, plane: "near" },
  ornament_teardrop_frosted_glitter_orange_sticker: { label: "an orange frosted teardrop ornament", glass: true, plane: "near" },
  ornament_ball_hand_painted_red_flower_silver_sticker: { label: "a silver ball painted with a red flower", glass: true, plane: "near" },
  ornament_grape_cluster_purple_sticker: { label: "a purple grape cluster ornament", glass: true, plane: "near" },
  ornament_ball_pink_ribbon_bow_turquoise_sticker: { label: "a turquoise ball with a pink bow", glass: true, plane: "near" },
  ornament_pinecone_quilted_pink_sticker: { label: "a pink quilted pinecone ornament", glass: true, plane: "near" },
  ornament_ball_painted_leaf_red_sticker: { label: "a red ball painted with a white sprig", glass: true, plane: "near" },
  ornament_grape_cluster_cobalt_blue_sticker: { label: "a cobalt grape cluster ornament", glass: true, plane: "near" },
  ornament_reflector_saucer_silver_sticker: { label: "a silver saucer reflector ornament", glass: true, plane: "near" },
  ornament_finial_onion_glitter_stripes_green_silver_large_sticker: { label: "a green and silver glitter-striped drop", glass: true, plane: "near" },
  ornament_ball_reflector_magenta_large_sticker: { label: "a big magenta reflector ball", glass: true, plane: "near" },
  ornament_pickle_glass_lime_green_sticker: { label: "a glass Christmas pickle", glass: true, plane: "near" },
  ornament_santa_claus_glass_pink_sticker: { label: "a pink glass Santa", glass: true, plane: "near" },
  ornament_ball_painted_stripes_red_green_silver_sticker: { label: "a silver ball with red and green stripes", glass: true, plane: "near" },
  ornament_ball_turquoise_small_sticker: { label: "a little turquoise ball", glass: true, plane: "near" },
  ornament_santa_claus_red_pink_ribbon_sticker: { label: "a red Santa on a pink ribbon", glass: true, plane: "near" },
  ornament_ball_shiny_purple_sticker: { label: "a shiny purple ball", glass: true, plane: "near" },
  ornament_berry_cluster_red_sticker: { label: "a red berry cluster ornament", glass: true, plane: "near" },
  ornament_ball_worn_silver_blue_spots_sticker: { label: "a worn silver ball with blue spots", glass: true, plane: "near" },
  ornament_finial_onion_glitter_stripes_green_silver_small_sticker: { label: "a smaller green and silver glitter-striped drop", glass: true, plane: "near" },
  ornament_strawberry_frosted_coral_red_sticker: { label: "a frosted coral strawberry ornament", glass: true, plane: "near" },
  ornament_ball_reflector_magenta_small_sticker: { label: "a little magenta reflector ball", glass: true, plane: "near" },
  ornament_strawberry_small_red_sticker: { label: "a little red strawberry ornament", glass: true, plane: "near" },
});

export type PropId = keyof typeof PROPS;

export const propSrc = (id: PropId) => `${process.env.PUBLIC_URL}/palais/props/${id}.webp`;
export const propSpec = (id: PropId): PropSpec => PROPS[id];
