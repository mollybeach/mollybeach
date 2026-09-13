import { useLayoutEffect, useRef } from "react";

/**
 * Fitting the desktop room to its photograph.
 *
 * Every sticker in the desktop room was placed against the old wide terrace
 * photographs (1672 × 941). The photographs are now taller (1448 × 1086): the
 * same terrace, pixel for pixel, with more floor painted in below, so the old
 * picture is exactly the top of the new one at 0.866 of the size.
 *
 * Rather than re-measure a hundred placements, the stickers keep the
 * coordinates they had, and the whole scene is scaled and shifted to land on
 * the terrace where it now appears. A wide window gets the wide photographs
 * instead, with the terrace in a different place again. How much depends on the shape of the
 * window, because the photograph is cropped to cover it, so it's worked out
 * from the stage's size and redone whenever that changes.
 */

const OLD = { w: 1672, h: 941 };
/** Room shows the photograph with object-position 50% 42% and a 1.045 zoom */
const POS_Y = 0.42;
const ZOOM = 1.045;

/**
 * The two sets of photographs, and where the old photograph's terrace sits in
 * each, as a scale and an offset in that photograph's pixels.
 *
 * - tall (1448 × 1086): the old picture exactly, at 0.866, top-left.
 * - wide (1672 × 941): painted separately, so matched by eye to the room's
 *   opening — its sides, the lintel and the line where the tiles meet the
 *   lawn. The four wide seasons were each warped to put that opening in the
 *   same place. It's a close match rather than an exact one.
 */
export const PHOTOS = {
  tall: { w: 1448, h: 1086, k: 0.866, x: 0, y: 0 },
  wide: { w: 1672, h: 941, k: 0.866 * 0.83, x: 235.7, y: 69.1 },
};

/** the wide photographs take over once the room is wider than this (halfway
    between the two shapes); the CSS container query in palais.css matches it */
export const WIDE_FROM = 1.54;

export const photoFor = (W: number, H: number) => (W / H >= WIDE_FROM ? PHOTOS.wide : PHOTOS.tall);

function frame(W: number, H: number, photo: { w: number; h: number }) {
  const w = Math.max(W, (H * photo.w) / photo.h);
  const h = (w * photo.h) / photo.w;
  return { left: (W - w) / 2, top: (H - h) * POS_Y, w };
}

/** the transform that moves the old stage's coordinates onto the photograph in view */
export function sceneTransform(W: number, H: number) {
  const p = photoFor(W, H);
  const o = frame(W, H, OLD);
  const n = frame(W, H, p);
  const f = n.w / p.w; // one photograph pixel, on screen
  const k = p.k * (OLD.w / o.w) * f;
  const cx = W / 2;
  const cy = H / 2;
  // where the stage's centre lands, allowing for the zoom about the centre
  const X = cx + ZOOM * (n.left + f * p.x + k * (cx - o.left) - cx);
  const Y = cy + ZOOM * (n.top + f * p.y + k * (cy - o.top) - cy);
  return { k, x: X - k * cx, y: Y - k * cy };
}

/** keeps an element's transform fitted to the stage it sits in */
export function useSceneFit<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage) return;
    let last = "";
    const fit = () => {
      const { k, x, y } = sceneTransform(stage.clientWidth, stage.clientHeight);
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${k.toFixed(5)})`;
      // say which set of photographs is showing, for anything that cares
      const which = photoFor(stage.clientWidth, stage.clientHeight) === PHOTOS.wide ? "wide" : "tall";
      if (which !== last) stage.dataset.photo = last = which;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);
  return ref;
}
