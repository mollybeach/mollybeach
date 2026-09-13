import { useContext, type CSSProperties, type ReactNode } from "react";
import { ArrangedRoom, LayoutNow, arranged } from "./arrangement";

/** a plain positioned box that follows the season's arrangement, for the one
    sticker that isn't a <Prop> (the vanity chair) */
export function ArrangedBox({
  id,
  className,
  style,
  children,
  set,
}: {
  id: string;
  className?: string;
  style: CSSProperties;
  children: ReactNode;
  set?: string;
}) {
  const inRoom = useContext(ArrangedRoom);
  const layout = useContext(LayoutNow);
  return (
    <div className={className} data-set={set} data-prop={id} style={{ ...style, ...(inRoom ? arranged(id, layout) : undefined) }}>
      {children}
    </div>
  );
}
