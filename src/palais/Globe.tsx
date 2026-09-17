import { useEffect, useRef, useState } from "react";
import { LANDS } from "./VisitorMap";

/**
 * The world map, as a world.
 *
 * The same island colours — grass, sand, the blue sea, the gilt cameo rings —
 * wrapped onto a globe that turns slowly and can be dragged round. It is drawn
 * with an orthographic projection, which is the view from far enough away that
 * the sphere shows as a disc: about fifteen lines of arithmetic, no 3-D
 * library, and it stays an SVG like the flat map beside it.
 *
 * Every stop sits at the latitude and longitude of the place it is really
 * after (WorldMap's `earth`), and the ones that turn round the back fade out
 * and stop taking clicks until they come round again.
 */

export interface Spot {
  id: string;
  name: string;
  /** [latitude, longitude] */
  earth: [number, number];
  picture: string;
  color: string;
  /** a room of the house rather than a place of its own: it stands where the
      Palais stands, so it only appears once you have come in close */
  inside?: boolean;
}

const R0 = 250;
const CX = 300;
const CY = 300;
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
  for (let lon = -180; lon < 180; lon += 30) {
    const run: string[] = [];
    for (let lat = -90; lat <= 90; lat += 4) {
      const p = project(lat, lon, spin, tilt, R);
      if (p.front) run.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      else if (run.length > 1) {
        lines.push(`M${run.join("L")}`);
        run.length = 0;
      }
    }
    if (run.length > 1) lines.push(`M${run.join("L")}`);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const run: string[] = [];
    for (let lon = -180; lon <= 180; lon += 4) {
      const p = project(lat, lon, spin, tilt, R);
      if (p.front) run.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      else if (run.length > 1) {
        lines.push(`M${run.join("L")}`);
        run.length = 0;
      }
    }
    if (run.length > 1) lines.push(`M${run.join("L")}`);
  }
  return lines;
}

const FRAME = 34;

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

  /* it turns on its own, unless it's being held or the year is paused */
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

  /* every stop that is facing us, with the ones that would pile up on top of
     each other dropped: come closer and they separate, and appear */
  const facing = spots
    .map((s, i) => ({ s, i, p: project(s.earth[0], s.earth[1], spin, tilt, R) }))
    .filter(({ p }) => p.front)
    .map((it) => ({ ...it, k: 0.55 + 0.45 * it.p.face }));
  const room = (a: { p: { x: number; y: number } }, b: { p: { x: number; y: number } }) =>
    Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) > FRAME * 1.9;
  const kept: typeof facing = [];
  // the one you have picked wins its spot, then the ones nearest the middle
  for (const it of [...facing].sort((a, b) => (a.i === here ? -1 : b.i === here ? 1 : b.p.face - a.p.face))) {
    if (kept.every((k) => room(it, k))) kept.push(it);
  }
  // drawn back to front, so the nearer cameo laps over the further one
  const cameos = kept.sort((a, b) => a.p.face - b.p.face);

  return (
    <svg
      className="wm-globe"
      viewBox="0 0 600 600"
      role="img"
      aria-label="A globe of the world, turning, with a stop on it for each place"
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
        <g className="wm-globe-land">
          {LANDS.map((l) =>
            runs(l.pts, spin, tilt, R).map((d, i) => <path key={`${l.name}-${i}`} d={d} />),
          )}
        </g>
      </g>

      {/* the light on the glass */}
      <circle cx={CX} cy={CY} r={R} fill="url(#wm-globe-sky)" pointerEvents="none" />
      <circle className="wm-globe-rim" cx={CX} cy={CY} r={R} />

      {/* closer and further away, for anyone without a wheel */}
      <g className="wm-globe-zoom">
        <g transform="translate(556 44)" onClick={() => setZoom((z) => Math.min(14, z * 1.45))} tabIndex={0} role="button" aria-label="Closer">
          <circle r="15" />
          <path d="M-7,0H7M0,-7V7" />
        </g>
        <g transform="translate(556 84)" onClick={() => setZoom((z) => Math.max(1, z / 1.35))} tabIndex={0} role="button" aria-label="Further away">
          <circle r="15" />
          <path d="M-7,0H7" />
        </g>
      </g>

      {cameos.map(({ s, i, p, k }) => {
        const on = i === here;
        return (
          <g
            key={s.id}
            className={`wm-globe-stop${on ? " is-on" : ""}`}
            transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(k * (on ? 1.15 : 1)).toFixed(3)})`}
            opacity={0.35 + 0.65 * p.face}
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
