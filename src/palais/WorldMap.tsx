import { useEffect, useMemo, useRef, useState } from "react";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { propSrc } from "./props";
import { usePlace, type Place } from "./place";
import { Globe } from "./Globe";
import { currentSeason, type Season } from "./seasons";
import { usePortrait } from "./PortraitTerrace";
import { SCENERY, Scenery, sceneMiddle, sceneReach } from "./MapScenery";

/**
 * The map, like the level select in a storybook game: an
 * illustrated island in a cream and gilt frame, dressed with blossom.
 *
 * One island, made of everywhere Molly has been, blended together and never
 * named after the real places. Each stop is a round gilt frame showing a
 * little picture of the room itself, on a dotted path, and Honeysuckle hops
 * along it to whichever stop is picked. The path starts at
 * home, the Palais, then the Lakehouse, and loops once round the island, so
 * the arrow keys walk it.
 */

interface Stop {
  id: string;
  name: string;
  /** a word or two under the name */
  tag: string;
  blurb: string;
  finds: string[];
  color: string;
  at: [number, number];
  /** size of the region's patch of land */
  patch: [number, number];
  seed: number;
  /** out at sea, on its own island */
  islet?: boolean;
  /** on the second island, down the map from the first; its `at` is measured
      on that island the same way the first island's are */
  isle?: 2;
  /** where it would be on Earth, if the island were the world */
  earth: [number, number];
  /** the room of the Palais you can walk into from here, if there is one yet */
  room?: Place;
  /** for a stop that is somewhere Molly has been rather than a room to come:
      what stands in place of the visit button */
  aside?: string;
  /** its picture was painted four times, one for each season, and again tall
      for a phone */
  seasons?: boolean;
}

