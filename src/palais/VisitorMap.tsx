/**
 * Where everybody came from, on a map of the world.
 *
 * It's drawn after the old school wall maps: a teal-grey ocean, land in faded
 * peach and ochre and sage, a rusty grid every twenty degrees, the tropics and
 * the polar circles dashed, and the oceans named in spaced-out capitals.
 *
 * The coastlines are written out by hand in this file — a hundred-odd points a
 * continent — so the whole world travels with the site and there's no map
 * library to keep. It's plotted flat (equirectangular): longitude straight
 * across, latitude straight down, which is why Greenland comes out enormous,
 * exactly as it does on the wall maps.
 *
 * A pin per city, sized by how many visits came from it, from the same lookup
 * that fills the visitor book (visits.ts). Point at one and it tells you where
 * it is and how many came from there. Cities whose lookup never answered have
 * no coordinates, so they are counted underneath instead of being put
 * somewhere they weren't.
 */

import { useState } from "react";
import type { VisitStats } from "./visits";

/** the wall map's colours: nothing means anything, they just have to differ */
const PAPER = {
  peach: "#efb489",
  ochre: "#e7c98d",
  sage: "#bfcb9f",
  rose: "#e9a9a1",
  cream: "#f1e3bf",
  straw: "#ddd3a0",
};

interface Land {
  name: string;
  fill: string;
  /** [longitude, latitude] */
  pts: [number, number][];
}

