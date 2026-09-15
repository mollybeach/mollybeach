import type { ReactNode } from "react";
import { conjureVars, type SetName } from "./conjureSchedule";

/**
 * Wraps one prop so it vanishes and returns with the rest of its set.
 *
 * Switched off for now: the furniture stays put on every page. Set VANISHING
 * back to true to bring the turns back.
 *
 * Two layers. The wrapper carries the dissolve itself — opacity, blur, a lift
 * into light. The light is a sibling, not a child, so it is not faded or
 * blurred along with the furniture: the golden flare and the rising sparkles
 * are at full strength in exactly the moment the piece is not there.
 *
 * Both live inside the prop's own positioned element, so the animation never
 * changes where the piece falls in the room's paint order.
 */
const VANISHING = false;

export function Conjure({ set, children }: { set?: SetName; children: ReactNode }) {
  if (!set || !VANISHING) return <>{children}</>;
  const vars = conjureVars(set);
  return (
    <>
      <div className="conjure" style={vars}>
        {children}
      </div>
      <span aria-hidden className="conjure-light" style={vars} />
    </>
  );
}
