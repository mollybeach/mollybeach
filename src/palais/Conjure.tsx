import type { ReactNode } from "react";
import { conjureVars, type SetName } from "./conjureSchedule";

/**
 * Wraps one prop so it vanishes and returns with the rest of its set.
 *
 * Two layers. The wrapper carries the dissolve itself — opacity, blur, a lift
 * into light. The light is a sibling, not a child, so it is not faded or
 * blurred along with the furniture: the golden flare and the rising sparkles
 * are at full strength in exactly the moment the piece is not there.
 *
 * Both live inside the prop's own positioned element, so the animation never
 * changes where the piece falls in the room's paint order.
 */
export function Conjure({ set, children }: { set?: SetName; children: ReactNode }) {
  if (!set) return <>{children}</>;
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