const STOPS: Stop[] = [
  {
    id: "palace",
    earth: [46.85, -121.76],
    name: "Home",
    tag: "the Palais",
    blurb: "The gilded terrace where everyone lives: cats, cake and cameos, with the mountain through the arches and the pool out back, all through the four seasons.",
    finds: ["A painted ceiling full of cherubs", "Honeysuckle riding his tricycle", "A pool out back for the dogs in summer"],
    color: "#ffd88a",
    at: [518, 386],
    patch: [58, 42],
    seed: 7,
    room: "palace",
  },
  {
    id: "closet",
    earth: [47.02, -121.52],
    name: "Closet",
    tag: "inside the Lakehouse",
    blurb: "Every dress you ever loved, hanging in the order you wore it somewhere beautiful.",
    finds: ["Mirrors that show your best days", "A staircase made of Mary Janes", "Rails and rails of hanging dresses"],
    color: "#ffb3d6",
    at: [622, 286],
    patch: [46, 38],
    seed: 23,
    room: "closet",
  },
  {
    id: "bathroom",
    earth: [46.74, -121.52],
    name: "Bathroom",
    tag: "through the right arch",
    blurb: "The bathroom you glimpse through the arch on the terrace: a clawfoot tub, rose wallpaper, a glass-block window and cabinets of pretty jars, all in blush and white.",
    finds: ["A clawfoot tub", "Glass-block windows", "Pink towels and jars of bath salts"],
    color: "#f3c6d8",
    at: [722, 400],
    patch: [48, 36],
    seed: 29,
    room: "bathroom",
  },
  {
    id: "kitchen",
    earth: [46.97, -121.98],
    name: "Kitchen",
    tag: "just off the terrace",
    blurb: "The marble bar you can see from the terrace is only the end of it: a whole kitchen of pink tile, mint stools and brass, with the garden through the windows and something always baking.",
    finds: ["The mint bar stools", "A copper kettle on the range", "Cakes cooling for the cats' birthdays"],
    color: "#f7b7a3",
    at: [511, 521],
    patch: [52, 38],
    seed: 23,
    room: "kitchen",
  },
  {
    id: "library",
    earth: [43.65, -79.38],
    name: "Library",
    tag: "up the book stairs",
    blurb: "Carved walnut shelves climb to a painted sky with a golden sun, a staircase of books spirals up the wall, and the desk sits at an arched window over the lake at sunset.",
    finds: ["A spiral staircase made of books", "A globe and a rolling ladder", "Roses round the window over the lake"],
    color: "#d9a066",
    at: [675, 549],
    patch: [48, 36],
    seed: 167,
    room: "library",
  },
  {
    id: "lagoon",
    earth: [64.1, -21.8],
    name: "Lagoon",
    tag: "fire under snow",
    blurb: "Milky blue water steaming in the snow under the northern lights, with a geyser, a waterfall and a volcano glowing on the horizon.",
    finds: ["A little bridge over the warm blue water", "Sea stacks off a black-sand beach", "A lodge lit up on the ski slope"],
    color: "#cdeefa",
    at: [328, 400],
    patch: [104, 56],
    seed: 37,
    room: "lagoon",
  },
  {
    id: "boudoir",
    earth: [48.8, 2.12],
    name: "Boudoir",
    tag: "along from the wardrobe",
    blurb: "A gilded dressing room: lilac curtains swagged over tall windows, a chandelier over a marble floor, and a trifold mirror on the vanity with the roses outside coming in.",
    finds: ["A trifold mirror and a walnut vanity", "A blue tufted ottoman in the middle", "Candles on gilt sconces all round"],
    color: "#e6c2e0",
    at: [417, 278],
    patch: [46, 34],
    seed: 173,
    room: "boudoir",
  },
  {
    id: "lakehouse",
    earth: [47.66, -122.26],
    name: "Lakehouse",
    tag: "where it began",
    blurb: "A glass house at the edge of a still lake, with a fire going and the mountain glowing across the water. The Shimmer started here and spread out to everything else.",
    finds: ["A red bridge over the Japanese garden", "A boathouse and a long dock", "Sunrise over the mountain"],
    color: "#8fcbe8",
    at: [741, 132],
    patch: [80, 58],
    seed: 11,
    room: "lakehouse",
  },
  {
    id: "caves",
    earth: [-38.3, 175.1],
    name: "Blue Caves",
    tag: "under the hills",
    blurb: "A cosy grotto under a ceiling of glowworms, with lantern-lit steps down to a rowboat on a misty river, hobbit doors in the hills and a snowy mountain at dusk.",
    finds: ["Glowworms like a galaxy overhead", "Round doors in the green hills", "Hot springs steaming down the terraces"],
    color: "#a9b8ff",
    at: [325, 162],
    patch: [92, 60],
    seed: 71,
    room: "caves",
  },
  {
    id: "jacaranda",
    earth: [-34.6, -58.4],
    name: "Jacaranda Quarter",
    tag: "night streets",
    blurb: "French doors open onto an iron balcony over a cobbled street of purple jacaranda trees, gas lamps and a waterfront glowing pink at dusk.",
    finds: ["Purple petals on the balcony floor", "A little jazz stage with a double bass", "Neon lights on the water past the palms"],
    color: "#c9b3ff",
    at: [848, 284],
    patch: [52, 58],
    seed: 103,
    room: "jacaranda",
  },
  {
    id: "school",
    earth: [40.73, -73.99],
    name: "Brat Academy",
    tag: "where girls learn to code",
    blurb: "A gilded classroom under a crystal chandelier, with lime iBooks on every desk, cherry blossom out the windows and the syllabus chalked up on the board. Molly teaches girls to code here: press the chalkboard for the courses.",
    finds: ["The syllabus on the chalkboard", "Bratz busts along the shelves", "An iBook on every desk"],
    color: "#ff9ccf",
    at: [519, 142],
    patch: [56, 40],
    seed: 181,
    room: "school",
  },
  {
    id: "domes",
    earth: [41.0, 29.0],
    name: "Riviera",
    tag: "the old city",
    blurb: "A steaming marble bath under blue-and-white tiles, looking out over domes and minarets, a yellow tram, gondolas on the canal and a volcano at sunset.",
    finds: ["A warm pool with a fountain", "A little yellow tram up the hill", "Gondolas below the palace on the river"],
    color: "#ffb99b",
    at: [261, 535],
    patch: [98, 66],
    seed: 97,
    room: "domes",
  },
  {
    id: "sunliner",
    earth: [34.1, -116.3],
    name: "Train",
    tag: "where the desert kept the train",
    blurb: "A journey that stopped short: the Sunliner came off the rails out in the desert past the city in 2023, and the desert kept it. The carriages have gone gold in the late sun, with ocotillo and prickly pear growing up through the ties.",
    finds: ["Car 31025, still on its wheels", "Ocotillo in flower along the rails", "A rainbow over the mountains at sundown"],
    color: "#f0a14e",
    seasons: true,
    at: [153, 390],
    patch: [86, 54],
    seed: 41,
    room: "sunliner",
  },
  /* ---- the second island, down the map: the Glasshouse, the Rainwood,
     Madeleine, the Amphitheatre and the Strand, with the Lantern Isles and the Glass Reef
     on islets of their own ---- */
  {
    id: "garden",
    earth: [46.4, -121.0],
    name: "Glasshouse",
    tag: "a garden conservatory",
    blurb: "An iron-and-glass conservatory built over the garden, full of magnolia, wisteria and hydrangea, with the rain on the roof and the mountain beyond the panes.",
    finds: ["A vaulted glass roof", "Wisteria grown right over the ironwork", "Orchids, ferns and a fountain"],
    color: "#b5dca8",
    at: [195, 430],
    patch: [56, 42],
    seed: 31,
    room: "garden",
    seasons: true,
    isle: 2,
  },
  {
    id: "rainwood",
    earth: [10.3, -84.8],
    name: "Rainwood",
    tag: "moss & mist",
    blurb: "A glass conservatory grown over with ferns, looking out on mossy giant trees, a misty river and a glowing bubble dome.",
    finds: ["A glass bubble dome in the trees", "A cabin with a hot tub on the water", "Sunbeams through the mist"],
    color: "#9fd88f",
    at: [300, 260],
    patch: [86, 70],
    seed: 41,
    room: "rainwood",
    isle: 2,
  },
  {
    id: "madeleine",
    earth: [46.68, -121.98],
    name: "Madeleine",
    tag: "upstairs, facing the sea",
    blurb: "A round pink room with gilt shells on the walls and a painted sky on the ceiling, where lace curtains open onto a balcony of roses and the sun going down into the sea.",
    finds: ["A mosaic floor of blue flowers", "Bougainvillea over the balcony", "The sunset path across the water"],
    color: "#ffc2cf",
    at: [520, 140],
    patch: [48, 36],
    seed: 151,
    room: "madeleine",
    isle: 2,
  },
  {
    id: "lanterns",
    earth: [34.9, 135.8],
    name: "Lantern Isles",
    tag: "by ferry",
    blurb: "A red lacquered pavilion hung with glowing lanterns, looking across the water to a temple island lit up at dusk, with cranes painted on the ceiling.",
    finds: ["Temples stepping up a cliff to a glowing tower", "A lantern boat on the water", "Cherry blossom and red maples"],
    color: "#ffab9e",
    at: [870, 150],
    patch: [56, 40],
    seed: 131,
    room: "lanterns",
    islet: true,
    isle: 2,
  },
  {
    id: "gorge",
    earth: [37.6, 22.9],
    name: "Amphitheatre",
    tag: "the festival",
    blurb: "Grass terraces on a canyon rim, a river far below, and the sun going down into the sea behind the stage.",
    finds: ["A stage lit up on the canyon rim", "A marina of yachts below the cliffs", "String lights through the arches"],
    color: "#ffc978",
    at: [680, 300],
    patch: [92, 64],
    seed: 83,
    room: "gorge",
    isle: 2,
  },
  {
    id: "reef",
    earth: [-18.3, 147.7],
    name: "Glass Reef",
    tag: "out at sea",
    blurb: "A seashell pavilion of white marble and gold, half under the sea: a palm island above the waterline, and a coral reef with sea turtles below.",
    finds: ["A sea turtle gliding past the glass", "A palm island floating on the waterline", "Sunlight rippling across the floor"],
    color: "#6fd3e6",
    at: [905, 560],
    patch: [70, 36],
    seed: 67,
    room: "reef",
    islet: true,
    isle: 2,
  },
  {
    id: "shore",
    earth: [36.4, 25.4],
    name: "Strand",
    tag: "every beach at once",
    blurb: "A white loggia draped in bougainvillea, with every beach at once through the arches: white cliff houses with blue domes, a sea stack at sunset and a seaside promenade.",
    finds: ["Blue domes on a white cliff", "A yacht below the sea stack at sunset", "Striped umbrellas along the promenade"],
    color: "#7fdccf",
    at: [450, 470],
    patch: [80, 100],
    seed: 53,
    room: "shore",
    isle: 2,
  },
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** a soft, wobbly closed outline, smoothed into curves */
/** how far out a wobbly outline reaches at angle t, as a multiple of its radius */
function wobble(seed: number, amp: number) {
  const rand = rng(seed);
  const waves = [2, 3, 4, 5, 7, 11].map((k) => ({ k, a: (rand() * amp) / Math.sqrt(k / 2), p: rand() * Math.PI * 2 }));
  return (t: number) => waves.reduce((m, w) => m + w.a * Math.sin(w.k * t + w.p), 1);
}

/** a soft, wobbly closed outline, smoothed into curves */
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, amp = 0.12, n = 64) {
  const m = wobble(seed, amp);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(t) * rx * m(t), cy + Math.sin(t) * ry * m(t)]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/** a gentle curve between two stops, bowing alternately left and right */
