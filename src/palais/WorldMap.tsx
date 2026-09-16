import { useEffect, useMemo, useRef, useState } from "react";
import { floralSrc, useFloral } from "./florals";
import { propSrc } from "./props";
import { usePlace, type Place } from "./place";

/**
 * Area M: the world map, like the level select in a storybook game: an
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
  /** the room of the Palais you can walk into from here, if there is one yet */
  room?: Place;
}

const STOPS: Stop[] = [
  {
    id: "palace",
    name: "The Palais",
    tag: "home",
    blurb: "The gilded terrace where everyone lives: cats, cake and cameos, with the mountain through the arches and the pool out back, all through the four seasons.",
    finds: ["A painted ceiling full of cherubs", "Honeysuckle riding her tricycle", "A pool out back for the dogs in summer"],
    color: "#ffd88a",
    at: [560, 420],
    patch: [58, 42],
    seed: 7,
    room: "palace",
  },
  {
    id: "kitchen",
    name: "The Kitchen",
    tag: "just off the terrace",
    blurb: "The marble bar you can see from the terrace is only the end of it: a whole kitchen of pink tile, mint stools and brass, with the garden through the windows and something always baking.",
    finds: ["The mint bar stools", "A copper kettle on the range", "Cakes cooling for the cats' birthdays"],
    color: "#f7b7a3",
    at: [408, 414],
    patch: [52, 38],
    seed: 23,
    room: "kitchen",
  },
  {
    id: "lakehouse",
    name: "The Lakehouse",
    tag: "where it began",
    blurb: "A glass house at the edge of a still lake, with a fire going and the mountain glowing across the water. The Shimmer started here and spread out to everything else.",
    finds: ["A red bridge over the Japanese garden", "A boathouse and a long dock", "Sunrise over the mountain"],
    color: "#8fcbe8",
    at: [400, 276],
    patch: [80, 58],
    seed: 11,
    room: "lakehouse",
  },
  {
    id: "closet",
    name: "The Wardrobe Wing",
    tag: "inside the Lakehouse",
    blurb: "Every dress you ever loved, hanging in the order you wore it somewhere beautiful.",
    finds: ["Mirrors that show your best days", "A staircase made of Mary Janes", "Rails and rails of hanging dresses"],
    color: "#ffb3d6",
    at: [548, 222],
    patch: [46, 38],
    seed: 23,
    room: "closet",
  },
  {
    id: "domes",
    name: "The City of Domes",
    tag: "the old city",
    blurb: "A steaming marble bath under blue-and-white tiles, looking out over domes and minarets, a yellow tram, gondolas on the canal and a volcano at sunset.",
    finds: ["A warm pool with a fountain", "A little yellow tram up the hill", "Gondolas below the palace on the river"],
    color: "#ffb99b",
    at: [737, 199],
    patch: [98, 66],
    seed: 97,
    room: "domes",
  },
  {
    id: "lanterns",
    name: "The Lantern Isles",
    tag: "by ferry",
    blurb: "A red lacquered pavilion hung with glowing lanterns, looking across the water to a temple island lit up at dusk, with cranes painted on the ceiling.",
    finds: ["Temples stepping up a cliff to a glowing tower", "A lantern boat on the water", "Cherry blossom and red maples"],
    color: "#ffab9e",
    at: [885, 142],
    patch: [56, 40],
    seed: 131,
    room: "lanterns",
    islet: true,
  },
  {
    id: "jacaranda",
    name: "The Jacaranda Quarter",
    tag: "night streets",
    blurb: "French doors open onto an iron balcony over a cobbled street of purple jacaranda trees, gas lamps and a waterfront glowing pink at dusk.",
    finds: ["Purple petals on the balcony floor", "A little jazz stage with a double bass", "Neon lights on the water past the palms"],
    color: "#c9b3ff",
    at: [841, 373],
    patch: [52, 58],
    seed: 103,
    room: "jacaranda",
  },
  {
    id: "bathroom",
    name: "The Bathroom",
    tag: "through the right arch",
    blurb: "The bathroom you glimpse through the arch on the terrace: a clawfoot tub, rose wallpaper, a glass-block window and cabinets of pretty jars, all in blush and white.",
    finds: ["A clawfoot tub", "Glass-block windows", "Pink towels and jars of bath salts"],
    color: "#f3c6d8",
    at: [687, 337],
    patch: [48, 36],
    seed: 29,
    room: "bathroom",
  },
  {
    id: "gorge",
    name: "The Amphitheatre",
    tag: "the festival",
    blurb: "Grass terraces on a canyon rim, a river far below, and the sun going down into the sea behind the stage.",
    finds: ["A stage lit up on the canyon rim", "A marina of yachts below the cliffs", "String lights through the arches"],
    color: "#ffc978",
    at: [681, 520],
    patch: [92, 64],
    seed: 83,
    room: "gorge",
  },
  {
    id: "caves",
    name: "The Hollow of Small Stars",
    tag: "under the hills",
    blurb: "A cosy grotto under a ceiling of glowworms, with lantern-lit steps down to a rowboat on a misty river, hobbit doors in the hills and a snowy mountain at dusk.",
    finds: ["Glowworms like a galaxy overhead", "Round doors in the green hills", "Hot springs steaming down the terraces"],
    color: "#a9b8ff",
    at: [462, 552],
    patch: [92, 60],
    seed: 71,
    room: "caves",
  },
  {
    id: "reef",
    name: "The Glass Reef",
    tag: "out at sea",
    blurb: "A seashell pavilion of white marble and gold, half under the sea: a palm island above the waterline, and a coral reef with sea turtles below.",
    finds: ["A sea turtle gliding past the glass", "A palm island floating on the waterline", "Sunlight rippling across the floor"],
    color: "#6fd3e6",
    at: [125, 580],
    patch: [70, 36],
    seed: 67,
    room: "reef",
    islet: true,
  },
  {
    id: "shore",
    name: "The Shore of All Shores",
    tag: "every beach at once",
    blurb: "A white loggia draped in bougainvillea, with every beach at once through the arches: white cliff houses with blue domes, a sea stack at sunset and a seaside promenade.",
    finds: ["Blue domes on a white cliff", "A yacht below the sea stack at sunset", "Striped umbrellas along the promenade"],
    color: "#7fdccf",
    at: [220, 442],
    patch: [80, 100],
    seed: 53,
    room: "shore",
  },
  {
    id: "garden",
    name: "The Glasshouse",
    tag: "a garden conservatory",
    blurb: "An iron-and-glass conservatory built over the garden, full of magnolia, wisteria and hydrangea, with the rain on the roof and the mountain beyond the panes.",
    finds: ["A vaulted glass roof", "Wisteria grown right over the ironwork", "Orchids, ferns and a fountain"],
    color: "#b5dca8",
    at: [242, 304],
    patch: [56, 42],
    seed: 31,
    room: "garden",
  },
  {
    id: "rainwood",
    name: "The Rainwood",
    tag: "moss & mist",
    blurb: "A glass conservatory grown over with ferns, looking out on mossy giant trees, a misty river and a glowing bubble dome.",
    finds: ["A glass bubble dome in the trees", "A cabin with a hot tub on the water", "Sunbeams through the mist"],
    color: "#9fd88f",
    at: [242, 166],
    patch: [86, 70],
    seed: 41,
    room: "rainwood",
  },
  {
    id: "lagoon",
    name: "The Steaming Lagoon",
    tag: "fire under snow",
    blurb: "Milky blue water steaming in the snow under the northern lights, with a geyser, a waterfall and a volcano glowing on the horizon.",
    finds: ["A little bridge over the warm blue water", "Sea stacks off a black-sand beach", "A lodge lit up on the ski slope"],
    color: "#cdeefa",
    at: [408, 99],
    patch: [104, 56],
    seed: 37,
    room: "lagoon",
  },
  {
    id: "madeleine",
    name: "Madeleine's Room",
    tag: "upstairs, facing the sea",
    blurb: "A round pink room with gilt shells on the walls and a painted sky on the ceiling, where lace curtains open onto a balcony of roses and the sun going down into the sea.",
    finds: ["A mosaic floor of blue flowers", "Bougainvillea over the balcony", "The sunset path across the water"],
    color: "#ffc2cf",
    at: [592, 96],
    patch: [48, 36],
    seed: 151,
    room: "madeleine",
  },
  {
    id: "library",
    name: "The Library",
    tag: "up the book stairs",
    blurb: "Carved walnut shelves climb to a painted sky with a golden sun, a staircase of books spirals up the wall, and the desk sits at an arched window over the lake at sunset.",
    finds: ["A spiral staircase made of books", "A globe and a rolling ladder", "Roses round the window over the lake"],
    color: "#d9a066",
    at: [120, 300],
    patch: [48, 36],
    seed: 167,
    room: "library",
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

const ISLAND = { cx: 500, cy: 352, rx: 416, ry: 275, seed: 5, amp: 0.1 };
const islandEdge = wobble(ISLAND.seed, ISLAND.amp);
/** 0 at the middle of the island, 1 at its coast */
const inland = (x: number, y: number) => {
  const dx = (x - ISLAND.cx) / ISLAND.rx;
  const dy = (y - ISLAND.cy) / ISLAND.ry;
  return Math.hypot(dx, dy) / islandEdge(Math.atan2(dy, dx));
};

/** each stop's picture, in a round gilt frame */
const FRAME = 44;
const labelOf = (s: Stop) => s.name;
const labelWidth = (s: Stop) => labelOf(s).length * 8.6 + 30;

const picture = (s: Stop) => `${process.env.PUBLIC_URL}/palais/map/${s.room ?? s.id}.webp`;

/** a cluster of apple blossom and leaves, for the corners of the frame */
function Blossoms({ className }: { className: string }) {
  const flower = (x: number, y: number, r: number, pink: boolean, rot = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-r * 0.55} rx={r * 0.42} ry={r * 0.55} transform={`rotate(${a})`} fill={pink ? "url(#wm-petal-pink)" : "url(#wm-petal-white)"} stroke="#e2b8c4" strokeWidth={0.6} />
      ))}
      <circle r={r * 0.2} fill="#f2c45a" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.3} cy={Math.sin((a * Math.PI) / 180) * r * 0.3} r={r * 0.05} fill="#c98a2e" />
      ))}
    </g>
  );
  const leaf = (x: number, y: number, len: number, rot: number) => (
    <path transform={`translate(${x} ${y}) rotate(${rot})`} d={`M0,0 C${len * 0.3},${-len * 0.28} ${len * 0.75},${-len * 0.22} ${len},0 C${len * 0.75},${len * 0.22} ${len * 0.3},${len * 0.28} 0,0 Z`} fill="#6f9a5a" stroke="#4f7a44" strokeWidth={0.7} />
  );
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden>
      <defs>
        <radialGradient id="wm-petal-white">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#f6e4ea" />
        </radialGradient>
        <radialGradient id="wm-petal-pink">
          <stop offset="0" stopColor="#fde7ef" />
          <stop offset="1" stopColor="#eea6bf" />
        </radialGradient>
      </defs>
      {leaf(50, 52, 44, -150)}
      {leaf(56, 58, 40, 80)}
      {leaf(48, 60, 36, 150)}
      {leaf(60, 48, 38, -40)}
      {flower(40, 40, 22, false, 10)}
      {flower(74, 58, 18, true, -20)}
      {flower(46, 80, 15, false, 30)}
      {flower(80, 26, 11, true, 5)}
      {flower(20, 66, 10, true, 40)}
    </svg>
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
  const closeBtn = useRef<HTMLButtonElement>(null);
  const mapSvg = useRef<SVGSVGElement>(null);
  // the place a click would pick, while the pointer is over the map
  const [hover, setHover] = useState<number | null>(null);
  // the map wears the same cream paper over a floral as the catalogue
  const paper = useFloral("map");

  /** the place nearest to a point on the screen */
  const nearest = (clientX: number, clientY: number) => {
    const svg = mapSvg.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    let best = 0;
    let bestD = Infinity;
    STOPS.forEach((st, i) => {
      const d = Math.hypot(st.at[0] - pt.x, st.at[1] - pt.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
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
    const shallows = blob(I.cx, I.cy + 6, I.rx + 40, I.ry + 36, I.seed, I.amp, 140);
    const islets = STOPS.filter((s) => s.islet).map((s) => ({
      id: s.id,
      at: s.at,
      shallows: blob(s.at[0], s.at[1] + 6, FRAME + 58, FRAME + 44, s.seed + 1, 0.14, 48),
      beach: blob(s.at[0], s.at[1] + 5, FRAME + 40, FRAME + 30, s.seed + 1, 0.14, 48),
      land: blob(s.at[0], s.at[1] + 2, FRAME + 30, FRAME + 20, s.seed + 1, 0.14, 48),
    }));
    const meadows = STOPS.map((s) => blob(s.at[0], s.at[1], s.patch[0] + 16, s.patch[1] + 12, s.seed, 0.18, 48));
    const trails = STOPS.slice(0, -1).map((s, i) => trail(s.at, STOPS[i + 1].at, i));

    // keep trees, flowers and mountains off the pictures and their names
    const clear = (x: number, y: number, pad: number) =>
      STOPS.every((s) => {
        if (Math.hypot(x - s.at[0], y - s.at[1]) < FRAME + 10 + pad) return false;
        const ly = s.at[1] + FRAME + 22;
        return !(Math.abs(x - s.at[0]) < labelWidth(s) / 2 + 8 + pad && Math.abs(y - ly) < 16 + pad);
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
    trees.sort((a, b) => a.y - b.y);

    const flowers: { x: number; y: number; c: string }[] = [];
    const PETALS = ["#f4a6c6", "#c9a3ec", "#ffffff", "#f7c2d6", "#b48be0"];
    for (let n = 0; n < 4000 && flowers.length < 260; n++) {
      const x = 95 + rand() * 810;
      const y = 85 + rand() * 545;
      if (inland(x, y) > 0.88 || !clear(x, y, 2)) continue;
      flowers.push({ x, y, c: PETALS[Math.floor(rand() * PETALS.length)] });
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
    const waves = Array.from({ length: 40 }, () => ({ x: 20 + rand() * 960, y: 16 + rand() * 650 })).filter(
      (w) => ((w.x - I.cx) / (I.rx + 70)) ** 2 + ((w.y - I.cy) / (I.ry + 64)) ** 2 > 1,
    );
    return { island, beach, shallows, islets, meadows, trails, trees, flowers, peaks, rocks, seaRocks, waves };
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
    const green = t.tone < 0.33 ? "#4f8a4c" : t.tone < 0.66 ? "#5f9c55" : "#3f7a45";
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
    <div className="wm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="wm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wm-title"
        /* the same cream paper over a floral as the catalogue */
        style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.965), rgba(250, 243, 229, 0.975)), url("${floralSrc(paper.now)}")` }}
      >
        <Blossoms className="wm-bloom wm-bloom--tl" />
        <Blossoms className="wm-bloom wm-bloom--bl" />
        <Blossoms className="wm-bloom wm-bloom--tr" />
        <Blossoms className="wm-bloom wm-bloom--br" />

        <div className="wm-title">
          <Blossoms className="wm-bloom wm-bloom--title-l" />
          <h2 id="wm-title">
            <span aria-hidden>✿</span> Area M <span aria-hidden>✿</span>
          </h2>
          <Blossoms className="wm-bloom wm-bloom--title-r" />
        </div>
        <button ref={closeBtn} type="button" className="wm-close" onClick={onClose} aria-label="Close the map">
          ×
        </button>

        <div className="wm-stage">
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
              <radialGradient id="wm-sea" cx="0.5" cy="0.5" r="0.75">
                <stop offset="0" stopColor="#56c3e6" />
                <stop offset="0.7" stopColor="#3aa6d6" />
                <stop offset="1" stopColor="#2c8fc4" />
              </radialGradient>
              <radialGradient id="wm-grass" cx="0.5" cy="0.45" r="0.6">
                <stop offset="0" stopColor="#a9d77f" />
                <stop offset="0.7" stopColor="#8cc46c" />
                <stop offset="1" stopColor="#6fae5c" />
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
              <clipPath id="wm-frame">
                <circle r={FRAME} />
              </clipPath>
            </defs>

            {/* the sea */}
            <rect x={0} y={0} width={1000} height={680} fill="url(#wm-sea)" />
            {art.waves.map((w, i) => (
              <path key={i} d={`M${w.x.toFixed(0)},${w.y.toFixed(0)} q7,-5 14,0 t14,0`} fill="none" stroke="#e8f8ff" strokeOpacity={0.7} strokeWidth={1.8} strokeLinecap="round" />
            ))}
            {art.seaRocks.map(([x, y, r], i) => (
              <g key={i}>
                <ellipse cx={x} cy={y + 3} rx={r * 1.6} ry={r * 0.6} fill="#e8f8ff" opacity={0.6} />
                <path d={`M${x - r},${y + 2} Q${x - r * 0.6},${y - r} ${x},${y - r} Q${x + r * 0.8},${y - r * 0.6} ${x + r},${y + 2} Z`} fill="#8a8f98" stroke="#5f656e" strokeWidth={1} />
              </g>
            ))}

            {/* sailboats */}
            {[
              [215, 100],
              [915, 455],
              [835, 640],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path d="M-12,4 L12,4 L8,10 L-8,10 Z" fill="#8a5a3c" />
                <path d="M0,-22 L0,4 L13,4 Z" fill="#fffdf6" stroke="#c9c0b0" strokeWidth={0.8} />
                <path d="M-2,-16 L-2,3 L-11,3 Z" fill="#f3ece0" stroke="#c9c0b0" strokeWidth={0.8} />
                <path d="M-18,12 q9,3 18,0 t18,0" fill="none" stroke="#e8f8ff" strokeWidth={1.6} strokeLinecap="round" />
              </g>
            ))}

            {/* seagulls */}
            {[
              [120, 390],
              [140, 405],
              [104, 412],
            ].map(([x, y], i) => (
              <path key={i} d={`M${x - 7},${y} q4,-5 7,0 q3,-5 7,0`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
            ))}

            {/* islets out at sea */}
            {art.islets.map((s) => (
              <g key={s.id}>
                <path d={s.shallows} fill="#8fe0ee" opacity={0.8} />
                <path d={s.beach} fill="#f4e3b6" stroke="#fffaf0" strokeWidth={2} />
                <path d={s.land} fill="url(#wm-grass)" />
              </g>
            ))}

            {/* the island: turquoise shallows, a ring of sand and surf, then grass */}
            <path d={art.shallows} fill="#8fe0ee" opacity={0.85} />
            <path d={art.beach} fill="#f4e3b6" stroke="#fffaf0" strokeWidth={3} />
            <path d={art.island} fill="url(#wm-grass)" />
            <g clipPath="url(#wm-island)">
              {STOPS.map((s, i) => (s.islet ? null : <path key={s.id} d={art.meadows[i]} fill={s.color} opacity={0.34} />))}
              {/* a lake by the lakehouse, and a river down to the sea */}
              <path d="M470,190 C440,240 470,268 440,292" fill="none" stroke="#5fc0e0" strokeWidth={6} strokeLinecap="round" />
              <path d="M470,372 C520,410 600,470 640,500 C720,560 820,590 930,640" fill="none" stroke="#5fc0e0" strokeWidth={7} strokeLinecap="round" />
              {art.flowers.map((f, i) => (
                <circle key={i} cx={f.x} cy={f.y} r={2.4} fill={f.c} />
              ))}
            </g>
            {art.rocks.map((r, i) => (
              <path key={i} d={`M${r.x - r.r},${r.y + r.r * 0.4} Q${r.x - r.r * 0.5},${r.y - r.r} ${r.x + r.r * 0.2},${r.y - r.r * 0.8} Q${r.x + r.r},${r.y - r.r * 0.3} ${r.x + r.r},${r.y + r.r * 0.4} Z`} fill="#9a9aa0" stroke="#6f7078" strokeWidth={1} />
            ))}

            {/* snowy peaks */}
            {art.peaks.map(([x, y, h], i) => (
              <g key={i}>
                <path d={`M${x - h},${y + h * 0.35} L${x},${y - h} L${x + h},${y + h * 0.35} Z`} fill="#8e99a8" />
                <path d={`M${x},${y - h} L${x + h},${y + h * 0.35} L${x + h * 0.15},${y + h * 0.35} Z`} fill="#6f7a8a" />
                <path d={`M${x - h * 0.32},${y - h * 0.36} L${x},${y - h} L${x + h * 0.32},${y - h * 0.36} L${x + h * 0.1},${y - h * 0.46} L${x - h * 0.08},${y - h * 0.3} Z`} fill="#fbfdff" />
              </g>
            ))}
            {art.trees.map(tree)}

            {/* the dotted path between the stops */}
            {art.trails.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#fffdf6" strokeWidth={4.5} strokeDasharray="0.1 11" strokeLinecap="round" />
            ))}

            {/* a compass rose, top left */}
            <g transform="translate(108 96)" aria-hidden>
              <circle r={26} fill="none" stroke="#f7e3a6" strokeWidth={1.5} opacity={0.9} />
              <path d="M0,-40 L5,-5 L40,0 L5,5 L0,40 L-5,5 L-40,0 L-5,-5 Z" fill="#fbeec1" stroke="#b98f3e" strokeWidth={1} />
              <path d="M0,-24 L3,-3 L24,0 L3,3 L0,24 L-3,3 L-24,0 L-3,-3 Z" fill="#d9b25a" transform="rotate(45)" opacity={0.85} />
            </g>

            {/* the stops: a round gilt frame with the place inside */}
            {STOPS.map((s, i) => {
              const on = i === here;
              const w = labelWidth(s);
              return (
                <g
                  key={s.id}
                  className={`wm-stop${on ? " is-on" : ""}${hover === i && !on ? " is-hover" : ""}`}
                  transform={`translate(${s.at[0]} ${s.at[1]})`}
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
                  <g className="wm-cameo">
                    {on && <circle className="wm-halo" r={FRAME + 24} fill="url(#wm-halo)" />}
                    <ellipse cy={FRAME - 2} rx={FRAME * 0.9} ry={10} fill="#2f3a2a" opacity={0.28} />
                    <circle r={FRAME + 1} fill="#fffaf0" />
                    <image
                      href={picture(s)}
                      x={-FRAME * 1.4}
                      y={-FRAME}
                      width={FRAME * 2.8}
                      height={FRAME * 2}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath="url(#wm-frame)"
                    />
                    <circle r={FRAME + 2} fill="none" stroke="url(#wm-gilt)" strokeWidth={5} />
                    <circle r={FRAME + 5} fill="none" stroke="#fffaf0" strokeWidth={1.2} opacity={0.9} />
                  </g>
                  <g transform={`translate(0 ${FRAME + 22})`}>
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
            <g className="wm-player" style={{ transform: `translate(${stop.at[0] + FRAME + 4}px, ${stop.at[1] + 10}px)` }}>
              <g className="wm-player-hop" key={here}>
                <image href={propSrc("cat-honeysuckle")} x={-29} y={-74} width={58} height={74} />
              </g>
            </g>
          </svg>
        </div>

        <div className="wm-card" aria-live="polite">
          {/* the words scroll if they must; the buttons below always stay in view */}
          <div className="wm-card-body">
          <figure className="wm-peek">
            <img key={stop.id} src={picture(stop)} alt={`A look inside ${stop.name}`} decoding="async" />
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
            <p className="wm-soon">Coming soon</p>
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
