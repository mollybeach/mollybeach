import { useEffect, useRef } from "react";
import { LivingPhoto } from "./LivingPhoto";

/* The terrace through the year, in order. Spring is the room as it loads; the
   rest fade in over it one after another, then winter fades back to spring.
   The timing lives in palais.css (palais-season-*), which assumes four. */
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;

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
 * The terrace turns through the seasons: four photographs of the same view,
 * stacked, crossfading on a slow timer.
 *
 * On a tall screen they are the portrait photographs instead, held in a
 * `.palais-frame` so the phone layout can be placed against them exactly.
 *
 * The slight pointer-driven drift is the only motion, and it is what stops a
 * still photograph from reading as wallpaper.
 */
export function Room({ portrait = false }: { portrait?: boolean }) {
  const img = useRef<HTMLDivElement & HTMLImageElement>(null);

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

  const stack = (set: "tall" | "wide") =>
    SEASONS.map((season) => (
      <img
        key={`${set}-${season}`}
        src={`${process.env.PUBLIC_URL}/palais/room-${portrait ? "portrait-" : set === "wide" ? "wide-" : ""}${season}.webp`}
        alt=""
        decoding="async"
        className={`palais-season palais-season--${season}`}
        style={portrait ? undefined : { objectPosition: "50% 42%" }}
      />
    ));
  const seasons = portrait ? (
    <div ref={img} className="palais-seasons" style={{ transform: "scale(1.045)" }}>
      {stack("tall")}
      <LivingPhoto room="palace" />
    </div>
  ) : (
    // both sets are always there and always turning together, so switching
    // between them as the window changes shape never puts the year out of step
    <div ref={img} className="palais-seasons" style={{ transform: "scale(1.045)" }}>
      {/* the clouds and water in each set move (LivingPhoto.tsx) */}
      <div className="palais-seasons-set palais-seasons-set--tall">
        {stack("tall")}
        <LivingPhoto room="palace" />
      </div>
      <div className="palais-seasons-set palais-seasons-set--wide">
        {stack("wide")}
        <LivingPhoto room="palace" />
      </div>
    </div>
  );
  const photo = portrait ? <div className="palais-frame">{seasons}</div> : seasons;

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
