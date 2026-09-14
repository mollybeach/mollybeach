import { useEffect, useMemo, useRef, useState } from "react";
import type { Styled } from "./styled";
import { usePortrait } from "./PortraitTerrace";
import { usePlace } from "./place";
import { CLOSET_BARS, CLOSET_LINES, CLOSET_PHOTOS, CLOSET_RACKS, WINDOW_MOULDING, closetSrc, garment, hookPoints, lay, type Bar, type Line, type Rack, type Spot } from "./clothes";
import { useClosetMoves, useRackOrder, type PieceMove } from "./closetRacks";
import { JewelryBox } from "./JewelryBox";
import { propSrc } from "./props";

/* the jewellery cabinet, standing for good on the floor between the cubbies
   and the left rolling rack: its feet, middle and width, in each photograph's pixels */
const CABINET = {
  wide: { x: 470, feet: 1000, w: 128 },
  tall: { x: 184, feet: 1150, w: 76 },
};

/** a little brass hanger, hooked over the rail */
function Hanger() {
  return (
    <svg className="closet-hanger" viewBox="0 0 100 40" aria-hidden>
      <path d="M50 17V12.5c0-3.5 2.6-6.5 6-6.5s5.6 3 5.6 5.6c0 2.2-1.4 3.6-3.2 4.2" />
      <path d="M50 17 11 34.5c-3 1.4-2.2 3.5.8 3.5h76.4c3 0 3.8-2.1.8-3.5Z" />
    </svg>
  );
}

/** a free-standing brass rail on the tiles, for what the closet's own rails can't show */
function RollingRack({ rack, photo }: { rack: Rack; photo: { w: number; h: number } }) {
  const style: Styled = {
    left: `${((rack.x0 / photo.w) * 100).toFixed(3)}%`,
    width: `${(((rack.x1 - rack.x0) / photo.w) * 100).toFixed(3)}%`,
    top: `${((rack.bar / photo.h) * 100).toFixed(3)}%`,
    height: `${(((rack.feet - rack.bar) / photo.h) * 100).toFixed(3)}%`,
    zIndex: rack.z,
  };
  return (
    <div className="closet-rack" style={style} aria-hidden>
      <i className="closet-rack-shadow" />
      <i className="closet-rack-post closet-rack-post--l" />
      <i className="closet-rack-post closet-rack-post--r" />
      <i className="closet-rack-foot closet-rack-foot--l" />
      <i className="closet-rack-foot closet-rack-foot--r" />
      <i className="closet-rack-bar" />
    </div>
  );
}

/** a brass bar fixed across a bay, like the closet's own */
function HangingBar({ bar, photo }: { bar: Bar; photo: { w: number; h: number } }) {
  const dx = bar.to[0] - bar.from[0];
  const dy = bar.to[1] - bar.from[1];
  const style: Styled = {
    left: `${((bar.from[0] / photo.w) * 100).toFixed(3)}%`,
    top: `${((bar.from[1] / photo.h) * 100).toFixed(3)}%`,
    width: `${((Math.hypot(dx, dy) / photo.w) * 100).toFixed(3)}%`,
    transform: `rotate(${((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2)}deg)`,
    zIndex: bar.z,
  };
  return <i className="closet-bar" style={style} aria-hidden />;
}

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

/** a moulding frame round the window's pink recess: a rail along the top, a
    stile down each side, and a carved block at each top corner */
function WindowMoulding({ m, photo }: { m: { x0: number; y0: number; x1: number; y1: number; t: number }; photo: { w: number; h: number } }) {
  const strip = (x: number, y: number, w: number, h: number): Styled => ({ left: pct(x, photo.w), top: pct(y, photo.h), width: pct(w, photo.w), height: pct(h, photo.h) });
  const c = m.t * 1.5;
  return (
    <>
      <i className="closet-moulding closet-moulding--h" style={strip(m.x0, m.y0, m.x1 - m.x0, m.t)} aria-hidden />
      <i className="closet-moulding closet-moulding--v" style={strip(m.x0, m.y0, m.t, m.y1 - m.y0)} aria-hidden />
      <i className="closet-moulding closet-moulding--v" style={strip(m.x1 - m.t, m.y0, m.t, m.y1 - m.y0)} aria-hidden />
      <i className="closet-moulding-corner" style={strip(m.x0 - (c - m.t) / 2, m.y0 - (c - m.t) / 2, c, c)} aria-hidden />
      <i className="closet-moulding-corner" style={strip(m.x1 - m.t - (c - m.t) / 2, m.y0 - (c - m.t) / 2, c, c)} aria-hidden />
    </>
  );
}

/** a row of little brass hooks, screwed into the moulding */
function HookRow({ line, photo }: { line: Line; photo: { w: number; h: number } }) {
  return (
    <>
      {hookPoints(line).map(([x, y]) => (
        <svg key={`${x}-${y}`} className="closet-hook" viewBox="0 0 20 34" style={{ left: pct(x, photo.w), top: pct(y, photo.h), zIndex: line.z + 1 }} aria-hidden>
          <circle cx="10" cy="6" r="5.4" className="closet-hook-plate" />
          <circle cx="10" cy="6" r="1.4" className="closet-hook-screw" />
          <path d="M10 9v12.5c0 6.4 7 6.4 7 1.6" className="closet-hook-arm" />
        </svg>
      ))}
    </>
  );
}

