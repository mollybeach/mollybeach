import { useEffect, useRef, useState } from "react";
import { LANDS } from "./VisitorMap";

/**
 * The world map, as a world.
 *
 * The island's own cartoon ground — shaded grass, a ring of sand, pale
 * shallows, little round trees — wrapped onto a globe that turns slowly and
 * can be dragged round, with the Palais's castle standing on top of it. It is
 * drawn with an orthographic projection, the view from far enough away that
 * the sphere shows as a disc: a few lines of arithmetic, no 3-D library, and
 * it stays an SVG like the flat map beside it.
 *
 * Every stop sits at the latitude and longitude of the place it is really
 * after (WorldMap's `earth`). Places close enough to pile on top of each other
 * are fanned out in a ring around where they are, each with a thread back to
 * its real spot, so every one of them can be seen from all the way out.
 */

export interface Spot {
  id: string;
  name: string;
  /** [latitude, longitude] */
  earth: [number, number];
  picture: string;
  color: string;
  /** a room of the house rather than a place of its own */
  inside?: boolean;
}

const R0 = 230;
const CX = 300;
const CY = 322;
const rad = (d: number) => (d * Math.PI) / 180;

/** where a point of the world lands on the disc, and whether it's facing us */
function project(lat: number, lon: number, spin: number, tilt: number, R: number) {
  const φ = rad(lat);
  const λ = rad(lon - spin);
  const φ0 = rad(tilt);
  const cosc = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ);
  return {
    x: CX + R * Math.cos(φ) * Math.sin(λ),
    y: CY - R * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ)),
    front: cosc > 0,
    /** 1 in the middle of the disc, 0 at its edge */
    face: Math.max(0, cosc),
  };
}

/** a coastline, cut into the runs of it that are facing us */
function runs(pts: [number, number][], spin: number, tilt: number, R: number) {
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length > 2) out.push(`M${run.join("L")}Z`);
    run = [];
  };
  for (const [lon, lat] of pts) {
    const p = project(lat, lon, spin, tilt, R);
    if (p.front) run.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    else flush();
  }
  flush();
  return out;
}

/** the lines of latitude and longitude, drawn only where they face us */
function graticule(spin: number, tilt: number, R: number) {
  const lines: string[] = [];
  const add = (pts: [number, number][]) => {
    let run: string[] = [];
    for (const [lat, lon] of pts) {
      const p = project(lat, lon, spin, tilt, R);
      if (p.front) run.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      else {
        if (run.length > 1) lines.push(`M${run.join("L")}`);
        run = [];
      }
    }
    if (run.length > 1) lines.push(`M${run.join("L")}`);
  };
  for (let lon = -180; lon < 180; lon += 30) add(Array.from({ length: 46 }, (_, i) => [-90 + i * 4, lon] as [number, number]));
  for (let lat = -60; lat <= 60; lat += 30) add(Array.from({ length: 91 }, (_, i) => [lat, -180 + i * 4] as [number, number]));
  return lines;
}

/* ---- the trees -------------------------------------------------------------
   Little round trees scattered over the land, the same as on the island. They
   are placed once, at fixed points of the world, so they turn with it. */