const LANDS: Land[] = [
  {
    name: "North America",
    fill: PAPER.rose,
    pts: [
      [-168, 66], [-166, 68], [-163, 71], [-156, 71], [-148, 70], [-141, 70], [-133, 69], [-125, 70],
      [-115, 69], [-105, 69], [-96, 68], [-95, 72], [-90, 73], [-82, 73], [-78, 71], [-73, 68],
      [-78, 64], [-85, 66], [-88, 64], [-82, 62], [-79, 60], [-77, 56], [-79, 52], [-72, 52],
      [-67, 58], [-64, 60], [-61, 57], [-56, 52], [-64, 47], [-66, 45], [-70, 43], [-74, 40],
      [-76, 37], [-76, 35], [-81, 32], [-81, 27], [-80, 25], [-83, 29], [-85, 30], [-89, 29],
      [-94, 29], [-97, 26], [-97, 22], [-105, 22], [-106, 24], [-110, 24], [-113, 29], [-114, 31],
      [-117, 32], [-121, 35], [-124, 40], [-124, 46], [-125, 50], [-131, 54], [-135, 58], [-140, 60],
      [-148, 60], [-153, 58], [-158, 56], [-163, 58], [-165, 61],
    ],
  },
  {
    name: "Central America",
    fill: PAPER.ochre,
    pts: [
      [-97, 16], [-94, 16], [-92, 15], [-88, 14], [-84, 10], [-83, 8], [-79, 9], [-77, 8], [-79, 10],
      [-83, 13], [-86, 16], [-88, 18], [-92, 18], [-95, 18],
    ],
  },
  {
    name: "South America",
    fill: PAPER.ochre,
    pts: [
      [-78, 8], [-75, 11], [-72, 12], [-66, 11], [-62, 10], [-60, 8], [-52, 5], [-50, 0], [-44, -2],
      [-38, -5], [-35, -7], [-37, -12], [-39, -16], [-41, -22], [-48, -25], [-53, -32], [-58, -35],
      [-57, -38], [-62, -40], [-65, -43], [-65, -45], [-68, -50], [-69, -52], [-74, -52], [-74, -47],
      [-73, -43], [-73, -40], [-72, -35], [-71, -30], [-70, -23], [-70, -18], [-76, -14], [-79, -8],
      [-81, -6], [-80, -3], [-79, 2], [-77, 6],
    ],
  },
  {
    name: "Eurasia",
    fill: PAPER.straw,
    pts: [
      [-10, 36], [-9, 39], [-9, 43], [-2, 43], [-1, 46], [-2, 48], [2, 51], [4, 52], [8, 54],
      [10, 57], [8, 58], [5, 59], [5, 62], [12, 65], [15, 68], [21, 70], [28, 71], [33, 69],
      [40, 68], [45, 68], [55, 69], [60, 70], [68, 73], [75, 73], [80, 73], [90, 76], [100, 77],
      [106, 77], [113, 73], [120, 73], [130, 72], [139, 72], [145, 70], [152, 70], [160, 70],
      [170, 68], [175, 65], [170, 62], [163, 60], [162, 57], [158, 53], [155, 52], [150, 59],
      [143, 59], [140, 53], [135, 48], [140, 46], [135, 43], [131, 43], [130, 42], [128, 38],
      [127, 35], [122, 37], [122, 31], [120, 30], [117, 24], [110, 21], [108, 16], [109, 11],
      [105, 10], [103, 8], [100, 5], [98, 9], [99, 13], [97, 16], [94, 18], [90, 22], [87, 21],
      [82, 17], [80, 15], [77, 8], [73, 15], [72, 20], [69, 22], [68, 24], [66, 25], [60, 25],
      [57, 25], [50, 28], [48, 30], [50, 30], [48, 29], [44, 37], [41, 43], [37, 45], [40, 38],
      [36, 36], [30, 41], [29, 36], [27, 36], [23, 38], [24, 40], [20, 40], [18, 40], [16, 38],
      [15, 42], [13, 45], [12, 45], [8, 44], [3, 43], [0, 40],
    ],
  },
  {
    name: "Africa",
    fill: PAPER.peach,
    pts: [
      [-17, 15], [-17, 21], [-13, 28], [-10, 30], [-6, 36], [0, 36], [5, 37], [10, 37], [14, 33],
      [20, 32], [25, 32], [32, 31], [34, 28], [35, 24], [37, 21], [39, 15], [43, 12], [48, 12],
      [51, 12], [50, 8], [48, 5], [43, 1], [41, -2], [40, -7], [40, -12], [38, -17], [35, -20],
      [33, -26], [30, -31], [26, -34], [22, -34], [18, -34], [15, -27], [12, -20], [12, -17],
      [10, -8], [9, -1], [5, 4], [2, 6], [-4, 5], [-8, 4], [-11, 6], [-13, 9], [-16, 12],
    ],
  },
  {
    name: "Australia",
    fill: PAPER.sage,
    pts: [
      [114, -22], [113, -26], [115, -31], [115, -34], [119, -34], [124, -33], [129, -32], [134, -33],
      [137, -35], [139, -36], [141, -38], [145, -39], [147, -38], [150, -37], [151, -34], [153, -28],
      [153, -25], [149, -21], [146, -19], [145, -15], [142, -11], [139, -17], [137, -12], [132, -11],
      [130, -12], [127, -14], [125, -14], [122, -17], [117, -20],
    ],
  },
  {
    name: "Greenland",
    fill: PAPER.cream,
    pts: [
      [-45, 60], [-50, 63], [-52, 66], [-54, 69], [-55, 72], [-58, 75], [-52, 78], [-40, 80],
      [-30, 82], [-25, 82], [-20, 78], [-20, 74], [-24, 72], [-30, 68], [-38, 65], [-42, 61],
    ],
  },
  { name: "Iceland", fill: PAPER.cream, pts: [[-24, 65], [-22, 66], [-18, 66], [-14, 65], [-18, 64], [-22, 64]] },
  { name: "Britain", fill: PAPER.rose, pts: [[-5, 50], [-4, 52], [-5, 54], [-3, 55], [-6, 58], [-2, 58], [0, 54], [1, 51], [-3, 50]] },
  { name: "Ireland", fill: PAPER.sage, pts: [[-10, 52], [-10, 54], [-8, 55], [-6, 55], [-6, 52], [-8, 51]] },
  { name: "Japan", fill: PAPER.rose, pts: [[130, 33], [132, 34], [136, 35], [138, 37], [141, 40], [141, 43], [145, 44], [144, 42], [140, 38], [137, 35], [133, 33]] },
  { name: "Sakhalin", fill: PAPER.straw, pts: [[142, 46], [143, 50], [143, 54], [142, 53], [141, 48]] },
  { name: "Taiwan", fill: PAPER.ochre, pts: [[120, 22], [122, 25], [121, 25], [120, 23]] },
  { name: "Philippines", fill: PAPER.ochre, pts: [[120, 18], [124, 18], [126, 13], [126, 8], [122, 6], [120, 10], [117, 9], [119, 14]] },
  { name: "Borneo", fill: PAPER.sage, pts: [[109, 2], [113, 4], [117, 7], [119, 5], [118, 1], [116, -3], [111, -3], [109, 0]] },
  { name: "Sumatra", fill: PAPER.sage, pts: [[95, 5], [99, 3], [104, -2], [106, -6], [103, -6], [99, -2], [96, 2]] },
  { name: "Java", fill: PAPER.sage, pts: [[105, -6], [112, -7], [114, -8], [110, -8], [106, -7]] },
  { name: "New Guinea", fill: PAPER.rose, pts: [[131, -1], [136, -2], [141, -3], [146, -6], [150, -10], [146, -8], [141, -9], [137, -8], [133, -4]] },
  { name: "New Zealand", fill: PAPER.rose, pts: [[173, -35], [176, -38], [178, -39], [175, -41], [174, -41], [171, -43], [168, -46], [167, -45], [170, -43], [172, -40]] },
  { name: "Tasmania", fill: PAPER.sage, pts: [[145, -41], [148, -41], [148, -43], [146, -43]] },
  { name: "Madagascar", fill: PAPER.ochre, pts: [[49, -12], [50, -16], [48, -21], [47, -25], [45, -25], [43, -21], [44, -16], [46, -12]] },
  { name: "Sri Lanka", fill: PAPER.ochre, pts: [[80, 6], [82, 8], [81, 9], [79, 8]] },
  { name: "Cuba", fill: PAPER.cream, pts: [[-85, 22], [-80, 23], [-75, 20], [-78, 20], [-83, 21]] },
  { name: "Hispaniola", fill: PAPER.cream, pts: [[-74, 20], [-69, 20], [-68, 18], [-72, 18]] },
  { name: "Svalbard", fill: PAPER.cream, pts: [[11, 78], [17, 80], [21, 79], [16, 77], [12, 77]] },
  { name: "Novaya Zemlya", fill: PAPER.cream, pts: [[52, 71], [58, 74], [68, 76], [65, 74], [56, 71]] },
];

