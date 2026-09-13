import { useEffect, useRef } from "react";

/**
 * The room: the photographed palace terrace, held behind everything.
 *
 * On the standalone site this was fixed to the viewport. Here it fills the
 * home page's stage instead, so it sits beside the portfolio's sidebar rather
 * than underneath it.
 *
 * `object-position` keeps the floor in frame: when the pane is wider than the
 * photograph, `cover` crops top and bottom, and the floor is the part that
 * matters because everything stands on it.
 *
 * On a tall screen it is the portrait photograph instead, held in a
 * `.palais-frame` so the phone layout can be placed against it exactly.
 *
 * The slight pointer-driven drift is the only motion, and it is what stops a
 * still photograph from reading as wallpaper.
 */
export function Room({ portrait = false }: { portrait?: boolean }) {
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = img.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let mx = 0;
    let my = 0;

    const apply = () => {
      frame = 0;
      el.style.transform = `scale(1.045) translate3d(${(mx * -10).toFixed(1)}px, ${(my * -7).toFixed(1)}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    apply();
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [portrait]);

  const photo = portrait ? (
    <div className="palais-frame">
      <img ref={img} src={`${process.env.PUBLIC_URL}/palais/room-portrait.webp`} alt="" style={{ transform: "scale(1.045)" }} />
    </div>
  ) : (
    <img
      ref={img}
      src={`${process.env.PUBLIC_URL}/palais/room.webp`}
      alt=""
      style={{ objectPosition: "50% 42%", transform: "scale(1.045)" }}
    />
  );

  return (
    <div aria-hidden className="palais-room">
      {photo}
      {/* a little more shadow on the right-hand side of the room */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 8% 34%, rgba(255,246,222,0.26) 0%, rgba(255,246,222,0) 56%)," +
            "linear-gradient(255deg, rgba(58,42,24,0.2) 0%, rgba(58,42,24,0) 46%)",
        }}
      />
    </div>
  );
}
