import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { propSpec, propSrc, type PropId } from "./props";

/**
 * The chair, standing in the room, and turnable.
 *
 * There is only one photograph of the chair, so it cannot truly be spun. What
 * it *can* do is behave like a solid object standing in the room: it sits in a
 * real perspective, leans and turns toward the pointer, and its shadow swings
 * the other way. Your eye reads a thing with a back and sides, which is the
 * honest version of 3D with one view to work from.
 *
 * Drag it, or just move the pointer nearby, to look around it.
 */
export function Plinth({
  id,
  w = "20rem",
  className = "",
}: {
  id: PropId;
  w?: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [spin, setSpin] = useState(0); // degrees, from pointer or drag
  const [lean, setLean] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, from: 0 });
  const spec = propSpec(id);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: PointerEvent) => {
      if (drag.current.x) {
        setSpin(drag.current.from + (e.clientX - drag.current.x) * 0.55);
        return;
      }
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // fall off with distance so it only reacts when you are near it
      const near = Math.max(0, 1 - Math.hypot(e.clientX - cx, e.clientY - cy) / 620);
      setSpin(((e.clientX - cx) / r.width) * 26 * near);
      setLean(((e.clientY - cy) / r.height) * -7 * near);
    };

    const onUp = () => {
      drag.current.x = 0;
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, from: spin };
    setDragging(true);
  };

  return (
    <div
      ref={box}
      className={`palais-plinth ${className}`}
      style={{ width: w, perspective: "1100px", perspectiveOrigin: "50% 72%" }}
      onPointerDown={onDown}
    >
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${8 + lean}deg) rotateY(${spin}deg)`,
          transition: dragging ? "none" : "transform 700ms cubic-bezier(.2,.7,.2,1)",
          cursor: dragging ? "grabbing" : "grab",
        }}
      >
        {/* No plinth any more. A marble drum at this size read as a white
            blob under the chair and fought the parquet; the chair simply
            stands on the floor, and the turning is all in how it and its
            shadow answer the pointer. */}
        {/* ---- the chair, standing up on the plinth ---- */}
        <div
          style={{
            position: "relative",
            transform: `rotateY(${-spin * 0.55}deg)`,
            transformStyle: "preserve-3d",
            transition: dragging ? "none" : "transform 700ms cubic-bezier(.2,.7,.2,1)",
          }}
        >
          <div className="prop prop--near">
                        <img src={propSrc(id)} alt={spec.label} />
          </div>
        </div>
      </div>

      {/* the shadow on the parquet, swinging opposite the turn */}
      <span
        aria-hidden
        className="contact-shadow"
        style={{
          width: "88%",
          paddingBottom: "8%",
          bottom: "-2%",
          opacity: 0.46,
          transform: `translateX(calc(-50% + ${(spin * -0.4).toFixed(1)}px))`,
          transition: dragging ? "none" : "transform 700ms cubic-bezier(.2,.7,.2,1)",
        }}
      />

    </div>
  );
}
