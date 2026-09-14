import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { propSrc } from "./props";
import { usePlace, type Place } from "./place";

/**
 * Area M: the world map, like the level select in a video game.
 *
 * One island, made of everywhere Molly has been, blended together and never
 * named after the real places. Each region is a stop on a dotted path, and
 * Honeysuckle hops along it to whichever stop is picked. The path starts at
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
  icon: (color: string) => ReactNode;
  /** out at sea, on its own island */
  islet?: boolean;
  /** put the name above the stop instead of below */
  nameAbove?: boolean;
  /** the room of the Palais you can walk into from here, if there is one yet */
  room?: Place;
}

const INK = "#7a5a52";

const STOPS: Stop[] = [
  {
    id: "palace",
    name: "The Palais",
    tag: "home",
    blurb: "The gilded terrace where everyone lives: cats, cake and cameos, with the mountain through the arches and the pool out back, all through the four seasons.",
    finds: ["A painted ceiling full of cherubs", "Honeysuckle riding her tricycle", "A pool out back for the dogs in summer"],
    color: "#ffd88a",
    at: [575, 410],
    patch: [58, 42],
    seed: 7,
    room: "palace",
    icon: () => (
      <>
        <rect x={-13} y={-2} width={26} height={14} rx={1.5} fill="#fff" stroke={INK} strokeWidth={2.5} />
        <path d="M-15,-2 h30 l-3,-5 h-24 Z" fill="#ffd88a" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M-6,-7 a6,6 0 0 1 12,0 Z" fill="#ffb3cf" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M0,-13 v-4" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        <path d="M-3,12 v-6 a3,3 0 0 1 6,0 v6" fill="#8fcbe8" stroke={INK} strokeWidth={2} />
        <path d="M-10,4 h3 M7,4 h3" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "lakehouse",
    name: "The Lakehouse",
    tag: "where it began",
    blurb: "A glass house at the edge of a still lake, with a fire going and the mountain glowing across the water. The Shimmer started here and spread out to everything else.",
    finds: ["A red bridge over the Japanese garden", "A boathouse and a long dock", "Sunrise over the mountain"],
    color: "#8fcbe8",
    at: [470, 338],
    patch: [80, 58],
    seed: 11,
    room: "lakehouse",
    icon: (c) => (
      <>
        <rect x={-11} y={-4} width={22} height={16} rx={2} fill="#fff" stroke={INK} strokeWidth={2.5} />
        <path d="M-15,-3 L0,-16 L15,-3 Z" fill={c} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={-3} y={3} width={6} height={9} rx={1.5} fill="#ffb3cf" stroke={INK} strokeWidth={2} />
      </>
    ),
  },
  {
    id: "closet",
    name: "The Wardrobe Wing",
    tag: "inside the Lakehouse",
    blurb: "Every dress you ever loved, hanging in the order you wore it somewhere beautiful.",
    finds: ["Mirrors that show your best days", "A staircase made of Mary Janes", "Rails and rails of hanging dresses"],
    color: "#ffb3d6",
    at: [590, 296],
    patch: [46, 38],
    seed: 23,
    nameAbove: true,
    room: "closet",
    icon: (c) => (
      <path
        d="M-5,-15 h10 l2,6 l7,19 q-14,5 -28,0 l7,-19 Z"
        fill={c}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "domes",
    name: "The City of Domes",
    tag: "the old city",
    blurb: "A steaming marble bath under blue-and-white tiles, looking out over domes and minarets, a yellow tram, gondolas on the canal and a volcano at sunset.",
    finds: ["A warm pool with a fountain", "A little yellow tram up the hill", "Gondolas below the palace on the river"],
    color: "#ffb99b",
    at: [720, 280],
    patch: [98, 66],
    seed: 97,
    room: "domes",
    icon: (c) => (
      <>
        <path d="M-13,8 a13,13 0 0 1 26,0 Z" fill={c} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={-13} y={8} width={26} height={7} fill="#fff" stroke={INK} strokeWidth={2.5} />
        <path d="M0,-5 V-15 l7,3 l-7,3" fill="#ff8bb8" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: "lanterns",
    name: "The Lantern Isles",
    tag: "by ferry",
    blurb: "Temple roofs stepping up a forest ridge, with a tower of lanterns at the very top.",
    finds: ["Lanterns glowing up the hillside", "An island avenue lined with trees", "Tea in a wooden temple"],
    color: "#ffab9e",
    at: [888, 158],
    patch: [56, 40],
    seed: 131,
    islet: true,
    nameAbove: true,
    icon: () => (
      <>
        <rect x={-10} y={-11} width={20} height={22} rx={8} fill="#ff8b7a" stroke={INK} strokeWidth={2.5} />
        <path d="M-10,-3 h20 M-10,4 h20" stroke={INK} strokeWidth={1.8} />
        <path d="M-5,-15 h10 M-5,15 h10" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "jacaranda",
    name: "The Jacaranda Quarter",
    tag: "night streets",
    blurb: "French doors open onto an iron balcony over a cobbled street of purple jacaranda trees, gas lamps and a waterfront glowing pink at dusk.",
    finds: ["Purple petals on the balcony floor", "A little jazz stage with a double bass", "Neon lights on the water past the palms"],
    color: "#c9b3ff",
    at: [830, 420],
    patch: [52, 58],
    seed: 103,
    room: "jacaranda",
    nameAbove: true,
    icon: (c) => (
      <>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-8} rx={5.5} ry={8} fill={c} stroke={INK} strokeWidth={2} transform={`rotate(${a})`} />
        ))}
        <circle r={4.5} fill="#ffe27a" stroke={INK} strokeWidth={2} />
      </>
    ),
  },
  {
    id: "gorge",
    name: "The Amphitheatre",
    tag: "the festival",
    blurb: "Grass terraces on a canyon rim, a river far below, and the sun going down into the sea behind the stage.",
    finds: ["A stage lit up on the canyon rim", "A marina of yachts below the cliffs", "String lights through the arches"],
    color: "#ffc978",
    at: [665, 470],
    patch: [92, 64],
    seed: 83,
    room: "gorge",
    icon: () => (
      <path
        d="M-4,8 a5,4 0 1 1 -2,-4 V-12 l14,-4 V4 a5,4 0 1 1 -2,-4 V-10 l-10,3"
        fill="#fff"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "caves",
    name: "The Hollow of Small Stars",
    tag: "under the hills",
    blurb: "A quiet boat ride down an underground river, under a ceiling full of glowing stars.",
    finds: ["Glowworms like a galaxy overhead", "Geysers puffing through the forest", "Round doors in soft green hills"],
    color: "#a9b8ff",
    at: [448, 500],
    patch: [92, 60],
    seed: 71,
    icon: () => (
      <path
        d="M0,-15 L4,-4 L15,-4 L6,3 L9,14 L0,7 L-9,14 L-6,3 L-15,-4 L-4,-4 Z"
        fill="#fff3a6"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "reef",
    name: "The Glass Reef",
    tag: "out at sea",
    blurb: "A seashell pavilion of white marble and gold, half under the sea: a palm island above the waterline, and a coral reef with sea turtles below.",
    finds: ["A sea turtle gliding past the glass", "A palm island floating on the waterline", "Sunlight rippling across the floor"],
    color: "#6fd3e6",
    at: [140, 604],
    patch: [70, 36],
    seed: 67,
    room: "reef",
    islet: true,
    icon: () => (
      <>
        <path d="M-14,0 q10,-12 22,0 q-12,12 -22,0 Z" fill="#ff9e9e" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M8,0 l8,-7 v14 Z" fill="#ff9e9e" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={-6} cy={-2} r={1.8} fill={INK} />
      </>
    ),
  },
  {
    id: "shore",
    name: "The Shore of All Shores",
    tag: "every beach at once",
    blurb: "Black sand on one side, turquoise coves on the other, and it's always golden hour.",
    finds: ["Cave rooms carved into a white cliff", "A little yacht that's always at anchor", "A sunset boat along the coast"],
    color: "#7fdccf",
    at: [238, 418],
    patch: [80, 100],
    seed: 53,
    icon: (c) => (
      <>
        <circle cx={6} cy={-7} r={7} fill="#ffe27a" stroke={INK} strokeWidth={2.5} />
        <path d="M-15,6 q4,-5 8,0 t8,0 t8,0 t8,0" fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" />
        <path d="M-15,6 q4,-5 8,0 t8,0 t8,0 t8,0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "rainwood",
    name: "The Rainwood",
    tag: "moss & mist",
    blurb: "A glass conservatory grown over with ferns, looking out on mossy giant trees, a misty river and a glowing bubble dome.",
    finds: ["A glass bubble dome in the trees", "A cabin with a hot tub on the water", "Sunbeams through the mist"],
    color: "#9fd88f",
    at: [278, 238],
    patch: [86, 70],
    seed: 41,
    room: "rainwood",
    icon: (c) => (
      <>
        <path d="M0,-16 L11,2 H-11 Z M0,-8 L13,10 H-13 Z" fill={c} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={-2.5} y={10} width={5} height={5} fill={INK} />
      </>
    ),
  },
  {
    id: "lagoon",
    name: "The Steaming Lagoon",
    tag: "fire under snow",
    blurb: "Milky blue water steaming in the snow under the northern lights, with a geyser, a waterfall and a volcano glowing on the horizon.",
    finds: ["A little bridge over the warm blue water", "Sea stacks off a black-sand beach", "A lodge lit up on the ski slope"],
    color: "#cdeefa",
    at: [470, 168],
    patch: [104, 56],
    seed: 37,
    room: "lagoon",
    icon: () => (
      <>
        <path d="M-16,12 L-3,-10 L10,12 Z" fill="#fff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M-3,-10 l-5,8 l5,-2 l5,2 Z" fill="#ff9e9e" />
        <path d="M9,2 q-4,-5 0,-9 q4,-4 0,-9" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      </>
    ),
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
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, amp = 0.12, n = 64) {
  const rand = rng(seed);
  const waves = [2, 3, 4, 5, 7, 11].map((k) => ({ k, a: (rand() * amp) / Math.sqrt(k / 2), p: rand() * Math.PI * 2 }));
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    let m = 1;
    for (const w of waves) m += w.a * Math.sin(w.k * t + w.p);
    pts.push([cx + Math.cos(t) * rx * m, cy + Math.sin(t) * ry * m]);
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

const ISLAND = { cx: 500, cy: 352, rx: 378, ry: 250, seed: 5 };

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

  const shapes = useMemo(() => {
    const island = blob(ISLAND.cx, ISLAND.cy, ISLAND.rx, ISLAND.ry, ISLAND.seed, 0.1, 120);
    const beach = blob(ISLAND.cx, ISLAND.cy + 6, ISLAND.rx + 16, ISLAND.ry + 16, ISLAND.seed, 0.1, 120);
    const patches = STOPS.map((s) => blob(s.at[0], s.at[1], s.patch[0], s.patch[1], s.seed, 0.14, 48));
    const islets = STOPS.filter((s) => s.islet).map((s) => ({
      id: s.id,
      beach: blob(s.at[0], s.at[1] + 4, s.patch[0] + 24, s.patch[1] + 22, s.seed + 1, 0.12, 48),
      land: blob(s.at[0], s.at[1], s.patch[0] + 12, s.patch[1] + 12, s.seed + 1, 0.12, 48),
    }));
    const trails = STOPS.slice(0, -1).map((s, i) => trail(s.at, STOPS[i + 1].at, i));
    const rand = rng(909);
    const sparkles = Array.from({ length: 26 }, () => {
      const t = rand() * Math.PI * 2;
      const r = 1.08 + rand() * 0.28;
      return { x: ISLAND.cx + Math.cos(t) * ISLAND.rx * r, y: ISLAND.cy + Math.sin(t) * ISLAND.ry * r, d: -rand() * 3 };
    });
    return { island, beach, patches, islets, trails, sparkles };
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

  return (
    <div className="wm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wm-panel" role="dialog" aria-modal="true" aria-labelledby="wm-title">
        <div className="wm-banner">
          <span aria-hidden className="wm-banner-tail wm-banner-tail--l" />
          <h2 id="wm-title">
            <span aria-hidden>✿ </span>Area M<span aria-hidden> ✿</span>
          </h2>
          <span aria-hidden className="wm-banner-tail wm-banner-tail--r" />
        </div>
        <button ref={closeBtn} type="button" className="wm-close" onClick={onClose} aria-label="Close the map">
          ×
        </button>

        <div className="wm-stage">
          <svg className="wm-map" viewBox="0 0 1000 680" role="img" aria-label={`World map. Honeysuckle is at ${stop.name}.`}>
            <defs>
              <linearGradient id="wm-rainbow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff9ecf" />
                <stop offset="0.25" stopColor="#ffd88a" />
                <stop offset="0.5" stopColor="#a6f0cf" />
                <stop offset="0.75" stopColor="#9fc8ff" />
                <stop offset="1" stopColor="#d3b3ff" />
              </linearGradient>
              <pattern id="wm-waves" width="46" height="30" patternUnits="userSpaceOnUse">
                <path d="M4,16 q5,-5 10,0 t10,0" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={2.2} strokeLinecap="round" />
              </pattern>
              <clipPath id="wm-land">
                <path d={shapes.island} />
              </clipPath>
            </defs>

            <rect width={1000} height={680} fill="#aee6ef" />
            <rect width={1000} height={680} fill="url(#wm-waves)" />

            {/* the Shimmer: a bubble wall around the world */}
            <ellipse className="wm-shimmer" cx={500} cy={348} rx={478} ry={322} fill="none" stroke="url(#wm-rainbow)" strokeWidth={10} strokeDasharray="26 14" strokeLinecap="round" />

            {shapes.sparkles.map((s, i) => (
              <path
                key={i}
                className="wm-sparkle"
                style={{ animationDelay: `${s.d}s` }}
                d={`M${s.x},${s.y - 6} L${s.x + 1.8},${s.y - 1.8} L${s.x + 6},${s.y} L${s.x + 1.8},${s.y + 1.8} L${s.x},${s.y + 6} L${s.x - 1.8},${s.y + 1.8} L${s.x - 6},${s.y} L${s.x - 1.8},${s.y - 1.8} Z`}
                fill="#fff"
              />
            ))}

            {/* islets out at sea */}
            {shapes.islets.map((s) => (
              <g key={s.id}>
                <path d={s.beach} fill="#ffe6a8" stroke={INK} strokeWidth={4} />
                <path d={s.land} fill="#c7eeb0" stroke={INK} strokeWidth={3} />
              </g>
            ))}

            {/* the island: sand, then grass */}
            <path d={shapes.beach} fill="#ffe6a8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={shapes.island} fill="#c7eeb0" stroke="#e9c77f" strokeWidth={3} />

            {/* each region's patch of land */}
            {STOPS.map((s, i) => (
              <path
                key={s.id}
                d={shapes.patches[i]}
                fill={s.color}
                fillOpacity={i === here ? 0.95 : 0.7}
                stroke="#fff"
                strokeWidth={3}
                strokeDasharray="2 7"
                strokeLinecap="round"
                clipPath={s.islet ? undefined : "url(#wm-land)"}
                className="wm-patch"
              />
            ))}

            {/* a river from the lagoon, through the lake, out to sea */}
            <path d="M470,196 C455,250 500,280 470,318 M500,352 C560,390 610,440 640,480 C700,540 800,560 900,620" fill="none" stroke="#8fd3f0" strokeWidth={7} strokeLinecap="round" clipPath="url(#wm-land)" />

            {/* the dotted path between the stops */}
            {shapes.trails.map((d, i) => (
              <g key={i}>
                <path d={d} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.7} />
                <path d={d} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="0.1 13" strokeLinecap="round" />
              </g>
            ))}

            {/* the stops */}
            {STOPS.map((s, i) => {
              const on = i === here;
              return (
                <g
                  key={s.id}
                  className={`wm-stop${on ? " is-on" : ""}`}
                  transform={`translate(${s.at[0]} ${s.at[1]})`}
                  role="button"
                  tabIndex={0}
                  aria-label={s.name}
                  aria-pressed={on}
                  onClick={() => setHere(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setHere(i);
                    }
                  }}
                >
                  <ellipse cx={0} cy={26} rx={24} ry={7} fill={INK} opacity={0.18} />
                  <g className="wm-stop-bob">
                    <circle r={27} fill="#fff" stroke={INK} strokeWidth={4} />
                    <circle r={21} fill={s.color} fillOpacity={0.45} />
                    {s.icon(s.color)}
                  </g>
                  <g transform={`translate(0 ${s.nameAbove ? -44 : 44})`}>
                    <rect x={-(s.name.length * 4.6 + 12)} y={-12} width={s.name.length * 9.2 + 24} height={24} rx={12} fill="#fff" stroke={INK} strokeWidth={3} />
                    <text className="wm-stop-name" y={5} textAnchor="middle">
                      {s.name}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Honeysuckle, hopping from stop to stop */}
            <g className="wm-player" style={{ transform: `translate(${stop.at[0] + 30}px, ${stop.at[1] - 8}px)` }}>
              <g className="wm-player-hop" key={here}>
                <image href={propSrc("cat-honeysuckle")} x={-34} y={-86} width={68} height={86} />
              </g>
            </g>
          </svg>
        </div>

        <div className="wm-card" aria-live="polite">
          <div className="wm-card-head">
            <span className="wm-dot" style={{ background: stop.color }} aria-hidden />
            <div>
              <h3>{stop.name}</h3>
              <p className="wm-tag">
                Stop {here + 1} of {STOPS.length} · {stop.tag}
              </p>
            </div>
          </div>
          <p className="wm-blurb">{stop.blurb}</p>
          <ul className="wm-finds">
            {stop.finds.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {stop.room ? (
            stop.room === place ? (
              <p className="wm-here">✿ You're here</p>
            ) : (
              <button
                type="button"
                className="wm-btn wm-btn--visit"
                onClick={() => {
                  go(stop.room!);
                  onClose();
                }}
              >
                Visit {stop.name} ✦
              </button>
            )
          ) : (
            <p className="wm-soon">🔒 Coming soon</p>
          )}
          <div className="wm-nav">
            <button type="button" className="wm-btn" onClick={() => setHere((h) => Math.max(0, h - 1))} disabled={here === 0}>
              ◀ Back
            </button>
            <button
              type="button"
              className="wm-btn wm-btn--go"
              onClick={() => setHere((h) => Math.min(STOPS.length - 1, h + 1))}
              disabled={here === STOPS.length - 1}
            >
              Next stop ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