/** the lines that get a name and a dash, the way a wall map draws them */
const PARALLELS: { lat: number; name: string }[] = [
  { lat: 66.5, name: "ARCTIC CIRCLE" },
  { lat: 23.5, name: "TROPIC OF CANCER" },
  { lat: -23.5, name: "TROPIC OF CAPRICORN" },
  { lat: -66.5, name: "ANTARCTIC CIRCLE" },
];

const SEAS: { name: string; lon: number; lat: number; size?: number }[] = [
  { name: "PACIFIC OCEAN", lon: -150, lat: -12, size: 11 },
  { name: "ATLANTIC OCEAN", lon: -28, lat: -20, size: 11 },
  { name: "INDIAN OCEAN", lon: 78, lat: -32, size: 11 },
  { name: "ARCTIC OCEAN", lon: -22, lat: 84, size: 7.5 },
  { name: "SOUTHERN OCEAN", lon: 40, lat: -72, size: 7.5 },
];

const W = 720;
const H = 360;
const x = (lon: number) => ((lon + 180) / 360) * W;
const y = (lat: number) => ((90 - lat) / 180) * H;
const shape = (pts: [number, number][]) => `M${pts.map(([lo, la]) => `${x(lo).toFixed(1)},${y(la).toFixed(1)}`).join("L")}Z`;

type City = VisitStats["cities"][number];

/** the pin: taller for more visits, but not so much that one city swallows the map */
const pinSize = (visits: number, most: number) => 11 + 9 * Math.sqrt(visits / Math.max(1, most));

/** the country's flag, from its two letters; a globe for anywhere unplaced */
const flagOf = (code: string | null) =>
  code && /^[A-Z]{2}$/i.test(code)
    ? String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
    : "🌐";

