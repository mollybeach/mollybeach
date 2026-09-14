/**
 * The jewellery, kept in the jewellery box in the Wardrobe Wing (JewelryBox.tsx).
 *
 * Every piece is something Molly bought, cut out of the shop's photo. Each
 * kind has its place in the box: rings on the ring rolls in the top tray,
 * necklaces hanging from the hooks inside the doors, bracelets in the first
 * two drawers, earrings in the drawers below them, and hair pieces tucked into
 * the gathered pockets at the bottom of each door.
 */

export type JewelryKind = "ring" | "necklace" | "bracelet" | "earrings" | "hair";

export interface Jewel {
  label: string;
  store: string;
  bought: string;
  kind: JewelryKind;
}

const box = <T extends Record<string, Jewel>>(t: T) => t;

export const JEWELRY = box({
  "temu-flower-butterfly-rings": { label: "Flower & butterfly ring set", store: "Temu", bought: "2023-05", kind: "ring" },
  "temu-white-opal-ring": { label: "White opal oval ring", store: "Temu", bought: "2023-05", kind: "ring" },
  "amz-lana-necklace": { label: "Lana rosary locket necklace", store: "Amazon", bought: "2025-12", kind: "necklace" },
  "temu-pearl-necklace": { label: "Pearl heart necklace", store: "Temu", bought: "2023-05", kind: "necklace" },
  "temu-emerald-teardrop-necklace": { label: "Emerald teardrop necklace", store: "Temu", bought: "2023-05", kind: "necklace" },
  "temu-deer-necklace": { label: "Deer head pendant necklace", store: "Temu", bought: "2023-05", kind: "necklace" },
  "temu-pink-heart-necklace": { label: "Sparkling pink heart necklace", store: "Temu", bought: "2023-05", kind: "necklace" },
  "temu-angel-wings-necklace": { label: "Angel wings necklace", store: "Temu", bought: "2023-05", kind: "necklace" },
  "temu-ruby-heart-necklace": { label: "Ruby heart cupid necklace", store: "Temu", bought: "2023-05", kind: "necklace" },
  "temu-sapphire-heart-necklace": { label: "Sapphire heart necklace", store: "Temu", bought: "2023-05", kind: "necklace" },
  "amz-pearl-watch-band": { label: "Pearl beaded watch band", store: "Amazon", bought: "2023-12", kind: "bracelet" },
  "amz-bling-pearl-band": { label: "Pearl & crystal watch band", store: "Amazon", bought: "2023-12", kind: "bracelet" },
  "temu-butterfly-star-clip-earrings": { label: "Star & butterfly clip-ons", store: "Temu", bought: "2023-05", kind: "earrings" },
  "temu-gold-heart-studs": { label: "Gold heart studs", store: "Temu", bought: "2023-05", kind: "earrings" },
  "temu-cz-studs": { label: "Gold crystal ear crawlers", store: "Temu", bought: "2023-05", kind: "earrings" },
  "temu-heart-drop-earrings": { label: "Pink heart drop earrings", store: "Temu", bought: "2023-05", kind: "earrings" },
  "temu-butterfly-ear-cuff": { label: "Butterfly studs", store: "Temu", bought: "2023-05", kind: "earrings" },
  "temu-snake-studs": { label: "Crystal snake studs", store: "Temu", bought: "2023-05", kind: "earrings" },
  "temu-crown-earrings": { label: "Zircon crown earrings", store: "Temu", bought: "2023-05", kind: "earrings" },
  "amz-faious-studs": { label: "Lightning, moon & heart studs", store: "Amazon · FAIOUS", bought: "2023-02", kind: "earrings" },
  "amz-daith-hoops": { label: "Gold daith hoops", store: "Amazon · Drperfect", bought: "2023-02", kind: "earrings" },
  "amz-kainier-studs": { label: "CZ stud earrings", store: "Amazon · Kainier", bought: "2023-02", kind: "earrings" },
  "amz-olive-leaf-earrings": { label: "Olive leaf drop earrings", store: "Amazon · SLUYNZ", bought: "2023-02", kind: "earrings" },
  "amz-bridal-leaf-earrings": { label: "Crystal leaf bridal earrings", store: "Amazon", bought: "2023-03", kind: "earrings" },
  "amz-leaf-climber-earrings": { label: "Gold leaf ear climbers", store: "Amazon · Humble Chic", bought: "2023-04", kind: "earrings" },
  "amz-cartilage-studs": { label: "Cartilage studs set", store: "Amazon · FUNRUN", bought: "2023-04", kind: "earrings" },
  "tulip-ribbon-bow-hair-clips": { label: "Tulip ribbon bow hair clips", store: "Closet", bought: "", kind: "hair" },
  "love-fails-silk-hair-scarf": { label: "“Love Fails” silk hair scarf", store: "Closet", bought: "", kind: "hair" },
  "sage-bow-hair-clip-strand": { label: "Sage bow hair clips", store: "Closet", bought: "", kind: "hair" },
  "pink-bow-hair-clip-strand": { label: "Pink bow hair clips", store: "Closet", bought: "", kind: "hair" },
  "black-bow-hair-clip-strand": { label: "Black bow hair clips", store: "Closet", bought: "", kind: "hair" },
});

