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
    items: ["bed-iron", "dresser", "armchair-sage", "loveseat", "vanity", "chair-vanity", "cabinet-jewelry"],
  },
  { key: "trellises", name: "Trellises", emoji: "🌿", items: ["trellis-wisteria", "trellis-ivy"] },
  {
    key: "plants",
    name: "House plants",
    emoji: "🪴",
    items: ["monstera-crystal", "dracaena", "fiddle-leaf-fig", "planter-greek-head"],
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
    ],
  },
  {
    key: "lights",
    name: "Hanging lights",
    emoji: "💡",
    items: ["pendant-opal", "pendant-cameo", "pendant-opal-antique"],
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
