import { useEffect, useRef, useState } from "react";

/**
 * The world map, as a world.
 *
 * The world is all ocean (public/palais/map/globe-sea.webp), and every room
 * stands on it as a little 3-D island of its own (public/palais/map/islands),
 * where the room is on the flat map: the first island's rooms over the
 * western half of the world, the second's over the eastern. The sphere is painted
 * pixel by pixel onto a canvas each time it turns: for every point of the
 * disc, the latitude and longitude under it (the orthographic projection run
 * backwards), and the colour of the world there, shaded towards the edge so it
 * reads as a ball. Every stop sits on its own spot in its island's painting.
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
  /** how big its circle is on the world, and how far below its middle its
      name sits, both in degrees of latitude: the size of the frame painted
      under it, so the real circle covers the painted one exactly */
  size: number;
  label: number;
  /** a little 3-D island of the room (public/palais/map/islands), standing on
      the world in place of the flat circle */
  island?: string;
  /** its island picture has its name painted on already, so no pill is added */
  named?: boolean;
  /** painted on the big island already, with its name: only a place to press */
  painted?: boolean;
}

const R0 = 230;

/* ---- the wrapped world ------------------------------------------------------ */

const WORLD_SRC = `${process.env.PUBLIC_URL}/palais/map/globe-sea.webp?v=2`;
/** where each island's painting lies on the world, in degrees: between them
    they cover it all, the first over the western half and the second over the
    eastern, blending at the two seams; `side` is how much of each map image is
    the plain sea added to its sides, which the globe leaves off */
export const ISLE_BOUNDS = [
  { lon0: -188.8, lon1: 8.8, lat0: 78, lat1: -78, side: 98 / 1637 },
  { lon0: -8.8, lon1: 188.8, lat0: 78, lat1: -78, side: 124 / 1665 },
];
/** a point of an island's map image (0..1 across and down) as a place on the world */
export const onWorld = (isle: 0 | 1, u: number, v: number): [number, number] => {
  const b = ISLE_BOUNDS[isle];
  const uc = (u - b.side) / (1 - 2 * b.side);
  return [b.lat0 + (b.lat1 - b.lat0) * v, b.lon0 + (b.lon1 - b.lon0) * uc];
};

let worldPixels: Promise<ImageData> | null = null;
function loadWorld() {
  if (!worldPixels)
    worldPixels = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const g = c.getContext("2d");
        if (!g) return reject(new Error("no canvas"));
        g.drawImage(img, 0, 0);
        resolve(g.getImageData(0, 0, c.width, c.height));
      };
      img.onerror = reject;
      img.src = WORLD_SRC;
    });
  return worldPixels;
}

