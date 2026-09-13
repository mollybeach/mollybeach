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
});

export type PropId = keyof typeof PROPS;

export const propSrc = (id: PropId) => `${process.env.PUBLIC_URL}/palais/props/${id}.webp`;
export const propSpec = (id: PropId): PropSpec => PROPS[id];
