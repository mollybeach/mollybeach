/**
 * Where everybody came from, on a map of the world.
 *
 * The coastlines are drawn by hand and kept deliberately coarse — a few dozen
 * points a continent — so the whole world travels in this file rather than in
 * a map library. It is plotted flat (equirectangular): longitude straight
 * across, latitude straight down, which is why Greenland looks enormous.
 *
 * A pin per city, sized by how many visits came from it, from the same lookup
 * that fills the visitor book (visits.ts). Cities whose lookup never answered
 * have no coordinates, so they are counted underneath instead of being put
 * somewhere they weren't.
 */

import type { VisitStats } from "./visits";

/* the world, in [longitude, latitude] */
const LANDS: [number, number][][] = [
  // North America
  [
    [-168, 66], [-160, 71], [-130, 70], [-95, 72], [-80, 73], [-65, 60], [-55, 52], [-66, 45],
    [-70, 42], [-75, 35], [-81, 31], [-80, 25], [-90, 29], [-97, 26], [-105, 22], [-110, 24],
    [-117, 32], [-124, 40], [-124, 48], [-135, 57], [-150, 59],
  ],
  // the isthmus
  [[-97, 16], [-92, 15], [-84, 10], [-77, 8], [-83, 13], [-88, 16], [-95, 18]],
  // South America
  [
    [-78, 8], [-72, 12], [-62, 10], [-52, 5], [-44, -2], [-35, -7], [-39, -16], [-48, -25],
    [-58, -35], [-62, -40], [-65, -45], [-69, -52], [-74, -50], [-73, -40], [-71, -30],
    [-70, -18], [-75, -14], [-81, -6], [-79, 2],
  ],
  // Europe and Asia
  [
    [-10, 36], [-9, 43], [-2, 48], [2, 51], [8, 54], [10, 58], [5, 61], [12, 68], [28, 71],
    [40, 68], [60, 70], [75, 73], [100, 77], [113, 73], [130, 72], [145, 70], [170, 68],
    [163, 60], [155, 52], [140, 46], [130, 42], [127, 35], [120, 30], [110, 20], [105, 10],
    [100, 5], [97, 16], [90, 22], [80, 15], [77, 8], [72, 20], [68, 24], [60, 25], [50, 28],
    [48, 30], [40, 38], [30, 41], [27, 36], [20, 40], [14, 38], [12, 45], [3, 43],
  ],
  // Africa
  [
    [-17, 15], [-16, 22], [-10, 30], [0, 34], [10, 37], [20, 32], [32, 31], [35, 24], [39, 15],
    [43, 11], [51, 12], [48, 5], [41, -2], [40, -12], [35, -20], [32, -26], [26, -34], [18, -34],
    [12, -17], [9, -1], [2, 6], [-8, 4], [-13, 9],
  ],
  // Australia
  [
    [114, -22], [113, -26], [115, -34], [129, -32], [137, -35], [141, -38], [147, -38],
    [150, -35], [153, -28], [146, -19], [142, -11], [132, -11], [125, -14], [117, -20],
  ],
  // Greenland
  [[-45, 60], [-52, 66], [-55, 72], [-40, 80], [-25, 82], [-20, 74], [-30, 68], [-42, 61]],
  // the British Isles
  [[-5, 50], [-5, 54], [-6, 58], [-2, 58], [0, 53], [-3, 51]],
  // Iceland
  [[-24, 65], [-18, 66], [-14, 65], [-18, 64], [-22, 64]],
  // Japan
  [[130, 33], [136, 35], [141, 40], [145, 44], [142, 42], [138, 37], [133, 34]],
  // New Zealand
  [[173, -35], [176, -38], [178, -39], [174, -42], [170, -45], [167, -46], [172, -41]],
  // Madagascar
  [[44, -12], [50, -15], [50, -25], [45, -25], [43, -18]],
  // Sri Lanka
  [[80, 6], [82, 8], [81, 9], [79, 8]],
];

const W = 720;
const H = 360;
const x = (lon: number) => ((lon + 180) / 360) * W;
const y = (lat: number) => ((90 - lat) / 180) * H;
const shape = (pts: [number, number][]) => `M${pts.map(([lo, la]) => `${x(lo).toFixed(1)},${y(la).toFixed(1)}`).join("L")}Z`;

type City = VisitStats["cities"][number];

/** the pin: bigger for more visits, but not by so much that one city swallows the map */
const pinSize = (visits: number, most: number) => 3.4 + 5.6 * Math.sqrt(visits / Math.max(1, most));

export function VisitorMap({ cities }: { cities: City[] }) {
  const placed = cities.filter((c) => c.lat != null && c.lon != null);
  const lost = cities.length - placed.length;
  const most = Math.max(1, ...placed.map((c) => c.visits));
  const where = (c: City) => [c.city, c.region, c.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");

  return (
    <figure className="vis-world">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A world map with a pin on each of the ${placed.length} cities visitors came from`}>
        <rect width={W} height={H} rx={10} className="vis-world-sea" />
        {/* the grid, then the equator a little darker */}
        <g className="vis-world-grid">
          {[-120, -60, 0, 60, 120].map((lon) => (
            <line key={lon} x1={x(lon)} y1={0} x2={x(lon)} y2={H} />
          ))}
          {[-60, -30, 30, 60].map((lat) => (
            <line key={lat} x1={0} y1={y(lat)} x2={W} y2={y(lat)} />
          ))}
        </g>
        <line className="vis-world-equator" x1={0} y1={y(0)} x2={W} y2={y(0)} />
        <g className="vis-world-land">
          {LANDS.map((pts, i) => (
            <path key={i} d={shape(pts)} />
          ))}
        </g>
        <g className="vis-world-pins">
          {placed.map((c) => {
            const r = pinSize(c.visits, most);
            return (
              <g key={`${c.city}-${c.country}-${c.lat}`} transform={`translate(${x(c.lon!).toFixed(1)} ${y(c.lat!).toFixed(1)})`}>
                <title>{`${where(c)} · ${c.visits} visit${c.visits === 1 ? "" : "s"}`}</title>
                <circle className="vis-world-halo" r={r * 1.9} />
                <circle className="vis-world-pin" r={r} />
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption className="cat-note">
        {placed.length ? `${placed.length} cit${placed.length === 1 ? "y" : "ies"}` : "No cities yet"}
        {lost > 0 && ` · ${lost} more whose lookup was blocked, so they have no place on the map`}
      </figcaption>
    </figure>
  );
}
