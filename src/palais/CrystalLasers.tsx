import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { coverBox } from "./GlobeEgg";
import { usePlace } from "./place";

/**
 * The lasers over the Crystal Ballroom's dance floor.
 *
 * A fan of thin beams, pink, violet, blue and green, thrown out from the top
 * of the stage arch and swept slowly back and forth over the marble, with a
 * flicker now and then as if the lighting desk were busy. It lies on the room's
 * photographs, under the stickers, and is lined up with the picture however
 * the room has cropped it (coverBox, as the pool table is). For people who ask
 * for reduced motion the beams hold still.
 */

/** where the beams come from, as a fraction of the picture: the top of the
    stage, on the wide pictures and on the tall ones */
const FROM = { wide: { x: 0.48, y: 0.29 }, tall: { x: 0.5, y: 0.35 } };

/** each beam: where it points (degrees off straight down), how far it sweeps
    either way, how long a sweep takes, how far into it it starts, its colour */
const BEAMS: { a: number; sweep: number; dur: number; delay: number; color: string }[] = [
  { a: -56, sweep: 12, dur: 7.5, delay: 0, color: "#ff3fd2" },
  { a: -44, sweep: 18, dur: 9, delay: -3, color: "#8b5cff" },
  { a: -26, sweep: 12, dur: 6.5, delay: -1.5, color: "#3fe8ff" },
  { a: -9, sweep: 16, dur: 8, delay: -5, color: "#5dff8f" },
  { a: 9, sweep: 16, dur: 8, delay: -1, color: "#ff3fd2" },
  { a: 26, sweep: 12, dur: 6.5, delay: -4, color: "#3fe8ff" },
  { a: 44, sweep: 18, dur: 9, delay: -6, color: "#8b5cff" },
  { a: 56, sweep: 12, dur: 7.5, delay: -2.5, color: "#5dff8f" },
];

export function CrystalLasers({ tall }: { tall: boolean }) {
  const { place } = usePlace();
  const here = place === "crystal";
  const rig = useRef<HTMLDivElement>(null);

  /* keep the beams on the top of the stage wherever the picture puts it */
  useLayoutEffect(() => {
    const el = rig.current;
    const box = el?.parentElement;
    if (!el || !box || !here) return;
    const fit = () => {
      const img = Array.from(box.querySelectorAll<HTMLImageElement>("img")).find((i) => i.naturalWidth);
      if (!img) return;
      const b = coverBox(img, box);
      const from = FROM[tall ? "tall" : "wide"];
      el.style.left = `${b.left + b.w * from.x}px`;
      el.style.top = `${b.top + b.h * from.y}px`;
      // long enough to reach past the corners of the floor
      el.style.setProperty("--reach", `${Math.hypot(b.w, b.h)}px`);
      // and only once there's a picture under them to light
      el.style.opacity = "1";
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(box);
    const id = setInterval(fit, 3000);
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here, tall]);

  return (
    <div ref={rig} aria-hidden className="palais-lasers">
      {BEAMS.map((b, i) => (
        <span
          key={i}
          className="palais-laser"
          style={
            {
              "--a": `${b.a}deg`,
              "--sweep": `${b.sweep}deg`,
              "--color": b.color,
              animationDuration: `${b.dur}s, ${3 + (i % 3) * 1.3}s`,
              animationDelay: `${b.delay}s, ${-i * 0.7}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