const inside = (lon: number, lat: number, pts: [number, number][]) => {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

/** a steady scatter, so the trees are in the same places every time */
const scatter = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

const TREES: { lat: number; lon: number; tone: number; size: number }[] = (() => {
  const out: { lat: number; lon: number; tone: number; size: number }[] = [];
  LANDS.forEach((land, n) => {
    const lons = land.pts.map((p) => p[0]);
    const lats = land.pts.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
    const area = (x1 - x0) * (y1 - y0);
    const want = Math.min(160, Math.max(2, Math.round(area / 55)));
    const rnd = scatter(1234 + n * 97);
    for (let tries = 0, got = 0; tries < want * 6 && got < want; tries++) {
      const lon = x0 + rnd() * (x1 - x0);
      const lat = y0 + rnd() * (y1 - y0);
      if (lat > 72 || !inside(lon, lat, land.pts)) continue;
      out.push({ lat, lon, tone: Math.floor(rnd() * 3), size: 0.8 + rnd() * 0.6 });
      got++;
    }
  });
  return out;
})();

const TREE_GREENS = ["#2f6b34", "#3d7d3a", "#4f8f3f"];

/* ---- the castle on top ------------------------------------------------------ */

function Castle({ x, y, s }: { x: number; y: number; s: number }) {
  const stone = "#f6ecd6";
  const line = "#b98f3e";
  const roof = "#d98aa0";
  const roofDark = "#b8607c";
  return (
    <g className="wm-globe-castle" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`} aria-hidden>
      {/* the little green hill it stands on */}
      <ellipse cx={0} cy={2} rx={62} ry={12} fill="#3d7d3a" />
      <ellipse cx={0} cy={-1} rx={54} ry={9} fill="#5a9a45" />

      {/* the flags, behind the roofs */}
      {[
        [-31, -92],
        [31, -92],
        [0, -110],
      ].map(([fx, fy], i) => (
        <g key={i}>
          <line x1={fx} y1={fy + 8} x2={fx} y2={fy - 10} stroke={line} strokeWidth={1.6} />
          <path d={`M${fx},${fy - 10} l13,4 l-13,4 Z`} fill={i === 2 ? "#e8c774" : roof} />
        </g>
      ))}

      {/* the side towers */}
      {[-31, 31].map((tx) => (
        <g key={tx}>
          <rect x={tx - 9} y={-62} width={18} height={62} fill={stone} stroke={line} strokeWidth={1.5} />
          <path d={`M${tx - 12},-62 L${tx},-90 L${tx + 12},-62 Z`} fill={roof} stroke={roofDark} strokeWidth={1.2} />
          <path d={`M${tx - 3},-40 a3,3 0 0 1 6,0 v8 h-6 Z`} fill="#6b4a3a" />
        </g>
      ))}

      {/* the keep, with its battlements */}
      <rect x={-22} y={-48} width={44} height={48} fill={stone} stroke={line} strokeWidth={1.5} />
      {[-22, -12, -2, 8].map((bx) => (
        <rect key={bx} x={bx} y={-55} width={6} height={7} fill={stone} stroke={line} strokeWidth={1.2} />
      ))}
      <path d="M-8,0 v-16 a8,8 0 0 1 16,0 v16 Z" fill="#6b4a3a" />
      <path d="M-14,-34 a3,3 0 0 1 6,0 v7 h-6 Z M8,-34 a3,3 0 0 1 6,0 v7 h-6 Z" fill="#6b4a3a" />

      {/* the tall middle tower */}
      <rect x={-9} y={-80} width={18} height={32} fill={stone} stroke={line} strokeWidth={1.5} />
      <path d="M-12,-80 L0,-108 L12,-80 Z" fill={roof} stroke={roofDark} strokeWidth={1.2} />
      <circle cx={0} cy={-64} r={4} fill="#e8c774" stroke={line} strokeWidth={1} />
    </g>
  );
}

const FRAME = 30;

export function Globe({
  spots,
  here,
  onPick,
  spinning = true,
}: {
  spots: Spot[];
  here: number;
  onPick: (i: number) => void;
  spinning?: boolean;
}) {
  const [spin, setSpin] = useState(() => spots[here]?.earth[1] ?? 0);
  const [tilt, setTilt] = useState(16);
  /* how far you have fallen towards it: 1 is the whole world in view */
  const [zoom, setZoom] = useState(1);
  const R = R0 * zoom;
  const [held, setHeld] = useState(false);
  const drag = useRef<{ x: number; y: number; spin: number; tilt: number } | null>(null);

  /* it turns on its own, unless it's being held */
  useEffect(() => {
    if (!spinning || held) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setSpin((s) => (s + dt * 4.5) % 360); // a turn every eighty seconds
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spinning, held]);

  /* picking a stop brings it round to the front — but only when the pick
     changes, or the turn would be reset on every frame */
  const shown = useRef(-1);
  useEffect(() => {
    if (shown.current === here) return;
    shown.current = here;
    const spot = spots[here];
    if (!spot) return;
    setSpin(spot.earth[1]);
    setTilt(Math.max(-35, Math.min(45, spot.earth[0] * 0.55)));
  }, [here, spots]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, spin, tilt };
    setHeld(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setSpin(d.spin - (e.clientX - d.x) * 0.35);
    setTilt(Math.max(-70, Math.min(70, d.tilt + (e.clientY - d.y) * 0.3)));
  };
  const onUp = () => {
    drag.current = null;
    setHeld(false);
  };
  const onWheel = (e: React.WheelEvent) => setZoom((z) => Math.min(14, Math.max(1, z * (e.deltaY > 0 ? 0.86 : 1.16))));

  const lines = graticule(spin, tilt, R);
  const coasts = LANDS.flatMap((l) => runs(l.pts, spin, tilt, R).map((d, i) => ({ key: `${l.name}-${i}`, d })));

  /* every stop facing us. Stops close enough to sit on top of each other are
     gathered, and each gathering is fanned out in a ring round the spot they
     share, with a thread from each cameo back to where it really is */
  const facing = spots
    .map((s, i) => ({ s, i, p: project(s.earth[0], s.earth[1], spin, tilt, R) }))
    .filter(({ p }) => p.front);
  const groups: (typeof facing)[] = [];
  for (const it of facing) {
    // a gathering is only the places genuinely at the same spot: measured from
    // where the gathering started, not from its middle, so it can't creep out
    // and take in a neighbour a region away
    const near = groups.find((g) => Math.hypot(it.p.x - g[0].p.x, it.p.y - g[0].p.y) < FRAME * 1.2);
    if (near) near.push(it);
    else groups.push([it]);
  }
  const cameos = groups.flatMap((g, group) => {
    if (g.length === 1) return [{ ...g[0], at: { x: g[0].p.x, y: g[0].p.y }, k: 0.6 + 0.4 * g[0].p.face, fanned: false, group }];
    const cx = g.reduce((a, b) => a + b.p.x, 0) / g.length;
    const cy = g.reduce((a, b) => a + b.p.y, 0) / g.length;
    const k = 0.62;
    const ring = Math.max(FRAME * 1.5, (FRAME * k * 1.28) / Math.sin(Math.PI / g.length));
    return g.map((it, n) => {
      const a = -Math.PI / 2 + (2 * Math.PI * n) / g.length;
      return { ...it, at: { x: cx + ring * Math.cos(a), y: cy + ring * Math.sin(a) }, k, fanned: true, group };
    });
  });
  /* a place of its own always stays exactly where it is on the world; if a
     ring of gathered places would land on it, the whole ring steps aside
     (its threads still run back to the real spots) */
  const radius = (c: { k: number; i: number }) => FRAME * c.k * (c.i === here ? 1.15 : 1) + 3;
  for (let round = 0; round < 10; round++) {
    let moved = false;
    for (const c of cameos) {
      if (c.fanned) continue;
      const hit = cameos.find((o) => o.fanned && Math.hypot(o.at.x - c.at.x, o.at.y - c.at.y) < radius(o) + radius(c));
      if (!hit) continue;
      const dx = hit.at.x - c.at.x;
      const dy = hit.at.y - c.at.y;
      const d = Math.hypot(dx, dy) || 1;
      const push = radius(hit) + radius(c) - d + 1;
      for (const o of cameos) {
        if (o.group === hit.group) o.at = { x: o.at.x + (dx / d) * push, y: o.at.y + (dy / d) * push };
      }
      moved = true;
    }
    if (!moved) break;
  }

  // the picked one last, so it sits over its neighbours
  cameos.sort((a, b) => (a.i === here ? 1 : b.i === here ? -1 : a.p.face - b.p.face));

  // the castle stands on the top of the world, whichever way it's turned
  const castle = { x: CX, y: CY - R + 8, s: Math.min(1, 0.9 + 0.1 * zoom) };

  return (
    <svg
      className="wm-globe"
      viewBox="0 0 600 600"
      role="img"
      aria-label="A globe of the world, turning, with the Palais standing on top and a stop on it for each place"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
    >
      <defs>
        <radialGradient id="wm-globe-sea" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#6fa8e6" />
          <stop offset="62%" stopColor="#3f7fc4" />
          <stop offset="100%" stopColor="#1f4f8f" />
        </radialGradient>
        {/* the island's grass, laid across the whole disc so it shades like a ball */}
        <radialGradient id="wm-globe-grass" gradientUnits="userSpaceOnUse" cx={CX - R * 0.3} cy={CY - R * 0.35} r={R * 1.35}>
          <stop offset="0" stopColor="#6f9c45" />
          <stop offset="0.35" stopColor="#547d38" />
          <stop offset="0.75" stopColor="#346836" />
          <stop offset="1" stopColor="#21582a" />
        </radialGradient>
        <radialGradient id="wm-globe-sky" cx="50%" cy="50%" r="50%">
          <stop offset="82%" stopColor="#fffdf6" stopOpacity="0" />
          <stop offset="100%" stopColor="#fffdf6" stopOpacity="0.55" />
        </radialGradient>
        <clipPath id="wm-globe-disc">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      <circle cx={CX} cy={CY} r={R} fill="url(#wm-globe-sea)" />

      <g clipPath="url(#wm-globe-disc)">
        <g className="wm-globe-grid">
          {lines.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {/* the ground as the island draws it: pale shallows, a ring of sand, then grass */}
        <g className="wm-globe-shallows">
          {coasts.map(({ key, d }) => (
            <path key={key} d={d} />
          ))}
        </g>
        <g className="wm-globe-sand">
          {coasts.map(({ key, d }) => (
            <path key={key} d={d} />
          ))}
        </g>
        <g className="wm-globe-land">
          {coasts.map(({ key, d }) => (
            <path key={key} d={d} fill="url(#wm-globe-grass)" />
          ))}
        </g>
        <g className="wm-globe-trees">
          {TREES.map((t, i) => {
            const p = project(t.lat, t.lon, spin, tilt, R);
            if (!p.front || p.face < 0.08) return null;
            const r = (2.2 + zoom * 0.35) * t.size * (0.5 + 0.5 * p.face);
            return (
              <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
                <circle cx={r * 0.25} cy={r * 0.35} r={r} fill="rgba(20,50,25,0.35)" />
                <circle r={r} fill={TREE_GREENS[t.tone]} />
                <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.4} fill="rgba(255,255,255,0.18)" />
              </g>
            );
          })}
        </g>
      </g>

      {/* the light on the glass */}
      <circle cx={CX} cy={CY} r={R} fill="url(#wm-globe-sky)" pointerEvents="none" />
      <circle className="wm-globe-rim" cx={CX} cy={CY} r={R} />

      <Castle x={castle.x} y={castle.y} s={castle.s} />

      {/* closer and further away, for anyone without a wheel */}
      <g className="wm-globe-zoom">
        <g transform="translate(556 44)" onClick={() => setZoom((z) => Math.min(14, z * 1.45))} tabIndex={0} role="button" aria-label="Closer">
          <circle r="15" />
          <path d="M-7,0H7M0,-7V7" />
        </g>
        <g transform="translate(556 84)" onClick={() => setZoom((z) => Math.max(1, z / 1.45))} tabIndex={0} role="button" aria-label="Further away">
          <circle r="15" />
          <path d="M-7,0H7" />
        </g>
      </g>

      {/* the threads from a fanned-out cameo back to its real spot */}
      <g className="wm-globe-threads">
        {cameos
          .filter((c) => c.fanned)
          .map((c) => (
            <g key={c.s.id}>
              <line x1={c.p.x} y1={c.p.y} x2={c.at.x} y2={c.at.y} />
              <circle cx={c.p.x} cy={c.p.y} r={2.6} />
            </g>
          ))}
      </g>

      {cameos.map(({ s, i, p, at, k }) => {
        const on = i === here;
        return (
          <g
            key={s.id}
            className={`wm-globe-stop${on ? " is-on" : ""}`}
            transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) scale(${(k * (on ? 1.15 : 1)).toFixed(3)})`}
            opacity={0.4 + 0.6 * p.face}
            tabIndex={0}
            onClick={() => onPick(i)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(i)}
          >
            <title>{s.name}</title>
            <circle className="wm-globe-halo" r={FRAME + 6} fill={s.color} />
            <clipPath id={`wm-globe-clip-${s.id}`}>
              <circle r={FRAME} />
            </clipPath>
            <image
              href={s.picture}
              x={-FRAME}
              y={-FRAME}
              width={FRAME * 2}
              height={FRAME * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#wm-globe-clip-${s.id})`}
            />
            <circle className="wm-globe-ring" r={FRAME + 1} />
            {on && <text y={FRAME + 18}>{s.name}</text>}
          </g>
        );
      })}
    </svg>
  );
}
