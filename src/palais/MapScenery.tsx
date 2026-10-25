/**
 * Little painted landscapes on the world map, beside the rooms they belong to,
 * drawn from what each room looks out on. By the Blue Caves: snowy Mount Cook
 * over a lake, and Hobbiton's green hill with its round doors, fences,
 * flowers and a waterfall, the way the room's own picture has them.
 *
 * Each scene stands at a point on the map measured the same way as the stops
 * (on the second island, measured on that island), drawn at `scale`, and the
 * trees and flowers keep `reach` away from its middle.
 */

export interface Scene {
  /** which stop it belongs to, and which scene to draw */
  id: string;
  /** where it stands */
  at: [number, number];
  scale: number;
  /** the trees keep this far from (at, raised by half its height) */
  reach: number;
  isle?: 2;
}

export const SCENERY: Scene[] = [
  { id: "caves", at: [850, 336], scale: 1, reach: 66 },
  // across the lake from the Lakehouse: the University of Washington
  { id: "lakehouse", at: [628, 172], scale: 1, reach: 70 },
];

/** the middle of a scene on the whole, two-island map */
export const sceneMiddle = (s: Scene, drop: number): [number, number] => [s.at[0], s.at[1] - 30 * s.scale + (s.isle === 2 ? drop : 0)];
export const sceneReach = (s: Scene) => s.reach * s.scale;

