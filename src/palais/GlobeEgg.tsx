import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { VisitorMap } from "./VisitorMap";
import { Blossoms } from "./WorldMap";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { visitStats, type VisitStats } from "./visits";
import { usePlace } from "./place";

/**
 * The globe in the library, which nobody is told about.
 *
 * It stands beside the shelves in the photograph, so there's nothing to click:
 * this lays an invisible round button over it, worked out from where the
 * photograph actually sits once the room has cropped it to the window. Click
 * it and the world opens, with a pin on every city anyone has come from.
 *
 * The visitor figures only come back for Molly (the database answers those
 * functions for editors alone), so a stranger who finds the globe gets the
 * world with no pins on it, which is a fine thing to find too.
 */

/** where the globe is in the library photograph, as a fraction of it */
const GLOBE = { x: 0.71, y: 0.517, r: 0.032 };

/** the drawn box of a photograph that has been cropped to cover its box */
export function coverBox(img: HTMLImageElement, stage: HTMLElement) {
  const r = img.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  const cs = getComputedStyle(img);
  const [px = 50, py = 50] = cs.objectPosition.split(" ").map((v) => parseFloat(v));
  const k = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  return {
    left: r.left - s.left + ((r.width - w) * px) / 100,
    top: r.top - s.top + ((r.height - h) * py) / 100,
    w,
    h,
  };
}

export function GlobeEgg() {
  const { place } = usePlace();
  // the same dressing as the world map: cream paper over a floral, with the
  // rims and the plaque taking their stone from the sidebar and the footer
  const paper = useFloral("map");
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");
  const here = place === "library";
  const spot = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [asked, setAsked] = useState(false);

  /* keep the button over the globe, wherever the photograph has landed */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--library img"))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const box = coverBox(img, stage);
      const d = box.w * GLOBE.r * 2;
      el.style.width = `${d}px`;
      el.style.height = `${d}px`;
      el.style.left = `${box.left + box.w * GLOBE.x - d / 2}px`;
      el.style.top = `${box.top + box.h * GLOBE.y - d / 2}px`;
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200); // the photographs fade in as the seasons turn
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  /* the numbers, asked for once, and only when the globe is opened */
  useEffect(() => {
    if (!open || asked) return;
    setAsked(true);
    visitStats(3650)
      .then(setStats)
      .catch(() => setStats(null));
  }, [open, asked]);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!here) return null;

  return (
    <>
      <button
        ref={spot}
        type="button"
        className="palais-globe-egg"
        aria-label="The globe"
        title="The globe"
        onClick={() => setOpen(true)}
      />
      {open && (
        <div
          className="wm-backdrop"
          style={{
            ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
            ["--wm-jewel-side" as string]: paletteOf(chips.now).jewel,
            ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).jewel,
          }}
          onPointerDown={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="wm-panel wm-panel--globe"
            role="dialog"
            aria-modal="true"
            aria-labelledby="globe-title"
            style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.965), rgba(250, 243, 229, 0.975)), url("${floralSrc(paper.now)}")` }}
          >
            <Blossoms className="wm-bloom wm-bloom--tl" posy="tl" />
            <Blossoms className="wm-bloom wm-bloom--bl" posy="bl" />
            <Blossoms className="wm-bloom wm-bloom--tr" posy="tr" />
            <Blossoms className="wm-bloom wm-bloom--br" posy="br" />

            <div className="wm-title">
              <Blossoms className="wm-bloom wm-bloom--title-l" posy="title-l" />
              <h2 id="globe-title">
                <span aria-hidden>✿</span> Visitors <span aria-hidden>✿</span>
              </h2>
              <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
            </div>
            <button type="button" className="wm-close" onClick={close} aria-label="Close the visitors map">
              ×
            </button>

            <div className="wm-globe-body">
              <VisitorMap cities={stats?.cities ?? []} />
              {!stats && (
                <p className="cat-note">
                  The globe keeps its pins for Molly. Spin it anyway: the world is the same either way.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
