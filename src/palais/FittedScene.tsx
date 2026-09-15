import { useContext, type ReactNode } from "react";
import { LayoutNow } from "./arrangement";
import { usePlace } from "./place";
import { DEFAULT_REFERENCE, useSceneFit } from "./sceneFit";

/** the desktop room's stickers, laid out on the stage the room's look was saved
    on and fitted onto the photograph in view (sceneFit.ts) */
export function Scene({ children }: { children: ReactNode }) {
  const { place } = usePlace();
  const layout = useContext(LayoutNow);
  // a look saved on a real stage keeps it; an empty one, or one saved from a phone, uses the default
  const ref = layout && layout.stage.w > 1 && !layout.stage.portable ? layout.stage : DEFAULT_REFERENCE;
  const el = useSceneFit<HTMLDivElement>(place, ref);
  return (
    <div ref={el} className="palais-scene">
      {children}
    </div>
  );
}
