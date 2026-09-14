import { useEffect, useMemo, useState } from "react";
import type { Styled } from "./styled";
import { usePortrait } from "./PortraitTerrace";
import { usePlace } from "./place";
import { CLOSET_BARS, CLOSET_PHOTOS, CLOSET_RACKS, closetSrc, garment, lay, type Bar, type Rack, type Spot } from "./clothes";
import { useRackOrder } from "./closetRacks";

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

function Piece({ spot, i }: { spot: Spot; i: number }) {
  const g = garment(spot.id);
  const outer: Styled = {
    position: "absolute",
    left: `${(spot.x - spot.w / 2).toFixed(3)}%`,
    width: `${spot.w.toFixed(3)}%`,
    zIndex: spot.z,
    ...(spot.hang ? { top: `${spot.y.toFixed(3)}%` } : { bottom: `${(100 - spot.y).toFixed(3)}%`, transformOrigin: "50% 100%" }),
  };
  // hung things sway a little on their hangers, each on its own clock
  const mover: Styled = spot.hang ? { "--dur": `${7 + ((i * 37) % 50) / 10}s`, "--arc": "0.9deg", animationDelay: `-${(i * 1.7) % 9}s` } : {};
  return (
    <div className={`closet-piece closet-piece--${spot.hang ? "hung" : "set"}`} style={outer} data-prop={spot.id}>
      <div className={spot.hang ? "closet-sway anim-swing pivot-top" : undefined} style={mover}>
        {spot.hang && <Hanger />}
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
  if (!visited) return null;
  return (
    <div className="palais-closet" aria-hidden={place !== "closet"}>
      <div key={which} className={`palais-closet-frame palais-closet-frame--${which}`}>
        {CLOSET_BARS[which].map((bar) => (
          <HangingBar key={bar.from.join()} bar={bar} photo={CLOSET_PHOTOS[which]} />
        ))}
        {CLOSET_RACKS[which].map((rack) => (
          <RollingRack key={rack.x0} rack={rack} photo={CLOSET_PHOTOS[which]} />
        ))}
        {spots.map((spot, i) => (
          <Piece key={spot.id} spot={spot} i={i} />
        ))}
      </div>
    </div>
  );
}