export type JewelId = keyof typeof JEWELRY;

export const jewelSrc = (id: string) => `${process.env.PUBLIC_URL}/palais/jewelry/${id}.webp`;
export const JEWELRY_BOX_SRC = `${process.env.PUBLIC_URL}/palais/jewelry/jewelry-box-open.webp`;

export const JEWELRY_SHELVES: { key: JewelryKind; name: string; emoji: string }[] = [
  { key: "ring", name: "Rings", emoji: "💍" },
  { key: "necklace", name: "Necklaces", emoji: "📿" },
  { key: "bracelet", name: "Bracelets", emoji: "⌚" },
  { key: "earrings", name: "Earrings", emoji: "✨" },
  { key: "hair", name: "Hair pieces", emoji: "🎀" },
];

/* ---- the box: where each kind goes, measured off the open-box picture
   (1080 × 782 px). Each spot is a box the piece is fitted inside. ---------- */

export interface Slot {
  /** the middle of the spot, across and down, as percentages of the picture */
  x: number;
  y: number;
  /** the spot's size, as percentages of the picture's width and height */
  w: number;
  h: number;
  /** hanging from a hook: the top of the spot is the hook */
  hang?: boolean;
}

const W = 1080;
const H = 782;
const at = (x: number, y: number, w: number, h: number, hang = false): Slot => ({
  x: (x / W) * 100,
  y: (y / H) * 100,
  w: (w / W) * 100,
  h: (h / H) * 100,
  hang,
});

/* the brass hooks inside each door: necklaces hang from them */
const HOOKS = [72, 110, 150, 190, 230, 838, 880, 921, 964, 1008].map((x) => at(x, 240, 46, 230, true));
/* the ring rolls in the top tray, and the little trays either side of them */
const RINGS = [at(495, 238, 90, 40), at(585, 238, 90, 40), at(495, 275, 90, 36), at(585, 275, 90, 36), at(375, 222, 70, 34), at(705, 222, 70, 34)];
/* the first drawer: six little compartments */
const DRAWER_1 = [352, 432, 507, 582, 657, 732].map((x) => at(x, 368, 64, 46));
/* the second drawer: two small compartments, then two long ones, each in two */
const DRAWER_2 = [at(330, 498, 40, 50), at(372, 498, 40, 50), at(495, 484, 150, 28), at(495, 512, 150, 28), at(680, 484, 150, 28), at(680, 512, 150, 28)];
/* the bottom drawer: three deep compartments, room for two pieces in each */
const DRAWER_3 = [345, 425, 505, 580, 655, 735].map((x) => at(x, 605, 70, 58));

/* the gathered pockets at the foot of each door: hair pieces stand tucked into them */
const POCKETS = [at(125, 470, 70, 190), at(190, 465, 70, 200), at(250, 470, 62, 180), at(845, 480, 70, 190), at(920, 480, 70, 190)];

/** which spots each kind fills, in order: rings in the tray, necklaces on the
    hooks, bracelets in the first drawer, earrings in the drawers below */
const PLACES: Record<JewelryKind, Slot[]> = {
  ring: RINGS,
  necklace: HOOKS,
  bracelet: [DRAWER_1[0], DRAWER_1[1], DRAWER_1[2]],
  earrings: [...DRAWER_2, ...DRAWER_3, DRAWER_1[3], DRAWER_1[4], DRAWER_1[5]],
  hair: POCKETS,
};

/** where each piece in the box sits; anything with no spot left shares one */
export function layOutBox(ids: string[]): { id: string; slot: Slot }[] {
  const used: Record<JewelryKind, number> = { ring: 0, necklace: 0, bracelet: 0, earrings: 0, hair: 0 };
  return ids.flatMap((id) => {
    const j = (JEWELRY as Record<string, Jewel>)[id];
    if (!j) return [];
    const spots = PLACES[j.kind];
    const slot = spots[used[j.kind]++ % spots.length];
    return [{ id, slot }];
  });
}
