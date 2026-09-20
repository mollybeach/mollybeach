import { useLayoutEffect, useRef } from "react";
import { coverBox } from "./GlobeEgg";
import { propSrc } from "./props";
import { usePlace } from "./place";
import { useLetters } from "./LibraryLetters";

/**
 * The road case of old letters, standing on the Lakehouse floor.
 *
 * It isn't a sticker that can be moved: it sits in the front right corner in
 * every season, on a computer and on a phone alike, lined up with the
 * photograph however the room has cropped it — the same trick the iMac and the
 * library globe use (coverBox). The same case is in the catalogue too, for
 * putting in other rooms.
 *
 * It's the same letters as the library desk drawer: clicking the case opens
 * them (LibraryLetters). It lifts a little when it's pointed at, so it's plain
 * that it opens.
 */

const CASE = "road_case_vintage_mail_stack_black_sticker" as const;

/** where it stands, as a fraction of the lakehouse photograph */
const ON_THE_FLOOR = { x: 0.82, base: 1.0, w: 0.3 };
/** a phone sees a narrower crop of the room, so it sits a little smaller and further in */
const ON_A_PHONE = { x: 0.74, base: 0.99, w: 0.44 };

export function LakehouseCase() {
  const { place } = usePlace();
  const here = place === "lakehouse";
  const box = useRef<HTMLButtonElement>(null);
  const pull = useLetters();

  useLayoutEffect(() => {
    const el = box.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--lakehouse img"))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const spot = stage.clientWidth < 820 ? ON_A_PHONE : ON_THE_FLOOR;
      const shot = coverBox(img, stage);
      const w = shot.w * spot.w;
      const h = w * 0.45;                    // the case's own shape
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${shot.left + shot.w * spot.x - w / 2}px`;
      el.style.top = `${shot.top + shot.h * spot.base - h}px`;
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200);      // the photographs fade in as the seasons turn
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  if (!here) return null;

  return (
    <button
      ref={box}
      type="button"
      className="palais-lake-case"
      onClick={pull}
      aria-label="The road case of letters"
      title="Letters"
    >
      <img src={propSrc(CASE)} alt="" decoding="async" />
      <span className="lake-case-glow" aria-hidden />
      <span className="lake-case-tag" aria-hidden>✉ Letters</span>
    </button>
  );
}
