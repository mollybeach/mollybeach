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
 * the terrace where it now appears. How much depends on the shape of the
 * window, because the photograph is cropped to cover it, so it's worked out
 * from the stage's size and redone whenever that changes.
 */

const OLD = { w: 1672, h: 941 };
const NEW = { w: 1448, h: 1086 };
/** the old photograph's size within the new one */
const INSET = 0.866;
/** Room shows the photograph with object-position 50% 42% and a 1.045 zoom */
const POS_Y = 0.42;
const ZOOM = 1.045;

function frame(W: number, H: number, photo: { w: number; h: number }) {
  const w = Math.max(W, (H * photo.w) / photo.h);
  const h = (w * photo.h) / photo.w;
  return { left: (W - w) / 2, top: (H - h) * POS_Y, w };
}

/** the transform that moves the old stage's coordinates onto the new photograph */
export function sceneTransform(W: number, H: number) {
  const o = frame(W, H, OLD);
  const n = frame(W, H, NEW);
  // one old-photograph pixel, on screen, before and after
  const k = (INSET * (OLD.w / o.w) * n.w) / NEW.w;
  const cx = W / 2;
  const cy = H / 2;
  // where the stage's centre lands, allowing for the zoom about the centre
  const X = cx + ZOOM * (n.left + k * (cx - o.left) - cx);
  const Y = cy + ZOOM * (n.top + k * (cy - o.top) - cy);
  return { k, x: X - k * cx, y: Y - k * cy };
}

/** keeps an element's transform fitted to the stage it sits in */
export function useSceneFit<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage) return;
    const fit = () => {
      const { k, x, y } = sceneTransform(stage.clientWidth, stage.clientHeight);
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${k.toFixed(5)})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);
  return ref;
}
