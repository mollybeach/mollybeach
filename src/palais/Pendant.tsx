import { useContext } from "react";
import type { Styled } from "./styled";
import { ArrangedRoom, SeasonNow, arranged } from "./arrangement";
import { propSpec, propSrc, type PropId } from "./props";

/**
 * A light fixture hanging from the top edge of the page.
 *
 * The fixture's own canopy sits at the top of the page, so it is fully in
 * view and never cropped by the edge of the screen, and the whole fixture
 * swings from there — from the ceiling, not from its own middle.
 */
export function Pendant({
  id,
  x,
  w,
  tilt = 0,
  arc = 1.4,
  dur = 12,
  delay = 0,
  z = 95,
  className = "",
}: {
  id: PropId;
  /** left edge of the fixture */
  x: string;
  /** width of the fixture */
  w: string;
  tilt?: number;
  arc?: number;
  dur?: number;
  delay?: number;
  z?: number;
  className?: string;
}) {
  const spec = propSpec(id);
  const inRoom = useContext(ArrangedRoom);
  const season = useContext(SeasonNow);
  const moved = inRoom ? arranged(id, season) : undefined;

  const style: Styled = {
    position: "absolute",
    top: 0,
    left: x,
    width: w,
    zIndex: z,
    transformOrigin: "50% 0%",
    "--tilt": `${tilt}deg`,
    "--arc": `${arc}deg`,
    "--dur": `${dur}s`,
    animationDelay: `${delay}s`,
    ...moved,
    // it still hangs, and grows, from the ceiling
    ...(moved?.scale ? { transformOrigin: "50% 0%" } : undefined),
  };

  return (
    <div style={style} data-prop={id} className={`anim-swing ${className}`}>
      <div className="prop prop--lit">
        <img src={propSrc(id)} alt={spec.label} decoding="async" />
      </div>
    </div>
  );
}