function Piece({ spot, i, move }: { spot: Spot; i: number; move?: PieceMove }) {
  const g = garment(spot.id);
  const outer: Styled = {
    position: "absolute",
    left: `${(spot.x - spot.w / 2).toFixed(3)}%`,
    width: `${spot.w.toFixed(3)}%`,
    zIndex: move?.z ?? spot.z,
    // where Molly dragged it and how big she made it, saved with the rails (closetRacks.ts)
    ...(move && (move.x || move.y) ? { translate: `${move.x}cqw ${move.y}cqh` } : {}),
    ...(move && move.s !== 1 ? { scale: String(move.s), transformOrigin: "50% 100%" } : {}),
    ...(spot.hang ? { top: `${spot.y.toFixed(3)}%` } : { bottom: `${(100 - spot.y).toFixed(3)}%`, transformOrigin: "50% 100%" }),
  };
  // hung things sway a little on their hangers, each on its own clock
  const mover: Styled = spot.hang ? { "--dur": `${7 + ((i * 37) % 50) / 10}s`, "--arc": "0.9deg", animationDelay: `-${(i * 1.7) % 9}s` } : {};
  return (
    <div className={`closet-piece closet-piece--${spot.hang ? "hung" : "set"}${spot.hook ? " closet-piece--hooked" : ""}`} style={outer} data-prop={spot.id}>
      <div className={spot.hang ? "closet-sway anim-swing pivot-top" : undefined} style={mover}>
        {spot.hang && !spot.hook && <Hanger />}
        <img
          src={closetSrc(spot.id)}
          alt={g ? `${g.label} (${g.store})` : ""}
          title={g ? `${g.label} · ${g.store}, ${g.bought}` : undefined}
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  );
}

/**
 * The clothes in the Wardrobe Wing (clothes.ts): hung on its rails, set out
 * on its shelves, its window seat and its floor, over whichever closet
 * photograph is showing. They can be picked up and moved like the terrace's
 * stickers (Draggable.tsx), and taken out or put back from the catalogue.
 *
 * Nothing is loaded until the closet is first visited.
 */
export function Wardrobe() {
  const tall = usePortrait();
  const { place } = usePlace();
  const [visited, setVisited] = useState(place === "closet");
  useEffect(() => {
    if (place === "closet") setVisited(true);
  }, [place]);
  const which = tall ? "tall" : "wide";
  // rearranged from the catalogue's Racks page (closetRacks.ts)
  const order = useRackOrder(which);
  const spots = useMemo(() => lay(which, order), [which, order]);
  const moves = useClosetMoves(which);
  const [jewels, setJewels] = useState(false);
  const closet = useRef<HTMLDivElement>(null);
  // leaving the closet closes the jewellery box
  useEffect(() => {
    if (place !== "closet") setJewels(false);
  }, [place]);
  if (!visited) return null;
  const photo = CLOSET_PHOTOS[which];
  const cab = CABINET[which];
  const stage = closet.current?.closest<HTMLElement>(".palais-stage");
  return (
    <div ref={closet} className="palais-closet" aria-hidden={place !== "closet"}>
      <div key={which} className={`palais-closet-frame palais-closet-frame--${which}`}>
        {CLOSET_BARS[which].map((bar) => (
          <HangingBar key={bar.from.join()} bar={bar} photo={CLOSET_PHOTOS[which]} />
        ))}
        {CLOSET_RACKS[which].map((rack) => (
          <RollingRack key={rack.x0} rack={rack} photo={CLOSET_PHOTOS[which]} />
        ))}
        {WINDOW_MOULDING[which] && <WindowMoulding m={WINDOW_MOULDING[which]!} photo={photo} />}
        {CLOSET_LINES[which]
          .filter((line) => line.hooks)
          .map((line) => (
            <HookRow key={line.id} line={line} photo={photo} />
          ))}
        {spots.map((spot, i) => (
          <Piece key={spot.id} spot={spot} i={i} move={moves[spot.id]} />
        ))}
        {/* the jewellery cabinet: not a sticker to move, but a door into the jewellery box */}
        <button
          type="button"
          className="closet-jewelry"
          style={{
            left: `${(((cab.x - cab.w / 2) / photo.w) * 100).toFixed(3)}%`,
            bottom: `${((1 - cab.feet / photo.h) * 100).toFixed(3)}%`,
            width: `${((cab.w / photo.w) * 100).toFixed(3)}%`,
          }}
          onClick={() => setJewels(true)}
          aria-label="Open the jewelry box"
          title="Open the jewelry box"
        >
          <img src={propSrc("cabinet-jewelry")} alt="" draggable={false} />
        </button>
      </div>
      {jewels && stage && <JewelryBox stage={stage} onClose={() => setJewels(false)} />}
    </div>
  );
}