function trail(a: [number, number], b: [number, number], i: number) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const nx = -(b[1] - a[1]);
  const ny = b[0] - a[0];
  const len = Math.hypot(nx, ny) || 1;
  const bend = 0.16 * len * (i % 2 ? 1 : -1);
  return `M${a[0]},${a[1]} Q${(mx + (nx / len) * bend).toFixed(1)},${(my + (ny / len) * bend).toFixed(1)} ${b[0]},${b[1]}`;
}

const ISLAND = { cx: 500, cy: 345, rx: 420, ry: 276, seed: 5, amp: 0.06 };
const islandEdge = wobble(ISLAND.seed, ISLAND.amp);
/** 0 at the middle of the island, 1 at its coast */
const inland = (x: number, y: number) => {
  const dx = (x - ISLAND.cx) / ISLAND.rx;
  const dy = (y - ISLAND.cy) / ISLAND.ry;
  return Math.hypot(dx, dy) / islandEdge(Math.atan2(dy, dx));
};

/** the second island, a whole map's height further down: the map slides down
    to it and back. It's nearly as big as the first, with plenty of open
    ground for rooms still to come: give a new stop `isle: 2` and an `at` on
    it, measured the same way as the first island's */
const ISLE_DROP = 680;
const ISLAND2 = { cx: 500, cy: 345, rx: 410, ry: 268, seed: 9, amp: 0.08 };
const island2Edge = wobble(ISLAND2.seed, ISLAND2.amp);
const inland2 = (x: number, y: number) => {
  const dx = (x - ISLAND2.cx) / ISLAND2.rx;
  const dy = (y - ISLAND2.cy) / ISLAND2.ry;
  return Math.hypot(dx, dy) / island2Edge(Math.atan2(dy, dx));
};
/** where a stop is on the whole, two-island map */
const spot = (s: Stop): [number, number] => [s.at[0], s.at[1] + (s.isle === 2 ? ISLE_DROP : 0)];
const isleOf = (s: Stop) => (s.isle === 2 ? 1 : 0);

/** each stop's picture, in a round gilt frame */
/** the rooms that are inside the Palais rather than places of their own */
const INSIDE = new Set(["kitchen", "bathroom", "garden", "closet", "madeleine", "library", "boudoir"]);

const FRAME = 44;
/** on the painted first island, each room's frame is drawn over the one in
    the painting: how big that one is, and where its name sits from its middle */
const PAINTED: Record<string, { r: number; label: [number, number] }> = {
  caves: { r: 59, label: [-12, 59] },
  school: { r: 59, label: [0, 59] },
  lakehouse: { r: 59, label: [-7, 59] },
  boudoir: { r: 59, label: [0, 62] },
  closet: { r: 59, label: [0, 59] },
  jacaranda: { r: 59, label: [-4, 59] },
  palace: { r: 59, label: [0, 53] },
  sunliner: { r: 59, label: [0, 59] },
  bathroom: { r: 59, label: [3, 59] },
  domes: { r: 59, label: [25, 66] },
  kitchen: { r: 59, label: [-3, 59] },
  library: { r: 59, label: [-7, 59] },
  lagoon: { r: 59, label: [0, 59] },
};
/** a little cartoon house, the size of a stop's round frame: a pitched roof
    over a square front, for Home */
const HOUSE = (f: number) =>
  `M${-f * 0.95},${-f * 0.12} L0,${-f * 1.08} L${f * 0.95},${-f * 0.12} L${f * 0.78},${-f * 0.12} L${f * 0.78},${f * 0.92} L${-f * 0.78},${f * 0.92} L${-f * 0.78},${-f * 0.12} Z`;
const labelOf = (s: Stop) => s.name;
const labelWidth = (s: Stop) => labelOf(s).length * 8.6 + 30;

const picture = (s: Stop, season: Season, tall = false) => {
  const which = s.seasons ? `${tall ? "-portrait" : ""}-${season}` : "";
  return `${process.env.PUBLIC_URL}/palais/map/${s.room ?? s.id}${which}.webp`;
};

/** a cluster of apple blossom and leaves, for the corners of the frame */
/**
 * The painted flowers around the map's frame, cut from Molly's own sheet
 * (public/palais/blooms). Each corner gets its own posy: a big flower, a
 * smaller one and a leaf or two, laid over each other and turned a little, so
 * no two corners are alike.
 */
const BLOOM = (name: string) => `${process.env.PUBLIC_URL}/palais/blooms/${name}.webp`;

type Petal = { name: string; x: number; y: number; w: number; rot?: number };

