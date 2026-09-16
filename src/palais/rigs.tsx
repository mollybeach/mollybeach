import type { ReactNode } from "react";

/**
 * Stickers with moving parts.
 *
 * A rig is drawn in the sticker's own pixel space (the viewBox, or a layer
 * image the same size as the sticker), so it lines up at any size. `under`
 * paints behind the sticker and `over` in front of it. The sticker image
 * itself has had the moving parts cut out of it (see the rig scripts in the
 * Palais notes): the tricycle's spokes and the white showing between them, and
 * the sewing machine's needle bar.
 */

export interface Rig {
  under?: ReactNode;
  over?: ReactNode;
}

const layer = (name: string) => `${process.env.PUBLIC_URL}/palais/props/rigs/${name}.webp`;

/* ---- Honeysuckle's bicycle ------------------------------------------------ */

interface Wheel {
  /** the wheel's outline, as an ellipse in sticker pixels */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  tilt: number;
  spokes: number;
  /** seconds per turn */
  turn: number;
}

/* Measured off the photograph. The small back wheel turns faster, in
   proportion, because both cover the same ground. */
const WHEELS: Wheel[] = [
  { cx: 485, cy: 688, rx: 104, ry: 131, tilt: -2, spokes: 20, turn: 3.2 },
  { cx: 279, cy: 688, rx: 23, ry: 58, tilt: 7, spokes: 12, turn: 1.4 },
];

/**
 * Spokes are drawn on a unit circle that spins, and the circle is then
 * squashed into the wheel's ellipse — so they bunch and spread as they come
 * round, the way real spokes seen at an angle do.
 */
function Spokes({ w }: { w: Wheel }) {
  const unit = 3.4 / ((w.rx + w.ry) / 2); // a spoke about 3.4px thick
  const lines = Array.from({ length: w.spokes }, (_, i) => {
    const t = (i / w.spokes) * Math.PI * 2;
    return { x: Math.cos(t) * 1.04, y: Math.sin(t) * 1.04 };
  });
  return (
    <g transform={`translate(${w.cx} ${w.cy}) rotate(${w.tilt}) scale(${w.rx} ${w.ry})`}>
      <g className="palais-spin" style={{ animationDuration: `${w.turn}s` }}>
        {lines.map((p, i) => (
          <line key={i} x1={0} y1={0} x2={p.x} y2={p.y} stroke="#7d5f35" strokeWidth={unit} strokeLinecap="round" />
        ))}
        {lines.map((p, i) => (
          <line key={`h${i}`} x1={0} y1={0} x2={p.x} y2={p.y} stroke="#e4c891" strokeWidth={unit * 0.38} strokeLinecap="round" opacity={0.85} />
        ))}
      </g>
    </g>
  );
}

const tricycle: Rig = {
  under: (
    <svg className="prop-rig-layer" viewBox="0 0 664 860" preserveAspectRatio="none" aria-hidden>
      {WHEELS.map((w, i) => (
        <Spokes key={i} w={w} />
      ))}
    </svg>
  ),
};

/* ---- Honeysuckle at the sewing machine ------------------------------------- */

const sewing: Rig = {
  over: (
    <>
      {/* the cloth, tugged along a little with each stitch */}
      <img className="prop-rig-layer palais-rig-fabric" src={layer("honeysuckle-sewing-fabric")} alt="" decoding="async" />
      {/* the needle bar, going up and down */}
      <img className="prop-rig-layer palais-rig-needle" src={layer("honeysuckle-sewing-needle")} alt="" decoding="async" />
      {/* what the needle slides through, and his paw holding the cloth down */}
      <img className="prop-rig-layer" src={layer("honeysuckle-sewing-front")} alt="" decoding="async" />
    </>
  ),
};

export const RIGS: Partial<Record<string, Rig>> = {
  "honeysuckle-tricycle": tricycle,
  "honeysuckle-sewing": sewing,
};
