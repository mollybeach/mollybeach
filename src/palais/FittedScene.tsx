import type { ReactNode } from "react";
import { useSceneFit } from "./sceneFit";

/** the desktop room's stickers, fitted onto the terrace photograph (sceneFit.ts) */
export function Scene({ children }: { children: ReactNode }) {
  const ref = useSceneFit<HTMLDivElement>();
  return (
    <div ref={ref} className="palais-scene">
      {children}
    </div>
  );
}