/** a snowy peak, shaded, with its snowcap: drawn on (0, 0), `w` wide */
function Mountain({ w, h, id }: { w: number; h: number; id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-rock`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa7bb" />
          <stop offset="0.5" stopColor="#7d8aa0" />
          <stop offset="0.5" stopColor="#5f6b82" />
          <stop offset="1" stopColor="#56607a" />
        </linearGradient>
      </defs>
      <path d={`M${-w / 2},0 L${-w * 0.08},${-h} L${w * 0.04},${-h * 0.9} L${w / 2},0 Z`} fill={`url(#${id}-rock)`} />
      <path
        d={`M${-w * 0.21},${-h * 0.62} L${-w * 0.08},${-h} L${w * 0.04},${-h * 0.9} L${w * 0.16},${-h * 0.6} L${w * 0.08},${-h * 0.66} L${w * 0.01},${-h * 0.56} L${-w * 0.07},${-h * 0.68} Z`}
        fill="#fbfdff"
      />
      <path d={`M${-w * 0.08},${-h} L${w * 0.04},${-h * 0.9} L${w * 0.16},${-h * 0.6} L${w * 0.08},${-h * 0.66} Z`} fill="#dfe8f4" />
    </g>
  );
}

/** Hobbiton under Mount Cook: snowy peaks over a strip of lake, a rolling
    green hill with two round doors (one oak, one blue), white picket fences,
    a stone path, flowers, a purple-blossom tree and a little waterfall;
    about 130 wide, standing on (0, 0) */
function Shire({ id }: { id: string }) {
  const door = (x: number, y: number, r: number, wood: string, dark: string) => (
    <g>
      <circle cx={x} cy={y} r={r + 2.2} fill="#e9dcc2" />
      <circle cx={x} cy={y} r={r} fill={wood} />
      <path d={`M${x - r * 0.5},${y - r * 0.86} V${y + r} M${x + r * 0.5},${y - r * 0.86} V${y + r} M${x},${y - r} V${y + r}`} stroke={dark} strokeWidth={0.8} opacity={0.6} />
      <circle cx={x} cy={y} r={1.1} fill="#f2d16b" />
      <rect x={x - r - 2.2} y={y} width={2 * r + 4.4} height={r + 2} fill="transparent" />
    </g>
  );
  const fence = (x0: number, x1: number, y: number) => (
    <g stroke="#fffaf0" strokeWidth={1.1}>
      <line x1={x0} y1={y - 2} x2={x1} y2={y - 2} />
      {Array.from({ length: Math.round((x1 - x0) / 3) + 1 }, (_, i) => (
        <line key={i} x1={x0 + i * 3} y1={y} x2={x0 + i * 3} y2={y - 5} />
      ))}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6e07c" />
          <stop offset="1" stopColor="#5f9e42" />
        </linearGradient>
        <linearGradient id={`${id}-lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9d8f0" />
          <stop offset="1" stopColor="#5fa8d6" />
        </linearGradient>
      </defs>
      {/* Mount Cook and its range */}
      <g transform="translate(18 -40)">
        <Mountain w={110} h={58} id={`${id}-cook`} />
      </g>
      <g transform="translate(-30 -38)">
        <Mountain w={64} h={34} id={`${id}-range`} />
      </g>
      <g transform="translate(58 -38)">
        <Mountain w={52} h={28} id={`${id}-range2`} />
      </g>
      {/* the lake at its foot, and pines along the far shore */}
      <path d="M-50,-38 H80 V-30 H-50 Z" fill={`url(#${id}-lake)`} />
      {[-40, -30, 50, 62, 72].map((x, i) => (
        <path key={i} d={`M${x},-30 l3,-9 l3,9 z`} fill="#2f6b34" />
      ))}
      {/* the hill */}
      <path d="M-64,0 C-60,-26 -36,-36 -10,-34 C14,-32 34,-24 52,-14 C62,-8 68,-4 70,0 Z" fill={`url(#${id}-hill)`} />
      <path d="M-40,-30 C-30,-34 -16,-34 -6,-32" fill="none" stroke="#d6f0a8" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      {/* the two round doors */}
      {door(-28, -12, 7, "#c8893e", "#7a4a1e")}
      {door(18, -8, 6, "#3e7fbf", "#1f4a7a")}
      {/* chimney with smoke, a round window */}
      <rect x={-6} y={-38} width={4} height={7} fill="#a8723f" />
      <path d="M-4,-40 q-3,-4 0,-8 q3,-4 0,-8" fill="none" stroke="#f4f6fa" strokeWidth={1.4} strokeLinecap="round" opacity={0.85} />
      <circle cx={-12} cy={-16} r={3} fill="#ffe7a3" stroke="#e9dcc2" strokeWidth={1.3} />
      {/* picket fences and the stone path */}
      {fence(-60, -38, -2)}
      {fence(26, 44, -2)}
      <path d="M-28,-4 C-24,-2 -20,0 -16,2" fill="none" stroke="#d8cbb0" strokeWidth={3} strokeDasharray="2 1.5" strokeLinecap="round" />
      {/* a purple-blossom tree */}
      <rect x={42} y={-22} width={2.4} height={14} fill="#6b4423" />
      <circle cx={43} cy={-24} r={9} fill="#a77be0" />
      <circle cx={40} cy={-27} r={5} fill="#c9a8f2" />
      {/* a pink tree up the hill */}
      <rect x={-50} y={-26} width={2} height={10} fill="#6b4423" />
      <circle cx={-49} cy={-28} r={7} fill="#f4a6c6" />
      {/* flowers all along the front */}
      {[
        [-56, "#ffb3d6"],
        [-46, "#ffe08a"],
        [-36, "#c9a3ec"],
        [-6, "#ffb3d6"],
        [4, "#fffaf0"],
        [30, "#ff8fb0"],
        [54, "#ffe08a"],
      ].map(([x, c], i) => (
        <g key={i}>
          <circle cx={x as number} cy={-1} r={2.2} fill={c as string} />
          <circle cx={(x as number) + 3} cy={1} r={1.6} fill={c as string} />
        </g>
      ))}
      {/* the little waterfall, tumbling off the hill's end into a pool */}
      <path d="M60,-12 C62,-6 62,-2 64,2 H70 C68,-2 68,-6 66,-12 Z" fill="#e8f8ff" opacity={0.95} />
      <ellipse cx={66} cy={3} rx={9} ry={3} fill="#8fd8e8" stroke="#e8f8ff" strokeWidth={1} />
      <ellipse cx={58} cy={-12} rx={5} ry={3} fill="#9a8f84" />
      <ellipse cx={72} cy={-10} rx={4} ry={3} fill="#8a8078" />
    </g>
  );
}

const SCENES: Record<string, (key: string) => JSX.Element> = {
  // the UW campus across the lake, painted (public/palais/map/scenery/uw.webp), with
  // the lakehouse garden's red bridge on the water in front
  lakehouse: () => (
    <>
      <image href={`${process.env.PUBLIC_URL}/palais/map/scenery/uw.webp?v=2`} x={-92} y={-67} width={184} height={67.2} />
      <g transform="translate(40 -6) scale(0.62)">
        <path d="M-26,0 Q0,-16 26,0" fill="none" stroke="#7a1e14" strokeWidth={4.4} strokeLinecap="round" />
        <path d="M-26,0 Q0,-16 26,0" fill="none" stroke="#c8352a" strokeWidth={3} strokeLinecap="round" />
        <path d="M-24,-5 Q0,-21 24,-5" fill="none" stroke="#c8352a" strokeWidth={1.8} strokeLinecap="round" />
        {[-20, -12, -4, 4, 12, 20].map((x) => (
          <line key={x} x1={x} y1={-0.5 - 8 * (1 - (x / 26) ** 2)} x2={x} y2={-5.5 - 8 * (1 - (x / 26) ** 2)} stroke="#a52a20" strokeWidth={1.4} />
        ))}
      </g>
    </>
  ),
  // the Blue Caves: Mount Cook behind, the cave and Hobbiton in front
  // the Blue Caves: Mount Cook over a lake, and Hobbiton's green hill with a
  // wooden door and a blue one, fences, a purple tree and a waterfall
  caves: (k) => <Shire id={`${k}-shire`} />,
};

export function Scenery({ drop }: { drop: number }) {
  return (
    <g className="wm-scenery" aria-hidden>
      {SCENERY.map((s, i) => {
        const draw = SCENES[s.id];
        if (!draw) return null;
        const y = s.at[1] + (s.isle === 2 ? drop : 0);
        return (
          <g key={i} transform={`translate(${s.at[0]} ${y}) scale(${s.scale})`}>
            {draw(`wm-scene-${i}`)}
          </g>
        );
      })}
    </g>
  );
}