/** the sphere, painted onto the canvas as the world turns */
function paintWorld(canvas: HTMLCanvasElement, world: ImageData, spin: number, tilt: number, R: number) {
  const g = canvas.getContext("2d");
  if (!g) return;
  const S = canvas.width; // the canvas covers the whole 600-wide view
  const k = S / 600;
  const out = g.createImageData(S, S);
  const o = out.data;
  const w = world.data;
  const TW = world.width;
  const TH = world.height;
  const φ0 = rad(tilt);
  const sφ0 = Math.sin(φ0);
  const cφ0 = Math.cos(φ0);
  const λ0 = rad(spin);
  const cx = CX * k;
  const cy = CY * k;
  const Rk = R * k;
  const y0 = Math.max(0, Math.floor(cy - Rk));
  const y1 = Math.min(S, Math.ceil(cy + Rk));
  const x0 = Math.max(0, Math.floor(cx - Rk));
  const x1 = Math.min(S, Math.ceil(cx + Rk));
  for (let y = y0; y < y1; y++) {
    const py = (cy - y) / Rk;
    for (let x = x0; x < x1; x++) {
      const px = (x - cx) / Rk;
      const ρ2 = px * px + py * py;
      if (ρ2 >= 1) continue;
      const cosc = Math.sqrt(1 - ρ2);
      // the orthographic projection, backwards: sin c = ρ, cos c = √(1 − ρ²)
      const lat = Math.asin(cosc * sφ0 + py * cφ0);
      const lon = λ0 + Math.atan2(px, cosc * cφ0 - py * sφ0);
      let u = (lon / (2 * Math.PI) + 0.5) % 1;
      if (u < 0) u += 1;
      const v = 0.5 - lat / Math.PI;
      const ti = ((Math.min(TH - 1, (v * TH) | 0) * TW + ((u * TW) | 0)) << 2);
      // lit from the upper left: the sphere's own normal is (px, py, cosc),
      // so it darkens towards the rim and the far side, with a glossy
      // highlight where the light glances off it
      const nl = -px * 0.42 + py * 0.5 + cosc * 0.76;
      const shade = 0.3 + 0.82 * Math.max(0, nl);
      const spec = Math.pow(Math.max(0, nl), 24) * 70;
      const rim = Math.pow(1 - cosc, 3) * 90; // a blue haze of atmosphere at the edge
      const oi = (y * S + x) << 2;
      o[oi] = w[ti] * shade + spec + rim * 0.35;
      o[oi + 1] = w[ti + 1] * shade + spec + rim * 0.6;
      o[oi + 2] = w[ti + 2] * shade + spec + rim;
      o[oi + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
}
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

  const canvas = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useState<ImageData | null>(null);
  useEffect(() => {
    let live = true;
    loadWorld()
      .then((w) => live && setWorld(w))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (world && canvas.current) paintWorld(canvas.current, world, spin, tilt, R);
  }, [world, spin, tilt, R]);

  /* every stop facing us. Stops close enough to sit on top of each other are
     gathered, and each gathering is fanned out in a ring round the spot they
     share, with a thread from each cameo back to where it really is */
  /* every stop facing us, drawn the way the flat map draws them: the room's
     picture in a jewelled ring, with its name on a pill underneath. Each is
     as big as the frame painted under it on the world, foreshortened as the
     world turns, so it sits over that frame exactly */
  const cameos = spots
    .map((s, i) => {
      const [lat, lon] = s.earth;
      const p = project(lat, lon, spin, tilt, R);
      const up = project(lat + s.size, lon, spin, tilt, R);
      const side = project(lat, lon + s.size / Math.max(0.2, Math.cos(rad(lat))), spin, tilt, R);
      // the circle lies flat on the ball: its across and up directions are
      // where the world carries them, so it squashes as it turns away
      const A = { x: side.x - p.x, y: side.y - p.y };
      const B = { x: p.x - up.x, y: p.y - up.y };
      const rr = Math.hypot(B.x, B.y);
      const lab = project(lat - s.label, lon, spin, tilt, R);
      return { s, i, p, rr, A, B, lab };
    })
    .filter(({ p }) => p.front && p.face > 0.08)
    // the picked one last, so it sits over its neighbours
    .sort((a, b) => (a.s.island && b.s.island ? a.p.face - b.p.face : a.i === here ? 1 : b.i === here ? -1 : a.p.face - b.p.face));

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
        <radialGradient id="wm-globe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0.8" stopColor="#bfe4ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#bfe4ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wm-globe-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#0a1530" stopOpacity="0.45" />
          <stop offset="1" stopColor="#0a1530" stopOpacity="0" />
        </radialGradient>
        <clipPath id="wm-globe-disc">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      <circle cx={CX} cy={CY} r={R} fill="url(#wm-globe-sea)" />

      {/* its shadow, and the glow of its air */}
      <ellipse cx={CX + R * 0.12} cy={CY + R * 1.02} rx={R * 0.85} ry={R * 0.16} fill="url(#wm-globe-shadow)" />
      <circle cx={CX} cy={CY} r={R * 1.08} fill="url(#wm-globe-glow)" />
      {/* both islands' paintings, wrapped round the world */}
      <foreignObject x={0} y={0} width={600} height={600} pointerEvents="none">
        <canvas ref={canvas} width={720} height={720} style={{ width: "100%", height: "100%", display: "block" }} />
      </foreignObject>

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

      {cameos.map(({ s, i, p, rr, A, B, lab }) => {
        const on = i === here;
        const fs = Math.max(7, rr * 0.3);
        const pw = s.name.length * fs * 0.62 + fs * 1.4;
        if (s.painted) {
          // the building is on the painting, name and all: just a soft ring of
          // light round it when it's picked or pointed at
          const hr = Math.max(14, rr * 1.15) * (0.4 + 0.6 * p.face);
          return (
            <g
              key={s.id}
              className={`wm-globe-stop wm-globe-painted${on ? " is-on" : ""}`}
              tabIndex={0}
              onClick={() => onPick(i)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(i)}
            >
              <title>{s.name}</title>
              <circle cx={p.x} cy={p.y} r={hr} fill="transparent" />
              <circle className="wm-globe-glow" cx={p.x} cy={p.y} r={hr} />
            </g>
          );
        }
        if (s.island) {
          // the island stands up off the ball, its foot on its spot, growing
          // as it comes round to face us
          const iw = rr * 3 * (0.35 + 0.65 * p.face) * (on ? 1.12 : 1);
          const lf = Math.max(7, iw * 0.085);
          const lw = s.name.length * lf * 0.62 + lf * 1.4;
          return (
            <g
              key={s.id}
              className={`wm-globe-stop wm-globe-isle${on ? " is-on" : ""}`}
              opacity={Math.min(1, 0.15 + 1.4 * p.face)}
              tabIndex={0}
              onClick={() => onPick(i)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(i)}
            >
              <title>{s.name}</title>
              <ellipse cx={p.x} cy={p.y + iw * 0.02} rx={iw * 0.46} ry={iw * 0.1} fill="rgba(5,20,50,0.45)" />
              <image href={s.island} x={p.x - iw / 2} y={p.y - iw * 0.82} width={iw} height={iw * 0.86} preserveAspectRatio="xMidYMax meet" />
              <g transform={`translate(${p.x.toFixed(1)} ${(p.y + lf * 1.4).toFixed(1)})`} opacity={p.face > 0.35 && !s.named ? 1 : 0}>
                <rect x={-lw / 2} y={-lf * 0.95} width={lw} height={lf * 1.9} rx={lf * 0.95} fill={on ? "#fbe3ea" : "#fffaf0"} stroke={on ? "#d27a98" : "#c9a14e"} strokeWidth={Math.max(1, lf * 0.12)} />
                <text className="wm-globe-name" y={lf * 0.36} textAnchor="middle" style={{ fontSize: lf }}>
                  {s.name}
                </text>
              </g>
            </g>
          );
        }
        return (
          <g
            key={s.id}
            className={`wm-globe-stop${on ? " is-on" : ""}`}
            opacity={Math.min(1, 0.25 + 1.2 * p.face)}
            tabIndex={0}
            onClick={() => onPick(i)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(i)}
          >
            <title>{s.name}</title>
            {/* drawn 100 across, then laid onto the ball */}
            <g transform={`matrix(${(A.x / 100).toFixed(4)} ${(A.y / 100).toFixed(4)} ${(B.x / 100).toFixed(4)} ${(B.y / 100).toFixed(4)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
              <circle r={106} fill="rgba(20,20,40,0.35)" transform="translate(4 8)" />
              <clipPath id={`wm-globe-clip-${s.id}`}>
                <circle r={100} />
              </clipPath>
              <circle r={100} fill="#fffaf0" />
              <image href={s.picture} x={-140} y={-100} width={280} height={200} preserveAspectRatio="xMidYMid slice" clipPath={`url(#wm-globe-clip-${s.id})`} />
              <circle className="wm-globe-ring" r={102} style={{ strokeWidth: 10 }} />
              <circle r={109} fill="none" stroke="#fffaf0" strokeWidth={3} opacity={0.9} />
            </g>
            <g transform={`translate(${lab.x.toFixed(1)} ${lab.y.toFixed(1)}) scale(${(0.45 + 0.55 * p.face).toFixed(3)})`} opacity={p.face > 0.3 ? 1 : 0}>
              <rect x={-pw / 2} y={-fs * 0.95} width={pw} height={fs * 1.9} rx={fs * 0.95} fill={on ? "#fbe3ea" : "#fffaf0"} stroke={on ? "#d27a98" : "#c9a14e"} strokeWidth={Math.max(1, fs * 0.12)} />
              <text className="wm-globe-name" y={fs * 0.36} textAnchor="middle" style={{ fontSize: fs }}>
                {s.name}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