const POSIES: Record<string, Petal[]> = {
  tl: [
    { name: "leaf-long", x: 8, y: 52, w: 62, rot: -24 },
    { name: "leaf-sprig", x: 44, y: 8, w: 44, rot: 28 },
    { name: "lily-pink", x: 6, y: 10, w: 74 },
    { name: "tulip-bud-pink", x: 62, y: 44, w: 34, rot: 18 },
    { name: "forget-me-nots", x: 48, y: 70, w: 38, rot: -8 },
  ],
  bl: [
    { name: "leaf-pair", x: 6, y: 6, w: 52, rot: 200 },
    { name: "daisy-yellow", x: 30, y: 30, w: 50, rot: -12 },
    { name: "violet-purple", x: 4, y: 52, w: 36, rot: 14 },
    { name: "lavender-sprig", x: 54, y: 40, w: 42, rot: 24 },
    { name: "cornflower-blue", x: 58, y: 8, w: 30, rot: -20 },
  ],
  tr: [
    { name: "leaf-single", x: 50, y: 48, w: 48, rot: 140 },
    { name: "daisy-cream", x: 20, y: 14, w: 58, rot: 16 },
    { name: "bellflower-blue", x: 56, y: 6, w: 38, rot: -14 },
    { name: "violet-lilac", x: 10, y: 60, w: 34, rot: 22 },
  ],
  br: [
    { name: "leaf-long", x: 46, y: 6, w: 58, rot: 156 },
    { name: "daisy-white", x: 34, y: 34, w: 54, rot: -18 },
    { name: "tulip-bud-red", x: 6, y: 20, w: 34, rot: -26 },
    { name: "forget-me-nots-tall", x: 4, y: 52, w: 40, rot: 10 },
    { name: "lavender-small", x: 62, y: 62, w: 32, rot: 18 },
  ],
  "title-l": [
    { name: "leaf-sprig", x: 4, y: 40, w: 46, rot: -16 },
    { name: "violet-pink", x: 22, y: 10, w: 44, rot: 12 },
    { name: "periwinkle-blue", x: 52, y: 42, w: 34, rot: -10 },
    { name: "lavender-bud", x: 56, y: 4, w: 30, rot: 22 },
  ],
  "title-r": [
    { name: "leaf-pair", x: 46, y: 38, w: 46, rot: 200 },
    { name: "daisy-yellow", x: 18, y: 12, w: 44, rot: -14 },
    { name: "cornflower-bright", x: 52, y: 6, w: 32, rot: 16 },
    { name: "violet-purple", x: 8, y: 52, w: 34, rot: -8 },
  ],
};

export function Blossoms({ className, posy }: { className: string; posy: keyof typeof POSIES }) {
  return (
    <span className={className} aria-hidden>
      {POSIES[posy].map((p, i) => (
        <img
          key={i}
          src={BLOOM(p.name)}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, rotate: `${p.rot ?? 0}deg` }}
        />
      ))}
    </span>
  );
}

