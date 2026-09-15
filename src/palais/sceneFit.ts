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
  // the wide photographs with the pink cabinet (Sep 2026): fitted to the last
  // set by the pool, the arch and the floor line, so the arrangement holds
  wide: { w: 1672, h: 941, k: 0.866 * 0.83 * 0.9947, x: 171.1, y: 74.4 },
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

/* ---- following the photograph as the window changes shape ----------------

   The stickers used to be laid out on a box the size of the stage, so when the
   window changed shape their spots stretched with it while the photograph,
   cropped to cover the window, didn't: they slid off the things they stood on.

   Now they're laid out on a fixed box instead, the size of the stage the room's
   look was saved on (its layout's stage), so every spot means the same place
   whatever the window. That box is then moved and scaled so the photograph, as
   it would have been cropped on that stage, lands on the photograph as it's
   cropped now. On the stage a look was made on, nothing moves at all. */

/** the stage stickers are laid out on when a look doesn't say (the arrangement's) */
export const DEFAULT_REFERENCE = { w: 2766, h: 1654 };

interface Box {
  x: number;
  y: number;
  w: number;
}

/** where the old terrace photograph (the palace stickers' own coordinates) is on a stage */
function terraceOn(W: number, H: number): Box {
  const t = sceneTransform(W, H);
  const o = frame(W, H, OLD);
  return { x: t.k * o.left + t.x, y: t.k * o.top + t.y, w: t.k * o.w };
}

/** a photograph cropped to cover a stage, at an object-position */
function coverOn(W: number, H: number, nw: number, nh: number, fx: number, fy: number): Box {
  const sc = Math.max(W / nw, H / nh);
  const w = nw * sc;
  const h = nh * sc;
  return { x: (W - w) * fx, y: (H - h) * fy, w };
}

/** the photograph of a room on the map that's showing now, if it has loaded */
function roomImage(stage: HTMLElement, place: string): HTMLImageElement | null {
  let best: HTMLImageElement | null = null;
  let seen = -1;
  stage.querySelectorAll<HTMLImageElement>(`.palais-room--${place} img`).forEach((img) => {
    if (!img.naturalWidth) return;
    const o = parseFloat(getComputedStyle(img).opacity) || 0;
    if (o > seen) {
      best = img;
      seen = o;
    }
  });
  return best;
}

/** the transform that lays a look made on a `ref` stage onto this stage's photograph */
export function followTransform(stage: HTMLElement, place: string, ref: { w: number; h: number }) {
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const base = sceneTransform(ref.w, ref.h);
  let then: Box;
  let now: Box;
  const img = place === "palace" ? null : roomImage(stage, place);
  if (img) {
    const cs = getComputedStyle(img);
    const [px = 50, py = 50] = cs.objectPosition.split(" ").map((v) => parseFloat(v));
    const fit = cs.objectFit === "fill";
    const nw = fit ? img.clientWidth : img.naturalWidth;
    const nh = fit ? img.clientHeight : img.naturalHeight;
    // where it really is (allowing for any zoom on it) against where plain covering puts it
    const r = img.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const plain = coverOn(W, H, nw, nh, px / 100, py / 100);
    const sc = Math.max(r.width / nw, r.height / nh);
    now = { x: r.left - sr.left + ((r.width - nw * sc) * px) / 100, y: r.top - sr.top + ((r.height - nh * sc) * py) / 100, w: nw * sc };
    const zoom = now.w / plain.w;
    const c = coverOn(ref.w, ref.h, nw, nh, px / 100, py / 100);
    then = { x: ref.w / 2 + zoom * (c.x - ref.w / 2), y: ref.h / 2 + zoom * (c.y - ref.h / 2), w: zoom * c.w };
  } else {
    then = terraceOn(ref.w, ref.h);
    now = terraceOn(W, H);
  }
  const s = now.w / then.w;
  return { k: s * base.k, x: s * (base.x - then.x) + now.x, y: s * (base.y - then.y) + now.y };
}

/** keeps the stickers' box laid out on the look's stage, and fitted to the photograph in view */
export function useSceneFit<T extends HTMLElement>(place: string, ref: { w: number; h: number }) {
  const el = useRef<T>(null);
  const latest = useRef({ place, ref });
  latest.current = { place, ref };
  const fitRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    const box = el.current;
    const stage = box?.closest<HTMLElement>(".palais-stage");
    if (!box || !stage) return;
    let last = "";
    const fit = () => {
      const { place: at, ref: r } = latest.current;
      box.style.width = `${r.w}px`;
      box.style.height = `${r.h}px`;
      const { k, x, y } = followTransform(stage, at, r);
      box.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${k.toFixed(5)})`;
      // say which set of photographs is showing, for anything that cares
      const which = photoFor(stage.clientWidth, stage.clientHeight) === PHOTOS.wide ? "wide" : "tall";
      if (which !== last) stage.dataset.photo = last = which;
    };
    fitRef.current = fit;
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    // a room's photograph arriving, or turning to the next season's, can move where it's cropped
    const onLoad = (e: Event) => (e.target as Element).closest?.(".palais-room") && fit();
    stage.addEventListener("load", onLoad, true);
    return () => {
      ro.disconnect();
      stage.removeEventListener("load", onLoad, true);
    };
  }, []);
  // walking into another room, or wearing a look made on another stage
  useLayoutEffect(() => fitRef.current(), [place, ref.w, ref.h]);
  return el;
}