const nameOf = (c: City) =>
  [c.city, c.region, c.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");

export function VisitorMap({ cities }: { cities: City[] }) {
  const placed = cities.filter((c) => c.lat != null && c.lon != null);
  const lost = cities.length - placed.length;
  const most = Math.max(1, ...placed.map((c) => c.visits));
  const [over, setOver] = useState<number | null>(null);
  const shown = over != null ? placed[over] : null;

  /* the label that pops up beside a pin, kept inside the map's edges */
  const callout = (c: City) => {
    const line = nameOf(c);
    const count = `${c.visits} visit${c.visits === 1 ? "" : "s"}${c.unique ? ` · ${c.unique} of them new` : ""}`;
    const w = Math.max(line.length, count.length) * 5.4 + 22;
    const px = x(c.lon!);
    const py = y(c.lat!);
    const left = Math.min(Math.max(px - w / 2, 6), W - w - 6);
    const above = py > 58;
    const top = above ? py - 52 : py + 16;
    return (
      <g className="vis-world-say" pointerEvents="none">
        <path
          d={`M${px.toFixed(1)},${(above ? py - 12 : py + 12).toFixed(1)} l-5,${above ? 8 : -8} l10,0 Z`}
          className="vis-world-say-tip"
        />
        <rect x={left} y={top} width={w} height={36} rx={9} />
        <text x={left + 11} y={top + 15}>{line}</text>
        <text x={left + 11} y={top + 28} className="vis-world-say-count">{count}</text>
      </g>
    );
  };

  return (
    <figure className="vis-world">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`A world map with a pin on each of the ${placed.length} cities visitors came from`}
        onMouseLeave={() => setOver(null)}
      >
        <defs>
          <linearGradient id="vis-world-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fa9ad" />
            <stop offset="45%" stopColor="#7e9aa0" />
            <stop offset="100%" stopColor="#6f8d95" />
          </linearGradient>
          {/* the paper's own light, strongest in the middle as on a hung map */}
          <radialGradient id="vis-world-light" cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#fff7e2" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#4a3a22" stopOpacity="0.22" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#vis-world-water)" />

        {/* the grid: every twenty degrees, in the old rusty ink */}
        <g className="vis-world-grid">
          {Array.from({ length: 17 }, (_, i) => -160 + i * 20).map((lon) => (
            <line key={`m${lon}`} x1={x(lon)} y1={0} x2={x(lon)} y2={H} />
          ))}
          {Array.from({ length: 8 }, (_, i) => -80 + i * 20).map((lat) => (
            <line key={`p${lat}`} x1={0} y1={y(lat)} x2={W} y2={y(lat)} />
          ))}
        </g>

        <g className="vis-world-named">
          {PARALLELS.map((p) => (
            <g key={p.name}>
              <line x1={0} y1={y(p.lat)} x2={W} y2={y(p.lat)} />
              <text x={W - 8} y={y(p.lat) - 3}>{p.name}</text>
            </g>
          ))}
        </g>
        <line className="vis-world-equator" x1={0} y1={y(0)} x2={W} y2={y(0)} />

        <g className="vis-world-land">
          {LANDS.map((l) => (
            <path key={l.name} d={shape(l.pts)} fill={l.fill} />
          ))}
        </g>

        {/* the oceans, lettered the way a school map letters them */}
        <g className="vis-world-seas">
          {SEAS.map((s) => (
            <text key={s.name} x={x(s.lon)} y={y(s.lat)} fontSize={s.size}>
              {s.name}
            </text>
          ))}
        </g>

        <rect width={W} height={H} fill="url(#vis-world-light)" pointerEvents="none" />

        {/* a compass rose in the corner of the sea, like the Palais's own map */}
        <g className="vis-world-rose" transform="translate(44 300)">
          <circle r="17" />
          <path d="M0,-16 L4,-4 L16,0 L4,4 L0,16 L-4,4 L-16,0 L-4,-4 Z" />
          <text y="4">✿</text>
        </g>

        <g className="vis-world-pins">
          {placed.map((c, i) => {
            const r = pinSize(c.visits, most);
            const px = x(c.lon!);
            const py = y(c.lat!);
            return (
              <g
                key={`${c.city}-${c.country}-${c.lat}`}
                className={`vis-world-pin${over === i ? " is-on" : ""}`}
                transform={`translate(${px.toFixed(1)} ${py.toFixed(1)})`}
                tabIndex={0}
                onMouseEnter={() => setOver(i)}
                onFocus={() => setOver(i)}
                onBlur={() => setOver(null)}
              >
                <title>{`${nameOf(c)} · ${c.visits} visit${c.visits === 1 ? "" : "s"}`}</title>
                <circle className="vis-world-halo" r={r * 0.62} />
                {/* a flag pin: a tack in the paper, a thin pole, the country's
                    flag flying at the top of it */}
                <circle className="vis-world-tack" r={2.1} />
                <line className="vis-world-pole" y1={0} y2={-r} />
                <rect className="vis-world-cloth" x={1.4} y={-r - 1} width={r * 0.84} height={r * 0.58} rx={1.2} />
                <text className="vis-world-flag" x={1.4 + r * 0.42} y={-r - 1 + r * 0.3} fontSize={r * 0.66}>
                  {flagOf(c.code)}
                </text>
              </g>
            );
          })}
        </g>

        {shown && callout(shown)}
      </svg>
      <figcaption className="cat-note">
        {placed.length ? `${placed.length} cit${placed.length === 1 ? "y" : "ies"} · point at a pin for the place` : "No cities yet"}
        {lost > 0 && ` · ${lost} more whose lookup was blocked, so they have no place on the map`}
      </figcaption>
    </figure>
  );
}