export function WorldMap({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { place, go } = usePlace();
  const [here, setHere] = useState(0);
  // open the map with Honeysuckle standing wherever you are
  useEffect(() => {
    if (!open) return;
    const at = STOPS.findIndex((s) => s.room === place);
    setHere(at >= 0 ? at : 0);
  }, [open, place]);
  /* the year the room is having, so a stop painted four times shows the right
     one. It is read from the season animations themselves, the same way the
     room's own chips read it. */
  const [season, setSeason] = useState<Season>("spring");
  useEffect(() => {
    if (!open) return;
    const read = () => setSeason(currentSeason(document));
    read();
    const id = setInterval(read, 2000);
    return () => clearInterval(id);
  }, [open]);
  // a phone gets the tall painting of a stop that has one
  const portrait = usePortrait();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const mapSvg = useRef<SVGSVGElement>(null);
  // the place a click would pick, while the pointer is over the map
  const [hover, setHover] = useState<number | null>(null);
  // the island, or the same places on a world that turns
  const [globe, setGlobe] = useState(false);
  // which island is in view: the map slides down to the second one when
  // Honeysuckle hops there, or when the arrow is pressed
  const isle = isleOf(STOPS[here] ?? STOPS[0]);
  const crossTo = (to: 0 | 1) => setHere(STOPS.findIndex((s) => isleOf(s) === to));
  const spots = useMemo(
    () =>
      STOPS.map((s) => ({
        id: s.id,
        name: s.name,
        earth: s.earth,
        picture: picture(s, season, false),
        color: s.color,
        inside: INSIDE.has(s.id),
      })),
    [season],
  );
  // the map wears the same cream paper over a floral as the catalogue
  const paper = useFloral("map");
  // the card beside it wears another one, under a lighter veil
  const cardPaper = useFloral("card");
  // the ribbon over the map wears whatever the sidebar is wearing
  const chips = useFloral("sidebar");
  // the ribbon over the map takes the stone of whatever the footer is wearing
  const ribbon = useFloral("footer");

  /** the place nearest to a point on the screen */
  const nearest = (clientX: number, clientY: number) => {
    const svg = mapSvg.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    let best = -1;
    let bestD = Infinity;
    STOPS.forEach((st, i) => {
      if (isleOf(st) !== isle) return;
      const [sx, sy] = spot(st);
      const d = Math.hypot(sx - pt.x, sy - (pt.y + isle * ISLE_DROP));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best < 0 ? null : best;
  };

  /** click anywhere: Honeysuckle hops to the nearest place; click the place
      she's already at to go there */
  const pick = (i: number) => {
    const st = STOPS[i];
    if (i === here && st.room && st.room !== place) {
      go(st.room);
      onClose();
      return;
    }
    setHere(i);
  };

  const art = useMemo(() => {
    const I = ISLAND;
    const island = blob(I.cx, I.cy, I.rx, I.ry, I.seed, I.amp, 140);
    const beach = blob(I.cx, I.cy + 5, I.rx + 14, I.ry + 13, I.seed, I.amp, 140);
    const shallows = blob(I.cx, I.cy + 2, I.rx + 22, I.ry + 22, I.seed, I.amp, 140);
    const J = ISLAND2;
    const D = ISLE_DROP;
    const island2 = blob(J.cx, J.cy + D, J.rx, J.ry, J.seed, J.amp, 120);
    const beach2 = blob(J.cx, J.cy + D + 5, J.rx + 14, J.ry + 13, J.seed, J.amp, 120);
    const shallows2 = blob(J.cx, J.cy + D + 2, J.rx + 22, J.ry + 22, J.seed, J.amp, 120);
    const islets = STOPS.filter((s) => s.islet).map((s) => {
      const [x, y] = spot(s);
      return {
        id: s.id,
        shallows: blob(x, y + 6, FRAME + 58, FRAME + 44, s.seed + 1, 0.14, 48),
        beach: blob(x, y + 5, FRAME + 40, FRAME + 30, s.seed + 1, 0.14, 48),
        land: blob(x, y + 2, FRAME + 30, FRAME + 20, s.seed + 1, 0.14, 48),
      };
    });
    const meadows = STOPS.map((s) => blob(spot(s)[0], spot(s)[1], s.patch[0] + 16, s.patch[1] + 12, s.seed, 0.18, 48));
    // the path runs from stop to stop on each island; it doesn't swim. The
    // legs in and out of the Train are railway track instead of footpath.
    const trails = STOPS.slice(0, -1)
      .map((s, i) =>
        isleOf(s) === isleOf(STOPS[i + 1])
          ? { d: trail(spot(s), spot(STOPS[i + 1]), i), rail: s.id === "sunliner" || STOPS[i + 1].id === "sunliner" }
          : null,
      )
      .filter((t): t is { d: string; rail: boolean } => Boolean(t));

    // keep trees, flowers and mountains off the pictures and their names
    const clear = (x: number, y: number, pad: number) =>
      SCENERY.every((sc) => {
        const [sx, sy] = sceneMiddle(sc, ISLE_DROP);
        return Math.hypot(x - sx, y - sy) > sceneReach(sc) + pad;
      }) &&
      STOPS.every((s) => {
        const [sx, sy] = spot(s);
        if (Math.hypot(x - sx, y - sy) < FRAME + 10 + pad) return false;
        const ly = sy + FRAME + 22;
        return !(Math.abs(x - sx) < labelWidth(s) / 2 + 8 + pad && Math.abs(y - ly) < 16 + pad);
      });

    const rand = rng(4242);
    const trees: { x: number; y: number; r: number; kind: 0 | 1; tone: number }[] = [];
    for (let n = 0; n < 5000 && trees.length < 230; n++) {
      const x = 95 + rand() * 810;
      const y = 85 + rand() * 545;
      const d = inland(x, y);
      if (d > 0.9 || !clear(x, y, 6)) continue;
      if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < 13)) continue;
      trees.push({ x, y, r: 6 + rand() * 4, kind: rand() < 0.45 ? 1 : 0, tone: rand() });
    }
    // and a wood over the second island
    for (let n = 0, made = 0; n < 4000 && made < 120; n++) {
      const x = 100 + rand() * 800;
      const y = 90 + rand() * 520;
      if (inland2(x, y) > 0.88 || !clear(x, y + D, 6)) continue;
      if (trees.some((t) => Math.hypot(t.x - x, t.y - (y + D)) < 13)) continue;
      trees.push({ x, y: y + D, r: 6 + rand() * 4, kind: rand() < 0.45 ? 1 : 0, tone: rand() });
      made++;
    }
    trees.sort((a, b) => a.y - b.y);

    const flowers: { x: number; y: number; c: string }[] = [];
    const PETALS = ["#f4a6c6", "#c9a3ec", "#ffffff", "#f7c2d6", "#b48be0"];
    for (let n = 0; n < 4000 && flowers.length < 260; n++) {
      const x = 95 + rand() * 810;
      const y = 85 + rand() * 545;
      if (inland(x, y) > 0.88 || !clear(x, y, 2)) continue;
      flowers.push({ x, y, c: PETALS[Math.floor(rand() * PETALS.length)] });
    }
    const flowers2: { x: number; y: number; c: string }[] = [];
    for (let n = 0; n < 3000 && flowers2.length < 150; n++) {
      const x = 100 + rand() * 800;
      const y = 90 + rand() * 520;
      if (inland2(x, y) > 0.86 || !clear(x, y + D, 2)) continue;
      flowers2.push({ x, y: y + D, c: PETALS[Math.floor(rand() * PETALS.length)] });
    }

    // a range of snowy peaks in the north, and cliffs round the coast
    const peaks = [
      [555, 185, 46],
      [600, 172, 38],
      [380, 180, 40],
      [335, 195, 30],
      [640, 190, 28],
    ].filter(([x, y]) => clear(x, y, 4)) as [number, number, number][];
    const rocks = Array.from({ length: 26 }, () => {
      const t = rand() * Math.PI * 2;
      const e = islandEdge(t) * (0.97 + rand() * 0.06);
      return { x: I.cx + Math.cos(t) * I.rx * e, y: I.cy + Math.sin(t) * I.ry * e, r: 5 + rand() * 7 };
    }).filter((r) => clear(r.x, r.y, 0));
    const seaRocks = [
      [300, 78, 10],
      [690, 60, 8],
      [930, 250, 9],
      [80, 300, 8],
      [610, 655, 9],
      [960, 560, 7],
    ];
    const waves = Array.from({ length: 80 }, () => ({ x: 20 + rand() * 960, y: 16 + rand() * (650 + D) })).filter(
      (w) =>
        ((w.x - I.cx) / (I.rx + 70)) ** 2 + ((w.y - I.cy) / (I.ry + 64)) ** 2 > 1 &&
        ((w.x - J.cx) / (J.rx + 70)) ** 2 + ((w.y - J.cy - D) / (J.ry + 64)) ** 2 > 1,
    );
    return { island, beach, shallows, island2, beach2, shallows2, islets, meadows, trails, trees, flowers, flowers2, peaks, rocks, seaRocks, waves };
  }, []);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") setHere((h) => Math.min(STOPS.length - 1, h + 1));
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") setHere((h) => Math.max(0, h - 1));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const stop = STOPS[here];

  const tree = (t: { x: number; y: number; r: number; kind: 0 | 1; tone: number }, i: number) => {
    const green = t.tone < 0.33 ? "#1d5324" : t.tone < 0.66 ? "#2b6630" : "#14471b";
    const light = t.tone < 0.33 ? "#7cb26a" : t.tone < 0.66 ? "#8cc076" : "#6aa262";
    return (
      <g key={i} transform={`translate(${t.x.toFixed(1)} ${t.y.toFixed(1)})`}>
        <ellipse cx={2} cy={t.r * 0.9} rx={t.r * 0.9} ry={t.r * 0.35} fill="#2f4a2a" opacity={0.25} />
        {t.kind ? (
          <>
            <path d={`M0,${-t.r * 1.9} L${t.r * 0.85},${t.r * 0.7} L${-t.r * 0.85},${t.r * 0.7} Z`} fill={green} />
            <path d={`M0,${-t.r * 1.9} L${-t.r * 0.85},${t.r * 0.7} L${-t.r * 0.1},${t.r * 0.7} Z`} fill={light} opacity={0.7} />
          </>
        ) : (
          <>
            <rect x={-1} y={0} width={2} height={t.r * 0.8} fill="#7a5a3c" />
            <circle r={t.r} fill={green} />
            <circle cx={-t.r * 0.3} cy={-t.r * 0.3} r={t.r * 0.55} fill={light} opacity={0.8} />
          </>
        )}
      </g>
    );
  };

  return (
    <div
      className="wm-backdrop"
      style={{
        ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
        ["--wm-jewel-side" as string]: paletteOf(chips.now).jewel,
        ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).jewel,
      }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="wm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wm-title"
        /* the same cream paper over a floral as the catalogue */
        style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.965), rgba(250, 243, 229, 0.975)), url("${floralSrc(paper.now)}")` }}
      >
        <div className="wm-title">
          <Blossoms className="wm-bloom wm-bloom--title-l" posy="title-l" />
          <h2 id="wm-title">
            <span aria-hidden>✿</span> Map <span aria-hidden>✿</span>
          </h2>
          <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
        </div>
        <button
          type="button"
          className="wm-globe-switch"
          onClick={() => setGlobe((v) => !v)}
          aria-pressed={globe}
          title={globe ? "Back to the island" : "See it as a world"}
        >
          {globe ? "🗺 Island" : "🌍 Globe"}
        </button>
        <button ref={closeBtn} type="button" className="wm-close" onClick={onClose} aria-label="Close the map">
          ×
        </button>

        <div className="wm-stage">
          {globe ? (
            <Globe spots={spots} here={here} onPick={setHere} />
          ) : (
          <svg
            ref={mapSvg}
            className="wm-map"
            viewBox="25 25 960 640"
            role="img"
            aria-label={`World map. Honeysuckle is at ${stop.name}. Click a place to hop there, and click it again to visit.`}
            onClick={(e) => {
              const i = nearest(e.clientX, e.clientY);
              if (i !== null) pick(i);
            }}
            onPointerMove={(e) => setHover(nearest(e.clientX, e.clientY))}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              {/* the sea is the blue of the cornflowers round the frame, the
                  grass the green of their leaves (public/palais/blooms) */}
              <radialGradient id="wm-sea" cx="0.5" cy="0.5" r="0.75">
                <stop offset="0" stopColor="#3b6ccd" />
                <stop offset="0.7" stopColor="#245ac0" />
                <stop offset="1" stopColor="#174ba8" />
              </radialGradient>
              <radialGradient id="wm-grass" cx="0.5" cy="0.45" r="0.6">
                <stop offset="0" stopColor="#547d38" />
                <stop offset="0.7" stopColor="#346836" />
                <stop offset="1" stopColor="#21582a" />
              </radialGradient>
              <linearGradient id="wm-gilt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fbeec1" />
                <stop offset="0.45" stopColor="#d9b25a" />
                <stop offset="1" stopColor="#9c7632" />
              </linearGradient>
              <radialGradient id="wm-halo">
                <stop offset="0.6" stopColor="#fff7dc" stopOpacity={0.95} />
                <stop offset="1" stopColor="#fff7dc" stopOpacity={0} />
              </radialGradient>
              <clipPath id="wm-island">
                <path d={art.island} />
              </clipPath>
              <clipPath id="wm-island2">
                <path d={art.island2} />
              </clipPath>
              <clipPath id="wm-frame">
                <circle r={FRAME} />
              </clipPath>
              <clipPath id="wm-house">
                <path d={HOUSE(FRAME)} />
              </clipPath>
            </defs>

            {/* everything below slides as one, up to show the second island */}
            <g className="wm-world" style={{ transform: `translateY(${-isle * ISLE_DROP}px)` }}>
            {/* the sea */}
            <rect x={0} y={0} width={1000} height={680 + ISLE_DROP} fill="url(#wm-sea)" />
            {art.waves.map((w, i) => (
              <path key={i} d={`M${w.x.toFixed(0)},${w.y.toFixed(0)} q7,-5 14,0 t14,0`} fill="none" stroke="#e8f8ff" strokeOpacity={0.7} strokeWidth={1.8} strokeLinecap="round" />
            ))}
            {art.seaRocks.filter(([, y]) => y > ISLE_DROP).map(([x, y, r], i) => (
              <g key={i}>
                <ellipse cx={x} cy={y + 3} rx={r * 1.6} ry={r * 0.6} fill="#e8f8ff" opacity={0.6} />
                <path d={`M${x - r},${y + 2} Q${x - r * 0.6},${y - r} ${x},${y - r} Q${x + r * 0.8},${y - r * 0.6} ${x + r},${y + 2} Z`} fill="#8a8f98" stroke="#5f656e" strokeWidth={1} />
              </g>
            ))}

            {/* sailboats (the first island's painting has its own) */}
            {([] as number[][]).map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path d="M-12,4 L12,4 L8,10 L-8,10 Z" fill="#8a5a3c" />
                <path d="M0,-22 L0,4 L13,4 Z" fill="#fffdf6" stroke="#c9c0b0" strokeWidth={0.8} />
                <path d="M-2,-16 L-2,3 L-11,3 Z" fill="#f3ece0" stroke="#c9c0b0" strokeWidth={0.8} />
                <path d="M-18,12 q9,3 18,0 t18,0" fill="none" stroke="#e8f8ff" strokeWidth={1.6} strokeLinecap="round" />
              </g>
            ))}

            {/* seagulls (the painting has its own) */}
            {([] as number[][]).map(([x, y], i) => (
              <path key={i} d={`M${x - 7},${y} q4,-5 7,0 q3,-5 7,0`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
            ))}

            {/* islets out at sea */}
            {art.islets.map((s) => (
              <g key={s.id}>
                <path d={s.shallows} fill="#5d8ae6" opacity={0.8} />
                <path d={s.beach} fill="#f4e3b6" stroke="#fffaf0" strokeWidth={2} />
                <path d={s.land} fill="url(#wm-grass)" />
              </g>
            ))}

            {/* the island: turquoise shallows, a ring of sand and surf, then grass */}
            {/* the first island is painted (below), so its drawn coast, grass,
                rocks and trees are left out: they peeped out round the
                painting's edges as a white line of beach */}
            {/* the second island, the same way */}
            <path d={art.shallows2} fill="#5d8ae6" opacity={0.85} />
            <path d={art.beach2} fill="#f4e3b6" stroke="#fffaf0" strokeWidth={3} />
            <path d={art.island2} fill="url(#wm-grass)" />
            <g clipPath="url(#wm-island2)">
              {STOPS.map((s, i) => (s.islet || s.isle !== 2 ? null : <path key={s.id} d={art.meadows[i]} fill={s.color} opacity={0.34} />))}
              {art.flowers2.map((f, i) => (
                <circle key={i} cx={f.x} cy={f.y} r={2.4} fill={f.c} />
              ))}
            </g>
            <g clipPath="url(#wm-island)" display="none">
              {STOPS.map((s, i) => (s.islet || s.isle === 2 ? null : <path key={s.id} d={art.meadows[i]} fill={s.color} opacity={0.34} />))}
              {art.flowers.map((f, i) => (
                <circle key={i} cx={f.x} cy={f.y} r={2.4} fill={f.c} />
              ))}
            </g>
            {art.rocks.filter(() => false).map((r, i) => (
              <path key={i} d={`M${r.x - r.r},${r.y + r.r * 0.4} Q${r.x - r.r * 0.5},${r.y - r.r} ${r.x + r.r * 0.2},${r.y - r.r * 0.8} Q${r.x + r.r},${r.y - r.r * 0.3} ${r.x + r.r},${r.y + r.r * 0.4} Z`} fill="#9a9aa0" stroke="#6f7078" strokeWidth={1} />
            ))}

            {/* snowy peaks */}
            {art.peaks.filter(() => false).map(([x, y, h], i) => (
              <g key={i}>
                <path d={`M${x - h},${y + h * 0.35} L${x},${y - h} L${x + h},${y + h * 0.35} Z`} fill="#8e99a8" />
                <path d={`M${x},${y - h} L${x + h},${y + h * 0.35} L${x + h * 0.15},${y + h * 0.35} Z`} fill="#6f7a8a" />
                <path d={`M${x - h * 0.32},${y - h * 0.36} L${x},${y - h} L${x + h * 0.32},${y - h * 0.36} L${x + h * 0.1},${y - h * 0.46} L${x - h * 0.08},${y - h * 0.3} Z`} fill="#fbfdff" />
              </g>
            ))}
            {art.trees.filter((t) => t.y > ISLE_DROP).map(tree)}

            {/* what's in each room, painted beside it (MapScenery.tsx) */}
            <Scenery drop={ISLE_DROP} />

            {/* the dotted path between the stops */}
            {art.trails.map((t, i) =>
              t.rail ? (
                <g key={i}>
                  {/* two rails: a wide stroke with its middle masked out */}
                  <mask id={`wm-rails-${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1000} height={680 + ISLE_DROP}>
                    <path d={t.d} fill="none" stroke="#fff" strokeWidth={16} />
                    <path d={t.d} fill="none" stroke="#000" strokeWidth={8} />
                  </mask>
                  {/* the sleepers under them */}
                  <path d={t.d} fill="none" stroke="#4a2c12" strokeWidth={23} strokeDasharray="4 6" />
                  <path d={t.d} fill="none" stroke="#2e1a08" strokeWidth={16} mask={`url(#wm-rails-${i})`} />
                  <path d={t.d} fill="none" stroke="#9a6430" strokeWidth={13.5} mask={`url(#wm-rails-${i})`} />
                </g>
              ) : (
                <path key={i} d={t.d} fill="none" stroke="#fffdf6" strokeWidth={4.5} strokeDasharray="0.1 11" strokeLinecap="round" />
              ),
            )}

            {/* a compass rose, top left (the painting has its own, so it's hidden) */}
            <g transform="translate(108 96)" aria-hidden display="none">
              <circle r={26} fill="none" stroke="#f7e3a6" strokeWidth={1.5} opacity={0.9} />
              <path d="M0,-40 L5,-5 L40,0 L5,5 L0,40 L-5,5 L-40,0 L-5,-5 Z" fill="#fbeec1" stroke="#b98f3e" strokeWidth={1} />
              <path d="M0,-24 L3,-3 L24,0 L3,3 L0,24 L-3,3 L-24,0 L-3,-3 Z" fill="#d9b25a" transform="rotate(45)" opacity={0.85} />
            </g>

            {/* the first island is a painting (public/palais/map/island-one.webp),
                with every room's frame and name already painted in; the stops
                on it are just the places to press */}
            <image href={`${process.env.PUBLIC_URL}/palais/map/island-one.webp?v=20`} x={25} y={25} width={960} height={640} preserveAspectRatio="xMidYMid meet" />

            {/* the stops: a round gilt frame with the place inside */}
            {STOPS.map((s, i) => {
              const on = i === here;
              const w = labelWidth(s);
              return (
                <g
                  key={s.id}
                  className={`wm-stop${on ? " is-on" : ""}${hover === i && !on ? " is-hover" : ""}`}
                  transform={`translate(${spot(s)[0]} ${spot(s)[1]})`}
                  role="button"
                  tabIndex={0}
                  aria-label={s.name}
                  aria-pressed={on}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick(i);
                    }
                  }}
                >
                  <g transform={PAINTED[s.id] && isleOf(s) === 0 ? `scale(${(PAINTED[s.id].r + 1) / (FRAME + 5)})` : undefined}>
                  <g className="wm-cameo">
                    {on && <circle className="wm-halo" r={FRAME + 24} fill="url(#wm-halo)" />}
                    <ellipse cy={FRAME - 2} rx={FRAME * 0.9} ry={10} fill="#2f3a2a" opacity={0.28} />
                    {s.id === "palace" ? (
                      /* home is drawn as a little cartoon house, chimney and all */
                      <>
                        <rect x={FRAME * 0.42} y={-FRAME * 1.12} width={FRAME * 0.26} height={FRAME * 0.5} fill="var(--wm-jewel-side, #c9a44c)" stroke="#fffaf0" strokeWidth={1.2} />
                        <path d={HOUSE(FRAME + 1)} fill="#fffaf0" />
                        <image
                          href={picture(s, season)}
                          x={-FRAME * 1.4}
                          y={-FRAME * 1.1}
                          width={FRAME * 2.8}
                          height={FRAME * 2.1}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#wm-house)"
                        />
                        <path d={HOUSE(FRAME + 2)} fill="none" stroke="var(--wm-jewel-side, #c9a44c)" strokeWidth={5} strokeLinejoin="round" />
                        <path d={HOUSE(FRAME + 5)} fill="none" stroke="#fffaf0" strokeWidth={1.2} strokeLinejoin="round" opacity={0.9} />
                      </>
                    ) : (
                      <>
                        <circle r={FRAME + 1} fill="#fffaf0" />
                        <image
                          href={picture(s, season)}
                          x={-FRAME * 1.4}
                          y={-FRAME}
                          width={FRAME * 2.8}
                          height={FRAME * 2}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#wm-frame)"
                        />
                        <circle r={FRAME + 2} fill="none" stroke="var(--wm-jewel-side, #c9a44c)" strokeWidth={5} />
                        <circle r={FRAME + 5} fill="none" stroke="#fffaf0" strokeWidth={1.2} opacity={0.9} />
                      </>
                    )}
                  </g>
                  </g>
                  <g
                    transform={
                      PAINTED[s.id] && isleOf(s) === 0
                        ? `translate(${PAINTED[s.id].label[0]} ${PAINTED[s.id].label[1]})`
                        : `translate(0 ${FRAME + 22})`
                    }
                  >
                    <rect
                      x={-w / 2}
                      y={-15}
                      width={w}
                      height={30}
                      rx={15}
                      fill={on ? "#fbe3ea" : "#fffaf0"}
                      stroke={on ? "#d27a98" : "#c9a14e"}
                      strokeWidth={2}
                    />
                    <text className="wm-stop-name" y={6} textAnchor="middle">
                      {labelOf(s)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Honeysuckle, hopping from stop to stop */}
            <g
              className="wm-player"
              style={{ transform: `translate(${spot(stop)[0] + FRAME + 4}px, ${Math.max(spot(stop)[1] + 10, 146 + isle * ISLE_DROP)}px)` }}
            >
              <g className="wm-player-hop" key={here}>
                <image href={propSrc("cat-honeysuckle")} x={-41} y={-104} width={82} height={104} />
              </g>
            </g>
            </g>
          </svg>
          )}
          {/* the way to the other island */}
          {!globe &&
            (isle === 0 ? (
              <button type="button" className="wm-isle-arrow wm-isle-arrow--down" onClick={() => crossTo(1)}>
                <span aria-hidden>▼</span> To the next island
              </button>
            ) : (
              <button type="button" className="wm-isle-arrow wm-isle-arrow--up" onClick={() => crossTo(0)}>
                <span aria-hidden>▲</span> Back home
              </button>
            ))}
        </div>

        <div
          className="wm-card"
          aria-live="polite"
          style={{ backgroundImage: `linear-gradient(rgba(255, 252, 244, 0.93), rgba(251, 243, 232, 0.95)), url("${floralSrc(cardPaper.now)}")` }}
        >
          {/* the words scroll if they must; the buttons below always stay in view */}
          <div className="wm-card-body">
          <figure className={`wm-peek${portrait && stop.seasons ? " wm-peek--tall" : ""}`}>
            <img key={`${stop.id}-${season}-${portrait}`} src={picture(stop, season, portrait)} alt={`A look inside ${stop.name}`} decoding="async" />
          </figure>
          <div className="wm-card-head">
            <h3>{stop.name}</h3>
            <p className="wm-tag">
              Stop {here + 1} of {STOPS.length} · {stop.tag}
            </p>
          </div>
          <p className="wm-blurb">{stop.blurb}</p>
          <ul className="wm-finds">
            {stop.finds.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="wm-flourish" aria-hidden>
            ✦
          </div>
          </div>
          <div className="wm-actions">
          {stop.room ? (
            stop.room === place ? (
              <p className="wm-here">✿ You're here ✿</p>
            ) : (
              <button
                type="button"
                className="wm-btn wm-btn--visit"
                onClick={() => {
                  go(stop.room!);
                  onClose();
                }}
              >
                Visit {stop.name} ✿
              </button>
            )
          ) : (
            <p className="wm-soon">{stop.aside ?? "Coming soon"}</p>
          )}
          <div className="wm-nav">
            <button type="button" className="wm-btn" onClick={() => setHere((h) => Math.max(0, h - 1))} disabled={here === 0}>
              ◀ Back
            </button>
            <button
              type="button"
              className="wm-btn wm-btn--next"
              onClick={() => setHere((h) => Math.min(STOPS.length - 1, h + 1))}
              disabled={here === STOPS.length - 1}
            >
              Next stop ▶
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
