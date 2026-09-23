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

export type ClothesKind =
  | "coat"
  | "cardigan"
  | "robe"
  | "gown"
  | "dress"
  | "top"
  | "bottom"
  | "swim"
  | "shoes"
  | "sock"
  | "hat"
  | "bow"
  | "glasses"
  | "neck"
  | "bag"
  | "glove"
  | "belt"
  /** the catch-all: whatever has no shelf of its own yet. Today, wings. */
  | "accessory";

export interface Garment {
  label: string;
  /** where it came from */
  store: string;
  /** year and month of the order */
  bought: string;
  kind: ClothesKind;
  /**
   * Coats only: photographed done up rather than hanging open.
   *
   * The dress form shows a strip of her — and of a cardigan — through the
   * front of a coat, which is right for one shot open and wrong for one
   * buttoned: there is no opening to show anything through, so the strip
   * just cuts a window in solid cloth. Marked here, the strip is left off.
   */
  closed?: true;
}

const wardrobe = <T extends Record<string, Garment>>(t: T) => t;

export const CLOTHES = wardrobe({
  "amz-birkenstock-gizeh": { label: "Birkenstock Gizeh sandals", store: "Amazon", bought: "2021-10", kind: "shoes" },
  "amz-coutgo-heels": { label: "Patent T-strap platform heels", store: "Amazon", bought: "2023-02", kind: "shoes" },
  "amz-floral-sweatshirt": { label: "Sunflower embroidered sweatshirt", store: "Amazon · Romwe", bought: "2021-05", kind: "top" },
  "amz-maryjanes-kalstage": { label: "White double-strap Mary Janes", store: "Amazon", bought: "2023-05", kind: "shoes" },
  "amz-roller-skates": { label: "Light-up roller skates", store: "Amazon", bought: "2023-06", kind: "shoes" },
  "amz-ruffle-socks": { label: "Ruffle ankle socks", store: "Amazon", bought: "2026-01", kind: "sock" },
  "cider-star-moon-fishnets": { label: "Star and moon fishnet tights", store: "Cider", bought: "", kind: "sock" },
  "amz-ski-gloves": { label: "Touchscreen ski gloves", store: "Amazon", bought: "2023-12", kind: "glove" },
  "amz-tulle-dress-blue": { label: "Dusty blue tulle flower dress", store: "Amazon", bought: "2023-05", kind: "dress" },
  "amz-tulle-dress-green": { label: "Sage tulle flower dress", store: "Amazon", bought: "2023-05", kind: "dress" },
  "shein-ballet-bows": { label: "Ballet streamer bows", store: "Shein", bought: "2025-11", kind: "bow" },
  "shein-bow-loafers": { label: "Brown bow loafers", store: "Shein", bought: "2025-11", kind: "shoes" },
  "shein-cable-set": { label: "Cable knit polo sweater & pleated skirt", store: "Shein", bought: "2025-11", kind: "dress" },
  "shein-check-cami": { label: "Academia check cami", store: "Shein · ROMWE", bought: "2025-11", kind: "top" },
  "shein-fairisle-skirt": { label: "Fair Isle sweater skirt", store: "Shein · ROMWE", bought: "2025-11", kind: "bottom" },
  "shein-fluffy-shawl": { label: "Fluffy hooded shawl", store: "Shein", bought: "2026-03", kind: "coat" },
  "shein-mint-maryjanes": { label: "Mint Mary Jane pumps", store: "Shein", bought: "2025-11", kind: "shoes" },
  "shein-plaid-bowskirt": { label: "Plaid bow mini skirt", store: "Shein · SHEIN ICON", bought: "2025-11", kind: "bottom" },
  "shein-plaid-tieskirt": { label: "Plaid pleated tie skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "shein-pleated-khaki": { label: "Khaki pleated skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "shein-sweaterskirt-burgundy": { label: "Burgundy sweater skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "shein-sweaterskirt-navy": { label: "Navy sweater skirt", store: "Shein · Comfortcana", bought: "2025-11", kind: "bottom" },
  "temu-beach-swimsuit": { label: "Black & cream one-piece", store: "Temu", bought: "2025-05", kind: "swim" },
  "temu-bow-cami": { label: "Red bow babydoll cami", store: "Temu", bought: "2025-04", kind: "top" },
  "temu-bow-handbag": { label: "White bow handbag", store: "Temu", bought: "2023-05", kind: "bag" },
  "temu-butterfly-scarf": { label: "Butterfly crochet kerchief", store: "Temu", bought: "2023-05", kind: "hat" },
  "temu-floral-gloves": { label: "Flower fingerless gloves", store: "Temu", bought: "2023-05", kind: "glove" },
  "temu-fur-buckethat": { label: "Lime fluffy bucket hat", store: "Temu", bought: "2025-02", kind: "hat" },
  "temu-fur-headband": { label: "Green faux fur headband", store: "Temu", bought: "2025-02", kind: "hat" },
  "temu-hamster-slippers": { label: "Hamster slippers", store: "Temu", bought: "2023-05", kind: "shoes" },
  "temu-heart-bikini": { label: "Heart-link halter bikini", store: "Temu", bought: "2023-05", kind: "swim" },
  "temu-knit-miniskirt": { label: "White ribbed mini skirt", store: "Temu", bought: "2025-04", kind: "bottom" },
  "temu-knit-slipdress": { label: "Black & white bow slip dress", store: "Temu", bought: "2025-02", kind: "dress" },
  "temu-lace-gloves": { label: "Pink mesh lace gloves", store: "Temu", bought: "2023-05", kind: "glove" },
  "temu-laceup-dress": { label: "Lace-up backless dress", store: "Temu", bought: "2024-06", kind: "dress" },
  "temu-mantilla": { label: "Lace mantilla veil", store: "Temu", bought: "2023-05", kind: "hat" },
  "temu-offshoulder-dress": { label: "Black & white ruffle mini dress", store: "Temu", bought: "2025-05", kind: "dress" },
  "temu-pearl-tank": { label: "Powder blue corset top", store: "Temu", bought: "2025-04", kind: "top" },
  "temu-rose-beanie": { label: "Rose knit hood beanie", store: "Temu", bought: "2025-02", kind: "hat" },
  "temu-saddle-bag": { label: "Houndstooth saddle bag", store: "Temu", bought: "2023-05", kind: "bag" },
  "temu-satin-nightdress": { label: "Satin lace slip", store: "Temu", bought: "2023-05", kind: "dress" },
  "temu-squareneck-dress": { label: "Black ribbon mini dress", store: "Temu", bought: "2024-06", kind: "dress" },
  "temu-strawberry-bandana": { label: "Crochet heart bandana", store: "Temu", bought: "2023-05", kind: "hat" },
  "temu-tie-cardigan": { label: "Black tie-front cardigan", store: "Temu", bought: "2025-04", kind: "cardigan" },
  "ref-melanie-top": { label: "Melanie Top", store: "Reformation", bought: "2025-08", kind: "top" },
  "ref-shai-dress": { label: "Shai Dress", store: "Reformation", bought: "2025-05", kind: "dress" },
  "ref-sutton-shorts": { label: "Sutton Jean Shorts", store: "Reformation", bought: "2026-05", kind: "bottom" },
  "ref-juliet-top": { label: "Juliet Linen Top", store: "Reformation", bought: "2025-05", kind: "top" },
  "ref-ren-skirt": { label: "Ren Linen Skirt", store: "Reformation", bought: "2025-05", kind: "bottom" },
  "prada-ivory-pleated-tweed-skirt": { label: "Ivory pleated tweed mini skirt", store: "Prada", bought: "", kind: "bottom" },
  "prada-black-pleated-tweed-skirt": { label: "Black pleated tweed mini skirt", store: "Prada", bought: "", kind: "bottom" },
  "prada-pink-pleated-tweed-skirt": { label: "Pink pleated tweed mini skirt", store: "Prada", bought: "", kind: "bottom" },
  "ar-effortless-pant-black": { label: "The Effortless Pant, black", store: "Aritzia", bought: "", kind: "bottom" },
  "dh-goose-jacket-pink": { label: "Pink fur-hood parka", store: "DHgate", bought: "2026-03", kind: "coat" },
  "dh-puffer-jacket": { label: "Red fur-hood parka", store: "DHgate", bought: "2026-03", kind: "coat" },
  "etsy-burgundy-velvet-hooded-coat": { label: "Burgundy velvet hooded coat", store: "Etsy", bought: "", kind: "coat", closed: true },
  "white-fur-hood-parka": { label: "White fur-hood parka", store: "Closet", bought: "", kind: "coat" },
  "dh-fur-coat": { label: "Black faux fur coat", store: "DHgate", bought: "2026-03", kind: "coat" },
  "dh-cc-bikini": { label: "Black string bikini", store: "DHgate", bought: "2026-03", kind: "swim" },
  "dh-leather-belt": { label: "Black leather belt", store: "DHgate", bought: "2026-03", kind: "belt" },
  "dh-check-tote": { label: "Burberry check tote, red stripe", store: "DHgate", bought: "2026-03", kind: "bag" },
  "dh-rain-boots": { label: "Black rain boots", store: "DHgate", bought: "2025-12", kind: "shoes" },
  "dh-hobo-bag": { label: "Pink quilted hobo bag", store: "DHgate", bought: "2025-12", kind: "bag" },
  "dh-brown-tote": { label: "Burberry check tote", store: "DHgate", bought: "2025-05", kind: "bag" },
  "dh-cleo-bag": { label: "Mint Prada Re-Edition shoulder bag", store: "DHgate", bought: "2024-06", kind: "bag" },
  "cider-crochet-scarf": { label: "Daisy crochet kerchief", store: "Cider", bought: "2023-02", kind: "hat" },
  "cider-rib-cardigan": { label: "Lime rib tie cardigan", store: "Cider", bought: "2023-02", kind: "cardigan" },
  "cider-houndstooth-dress": { label: "Houndstooth pinafore dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-ditsy-layered-dress": { label: "Blue ditsy tiered dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-jacquard-dress": { label: "White floral jacquard dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-embroidered-dress": { label: "White embroidered mini dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-tie-shoulder-dress": { label: "Lime tie-shoulder dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-pearl-cardigan": { label: "Pastel pearl-button cardigan", store: "Cider", bought: "2023-02", kind: "cardigan" },
  "cider-toile-dress": { label: "Green toile de Jouy tiered mini", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-corduroy-dress": { label: "Teal floral corduroy dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-lemon-dress": { label: "Lemon print ruffle dress", store: "Cider", bought: "2023-02", kind: "dress" },
  "cider-fur-trim-dress": { label: "Moss velvet fur-trim dress", store: "Cider", bought: "2022-11", kind: "dress" },
  "cider-velvet-crop-blouse": { label: "Black velvet fuzzy crop top", store: "Cider", bought: "2022-11", kind: "top" },
  "cider-mesh-crop-top": { label: "Black mesh sweetheart top", store: "Cider", bought: "2022-11", kind: "top" },
  "cider-satin-corset-blouse": { label: "Cream satin corset blouse, sheer puff sleeves", store: "Cider", bought: "", kind: "top" },
  // a cropped jacket, but worn in the Shirt row of the dress form rather than
  // the Coat row: it goes over a top the way a blazer does, not over an outfit
  "prada-ivory-tweed-blazer": { label: "Ivory tweed blazer, black trim", store: "Prada", bought: "", kind: "top" },
  "prada-black-tweed-blazer": { label: "Black tweed blazer, ivory trim", store: "Prada", bought: "", kind: "top" },
  "prada-pink-tweed-blazer": { label: "Pink tweed blazer, black trim", store: "Prada", bought: "", kind: "top" },
  // jacket and skirt as one piece, so it takes the skirt row with it the way
  // a dress does — the two halves are in the wardrobe separately as well
  "prada-ivory-tweed-two-piece": { label: "Ivory tweed jacket & pleated skirt", store: "Prada", bought: "", kind: "dress" },
  "prada-black-tweed-two-piece": { label: "Black tweed jacket & pleated skirt", store: "Prada", bought: "", kind: "dress" },
  "prada-pink-tweed-two-piece": { label: "Pink tweed jacket & pleated skirt", store: "Prada", bought: "", kind: "dress" },
  "cider-velvet-bow-bustier": { label: "Black velvet bow-strap bustier", store: "Cider", bought: "", kind: "top" },
  "olive-ribbed-polo-top": { label: "Olive ribbed polo top", store: "Closet", bought: "", kind: "top" },
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
  "ar-esquire-trench": { label: "The Esquire Short Trench Coat", store: "Aritzia · Babaton", bought: "2026-08", kind: "coat", closed: true },
  "nord-icon-blazer": { label: "The Icon Relaxed Blazer", store: "Nordstrom · Open Edit", bought: "2026-06", kind: "coat" },
  "ar-bloor-sweater": { label: "Bare Merino Wool Bloor Sweater", store: "Aritzia", bought: "2026-08", kind: "top" },
  "ar-passage-cardigan": { label: "Passage Cardigan", store: "Aritzia · Babaton", bought: "2026-08", kind: "cardigan" },
  "ar-black-cream-trim-cardigan": { label: "Black cardigan, cream trim and gold buttons", store: "Aritzia", bought: "", kind: "cardigan" },
  "ar-cream-black-trim-cardigan": { label: "Cream cardigan, black trim and gold buttons", store: "Aritzia", bought: "", kind: "cardigan" },
  "ar-jewel-skort": { label: "Jewel Skort", store: "Aritzia", bought: "2026-08", kind: "bottom" },
  "cider-ruffle-skort": { label: "Chiffon ruffle hem mini skort", store: "TikTok Shop · Cider", bought: "2026-05", kind: "bottom" },
  "romi-alya-dress": { label: "Alya Maxi Dress", store: "Romi Fashion", bought: "2025-12", kind: "dress" },
  "ivory-strapless-full-skirt-maxi-dress": { label: "Ivory strapless full-skirt maxi dress", store: "Miss Circle", bought: "", kind: "dress" },
  "romi-miranda-dress": { label: "Miranda Mini Dress", store: "Romi Fashion", bought: "2025-12", kind: "dress" },
  "yellow-charlotte-dress": { label: "Charlotte Linen Dress", store: "Yellow The Label", bought: "2025-06", kind: "dress" },
  "tt-striped-vest-set": { label: "Striped vest & straight leg pants", store: "TikTok Shop · Origin Atelier", bought: "2026-06", kind: "dress" },
  "tt-striped-collar-set": { label: "Brown striped stand collar set", store: "TikTok Shop · Origin Atelier", bought: "2026-06", kind: "dress" },
  "cider-jacquard-bandeau-dress": { label: "Jacquard floral bandeau mini dress", store: "TikTok Shop · Cider", bought: "2026-06", kind: "dress" },
  "cider-wine-bandeau-dress": { label: "Wine chiffon bandeau draped dress", store: "TikTok Shop · Cider", bought: "2026-09", kind: "dress" },
  "tt-nidadie-set": { label: "Off-shoulder top & pleated skirt set", store: "TikTok Shop · NIDADIE", bought: "2025-03", kind: "dress" },
  "tt-black-slingbacks": { label: "Black patent buckle slingbacks", store: "TikTok Shop · Chic Materials", bought: "2026-06", kind: "shoes" },
  "tt-red-slingbacks": { label: "Red patent buckle slingbacks", store: "TikTok Shop · Chic Materials", bought: "2026-06", kind: "shoes" },
  "gold-round-pink-lens-sunglasses": { label: "Gold round sunglasses, pink lenses", store: "Closet", bought: "", kind: "glasses" },
  "black-cat-eye-sunglasses": { label: "Black cat-eye sunglasses", store: "Closet", bought: "", kind: "glasses" },
  "black-cat-eye-pink-lens-sunglasses": { label: "Black cat-eye sunglasses, pink lenses", store: "Closet", bought: "", kind: "glasses" },
  "butterfly-rhinestone-sunglasses-purple": { label: "Butterfly rhinestone sunglasses, purple lenses", store: "Closet", bought: "", kind: "glasses" },
  "pink-cat-eye-sunglasses": { label: "Pink cat-eye sunglasses", store: "Closet", bought: "", kind: "glasses" },
  "green-cat-eye-sunglasses": { label: "Green cat-eye sunglasses, teal lenses", store: "Closet", bought: "", kind: "glasses" },
  "tortoiseshell-cat-eye-sunglasses": { label: "Tortoiseshell cat-eye sunglasses", store: "Closet", bought: "", kind: "glasses" },
  "tan-cat-eye-sunglasses": { label: "Tan cat-eye sunglasses", store: "Closet", bought: "", kind: "glasses" },
  "clear-pink-cat-eye-sunglasses": { label: "Clear pink cat-eye sunglasses", store: "Closet", bought: "", kind: "glasses" },
  "tt-wine-oval-sunglasses": { label: "Wine oval sunglasses", store: "TikTok Shop · Chic Vizio", bought: "2026-09", kind: "glasses" },
  "tt-satin-bow-ties": { label: "Satin bow hair ties", store: "TikTok Shop · NANYOU", bought: "2026-06", kind: "bow" },
  "tt-plaid-halter-dress": { label: "Vintage plaid halter dress with velvet bows", store: "TikTok Shop · SML Vogue", bought: "2026-09", kind: "dress" },
  "tt-plaid-blazer-set": { label: "Khaki plaid blazer & mini skirt set", store: "TikTok Shop · Chic Modern Suits", bought: "2026-08", kind: "dress" },
  "etsy-purple-veil": { label: "Purple chapel veil with floral embroidery", store: "Etsy · MariaVeils", bought: "2023-11", kind: "hat" },
  "etsy-green-lace-veil": { label: "Green lace veil with daisy embroidery", store: "Etsy", bought: "", kind: "hat" },
  "etsy-floral-embroidered-veil": { label: "Taupe veil embroidered with flowers", store: "Etsy", bought: "", kind: "hat" },
  "etsy-gold-floral-veil": { label: "Gold veil embroidered with flowers", store: "Etsy", bought: "", kind: "hat" },
  "etsy-black-gold-veil-long": { label: "Black veil with gold embroidery and a long train", store: "Etsy", bought: "", kind: "hat" },
  "etsy-deep-blue-veil": { label: "Deep blue lace veil", store: "Etsy", bought: "", kind: "hat" },
  "etsy-copper-lace-veil": { label: "Copper lace veil", store: "Etsy", bought: "", kind: "hat" },
  "etsy-bernadette-veil": { label: "St Bernadette infinity veil", store: "Etsy · StLinusVeils", bought: "2023-11", kind: "hat" },
  "temu-floral-lingerie-set": { label: "Floral embroidery lingerie set", store: "Temu", bought: "2024-05", kind: "swim" },
  "shein-bear-ear-bonnet": { label: "Fluffy bear-ear bonnet", store: "Shein", bought: "2024", kind: "hat" },
  "shein-black-fur-beanie": { label: "Black faux fur beanie", store: "Shein", bought: "2024", kind: "hat" },
  "shein-sailor-collar": { label: "Rose Milk sailor collar", store: "Shein", bought: "2024", kind: "neck" },
  "chiffon-neck-scarf-black": { label: "Black chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-yellow": { label: "Yellow chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-navy": { label: "Navy chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-green": { label: "Dark green chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-ivory": { label: "Ivory chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-burgundy": { label: "Burgundy chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-purple": { label: "Purple chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-brown": { label: "Brown chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "chiffon-neck-scarf-light-blue": { label: "Light blue chiffon neck scarf", store: "Closet", bought: "", kind: "neck" },
  "shein-green-organza-dress": { label: "Green dress with organza sleeves", store: "Shein", bought: "2024", kind: "dress" },
  "shein-lamb-bonnet": { label: "Lamb-ear lace bonnet", store: "Shein", bought: "2024", kind: "hat" },
  "shein-white-fur-hat": { label: "White faux fur hat", store: "Shein", bought: "2024", kind: "hat" },
  "shein-mint-fur-bucket-hat": { label: "Mint faux fur bucket hat", store: "Shein", bought: "2024", kind: "hat" },
  "shein-bee-tank": { label: "Cream bee knit cami", store: "Shein", bought: "2024", kind: "top" },
  "shein-bunny-tank": { label: "Pink bunny pom-pom cami", store: "Shein", bought: "2024", kind: "top" },
  "shein-kitten-tank": { label: "“Always together” kitten cami", store: "Shein", bought: "2024", kind: "top" },
  "shein-cable-knit-skirt": { label: "Cream cable knit pom-pom skirt", store: "Shein", bought: "2024", kind: "bottom" },
  "shein-fur-snow-boots": { label: "Tan fur-cuff snow boots", store: "Shein", bought: "2024", kind: "shoes" },
  "cream-fluffy-coat": { label: "Cream faux fur coat with pom-poms", store: "Closet", bought: "2024", kind: "coat" },
  "brown-quilted-knit-jacket": { label: "Brown quilted vest with cable-knit sleeves", store: "Closet", bought: "2024", kind: "coat", closed: true },
  "yellow-floral-dress": { label: "Yellow floral sweetheart dress", store: "Closet", bought: "2024", kind: "dress" },
  "brown-bow-dress": { label: "Brown pleated dress with a bow", store: "Closet", bought: "2024", kind: "dress" },
  "cider-suede-bow-pinafore": { label: "Brown suede bow pinafore mini", store: "Cider", bought: "", kind: "dress" },
  "cider-brown-corduroy-daisy-pinafore": { label: "Brown corduroy daisy dress, lace trim", store: "Cider", bought: "", kind: "dress" },
  "cider-brown-floral-mermaid-maxi": { label: "Brown mesh mermaid maxi, floral appliqué", store: "Cider", bought: "", kind: "dress" },
  "maroon-corduroy-overall-dress": { label: "Maroon corduroy pinafore dress", store: "Closet", bought: "2024", kind: "dress" },
  "lavender-flower-dress": { label: "Lavender 3D flower tulle dress", store: "Closet", bought: "2024", kind: "dress" },
  "burberry-canvas-tote": { label: "Burberry canvas tote", store: "Closet", bought: "2024", kind: "bag" },
  "prada-blue-bag": { label: "Baby blue Prada bag", store: "Closet", bought: "2024", kind: "bag" },
  "prada-tan-shoulder-bag": { label: "Tan Prada leather shoulder bag", store: "Closet", bought: "", kind: "bag" },
  "prada-red-patent-cleo-bag": { label: "Red patent Prada Cleo bag", store: "Closet", bought: "", kind: "bag" },
  "gucci-gg-shoulder-bag": { label: "Gucci GG shoulder bag", store: "Closet", bought: "2024", kind: "bag" },
  "heart-sunglasses": { label: "Cream heart sunglasses", store: "Closet", bought: "2024", kind: "glasses" },
  "pink-marabou-lingerie-set": { label: "Pink marabou robe & lilac lace set", store: "Closet", bought: "2024", kind: "swim" },
  "icelandic-white-fur-hat": { label: "Icelandic white fur hat", store: "Closet", bought: "2024", kind: "hat" },
  "rhone-utility-trench-navy": { label: "Utility trench coat, navy", store: "Rhone", bought: "", kind: "coat", closed: true },
  "zeagoo-fur-lapel-wool-coat-navy": { label: "Faux fur lapel double-breasted wool coat, navy", store: "Zeagoo", bought: "2018", kind: "coat", closed: true },
  "wona-istanbul-chiffon-ruffle-dress-black": { label: "Istanbul black chiffon ruffled high-low dress", store: "WONA", bought: "", kind: "dress" },
  "blue-corset-mini-dress": { label: "Blue corset mini dress", store: "Closet", bought: "", kind: "dress" },
  "bw-bow-slingback-heels-front": { label: "Black-and-white bow slingback heels", store: "Closet", bought: "", kind: "shoes" },
  "sage-burgundy-bow-slingback-heels-front": { label: "Sage and burgundy bow slingback heels", store: "Closet", bought: "", kind: "shoes" },
  "ivory-ribbon-hair-bow": { label: "Ivory oversized ribbon bow", store: "Closet", bought: "", kind: "bow" },
  "white-lace-pleated-mini-skirt": { label: "White lace pleated mini skirt", store: "Closet", bought: "", kind: "bottom" },
  "chanel-white-knit-tank-black-trim": { label: "White knit tank, black trim", store: "Closet", bought: "", kind: "top" },
  "chanel-white-pleated-knit-skirt": { label: "White pleated knit skirt, black hem", store: "Closet", bought: "", kind: "bottom" },
  "black-ruffle-pleated-skirt": { label: "Black ruffle pleated skirt", store: "Closet", bought: "", kind: "bottom" },
  "black-long-ribbon-bow": { label: "Black long ribbon bow", store: "Closet", bought: "", kind: "bow" },
  "yellow-bow-kitten-heels": { label: "Yellow bow kitten heels", store: "Closet", bought: "", kind: "shoes" },
  "black-belted-pleated-shorts": { label: "Black belted pleated shorts", store: "Closet", bought: "", kind: "bottom" },
  "white-cat-eye-sunglasses": { label: "White cat-eye sunglasses", store: "Closet", bought: "", kind: "glasses" },
  "black-beige-pleated-belted-dress": { label: "Black and beige pleated belted dress", store: "Closet", bought: "2026", kind: "dress" },
  "denim-corset-flared-dress": { label: "Denim corset flared midi dress", store: "Closet · Parker", bought: "", kind: "dress" },
  "maroon-wool-trench-coat": { label: "Maroon wool trench coat", store: "Closet", bought: "2016", kind: "coat", closed: true },
  "green-wool-cropped-jacket-ruffle-skirt-set": { label: "Green wool cropped jacket & ruffle skirt set", store: "Closet · M&S", bought: "", kind: "dress" },
  "forever21-coca-cola-red-swimsuit": { label: "Red Coca-Cola one-piece swimsuit", store: "Forever 21", bought: "2025", kind: "swim" },
  "eollystrel-burgundy-lace-corset-top": { label: "Burgundy lace-trim corset top", store: "Closet · eollystrel", bought: "", kind: "top" },
  "hm-black-white-piped-keyhole-mini-dress": { label: "White keyhole mini dress with black piping", store: "H&M", bought: "2026", kind: "dress" },
  "strawberry-print-pink-string-bikini": { label: "Pink strawberry-print string bikini", store: "Closet", bought: "", kind: "swim" },
  "black-pink-trim-string-bikini": { label: "Black string bikini with pink trim", store: "Closet", bought: "", kind: "swim" },
  "black-patent-chain-platform-loafers": { label: "Black patent chain platform loafers", store: "Closet", bought: "", kind: "shoes" },
  "black-patent-triple-strap-platform-mary-janes": { label: "Black patent triple-strap platform Mary Janes", store: "Closet", bought: "", kind: "shoes" },
  "pink-sherpa-pom-pom-bucket-bag": { label: "Pink sherpa pom-pom bucket bag", store: "Closet", bought: "", kind: "bag" },
  "white-feather-angel-wings-halo-set": { label: "White feather angel wings & halo", store: "Closet", bought: "", kind: "accessory" },
  "black-feather-angel-wings-halo-set": { label: "Black feather angel wings & halo", store: "Closet", bought: "", kind: "accessory" },
  "black-faux-fur-cuff-bracelets-pair": { label: "Black faux fur cuff bracelets (pair)", store: "Closet", bought: "", kind: "glove" },
  "white-faux-fur-cuff-bracelets-pair": { label: "White faux fur cuff bracelets (pair)", store: "Closet", bought: "", kind: "glove" },
  "white-prada-re-edition-shoulder-bag": { label: "White Prada Re-Edition shoulder bag", store: "Closet", bought: "", kind: "bag" },
  // the same pair again, shot straight on: it stands square on her feet,
  // where the three-quarter one reads better on the closet floor
  "louis-vuitton-damier-peep-toe-heels-front": { label: "Louis Vuitton Damier peep-toe heels", store: "Closet", bought: "", kind: "shoes" },
  "green-suede-lace-up-block-heels": { label: "Green suede lace-up block heels", store: "Closet", bought: "", kind: "shoes" },
  "cider-brown-knee-high-boots": { label: "Brown chunky knee-high boots", store: "Cider", bought: "", kind: "shoes" },
  "brown-patent-ankle-strap-pumps": { label: "Brown patent ankle-strap pumps", store: "Closet", bought: "", kind: "shoes" },
  "brown-patent-two-strap-pumps": { label: "Brown patent two-strap pumps", store: "Closet", bought: "", kind: "shoes" },
  "navy-suede-ankle-strap-pumps": { label: "Navy suede ankle-strap pumps", store: "Closet", bought: "", kind: "shoes" },
  "burgundy-ribbon-tie-block-heels": { label: "Burgundy ribbon-tie block heels", store: "Closet", bought: "", kind: "shoes" },
  "black-white-tstrap-pointed-pumps": { label: "Black and white T-strap pointed pumps", store: "Closet", bought: "", kind: "shoes" },
  "black-patent-gold-buckle-mary-jane-heels": { label: "Black patent gold-buckle Mary Jane heels", store: "Closet", bought: "", kind: "shoes" },
  "louis-vuitton-denim-monogram-pochette": { label: "Louis Vuitton denim monogram pochette", store: "Closet", bought: "", kind: "bag" },
  "louis-vuitton-damier-azur-felicie-pochette": { label: "Louis Vuitton Damier Azur pochette", store: "Closet", bought: "", kind: "bag" },
  "brown-faux-fur-round-hat": { label: "Brown faux fur round hat", store: "Closet", bought: "", kind: "hat" },
  "light-blue-floral-lace-trim-head-scarf": { label: "Light blue floral head scarf with gold lace", store: "Closet", bought: "", kind: "hat" },
  "pink-floral-lace-trim-head-scarf": { label: "Pink floral head scarf with lace trim", store: "Closet", bought: "", kind: "hat" },
  "lavender-lace-head-scarf": { label: "Lavender lace head scarf", store: "Closet", bought: "", kind: "hat" },
  "gold-lace-head-scarf": { label: "Gold lace head scarf", store: "Closet", bought: "", kind: "hat" },
  "navy-celestial-velvet-gown": { label: "Navy velvet gown, embroidered with stars", store: "Closet", bought: "", kind: "gown" },
  "black-bow-glitter-tulle-gown": { label: "Black glitter tulle gown with ribbon bows", store: "Closet", bought: "", kind: "gown" },
  "grape-cluster-organza-mermaid-gown": { label: "Blue and green organza mermaid gown, beaded with grape clusters", store: "Closet", bought: "", kind: "gown" },
  "macaw-print-gold-silk-ball-gown": { label: "Gold silk ball gown printed with macaws, red scarf sleeves", store: "Closet", bought: "", kind: "gown" },
  "midnight-star-flamingo-embroidered-gown": { label: "Midnight gown scattered with stars, embroidered with flowers and flamingos, with a long veil", store: "Closet", bought: "", kind: "gown" },
  "midsommar-wildflower-gown": { label: "Midsommar gown, made entirely of wildflowers", store: "Closet", bought: "", kind: "gown" },
  "beige-rib-knit-pom-pom-ears-beanie": { label: "Beige rib-knit beanie with pom-pom ears", store: "Closet", bought: "", kind: "hat" },
  "navy_satin_lace_slip_dress_sticker": { label: "Navy satin lace slip dress", store: "Closet", bought: "", kind: "dress" },
  "cream_rose_floral_lace_dress_sticker": { label: "Cream rose floral ruffle dress", store: "Closet", bought: "", kind: "dress" },
  "ivory_satin_lace_slip_dress_sticker": { label: "Ivory satin lace slip dress", store: "Closet", bought: "", kind: "dress" },
  "forest_green_lace_satin_dress_sticker": { label: "Forest green lace babydoll dress", store: "Closet", bought: "", kind: "dress" },
  "mint_green_ruffled_corset_gown_sticker": { label: "Mint green ruffled corset gown", store: "Closet", bought: "", kind: "gown" },
  "powder_blue_scarf_maxi_dress_sticker": { label: "Powder blue maxi dress with scarf", store: "Closet", bought: "", kind: "dress" },
  "arianna-dress": { label: "Arianna dress · dove grey tulle ball gown with opera gloves", store: "Closet", bought: "", kind: "gown" },
  "peacock-dress": { label: "Peacock dress · beaded sheer bodice and a train of peacock feathers", store: "Closet", bought: "", kind: "gown" },
  "rhianna-dress": { label: "Rhianna dress · marigold brocade gown trimmed in fur", store: "Closet", bought: "", kind: "gown" },
  "yellow-ball-gown": { label: "Yellow ball gown · beaded corset and sunset organza", store: "Closet", bought: "", kind: "gown" },
  "etsy-wildflower-embroidered-gown": { label: "Ivory tulle gown embroidered with wildflowers", store: "Etsy", bought: "", kind: "gown" },
  "peacock-wings": { label: "Peacock feather wings", store: "Closet", bought: "", kind: "accessory" },
  "outfit_suit_brocade_robe_crimson_gold_regal_sticker": { label: "Crimson suit under a gold brocade robe · black gloves and jeweled brooches", store: "Closet", bought: "", kind: "robe" },
  "cape_royal_pleated_jeweled_cobalt_blue_sticker": { label: "Royal cobalt blue pleated cape · jeweled capelet trimmed in ivory fur", store: "Closet", bought: "", kind: "robe" },
  "mughal-couture-ensemble": { label: "Mughal-inspired couture ensemble · black velvet cape painted with court scenes, over a gold-embroidered sherwani", store: "Closet", bought: "", kind: "robe" },
  "cloud_cardigan_blue_white_knit_sticker": { label: "Blue cloud knit cardigan", store: "Closet", bought: "", kind: "cardigan" },
  "red-faux-fur-round-hat": { label: "Red faux fur round hat", store: "Closet", bought: "", kind: "hat" },
  "burgundy-wool-beret": { label: "Burgundy wool beret", store: "Closet", bought: "", kind: "hat" },
  "navy-wool-beret": { label: "Navy wool beret", store: "Closet", bought: "", kind: "hat" },
  "brown-wool-beret": { label: "Brown wool beret", store: "Closet", bought: "", kind: "hat" },
  "yellow-wool-beret": { label: "Yellow wool beret", store: "Closet", bought: "", kind: "hat" },
  "light-blue-wool-beret": { label: "Light blue wool beret", store: "Closet", bought: "", kind: "hat" },
  "cream-wool-beret": { label: "Cream wool beret", store: "Closet", bought: "", kind: "hat" },
  "pink-faux-fur-round-hat": { label: "Pink faux fur round hat", store: "Closet", bought: "", kind: "hat" },
  "green-faux-fur-round-hat": { label: "Green faux fur round hat", store: "Closet", bought: "", kind: "hat" },
});

export type GarmentId = keyof typeof CLOTHES;

export const garment = (id: string): Garment | undefined => (CLOTHES as Record<string, Garment>)[id];

/** pieces whose picture has its own file name, not the id (the shoes, re-cut as pairs) */
const IMAGE: Partial<Record<string, string>> = {
  "shein-mint-maryjanes": "shoe_mary_jane_mint_pumps_sticker",
  "amz-coutgo-heels": "shoe_tstrap_patent_black_platform_heels_sticker",
  "amz-maryjanes-kalstage": "shoe_mary_jane_white_double_strap_sticker",
  "shein-bow-loafers": "shoe_loafers_brown_bow_sticker",
  "amz-birkenstock-gizeh": "shoe_sandals_birkenstock_gizeh_brown_sticker",
  "temu-hamster-slippers": "shoe_slippers_hamster_sticker",
  "amz-roller-skates": "shoe_roller_skates_lavender_light_up_sticker",
  "dh-rain-boots": "shoe_rain_boots_black_double_c_sticker",
  "tt-black-slingbacks": "shoe_slingbacks_black_patent_buckle_sticker",
  "tt-red-slingbacks": "shoe_slingbacks_red_patent_buckle_sticker",
  "shein-fur-snow-boots": "shoe_snow_boots_tan_fur_cuff_sticker",
};

export const closetSrc = (id: string) => `${process.env.PUBLIC_URL}/palais/closet/${IMAGE[id] ?? id}.webp`;

/** the catalogue's shelves in the closet, one per kind of thing */
export const WARDROBE_SHELVES: { key: ClothesKind; name: string; emoji: string }[] = [
  { key: "coat", name: "Coats", emoji: "🧥" },
  { key: "cardigan", name: "Cardigans", emoji: "🥼" },
  { key: "robe", name: "Robes", emoji: "👘" },
  { key: "gown", name: "Gowns", emoji: "👑" },
  { key: "dress", name: "Dresses", emoji: "👗" },
  { key: "top", name: "Tops & knits", emoji: "👚" },
  { key: "bottom", name: "Skirts & shorts", emoji: "🩳" },
  { key: "swim", name: "Swim", emoji: "👙" },
  { key: "shoes", name: "Shoes", emoji: "👠" },
  { key: "sock", name: "Socks & tights", emoji: "🧦" },
  { key: "hat", name: "Hats", emoji: "👒" },
  { key: "bow", name: "Bows", emoji: "🎀" },
  { key: "glasses", name: "Glasses", emoji: "🕶️" },
  { key: "neck", name: "Collars & scarves", emoji: "🧣" },
  { key: "bag", name: "Bags", emoji: "👜" },
  { key: "glove", name: "Gloves & cuffs", emoji: "🧤" },
  { key: "belt", name: "Belts", emoji: "🪢" },
  { key: "accessory", name: "Accessories", emoji: "✨" },
];

/* ---- where everything goes --------------------------------------------- */

type Pt = [number, number];

export interface Line {
  /** stable, for remembering a rearrangement */
  id: string;
  /** what the catalogue's Racks page calls it */
  name: string;
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
  /** a row of this many hooks, from `from` to `to`: each piece hangs straight
      off a hook, with no hanger, spread out along the row */
  hooks?: number;
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
  /** hung straight off a hook, rather than on a hanger over a rail */
  hook?: boolean;
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
  { id: "left-rail", name: "Narrow left bay · rail", ids: ["cider-jacquard-bandeau-dress", "cider-fur-trim-dress", "cider-wine-bandeau-dress", "temu-laceup-dress", "cider-houndstooth-dress", "romi-miranda-dress", "temu-knit-slipdress", "cider-fluffy-mesh-dress"], from: [334, 367], to: [414, 397], w: [100, 88], hang: true, z: 50 },
  { id: "left-shelf", name: "Narrow left bay · shelf", ids: ["tt-satin-bow-ties", "amz-ski-gloves", "dh-leather-belt", "cider-crochet-scarf", "amz-ruffle-socks", "cider-star-moon-fishnets", "ivory-ribbon-hair-bow"], from: [352, 684], to: [420, 672], w: [74, 66], z: 52 },
  // the little rail over the cubbies, and the cubbies
  { id: "cubby-rail", name: "Cubbies · little rail", ids: ["tt-nidadie-set", "cider-lace-cami-dress", "temu-squareneck-dress", "temu-satin-nightdress", "temu-beach-swimsuit", "cider-satin-cami-dress", "tt-plaid-halter-dress"], from: [480, 327], to: [520, 349], w: [76, 68], hang: true, z: 40 },
  { id: "cubby-top", name: "Cubbies · on top", ids: ["temu-fur-buckethat", "temu-rose-beanie"], from: [492, 486], to: [540, 480], w: [58, 54], z: 38 },
  { id: "cubby-row-1", name: "Cubbies · middle row", ids: ["temu-lace-gloves", "black-long-ribbon-bow", "black-faux-fur-cuff-bracelets-pair"], from: [487, 577], to: [543, 572], w: [26, 24], z: 36 },
  { id: "cubby-row-2", name: "Cubbies · lower row", ids: ["temu-floral-gloves", "shein-ballet-bows", "white-faux-fur-cuff-bracelets-pair"], from: [487, 676], to: [516, 672], w: [27, 26], z: 36 },
  // the very narrow column of shelves by the mirror
  { id: "mirror-shelves", name: "Little shelves by the mirror", ids: ["temu-butterfly-scarf", "temu-strawberry-bandana"], from: [1398, 360], to: [1398, 770], w: [52, 52], z: 36 },
  // the inner right bay: tops above, skirts below
  { id: "right-top", name: "Right bay · top rail", ids: ["temu-offshoulder-dress", "shein-cable-set", "shein-check-cami", "cloud_cardigan_blue_white_knit_sticker"], from: [1598, 200], to: [1472, 280], w: [104, 92], hang: true, z: 70 },
  { id: "right-low", name: "Right bay · lower rail", ids: ["shein-plaid-bowskirt", "ref-ren-skirt", "prada-ivory-pleated-tweed-skirt", "prada-black-pleated-tweed-skirt", "prada-pink-pleated-tweed-skirt", "ar-effortless-pant-black", "shein-fairisle-skirt", "shein-plaid-tieskirt", "shein-pleated-khaki", "ref-sutton-shorts"], from: [1598, 638], to: [1472, 622], w: [100, 90], hang: true, z: 72 },
  // the middle of the window seat, between the two rails
  // hooks on the moulding round the window: a row along its top, and a row down its right side, beside the mirror
  { id: "window-hooks-top", name: "Window moulding · hooks across the top", ids: ["shein-white-fur-hat", "shein-bear-ear-bonnet", "shein-mint-fur-bucket-hat", "shein-lamb-bonnet", "shein-black-fur-beanie", "icelandic-white-fur-hat", "brown-faux-fur-round-hat", "beige-rib-knit-pom-pom-ears-beanie", "lavender-lace-head-scarf", "red-faux-fur-round-hat", "burgundy-wool-beret", "navy-wool-beret", "brown-wool-beret", "yellow-wool-beret", "light-blue-wool-beret", "cream-wool-beret", "pink-faux-fur-round-hat", "green-faux-fur-round-hat"], from: [640, 281], to: [1180, 281], w: [60, 60], hang: true, z: 36, hooks: 12 },
  { id: "window-hooks-side", name: "Window moulding · hooks down the right", ids: ["etsy-purple-veil", "etsy-green-lace-veil", "etsy-floral-embroidered-veil", "etsy-gold-floral-veil", "etsy-black-gold-veil-long", "etsy-deep-blue-veil", "etsy-copper-lace-veil", "temu-mantilla", "temu-fur-headband", "etsy-bernadette-veil", "light-blue-floral-lace-trim-head-scarf", "pink-floral-lace-trim-head-scarf", "gold-lace-head-scarf"], from: [1219, 336], to: [1219, 636], w: [54, 54], hang: true, z: 36, hooks: 7 },
  { id: "window-hooks-left", name: "Window moulding · hooks down the left", ids: ["pink-sherpa-pom-pom-bucket-bag"], from: [601, 336], to: [601, 636], w: [54, 54], hang: true, z: 36, hooks: 6 },
  { id: "seat", name: "Window seat", ids: ["temu-saddle-bag", "shein-fluffy-shawl", "temu-bow-handbag", "white-prada-re-edition-shoulder-bag", "louis-vuitton-denim-monogram-pochette", "louis-vuitton-damier-azur-felicie-pochette"], from: [918, 690], to: [1020, 690], w: [74, 74], z: 20 },
  // the two rolling rails
  { id: "rack-left", name: "Left rolling rack", ids: ["ref-shai-dress", "amz-tulle-dress-blue", "amz-tulle-dress-green", "cider-ruffle-velvet-dress", "cider-velvet-corset-dress", "shein-green-organza-dress", "wona-istanbul-chiffon-ruffle-dress-black", "blue-corset-mini-dress", "black-beige-pleated-belted-dress", "denim-corset-flared-dress", "hm-black-white-piped-keyhole-mini-dress", "mint_green_ruffled_corset_gown_sticker", "powder_blue_scarf_maxi_dress_sticker", "arianna-dress", "peacock-dress", "rhianna-dress", "yellow-ball-gown", "etsy-wildflower-embroidered-gown", "navy-celestial-velvet-gown", "black-bow-glitter-tulle-gown"], from: [622, 612], to: [868, 612], w: [118, 118], hang: true, z: 46 },
  { id: "rack-right", name: "Right rolling rack", ids: ["dh-puffer-jacket", "etsy-burgundy-velvet-hooded-coat", "white-fur-hood-parka", "dh-goose-jacket-pink", "amz-floral-sweatshirt", "temu-tie-cardigan", "temu-heart-bikini", "dh-fur-coat", "dh-cc-bikini", "tt-striped-vest-set", "tt-striped-collar-set", "rhone-utility-trench-navy", "zeagoo-fur-lapel-wool-coat-navy", "maroon-wool-trench-coat", "green-wool-cropped-jacket-ruffle-skirt-set", "navy_satin_lace_slip_dress_sticker", "cream_rose_floral_lace_dress_sticker", "ivory_satin_lace_slip_dress_sticker", "forest_green_lace_satin_dress_sticker"], from: [1066, 612], to: [1314, 612], w: [112, 104], hang: true, z: 46 },
  // every pair of shoes, lined up on the tiles in front
  { id: "shoes", name: "Shoes on the floor", ids: ["shein-mint-maryjanes", "amz-coutgo-heels", "amz-maryjanes-kalstage", "shein-bow-loafers", "amz-birkenstock-gizeh", "temu-hamster-slippers", "amz-roller-skates", "dh-rain-boots", "tt-black-slingbacks", "tt-red-slingbacks", "shein-fur-snow-boots", "bw-bow-slingback-heels-front", "sage-burgundy-bow-slingback-heels-front", "yellow-bow-kitten-heels", "black-patent-chain-platform-loafers", "black-patent-triple-strap-platform-mary-janes", "louis-vuitton-damier-peep-toe-heels-front", "green-suede-lace-up-block-heels", "cider-brown-knee-high-boots", "brown-patent-ankle-strap-pumps", "brown-patent-two-strap-pumps", "navy-suede-ankle-strap-pumps", "burgundy-ribbon-tie-block-heels", "black-white-tstrap-pointed-pumps", "black-patent-gold-buckle-mary-jane-heels"], from: [560, 1030], to: [1380, 1030], w: [84, 84], z: 60 },
  // the outer left bay, which only a wide screen shows all of: more dresses below, knits above
  { id: "outer-left-low", name: "Outer left bay · lower rail", ids: ["yellow-charlotte-dress", "romi-alya-dress", "cider-brown-floral-mermaid-maxi", "ivory-strapless-full-skirt-maxi-dress", "cider-lemon-dress", "cider-ditsy-layered-dress", "cider-jacquard-dress", "cider-embroidered-dress", "cider-tie-shoulder-dress", "cider-toile-dress", "cider-corduroy-dress", "cider-puff-sleeve-dress", "cider-floral-midi-dress"], from: [52, 292], to: [236, 348], w: [128, 110], hang: true, z: 80 },
  { id: "outer-left-top", name: "Outer left bay · top rail", ids: ["cider-velvet-playsuit", "cider-pastel-dress", "ar-esquire-trench", "nord-icon-blazer", "tt-plaid-blazer-set", "cream-fluffy-coat", "brown-quilted-knit-jacket"], from: [48, 98], to: [236, 198], w: [112, 96], hang: true, z: 60 },
  // the third bar, added under the two in the inner right bay: short knits
  { id: "right-bottom", name: "Right bay · bottom bar", ids: ["cider-rib-cardigan", "cider-mesh-crop-top", "cider-geometric-knit", "prada-ivory-tweed-blazer", "prada-black-tweed-blazer", "prada-pink-tweed-blazer", "ar-black-cream-trim-cardigan", "ar-cream-black-trim-cardigan", "cider-satin-corset-blouse", "cider-velvet-bow-bustier", "olive-ribbed-polo-top", "chanel-white-knit-tank-black-trim", "cider-pearl-cardigan", "cider-velvet-crop-blouse", "ar-jewel-skort", "cider-ruffle-skort"], from: [1598, 786], to: [1472, 770], w: [96, 88], hang: true, z: 74 },
  // bags on the outer right bay's shelves
  { id: "outer-right-upper", name: "Outer right shelves · upper", ids: ["dh-check-tote", "dh-hobo-bag"], from: [1840, 546], to: [1675, 548], w: [94, 86], z: 30 },
  { id: "outer-right-lower", name: "Outer right shelves · lower", ids: ["dh-brown-tote", "dh-cleo-bag"], from: [1845, 752], to: [1680, 716], w: [98, 90], z: 32 },
  // the bottom row of cubbies: sunglasses
  { id: "cubby-row-3", name: "Cubbies · bottom row", ids: ["gold-round-pink-lens-sunglasses", "black-cat-eye-sunglasses", "black-cat-eye-pink-lens-sunglasses", "butterfly-rhinestone-sunglasses-purple", "pink-cat-eye-sunglasses", "green-cat-eye-sunglasses", "tortoiseshell-cat-eye-sunglasses", "tan-cat-eye-sunglasses", "clear-pink-cat-eye-sunglasses", "tt-wine-oval-sunglasses", "heart-sunglasses", "white-cat-eye-sunglasses"], from: [487, 772], to: [543, 766], w: [27, 26], z: 36 },
  // the second bar in the inner right bay, and the bar in the bottom of the narrow left bay
  { id: "right-middle", name: "Right bay · middle bar", ids: ["ref-melanie-top", "ref-juliet-top", "temu-pearl-tank", "temu-bow-cami", "shein-bee-tank", "shein-bunny-tank", "shein-kitten-tank"], from: [1598, 404], to: [1474, 438], w: [100, 92], hang: true, z: 68 },
  { id: "left-bottom", name: "Narrow left bay · bottom bar", ids: ["shein-sweaterskirt-burgundy", "shein-sweaterskirt-navy", "temu-knit-miniskirt", "shein-cable-knit-skirt", "white-lace-pleated-mini-skirt"], from: [338, 714], to: [432, 694], w: [84, 76], hang: true, z: 48 },
  { id: "left-top", name: "Narrow left bay · top bar", ids: ["ar-bloor-sweater", "ar-passage-cardigan"], from: [336, 245], to: [432, 281], w: [78, 70], hang: true, z: 46 },
  // the bars added to the outer bays, left empty to be filled from the Racks page
  { id: "outer-left-bottom", name: "Outer left bay · bottom bar", ids: ["yellow-floral-dress", "brown-bow-dress", "prada-ivory-tweed-two-piece", "prada-black-tweed-two-piece", "prada-pink-tweed-two-piece", "cider-suede-bow-pinafore", "cider-brown-corduroy-daisy-pinafore", "maroon-corduroy-overall-dress", "lavender-flower-dress", "strawberry-print-pink-string-bikini", "black-pink-trim-string-bikini", "grape-cluster-organza-mermaid-gown", "macaw-print-gold-silk-ball-gown", "midnight-star-flamingo-embroidered-gown", "midsommar-wildflower-gown"], from: [58, 748], to: [282, 709], w: [92, 82], hang: true, z: 90 },
  { id: "outer-right-top", name: "Outer right bay · top bar", ids: ["black-ruffle-pleated-skirt", "chanel-white-pleated-knit-skirt", "black-belted-pleated-shorts", "white-feather-angel-wings-halo-set", "black-feather-angel-wings-halo-set", "peacock-wings"], from: [1830, 76], to: [1664, 130], w: [84, 76], hang: true, z: 30 },
  { id: "outer-right-second", name: "Outer right bay · second bar", ids: ["temu-floral-lingerie-set", "shein-sailor-collar", "chiffon-neck-scarf-black", "chiffon-neck-scarf-yellow", "chiffon-neck-scarf-navy", "chiffon-neck-scarf-green", "chiffon-neck-scarf-ivory", "chiffon-neck-scarf-burgundy", "chiffon-neck-scarf-purple", "chiffon-neck-scarf-brown", "chiffon-neck-scarf-light-blue", "pink-marabou-lingerie-set", "forever21-coca-cola-red-swimsuit", "eollystrel-burgundy-lace-corset-top"], from: [1830, 158], to: [1664, 250], w: [90, 82], hang: true, z: 30 },
  { id: "outer-right-bottom", name: "Outer right bay · bottom bar", ids: ["burberry-canvas-tote", "prada-blue-bag", "prada-tan-shoulder-bag", "prada-red-patent-cleo-bag", "gucci-gg-shoulder-bag"], from: [1852, 772], to: [1662, 738], w: [92, 84], hang: true, z: 32 },
];

/* The tall photograph for phones (941 × 1672). A phone crops its sides, so
   everything stays inside about 90–850 across. The tiles take up the whole
   bottom half here, so the rolling rails stand one behind the other. */
const TALL: Line[] = [
  { id: "left-rail", name: "Narrow left bay · rail", ids: ["temu-knit-slipdress", "temu-laceup-dress", "temu-squareneck-dress", "temu-satin-nightdress", "cider-houndstooth-dress", "cider-fur-trim-dress", "cider-fluffy-mesh-dress", "cider-satin-cami-dress", "cider-lace-cami-dress", "tt-nidadie-set", "tt-plaid-halter-dress"], from: [156, 580], to: [200, 605], w: [60, 54], hang: true, z: 50 },
  { id: "right-top", name: "Right bay · top rail", ids: ["temu-offshoulder-dress", "shein-cable-set", "shein-check-cami", "black-ruffle-pleated-skirt", "chanel-white-pleated-knit-skirt", "black-belted-pleated-shorts"], from: [830, 470], to: [754, 520], w: [74, 64], hang: true, z: 70 },
  { id: "right-low", name: "Right bay · lower rail", ids: ["shein-fairisle-skirt", "shein-plaid-bowskirt", "shein-plaid-tieskirt", "shein-pleated-khaki", "ref-sutton-shorts", "ref-ren-skirt", "prada-ivory-pleated-tweed-skirt", "prada-black-pleated-tweed-skirt", "prada-pink-pleated-tweed-skirt", "ar-effortless-pant-black", "strawberry-print-pink-string-bikini", "black-pink-trim-string-bikini"], from: [834, 902], to: [756, 888], w: [72, 64], hang: true, z: 72 },
  // the window seat
  { id: "seat", name: "Window seat", ids: ["temu-saddle-bag", "shein-fluffy-shawl", "temu-bow-handbag", "dh-check-tote", "dh-hobo-bag", "dh-brown-tote", "burberry-canvas-tote", "prada-blue-bag", "prada-tan-shoulder-bag", "prada-red-patent-cleo-bag", "gucci-gg-shoulder-bag", "black-faux-fur-cuff-bracelets-pair", "white-faux-fur-cuff-bracelets-pair", "white-prada-re-edition-shoulder-bag", "louis-vuitton-denim-monogram-pochette", "louis-vuitton-damier-azur-felicie-pochette"], from: [296, 968], to: [626, 968], w: [58, 58], z: 20 },
  { id: "window-hooks-top", name: "Window moulding · hooks across the top", ids: ["shein-bear-ear-bonnet", "shein-black-fur-beanie", "shein-lamb-bonnet", "shein-white-fur-hat", "shein-mint-fur-bucket-hat", "icelandic-white-fur-hat", "brown-faux-fur-round-hat", "beige-rib-knit-pom-pom-ears-beanie", "temu-fur-buckethat", "temu-rose-beanie"], from: [326, 452], to: [596, 452], w: [44, 44], hang: true, z: 36, hooks: 10 },
  { id: "window-hooks-left", name: "Window moulding · hooks down the left", ids: ["red-faux-fur-round-hat", "burgundy-wool-beret", "navy-wool-beret", "brown-wool-beret", "yellow-wool-beret", "light-blue-wool-beret", "cream-wool-beret", "pink-faux-fur-round-hat", "green-faux-fur-round-hat", "temu-fur-headband", "pink-sherpa-pom-pom-bucket-bag"], from: [312, 524], to: [312, 838], w: [46, 46], hang: true, z: 36, hooks: 5 },
  { id: "window-hooks-side", name: "Window moulding · hooks down the right", ids: ["etsy-purple-veil", "etsy-green-lace-veil", "etsy-floral-embroidered-veil", "etsy-gold-floral-veil", "etsy-black-gold-veil-long", "etsy-deep-blue-veil", "etsy-copper-lace-veil", "temu-mantilla", "etsy-bernadette-veil", "light-blue-floral-lace-trim-head-scarf", "pink-floral-lace-trim-head-scarf"], from: [610, 524], to: [610, 838], w: [46, 46], hang: true, z: 36, hooks: 5 },
  { id: "mirror", name: "Top of the mirror", ids: ["shein-ballet-bows"], from: [655, 560], to: [655, 560], w: [40, 40], hang: true, z: 20 },
  // the rolling rails: the far one with the dresses, the near one with knits and swim
  { id: "rack-back", name: "Back rolling rack", ids: ["amz-tulle-dress-blue", "amz-tulle-dress-green", "ref-shai-dress", "cider-velvet-corset-dress", "cider-ruffle-velvet-dress", "romi-miranda-dress", "cider-jacquard-bandeau-dress", "cider-wine-bandeau-dress", "shein-green-organza-dress", "yellow-floral-dress", "brown-bow-dress", "prada-ivory-tweed-two-piece", "prada-black-tweed-two-piece", "prada-pink-tweed-two-piece", "cider-suede-bow-pinafore", "cider-brown-corduroy-daisy-pinafore", "maroon-corduroy-overall-dress", "lavender-flower-dress", "wona-istanbul-chiffon-ruffle-dress-black", "blue-corset-mini-dress", "black-beige-pleated-belted-dress", "denim-corset-flared-dress", "hm-black-white-piped-keyhole-mini-dress", "navy_satin_lace_slip_dress_sticker", "cream_rose_floral_lace_dress_sticker", "ivory_satin_lace_slip_dress_sticker", "forest_green_lace_satin_dress_sticker", "mint_green_ruffled_corset_gown_sticker", "powder_blue_scarf_maxi_dress_sticker", "arianna-dress", "peacock-dress", "rhianna-dress", "yellow-ball-gown", "etsy-wildflower-embroidered-gown", "navy-celestial-velvet-gown", "black-bow-glitter-tulle-gown"], from: [236, 1040], to: [704, 1040], w: [78, 78], hang: true, z: 30 },
  { id: "rack-front", name: "Front rolling rack", ids: ["amz-floral-sweatshirt", "temu-tie-cardigan", "temu-heart-bikini", "temu-beach-swimsuit", "dh-goose-jacket-pink", "dh-puffer-jacket", "etsy-burgundy-velvet-hooded-coat", "white-fur-hood-parka", "dh-fur-coat", "dh-cc-bikini", "tt-striped-vest-set", "tt-striped-collar-set", "cream-fluffy-coat", "brown-quilted-knit-jacket", "rhone-utility-trench-navy", "zeagoo-fur-lapel-wool-coat-navy", "maroon-wool-trench-coat", "green-wool-cropped-jacket-ruffle-skirt-set", "cloud_cardigan_blue_white_knit_sticker", "grape-cluster-organza-mermaid-gown", "macaw-print-gold-silk-ball-gown", "midnight-star-flamingo-embroidered-gown", "midsommar-wildflower-gown"], from: [150, 1255], to: [790, 1255], w: [96, 96], hang: true, z: 40 },
  // on the tiles in front
  { id: "floor-front", name: "On the floor · front", ids: ["ivory-ribbon-hair-bow"], from: [140, 1520], to: [800, 1520], w: [58, 58], z: 50 },
  { id: "cubby-left", name: "Cubbies · back left", ids: ["temu-butterfly-scarf", "temu-strawberry-bandana", "temu-lace-gloves", "temu-floral-gloves", "amz-ski-gloves", "amz-ruffle-socks", "cider-star-moon-fishnets", "dh-leather-belt"], from: [112, 968], to: [180, 1002], w: [40, 40], z: 45 },
  { id: "cubby-right", name: "Cubbies · back right", ids: ["cider-crochet-scarf", "gold-round-pink-lens-sunglasses", "black-cat-eye-sunglasses", "black-cat-eye-pink-lens-sunglasses", "butterfly-rhinestone-sunglasses-purple", "pink-cat-eye-sunglasses", "green-cat-eye-sunglasses", "tortoiseshell-cat-eye-sunglasses", "tan-cat-eye-sunglasses", "clear-pink-cat-eye-sunglasses", "tt-wine-oval-sunglasses", "tt-satin-bow-ties", "heart-sunglasses"], from: [648, 952], to: [716, 986], w: [40, 40], z: 45 },
  { id: "shoes", name: "Shoes on the floor", ids: ["shein-mint-maryjanes", "amz-coutgo-heels", "amz-maryjanes-kalstage", "shein-bow-loafers", "amz-birkenstock-gizeh", "temu-hamster-slippers", "amz-roller-skates", "dh-rain-boots", "tt-black-slingbacks", "tt-red-slingbacks", "shein-fur-snow-boots", "bw-bow-slingback-heels-front", "sage-burgundy-bow-slingback-heels-front", "yellow-bow-kitten-heels", "black-patent-chain-platform-loafers", "black-patent-triple-strap-platform-mary-janes", "louis-vuitton-damier-peep-toe-heels-front", "green-suede-lace-up-block-heels", "cider-brown-knee-high-boots", "brown-patent-ankle-strap-pumps", "brown-patent-two-strap-pumps", "navy-suede-ankle-strap-pumps", "burgundy-ribbon-tie-block-heels", "black-white-tstrap-pointed-pumps", "black-patent-gold-buckle-mary-jane-heels"], from: [120, 1650], to: [820, 1650], w: [72, 72], z: 60 },
  // the outer left bay (a phone crops some of it) and the shelf in the inner right bay
  { id: "outer-left-low", name: "Outer left bay · lower rail", ids: ["cider-ditsy-layered-dress", "cider-jacquard-dress", "cider-embroidered-dress", "cider-tie-shoulder-dress", "cider-toile-dress", "cider-corduroy-dress", "cider-lemon-dress", "cider-puff-sleeve-dress", "cider-floral-midi-dress", "romi-alya-dress", "cider-brown-floral-mermaid-maxi", "ivory-strapless-full-skirt-maxi-dress", "yellow-charlotte-dress"], from: [84, 628], to: [140, 672], w: [80, 70], hang: true, z: 80 },
  { id: "outer-left-top", name: "Outer left bay · top rail", ids: ["cider-velvet-playsuit", "cider-pastel-dress", "ar-esquire-trench", "nord-icon-blazer", "tt-plaid-blazer-set"], from: [80, 342], to: [138, 404], w: [70, 60], hang: true, z: 60 },
  { id: "right-bottom", name: "Right bay · bottom bar", ids: ["cider-rib-cardigan", "cider-pearl-cardigan", "cider-geometric-knit", "prada-ivory-tweed-blazer", "prada-black-tweed-blazer", "prada-pink-tweed-blazer", "ar-black-cream-trim-cardigan", "ar-cream-black-trim-cardigan", "cider-satin-corset-blouse", "cider-velvet-bow-bustier", "olive-ribbed-polo-top", "chanel-white-knit-tank-black-trim", "cider-velvet-crop-blouse", "cider-mesh-crop-top", "ar-jewel-skort", "cider-ruffle-skort"], from: [826, 1014], to: [752, 1000], w: [66, 58], hang: true, z: 74 },
  { id: "right-shelf", name: "Right bay · shelf", ids: ["dh-cleo-bag", "black-long-ribbon-bow", "white-cat-eye-sunglasses"], from: [822, 848], to: [754, 842], w: [54, 48], z: 66 },
  { id: "right-middle", name: "Right bay · middle bar", ids: ["ref-melanie-top", "ref-juliet-top", "temu-pearl-tank", "temu-bow-cami", "shein-bee-tank", "shein-bunny-tank", "shein-kitten-tank", "forever21-coca-cola-red-swimsuit", "eollystrel-burgundy-lace-corset-top"], from: [826, 652], to: [752, 672], w: [68, 60], hang: true, z: 68 },
  { id: "left-bottom", name: "Narrow left bay · bottom bar", ids: ["shein-sweaterskirt-burgundy", "shein-sweaterskirt-navy", "temu-knit-miniskirt", "shein-cable-knit-skirt", "white-lace-pleated-mini-skirt"], from: [160, 921], to: [216, 905], w: [52, 48], hang: true, z: 48 },
  { id: "left-top", name: "Narrow left bay · top bar", ids: ["ar-bloor-sweater", "ar-passage-cardigan", "temu-floral-lingerie-set", "shein-sailor-collar", "chiffon-neck-scarf-black", "chiffon-neck-scarf-yellow", "chiffon-neck-scarf-navy", "chiffon-neck-scarf-green", "chiffon-neck-scarf-ivory", "chiffon-neck-scarf-burgundy", "chiffon-neck-scarf-purple", "chiffon-neck-scarf-brown", "chiffon-neck-scarf-light-blue", "pink-marabou-lingerie-set", "white-feather-angel-wings-halo-set", "black-feather-angel-wings-halo-set", "peacock-wings", "lavender-lace-head-scarf", "gold-lace-head-scarf"], from: [158, 604], to: [206, 628], w: [46, 42], hang: true, z: 46 },
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

/* Bars fitted where the closet had room for more: a third in the inner right
   bay just above its floor, a second under that bay's top rail, one each in
   the empty top and bottom boxes of the narrow left bay, one in the outer left
   bay's bottom box, and three in the outer right bay's boxes. */
export const CLOSET_BARS: Record<"wide" | "tall", Bar[]> = {
  wide: [
    { from: [1452, 768], to: [1606, 787], z: 73 },
    // under the inner right bay's top rail, above its shelf
    { from: [1460, 442], to: [1606, 401], z: 69 },
    // in the empty bottom of the narrow left bay, under its shelf
    { from: [322, 716], to: [446, 690], z: 49 },
    // in the narrow left bay's top box, just under its ceiling
    { from: [322, 240], to: [444, 286], z: 47 },
    // the outer left bay's bottom box, above the drawer
    { from: [34, 754], to: [298, 706], z: 91 },
    // the outer right bay: its very top box, the box under that, and the bottom box above the drawer
    { from: [1846, 70], to: [1648, 134], z: 31 },
    { from: [1846, 150], to: [1648, 258], z: 31 },
    { from: [1876, 776], to: [1640, 734], z: 33 },
  ],
  tall: [
    { from: [737, 975], to: [793, 990], z: 73 },
    { from: [737, 652], to: [793, 630], z: 69 },
    { from: [151, 924], to: [224, 902], z: 49 },
    { from: [152, 470], to: [214, 504], z: 47 },
  ],
};

export const CLOSET_RACKS: Record<"wide" | "tall", Rack[]> = {
  wide: [
    { x0: 596, x1: 894, bar: 612, feet: 985, z: 44 },
    { x0: 1040, x1: 1340, bar: 612, feet: 985, z: 44 },
  ],
  tall: [
    { x0: 222, x1: 718, bar: 1040, feet: 1292, z: 28 },
    { x0: 136, x1: 804, bar: 1255, feet: 1530, z: 38 },
  ],
};

/** a few pieces whose photographs make them look the wrong size beside the rest */
const SIZE: Partial<Record<GarmentId, number>> = {
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
  "romi-alya-dress": 0.78,
  "ivory-strapless-full-skirt-maxi-dress": 0.72,
  "cider-brown-floral-mermaid-maxi": 0.74,
  "etsy-wildflower-embroidered-gown": 0.72,
  "denim-corset-flared-dress": 0.72,
  "black-beige-pleated-belted-dress": 0.8,
  "mint_green_ruffled_corset_gown_sticker": 0.72,
  "powder_blue_scarf_maxi_dress_sticker": 0.72,
  "arianna-dress": 0.72,
  "peacock-dress": 0.72,
  "rhianna-dress": 0.72,
  "yellow-ball-gown": 0.72,
  "mughal-couture-ensemble": 0.72,
  "cape_royal_pleated_jeweled_cobalt_blue_sticker": 0.72,
  "outfit_suit_brocade_robe_crimson_gold_regal_sticker": 0.72,
};

/** where everything goes, with each rail's pieces in the order given (a
    rearrangement from the Racks page, or the order above) */
export function lay(which: "wide" | "tall", order?: Record<string, string[]>): Spot[] {
  const photo = CLOSET_PHOTOS[which];
  return CLOSET_LINES[which].flatMap((line) =>
    ((order?.[line.id] ?? line.ids) as GarmentId[]).map((id, i, ids) => {
      let t = ids.length > 1 ? i / (ids.length - 1) : 0;
      if (line.hooks && line.hooks > 1 && ids.length <= line.hooks) {
        // on its own hook: spread out along the row, or the middle one if it's alone
        const k = ids.length > 1 ? Math.round((i * (line.hooks - 1)) / (ids.length - 1)) : Math.floor((line.hooks - 1) / 2);
        t = k / (line.hooks - 1);
      }
      const x = line.from[0] + (line.to[0] - line.from[0]) * t;
      const y = line.from[1] + (line.to[1] - line.from[1]) * t + (line.hooks ? HOOK_DROP : 0);
      const w = (line.w[0] + (line.w[1] - line.w[0]) * t) * (SIZE[id] ?? 1);
      return {
        id,
        x: (x / photo.w) * 100,
        y: (y / photo.h) * 100,
        w: (w / photo.w) * 100,
        hang: !!line.hang,
        hook: !!line.hooks,
        z: line.z - i,
      };
    }),
  );
}

export const CLOSET_LINES: Record<"wide" | "tall", Line[]> = { wide: WIDE, tall: TALL };

/** how far below a hook's plate a piece hangs from its tip, in photograph pixels */
const HOOK_DROP = 18;

/** where each hook on a row of hooks is, in photograph pixels */
export const hookPoints = (line: Line): Pt[] =>
  Array.from({ length: line.hooks ?? 0 }, (_, k) => {
    const t = (line.hooks ?? 1) > 1 ? k / ((line.hooks ?? 1) - 1) : 0.5;
    return [line.from[0] + (line.to[0] - line.from[0]) * t, line.from[1] + (line.to[1] - line.from[1]) * t];
  });

/** a moulding frame round the pink recess the window sits in (wide photographs
    only): its outside edges, and how thick it is, in photograph pixels */
export const WINDOW_MOULDING: Record<"wide" | "tall", { x0: number; y0: number; x1: number; y1: number; t: number } | null> = {
  wide: { x0: 590, y0: 270, x1: 1230, y1: 688, t: 20 },
  tall: { x0: 300, y0: 428, x1: 622, y1: 900, t: 14 },
};
