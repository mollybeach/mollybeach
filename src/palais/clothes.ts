/**
 * The Wardrobe Wing's clothes.
 *
 * Every piece is something Molly actually bought online (Amazon, Shein, Temu
 * and Reformation), cut out of the shop's own product photo into a sticker:
 * flat product shots just lose their background, and clothes photographed on
 * a model are cut down to the garment alone. The stickers live in
 * /public/palais/closet.
 *
 * They're hung along the closet's brass rails and set out on its shelves, its
 * window seat and its floor. Each rail or shelf is a straight line in the
 * photograph, measured in that photograph's pixels, and the pieces on it are
 * spaced out evenly along it, a little bigger at the end nearer the camera.
 * The wide photographs and the tall one for phones are measured separately.
 */

export type ClothesKind = "coat" | "dress" | "top" | "bottom" | "swim" | "shoes" | "hat" | "bag" | "accessory";

export interface Garment {
  label: string;
  /** where it came from */
  store: string;
  /** year and month of the order */
  bought: string;
  kind: ClothesKind;
}

const wardrobe = <T extends Record<string, Garment>>(t: T) => t;

export const CLOTHES = wardrobe({
  "amz-birkenstock-gizeh": { label: "Birkenstock Gizeh sandals", store: "Amazon", bought: "2021-10", kind: "shoes" },
  "amz-coutgo-heels": { label: "Patent T-strap platform heels", store: "Amazon", bought: "2023-02", kind: "shoes" },
  "amz-fairies-dress": { label: "“F is for Fairies” dress", store: "Amazon · Dolls Kill", bought: "2025-07", kind: "dress" },
  "amz-floral-sweatshirt": { label: "Sunflower embroidered sweatshirt", store: "Amazon · Romwe", bought: "2021-05", kind: "top" },
  "amz-lana-necklace": { label: "Lana rosary locket necklace", store: "Amazon", bought: "2025-12", kind: "accessory" },
  "amz-lolita-maryjanes": { label: "Platform Mary Janes", store: "Amazon", bought: "2022-10", kind: "shoes" },
  "amz-maryjanes-kalstage": { label: "White double-strap Mary Janes", store: "Amazon", bought: "2023-05", kind: "shoes" },
  "amz-roller-skates": { label: "Light-up roller skates", store: "Amazon", bought: "2023-06", kind: "shoes" },
  "amz-ruffle-socks": { label: "Ruffle ankle socks", store: "Amazon", bought: "2026-01", kind: "accessory" },
  "amz-ski-gloves": { label: "Touchscreen ski gloves", store: "Amazon", bought: "2023-12", kind: "accessory" },
  "amz-superga-hitops": { label: "Superga 2750 hi-tops", store: "Amazon", bought: "2022-10", kind: "shoes" },
  "amz-tstrap-maryjanes": { label: "T-strap platform Mary Janes", store: "Amazon", bought: "2021-10", kind: "shoes" },
  "amz-tulle-dress-blue": { label: "Dusty blue tulle flower dress", store: "Amazon", bought: "2023-05", kind: "dress" },
  "amz-tulle-dress-green": { label: "Sage tulle flower dress", store: "Amazon", bought: "2023-05", kind: "dress" },
  "shein-ballet-bows": { label: "Ballet streamer bows", store: "Shein", bought: "2025-11", kind: "accessory" },
  "shein-bow-loafers": { label: "Brown bow loafers", store: "Shein", bought: "2025-11", kind: "shoes" },
  "shein-cable-set": { label: "Cable knit cardigan & crochet skirt", store: "Shein", bought: "2025-11", kind: "dress" },
  "shein-check-cami": { label: "Academia check cami", store: "Shein · ROMWE", bought: "2025-11", kind: "top" },
  "shein-dazy-set": { label: "Army green layered tee", store: "Shein · DAZY", bought: "2025-11", kind: "top" },
  "shein-fairisle-skirt": { label: "Fair Isle sweater skirt", store: "Shein · ROMWE", bought: "2025-11", kind: "bottom" },
  "shein-fluffy-shawl": { label: "Fluffy hooded shawl", store: "Shein", bought: "2026-03", kind: "top" },
  "shein-halfzip": { label: "White half-zip pullover", store: "Shein · Livesso", bought: "2025-11", kind: "top" },
  "shein-mint-maryjanes": { label: "Mint Mary Jane pumps", store: "Shein", bought: "2025-11", kind: "shoes" },
  "shein-plaid-bowskirt": { label: "Plaid bow mini skirt", store: "Shein · SHEIN ICON", bought: "2025-11", kind: "bottom" },
  "shein-plaid-tieskirt": { label: "Plaid pleated tie skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "shein-pleated-khaki": { label: "Khaki pleated skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "shein-ribbed-top": { label: "Cream ribbed knit top", store: "Shein", bought: "2025-11", kind: "top" },
  "shein-sweaterskirt-burgundy": { label: "Burgundy sweater skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "shein-sweaterskirt-navy": { label: "Navy sweater skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "shein-sweetheart-sweater": { label: "Sweetheart ribbed sweater", store: "Shein · Zielony", bought: "2025-11", kind: "top" },
  "temu-beach-swimsuit": { label: "Black & cream one-piece", store: "Temu", bought: "2025-05", kind: "swim" },
  "temu-bow-cami": { label: "Red bow babydoll cami", store: "Temu", bought: "2025-04", kind: "top" },
  "temu-bow-handbag": { label: "White bow handbag", store: "Temu", bought: "2023-05", kind: "bag" },
  "temu-butterfly-scarf": { label: "Butterfly crochet kerchief", store: "Temu", bought: "2023-05", kind: "accessory" },
  "temu-cable-cardigan": { label: "Grey cable knit cardigan", store: "Temu", bought: "2025-04", kind: "top" },
  "temu-ditsy-minidress": { label: "Pink ditsy floral dress", store: "Temu", bought: "2023-05", kind: "dress" },
  "temu-ditsy-splitdress": { label: "Ditsy floral puff-sleeve dress", store: "Temu", bought: "2023-05", kind: "dress" },
  "temu-floral-gloves": { label: "Flower fingerless gloves", store: "Temu", bought: "2023-05", kind: "accessory" },
  "temu-floral-tubedress": { label: "Floral ruffle tube dress", store: "Temu", bought: "2024-06", kind: "dress" },
  "temu-flower-camidress": { label: "Pistachio satin flower dress", store: "Temu", bought: "2023-05", kind: "dress" },
  "temu-flower-dress-pink": { label: "Dusty pink ruched dress", store: "Temu", bought: "2024-06", kind: "dress" },
  "temu-fur-buckethat": { label: "Lime fluffy bucket hat", store: "Temu", bought: "2025-02", kind: "hat" },
  "temu-fur-headband": { label: "Green faux fur headband", store: "Temu", bought: "2025-02", kind: "hat" },
  "temu-green-bow-dress": { label: "Green bow sundress", store: "Temu", bought: "2023-05", kind: "dress" },
  "temu-hamster-slippers": { label: "Hamster slippers", store: "Temu", bought: "2023-05", kind: "shoes" },
  "temu-heart-bikini": { label: "Heart-link halter bikini", store: "Temu", bought: "2023-05", kind: "swim" },
  "temu-knit-miniskirt": { label: "White ribbed mini skirt", store: "Temu", bought: "2025-04", kind: "bottom" },
  "temu-knit-slipdress": { label: "Black & white bow slip dress", store: "Temu", bought: "2025-02", kind: "dress" },
  "temu-lace-gloves": { label: "Pink mesh lace gloves", store: "Temu", bought: "2023-05", kind: "accessory" },
  "temu-laceup-dress": { label: "Lace-up backless dress", store: "Temu", bought: "2024-06", kind: "dress" },
  "temu-mantilla": { label: "Lace mantilla veil", store: "Temu", bought: "2023-05", kind: "accessory" },
  "temu-offshoulder-dress": { label: "Black & white ruffle mini dress", store: "Temu", bought: "2025-05", kind: "dress" },
  "temu-pearl-necklace": { label: "Pearl heart necklace", store: "Temu", bought: "2023-05", kind: "accessory" },
  "temu-pearl-tank": { label: "Powder blue corset top", store: "Temu", bought: "2025-04", kind: "top" },
  "temu-rose-beanie": { label: "Rose knit hood beanie", store: "Temu", bought: "2025-02", kind: "hat" },
  "temu-saddle-bag": { label: "Houndstooth saddle bag", store: "Temu", bought: "2023-05", kind: "bag" },
  "temu-satin-nightdress": { label: "Satin lace slip", store: "Temu", bought: "2023-05", kind: "dress" },
  "temu-satin-robe": { label: "Green satin robe", store: "Temu", bought: "2025-02", kind: "dress" },
  "temu-squareneck-dress": { label: "Black ribbon mini dress", store: "Temu", bought: "2024-06", kind: "dress" },
  "temu-strawberry-bandana": { label: "Crochet heart bandana", store: "Temu", bought: "2023-05", kind: "accessory" },
  "temu-tie-cardigan": { label: "Black tie-front cardigan", store: "Temu", bought: "2025-04", kind: "top" },
  "ref-melanie-top": { label: "Melanie Top", store: "Reformation", bought: "2025-08", kind: "top" },
  "ref-shai-dress": { label: "Shai Dress", store: "Reformation", bought: "2025-05", kind: "dress" },
  "ref-sutton-shorts": { label: "Sutton Jean Shorts", store: "Reformation", bought: "2026-05", kind: "bottom" },
  "ref-juliet-top": { label: "Juliet Linen Top", store: "Reformation", bought: "2025-05", kind: "top" },
  "ref-ren-skirt": { label: "Ren Linen Skirt", store: "Reformation", bought: "2025-05", kind: "bottom" },
  "dh-goose-jacket-pink": { label: "Pink fur-hood parka", store: "DHgate", bought: "2026-03", kind: "coat" },
  "dh-puffer-jacket": { label: "Red fur-hood parka", store: "DHgate", bought: "2026-03", kind: "coat" },
  "dh-fur-coat": { label: "Black faux fur coat", store: "DHgate", bought: "2026-03", kind: "coat" },
  "dh-tweed-set-ivory": { label: "Ivory tweed jacket & pleated skirt", store: "DHgate", bought: "2026-03", kind: "dress" },
  "dh-tweed-set-black": { label: "Black tweed jacket & pleated skirt", store: "DHgate", bought: "2026-03", kind: "dress" },
  "dh-knit-skirt-set": { label: "White knit tank & pleated skirt", store: "DHgate", bought: "2026-03", kind: "dress" },
  "dh-cc-bikini": { label: "Black string bikini", store: "DHgate", bought: "2026-03", kind: "swim" },
  "dh-leather-belt": { label: "Black leather belt", store: "DHgate", bought: "2026-03", kind: "accessory" },
  "dh-check-tote": { label: "Check leather tote", store: "DHgate", bought: "2026-03", kind: "bag" },
  "dh-rain-boots": { label: "Black rain boots", store: "DHgate", bought: "2025-12", kind: "shoes" },
  "dh-hobo-bag": { label: "Pink quilted hobo bag", store: "DHgate", bought: "2025-12", kind: "bag" },
  "dh-canvas-tote": { label: "Canvas & leather totes", store: "DHgate", bought: "2025-05", kind: "bag" },
  "dh-brown-tote": { label: "Check totes", store: "DHgate", bought: "2025-05", kind: "bag" },
  "dh-grey-hobo": { label: "Mint hobo shoulder bag", store: "DHgate", bought: "2024-08", kind: "bag" },
  "dh-cleo-bag": { label: "Green Cleo shoulder bag", store: "DHgate", bought: "2024-06", kind: "bag" },
  "cider-crochet-scarf": { label: "Daisy crochet kerchief", store: "Cider", bought: "2023-02", kind: "accessory" },
  "cider-rib-cardigan": { label: "Lime rib tie cardigan", store: "Cider", bought: "2023-02", kind: "top" },
  "cider-houndstooth-dress": { label: "Houndstooth pinafore dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-ditsy-layered-dress": { label: "Blue ditsy tiered dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-jacquard-dress": { label: "White floral jacquard dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-embroidered-dress": { label: "White embroidered mini dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-tie-shoulder-dress": { label: "Lime tie-shoulder dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-pearl-cardigan": { label: "Pastel pearl-button cardigan", store: "Cider", bought: "2023-02", kind: "top" },
  "cider-toile-dress": { label: "Toile de Jouy bow dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-corduroy-dress": { label: "Teal floral corduroy dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-lemon-dress": { label: "Lemon print ruffle dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-fur-trim-dress": { label: "Moss velvet fur-trim dress", store: "Cider", bought: "2022-11", kind: "dress" },
  "cider-velvet-crop-blouse": { label: "Black velvet fuzzy crop top", store: "Cider", bought: "2022-11", kind: "top" },
  "cider-mesh-crop-top": { label: "Black mesh sweetheart top", store: "Cider", bought: "2022-11", kind: "top" },
  "cider-fluffy-mesh-dress": { label: "Black fluffy-cuff mesh dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-satin-cami-dress": { label: "Chartreuse satin slip dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-geometric-knit": { label: "Green Fair Isle sweater", store: "Cider", bought: "2022-10", kind: "top" },
  "cider-pastel-dress": { label: "Iridescent pastel mini dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-velvet-playsuit": { label: "Blue velvet ruffle playsuit", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-velvet-corset-dress": { label: "Navy velvet corset dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-lace-cami-dress": { label: "Green lace ruched cami dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-ruffle-velvet-dress": { label: "Emerald ruched velvet dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-puff-sleeve-dress": { label: "Blue floral puff-sleeve dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "cider-floral-midi-dress": { label: "Pale blue jacquard slip dress", store: "Cider", bought: "2022-10", kind: "dress" },
  "ar-esquire-trench": { label: "The Esquire Short Trench Coat", store: "Aritzia · Babaton", bought: "2026-08", kind: "coat" },
  "nord-icon-blazer": { label: "The Icon Relaxed Blazer", store: "Nordstrom · Open Edit", bought: "2026-06", kind: "coat" },
  "ar-bloor-sweater": { label: "Bare Merino Wool Bloor Sweater", store: "Aritzia", bought: "2026-08", kind: "top" },
  "ar-passage-cardigan": { label: "Passage Cardigan", store: "Aritzia · Babaton", bought: "2026-08", kind: "top" },
  "ar-jewel-skort": { label: "Jewel Skort", store: "Aritzia", bought: "2026-08", kind: "bottom" },
  "rf-karmen-trousers": { label: "Karmen paper bag cigarette trousers", store: "Rebellious Fashion", bought: "2018-09", kind: "bottom" },
  "cider-ruffle-skort": { label: "Chiffon ruffle hem mini skort", store: "TikTok Shop · Cider", bought: "2026-05", kind: "bottom" },
  "romi-alya-dress": { label: "Alya Maxi Dress", store: "Romi Fashion", bought: "2025-12", kind: "dress" },
  "romi-miranda-dress": { label: "Miranda Mini Dress", store: "Romi Fashion", bought: "2025-12", kind: "dress" },
  "styluxe-slip-dress": { label: "Floral Print Day Slip Dress", store: "Styluxe", bought: "2025-07", kind: "dress" },
  "yellow-charlotte-dress": { label: "Charlotte Linen Dress", store: "Yellow The Label", bought: "2025-06", kind: "dress" },
  "tt-striped-vest-set": { label: "Striped vest & straight leg pants", store: "TikTok Shop · Origin Atelier", bought: "2026-06", kind: "dress" },
  "tt-striped-collar-set": { label: "Brown striped stand collar set", store: "TikTok Shop · Origin Atelier", bought: "2026-06", kind: "dress" },
  "cider-jacquard-bandeau-dress": { label: "Jacquard floral bandeau mini dress", store: "TikTok Shop · Cider", bought: "2026-06", kind: "dress" },
  "cider-wine-bandeau-dress": { label: "Wine chiffon bandeau draped dress", store: "TikTok Shop · Cider", bought: "2026-09", kind: "dress" },
  "tt-nidadie-set": { label: "Off-shoulder top & pleated skirt set", store: "TikTok Shop · NIDADIE", bought: "2025-03", kind: "dress" },
  "tt-black-slingbacks": { label: "Black patent buckle slingbacks", store: "TikTok Shop · Chic Materials", bought: "2026-06", kind: "shoes" },
  "tt-red-slingbacks": { label: "Red patent buckle slingbacks", store: "TikTok Shop · Chic Materials", bought: "2026-06", kind: "shoes" },
  "tt-cat-eye-6pack": { label: "Retro cat eye sunglasses (6)", store: "TikTok Shop · Urban Optic", bought: "2026-09", kind: "accessory" },
  "tt-beige-cat-eye": { label: "Cream cat eye sunglasses", store: "TikTok Shop · TAOGLASSES", bought: "2026-09", kind: "accessory" },
  "tt-wine-oval-sunglasses": { label: "Wine oval sunglasses", store: "TikTok Shop · Chic Vizio", bought: "2026-09", kind: "accessory" },
  "tt-satin-bow-ties": { label: "Satin bow hair ties", store: "TikTok Shop · NANYOU", bought: "2026-06", kind: "accessory" },
  "tt-plaid-halter-dress": { label: "Vintage plaid halter dress with velvet bows", store: "TikTok Shop · SML Vogue", bought: "2026-09", kind: "dress" },
  "tt-plaid-blazer-set": { label: "Khaki plaid blazer & mini skirt set", store: "TikTok Shop · Chic Modern Suits", bought: "2026-08", kind: "dress" },
  "ed-keinan-shorts": { label: "Keinan Low Rise Denim Shorts", store: "TikTok Shop · Edikted", bought: "2026-03", kind: "bottom" },
});

export type GarmentId = keyof typeof CLOTHES;

export const garment = (id: string): Garment | undefined => (CLOTHES as Record<string, Garment>)[id];

export const closetSrc = (id: string) => `${process.env.PUBLIC_URL}/palais/closet/${id}.webp`;

/** the catalogue's shelves in the closet, one per kind of thing */
export const WARDROBE_SHELVES: { key: ClothesKind; name: string; emoji: string }[] = [
  { key: "coat", name: "Coats", emoji: "🧥" },
  { key: "dress", name: "Dresses", emoji: "👗" },
  { key: "top", name: "Tops & knits", emoji: "👚" },
  { key: "bottom", name: "Skirts & shorts", emoji: "🩳" },
  { key: "swim", name: "Swim", emoji: "👙" },
  { key: "shoes", name: "Shoes", emoji: "👠" },
  { key: "hat", name: "Hats", emoji: "👒" },
  { key: "bag", name: "Bags", emoji: "👜" },
  { key: "accessory", name: "Accessories", emoji: "🎀" },
];

/* ---- where everything goes --------------------------------------------- */

type Pt = [number, number];

interface Line {
  ids: GarmentId[];
  /** the end nearer the camera, and the far end, in photograph pixels */
  from: Pt;
  to: Pt;
  /** how wide a piece is at each end, in photograph pixels */
  w: [number, number];
  /** hung from the line (a rail) rather than standing on it (a shelf, the floor) */
  hang?: boolean;
  /** stacking order at the near end; it counts down along the line */
  z: number;
}

export interface Spot {
  id: GarmentId;
  /** the middle of the piece, across, as a percentage of the photograph */
  x: number;
  /** the rail (for something hung) or the surface it stands on, down, as a percentage */
  y: number;
  /** width, as a percentage of the photograph's width */
  w: number;
  hang: boolean;
  z: number;
}

export const CLOSET_PHOTOS = {
  wide: { w: 1930, h: 1086 },
  tall: { w: 941, h: 1672 },
};

/* The wide photographs (1930 × 1086). On the left, an outer bay with two
   rails, a narrower bay with one rail and a shelf, and a column of cubbies;
   on the right, a very narrow column of shelves, an inner bay with two rails
   and an outer bay of shelves; the window seat and the tiles between.

   A window narrower than the photograph crops its sides — at 1440 × 900 with
   the sidebar open, about everything left of 260 and right of 1670 — so the
   outer bays get what's fine to half-hide, and most of the clothes hang on
   two rolling rails on the tiles instead, low enough to leave the window
   clear. */
const WIDE: Line[] = [
  // the narrower left bay
  { ids: ["temu-ditsy-minidress", "temu-floral-tubedress", "temu-green-bow-dress", "temu-flower-dress-pink", "temu-knit-slipdress", "temu-laceup-dress", "cider-houndstooth-dress", "cider-fur-trim-dress", "cider-fluffy-mesh-dress", "romi-miranda-dress", "cider-jacquard-bandeau-dress", "cider-wine-bandeau-dress"], from: [334, 367], to: [414, 397], w: [100, 88], hang: true, z: 50 },
  { ids: ["amz-ruffle-socks", "amz-ski-gloves", "dh-leather-belt", "cider-crochet-scarf", "tt-satin-bow-ties"], from: [352, 684], to: [420, 672], w: [74, 66], z: 52 },
  // the little rail over the cubbies, and the cubbies
  { ids: ["temu-squareneck-dress", "temu-satin-nightdress", "temu-beach-swimsuit", "cider-satin-cami-dress", "cider-lace-cami-dress", "tt-nidadie-set", "tt-plaid-halter-dress"], from: [480, 327], to: [520, 349], w: [76, 68], hang: true, z: 40 },
  { ids: ["temu-fur-buckethat", "temu-rose-beanie"], from: [492, 486], to: [540, 480], w: [58, 54], z: 38 },
  { ids: ["amz-lana-necklace", "temu-pearl-necklace", "temu-lace-gloves"], from: [487, 577], to: [543, 572], w: [26, 24], z: 36 },
  { ids: ["temu-floral-gloves", "shein-ballet-bows"], from: [487, 676], to: [516, 672], w: [27, 26], z: 36 },
  // the very narrow column of shelves by the mirror
  { ids: ["temu-mantilla", "temu-fur-headband", "temu-butterfly-scarf", "temu-strawberry-bandana"], from: [1398, 360], to: [1398, 770], w: [52, 52], z: 36 },
  // the inner right bay: tops above, skirts below
  { ids: ["temu-offshoulder-dress", "shein-cable-set", "shein-check-cami", "shein-dazy-set", "shein-ribbed-top", "temu-bow-cami", "temu-pearl-tank", "ref-melanie-top", "ref-juliet-top"], from: [1598, 200], to: [1472, 280], w: [104, 92], hang: true, z: 70 },
  { ids: ["shein-fairisle-skirt", "shein-plaid-bowskirt", "shein-plaid-tieskirt", "shein-pleated-khaki", "shein-sweaterskirt-burgundy", "shein-sweaterskirt-navy", "temu-knit-miniskirt", "ref-sutton-shorts", "ref-ren-skirt", "rf-karmen-trousers"], from: [1598, 638], to: [1472, 622], w: [100, 90], hang: true, z: 72 },
  // the middle of the window seat, between the two rails
  { ids: ["temu-saddle-bag", "shein-fluffy-shawl", "temu-bow-handbag"], from: [918, 690], to: [1020, 690], w: [74, 74], z: 20 },
  // the two rolling rails
  { ids: ["amz-tulle-dress-blue", "amz-tulle-dress-green", "amz-fairies-dress", "temu-ditsy-splitdress", "temu-flower-camidress", "temu-satin-robe", "ref-shai-dress", "dh-tweed-set-ivory", "dh-tweed-set-black", "dh-knit-skirt-set", "cider-velvet-corset-dress", "cider-ruffle-velvet-dress"], from: [622, 612], to: [868, 612], w: [118, 118], hang: true, z: 46 },
  { ids: ["amz-floral-sweatshirt", "temu-cable-cardigan", "shein-halfzip", "shein-sweetheart-sweater", "temu-tie-cardigan", "temu-heart-bikini", "dh-goose-jacket-pink", "dh-puffer-jacket", "dh-fur-coat", "dh-cc-bikini", "tt-striped-vest-set", "tt-striped-collar-set"], from: [1066, 612], to: [1314, 612], w: [112, 104], hang: true, z: 46 },
  // every pair of shoes, lined up on the tiles in front
  { ids: ["shein-mint-maryjanes", "amz-coutgo-heels", "amz-lolita-maryjanes", "amz-maryjanes-kalstage", "amz-tstrap-maryjanes", "shein-bow-loafers", "amz-birkenstock-gizeh", "amz-superga-hitops", "temu-hamster-slippers", "amz-roller-skates", "dh-rain-boots", "tt-black-slingbacks", "tt-red-slingbacks"], from: [560, 1030], to: [1380, 1030], w: [84, 84], z: 60 },
  // the outer left bay, which only a wide screen shows all of: more dresses below, knits above
  { ids: ["cider-ditsy-layered-dress", "cider-jacquard-dress", "cider-embroidered-dress", "cider-tie-shoulder-dress", "cider-toile-dress", "cider-corduroy-dress", "cider-lemon-dress", "cider-puff-sleeve-dress", "cider-floral-midi-dress", "romi-alya-dress", "yellow-charlotte-dress", "styluxe-slip-dress"], from: [52, 292], to: [236, 348], w: [128, 110], hang: true, z: 80 },
  { ids: ["cider-velvet-playsuit", "cider-pastel-dress", "ar-esquire-trench", "nord-icon-blazer", "ar-bloor-sweater", "ar-passage-cardigan", "tt-plaid-blazer-set"], from: [48, 98], to: [236, 198], w: [112, 96], hang: true, z: 60 },
  // the third bar, added under the two in the inner right bay: short knits
  { ids: ["cider-rib-cardigan", "cider-pearl-cardigan", "cider-geometric-knit", "cider-velvet-crop-blouse", "cider-mesh-crop-top", "ar-jewel-skort", "cider-ruffle-skort", "ed-keinan-shorts"], from: [1598, 786], to: [1472, 770], w: [96, 88], hang: true, z: 74 },
  // bags on the outer right bay's shelves
  { ids: ["dh-check-tote", "dh-hobo-bag", "dh-canvas-tote"], from: [1840, 546], to: [1675, 548], w: [94, 86], z: 30 },
  { ids: ["dh-brown-tote", "dh-grey-hobo", "dh-cleo-bag"], from: [1845, 752], to: [1680, 716], w: [98, 90], z: 32 },
  // the bottom row of cubbies: sunglasses
  { ids: ["tt-cat-eye-6pack", "tt-beige-cat-eye", "tt-wine-oval-sunglasses"], from: [487, 772], to: [543, 766], w: [27, 26], z: 36 },
];

/* The tall photograph for phones (941 × 1672). A phone crops its sides, so
   everything stays inside about 90–850 across. The tiles take up the whole
   bottom half here, so the rolling rails stand one behind the other. */
const TALL: Line[] = [
  { ids: ["temu-ditsy-minidress", "temu-floral-tubedress", "temu-green-bow-dress", "temu-flower-dress-pink", "temu-knit-slipdress", "temu-laceup-dress", "temu-squareneck-dress", "temu-satin-nightdress", "cider-houndstooth-dress", "cider-fur-trim-dress", "cider-fluffy-mesh-dress", "cider-satin-cami-dress", "cider-lace-cami-dress", "tt-nidadie-set", "tt-plaid-halter-dress"], from: [156, 580], to: [200, 605], w: [60, 54], hang: true, z: 50 },
  { ids: ["temu-offshoulder-dress", "shein-cable-set", "shein-check-cami", "shein-dazy-set", "shein-ribbed-top", "temu-bow-cami", "temu-pearl-tank", "ref-melanie-top", "ref-juliet-top"], from: [800, 450], to: [742, 492], w: [64, 56], hang: true, z: 70 },
  { ids: ["shein-fairisle-skirt", "shein-plaid-bowskirt", "shein-plaid-tieskirt", "shein-pleated-khaki", "shein-sweaterskirt-burgundy", "shein-sweaterskirt-navy", "temu-knit-miniskirt", "ref-sutton-shorts", "ref-ren-skirt", "rf-karmen-trousers"], from: [800, 876], to: [742, 864], w: [62, 56], hang: true, z: 72 },
  // the window seat
  { ids: ["temu-saddle-bag", "temu-fur-buckethat", "temu-rose-beanie", "shein-fluffy-shawl", "temu-fur-headband", "temu-bow-handbag", "dh-check-tote", "dh-hobo-bag", "dh-canvas-tote", "dh-brown-tote"], from: [318, 948], to: [578, 948], w: [50, 50], z: 20 },
  { ids: ["shein-ballet-bows"], from: [655, 560], to: [655, 560], w: [40, 40], hang: true, z: 20 },
  // the rolling rails: the far one with the dresses, the near one with knits and swim
  { ids: ["amz-tulle-dress-blue", "amz-tulle-dress-green", "amz-fairies-dress", "temu-ditsy-splitdress", "temu-flower-camidress", "temu-satin-robe", "ref-shai-dress", "dh-tweed-set-ivory", "dh-tweed-set-black", "dh-knit-skirt-set", "cider-velvet-corset-dress", "cider-ruffle-velvet-dress", "romi-miranda-dress", "cider-jacquard-bandeau-dress", "cider-wine-bandeau-dress"], from: [320, 1010], to: [620, 1010], w: [80, 80], hang: true, z: 30 },
  { ids: ["amz-floral-sweatshirt", "temu-cable-cardigan", "shein-halfzip", "shein-sweetheart-sweater", "temu-tie-cardigan", "temu-heart-bikini", "temu-beach-swimsuit", "dh-goose-jacket-pink", "dh-puffer-jacket", "dh-fur-coat", "dh-cc-bikini", "tt-striped-vest-set", "tt-striped-collar-set"], from: [232, 1215], to: [708, 1215], w: [92, 92], hang: true, z: 40 },
  // on the tiles in front
  { ids: ["temu-mantilla", "temu-butterfly-scarf", "temu-strawberry-bandana", "amz-lana-necklace", "temu-pearl-necklace", "temu-lace-gloves", "temu-floral-gloves", "amz-ski-gloves", "amz-ruffle-socks", "dh-leather-belt", "cider-crochet-scarf", "tt-cat-eye-6pack", "tt-beige-cat-eye", "tt-wine-oval-sunglasses", "tt-satin-bow-ties"], from: [140, 1520], to: [800, 1520], w: [58, 58], z: 50 },
  { ids: ["shein-mint-maryjanes", "amz-coutgo-heels", "amz-lolita-maryjanes", "amz-maryjanes-kalstage", "amz-tstrap-maryjanes", "shein-bow-loafers", "amz-birkenstock-gizeh", "amz-superga-hitops", "temu-hamster-slippers", "amz-roller-skates", "dh-rain-boots", "tt-black-slingbacks", "tt-red-slingbacks"], from: [120, 1650], to: [820, 1650], w: [72, 72], z: 60 },
  // the outer left bay (a phone crops some of it) and the shelf in the inner right bay
  { ids: ["cider-ditsy-layered-dress", "cider-jacquard-dress", "cider-embroidered-dress", "cider-tie-shoulder-dress", "cider-toile-dress", "cider-corduroy-dress", "cider-lemon-dress", "cider-puff-sleeve-dress", "cider-floral-midi-dress", "romi-alya-dress", "yellow-charlotte-dress", "styluxe-slip-dress"], from: [84, 506], to: [140, 552], w: [80, 70], hang: true, z: 80 },
  { ids: ["cider-velvet-playsuit", "cider-pastel-dress", "ar-esquire-trench", "nord-icon-blazer", "ar-bloor-sweater", "ar-passage-cardigan", "tt-plaid-blazer-set"], from: [80, 342], to: [138, 404], w: [70, 60], hang: true, z: 60 },
  { ids: ["cider-rib-cardigan", "cider-pearl-cardigan", "cider-geometric-knit", "cider-velvet-crop-blouse", "cider-mesh-crop-top", "ar-jewel-skort", "cider-ruffle-skort", "ed-keinan-shorts"], from: [790, 990], to: [744, 978], w: [56, 52], hang: true, z: 74 },
  { ids: ["dh-grey-hobo", "dh-cleo-bag"], from: [786, 832], to: [744, 828], w: [44, 40], z: 66 },
];

/** a free-standing brass clothes rail: its bar, and where its feet stand, in photograph pixels */
export interface Rack {
  x0: number;
  x1: number;
  bar: number;
  feet: number;
  z: number;
}

/** a brass hanging bar fixed inside one of the closet's bays, from its bracket to its far end, in photograph pixels */
export interface Bar {
  from: [number, number];
  to: [number, number];
  z: number;
}

/* The inner right bay had room under its lower bar for a third, just above
   its floor, so one's been fitted there. */
export const CLOSET_BARS: Record<"wide" | "tall", Bar[]> = {
  wide: [{ from: [1452, 768], to: [1606, 787], z: 73 }],
  tall: [{ from: [737, 975], to: [793, 990], z: 73 }],
};

export const CLOSET_RACKS: Record<"wide" | "tall", Rack[]> = {
  wide: [
    { x0: 596, x1: 894, bar: 612, feet: 985, z: 44 },
    { x0: 1040, x1: 1340, bar: 612, feet: 985, z: 44 },
  ],
  tall: [
    { x0: 292, x1: 648, bar: 1010, feet: 1270, z: 28 },
    { x0: 196, x1: 744, bar: 1215, feet: 1500, z: 38 },
  ],
};

/** a few pieces whose photographs make them look the wrong size beside the rest */
const SIZE: Partial<Record<GarmentId, number>> = {
  "shein-bow-loafers": 0.72, // one loafer, seen end-on, so tall and narrow
  "amz-birkenstock-gizeh": 1.2,
  "temu-hamster-slippers": 1.1,
  "temu-heart-bikini": 0.85,
  // the long ones, so they clear the shoes lined up under the rails
  "cider-ruffle-velvet-dress": 0.72,
  "cider-velvet-corset-dress": 0.8,
  "cider-lace-cami-dress": 0.82,
  "cider-floral-midi-dress": 0.82,
  "cider-satin-cami-dress": 0.85,
  "cider-puff-sleeve-dress": 0.88,
  "dh-fur-coat": 0.9,
  "dh-hobo-bag": 0.8,
  "tt-striped-vest-set": 0.66,
  "rf-karmen-trousers": 0.72,
  "romi-alya-dress": 0.78,
};

function lay(lines: Line[], photo: { w: number; h: number }): Spot[] {
  return lines.flatMap((line) =>
    line.ids.map((id, i) => {
      const t = line.ids.length > 1 ? i / (line.ids.length - 1) : 0;
      const x = line.from[0] + (line.to[0] - line.from[0]) * t;
      const y = line.from[1] + (line.to[1] - line.from[1]) * t;
      const w = (line.w[0] + (line.w[1] - line.w[0]) * t) * (SIZE[id] ?? 1);
      return {
        id,
        x: (x / photo.w) * 100,
        y: (y / photo.h) * 100,
        w: (w / photo.w) * 100,
        hang: !!line.hang,
        z: line.z - i,
      };
    }),
  );
}

export const CLOSET_SPOTS = {
  wide: lay(WIDE, CLOSET_PHOTOS.wide),
  tall: lay(TALL, CLOSET_PHOTOS.tall),
};
