import type { SeasonLayout } from "./arrangement";
import type { Device } from "./layoutsDb";
import type { Place } from "./place";

/**
 * Saving a look made on one device for the other: a computer's arrangement for
 * phones, or a phone's for computers.
 *
 * A computer and a phone show each room in different photographs (a wide one
 * and a tall one), and the stickers start from different places in each, so a
 * look can't simply be copied across. Instead:
 *
 * 1. On the device you're on, each sticker's picture is measured where it is
 *    in the room photograph: the middle of its base, and its width, as
 *    fractions of the photograph.
 * 2. Those are carried over to the other photograph with the room's mapping
 *    (PHOTO_MAPS below): how far along and down the other photograph the same
 *    spot in the room is. The mappings were measured by matching features
 *    between each room's two photographs.
 * 3. The look is saved "portable": where each sticker should end up, not how
 *    far it moves. The first time the other device wears it, each sticker is
 *    measured where it starts there, and moved and sized to land on its spot
 *    (resolvePortable). Saving there afterwards keeps it as an ordinary look.
 */

/** where a sticker should land in the room photograph: the middle of its base
    (cx across, b down) and its width, all as fractions of the photograph */
export interface Spot {
  cx: number;
  b: number;
  w: number;
}

/** computer photograph → phone photograph, as fractions: x' = kx·x + tx, y' = ky·y + ty */
interface PhotoMap {
  kx: number;
  tx: number;
  ky: number;
  ty: number;
}

/* measured by matching features between the wide and the tall photographs
   (the vertical fit weighted to the lower half, where the furniture stands) */
const PHOTO_MAPS: Record<string, PhotoMap> = {
  "room-wide": { kx: 1.119, tx: -0.003, ky: 0.739, ty: 0.14 },
  room: { kx: 1.02, tx: -0.018, ky: 0.723, ty: 0.189 },
  kitchen: { kx: 1.381, tx: -0.176, ky: 0.612, ty: 0.155 },
  bathroom: { kx: 1.435, tx: -0.21, ky: 0.729, ty: 0.079 },
  madeleine: { kx: 1.172, tx: -0.086, ky: 0.816, ty: 0.074 },
  closet: { kx: 1.451, tx: -0.221, ky: 0.754, ty: 0.031 },
  garden: { kx: 0.94, tx: 0.038, ky: 1, ty: 0 },
  lakehouse: { kx: 1.089, tx: -0.072, ky: 0.705, ty: 0.127 },
  lagoon: { kx: 1.504, tx: -0.356, ky: 0.718, ty: 0.158 },
  domes: { kx: 1.332, tx: -0.351, ky: 0.505, ty: 0.273 },
  jacaranda: { kx: 1.893, tx: -0.452, ky: 0.907, ty: 0.037 },
  reef: { kx: 0.96, tx: 0.024, ky: 0.662, ty: 0.158 },
  lanterns: { kx: 0.869, tx: 0.066, ky: 0.946, ty: -0.013 },
  shore: { kx: 0.926, tx: 0.033, ky: 0.848, ty: 0.028 },
  caves: { kx: 0.92, tx: 0.067, ky: 0.762, ty: 0.122 },
  library: { kx: 1.399, tx: -0.206, ky: 0.72, ty: 0.121 },
};
/* a room with no tall photograph shows the same one on a phone */
const SAME: PhotoMap = { kx: 1, tx: 0, ky: 1, ty: 0 };

const layerSelector = (device: Device) =>
  device === "phone" ? ".palais-layer .palais-frame [data-prop]" : ".palais-layer [data-prop]";

const inLayer = (el: Element, device: Device) => (device === "phone" ? !!el.closest(".palais-frame") : !el.closest(".palais-frame"));

/** the room photograph showing now: the most visible of its season pictures */
function roomPhoto(stage: HTMLElement, place: Place): HTMLImageElement | null {
  const selector = place === "palace" ? ".palais-room:not(.palais-room--away) img" : `.palais-room--${place} img`;
  let best: HTMLImageElement | null = null;
  let bestSeen = -1;
  stage.querySelectorAll<HTMLImageElement>(selector).forEach((img) => {
    if (!img.naturalWidth) return;
    const r = img.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let seen = 1;
    for (let el: Element | null = img; el && el !== stage; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") seen = 0;
      seen *= parseFloat(cs.opacity) || 0;
    }
    if (seen > bestSeen) {
      best = img;
      bestSeen = seen;
    }
  });
  return best;
}

/** where the photograph's picture actually is on screen (it's cropped to cover its box) */
function photoBox(img: HTMLImageElement) {
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  if (cs.objectFit === "fill") return { x: r.left, y: r.top, w: r.width, h: r.height };
  const sc = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const w = img.naturalWidth * sc;
  const h = img.naturalHeight * sc;
  const [px = 50, py = 50] = cs.objectPosition.split(" ").map((v) => parseFloat(v));
  return { x: r.left + ((r.width - w) * px) / 100, y: r.top + ((r.height - h) * py) / 100, w, h };
}

/** which mapping this room's photographs use */
function mapFor(img: HTMLImageElement | null, place: Place): PhotoMap {
  if (place === "palace") {
    const src = img?.getAttribute("src") ?? "";
    return /room-wide-/.test(src) ? PHOTO_MAPS["room-wide"] : PHOTO_MAPS.room;
  }
  return PHOTO_MAPS[place] ?? SAME;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** the room as it is, as a look for the other device (see the top of this file) */
export function portableFor(stage: HTMLElement, place: Place, from: Device, hidden: Set<string>): SeasonLayout {
  const img = roomPhoto(stage, place);
  if (!img) throw new Error("Couldn't find the room's photograph");
  const box = photoBox(img);
  const map = mapFor(img, place);
  const props: SeasonLayout["props"] = {};
  stage.querySelectorAll<HTMLElement>(layerSelector(from)).forEach((el) => {
    if (!inLayer(el, from)) return;
    const id = el.dataset.prop!;
    const z = Number(getComputedStyle(el).zIndex) || 0;
    if (hidden.has(id)) {
      props[id] = { shown: false, x: 0, y: 0, s: 1, z };
      return;
    }
    const pic = el.querySelector("img") ?? el;
    const r = pic.getBoundingClientRect();
    if (!r.width) return;
    let spot: Spot = { cx: (r.left + r.width / 2 - box.x) / box.w, b: (r.bottom - box.y) / box.h, w: r.width / box.w };
    // computer → phone uses the mapping; phone → computer undoes it
    spot =
      from === "desktop"
        ? { cx: map.kx * spot.cx + map.tx, b: map.ky * spot.b + map.ty, w: map.kx * spot.w }
        : { cx: (spot.cx - map.tx) / map.kx, b: (spot.b - map.ty) / map.ky, w: spot.w / map.kx };
    // the other photograph may be narrower: keep what was in the room inside it
    spot.cx = clamp(spot.cx, spot.w / 2 + 0.01, 1 - spot.w / 2 - 0.01);
    props[id] = { shown: true, x: 0, y: 0, s: 1, z, at: spot };
  });
  return { stage: { w: 1000, h: 1000, portable: true }, props };
}

/** a look saved from the other device, waiting to be put in place */
export const isPortable = (layout: SeasonLayout | undefined) => Boolean(layout?.stage.portable);

/**
 * Put a portable look's stickers where they belong, on this device. The
 * pictures need to have loaded (their height sets where their base is), so it
 * waits for them, up to a few seconds. Returns a cancel function.
 */
export function resolvePortable(stage: HTMLElement, place: Place, device: Device, layout: SeasonLayout): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const started = Date.now();
  const els = new Map<string, HTMLElement>();
  stage.querySelectorAll<HTMLElement>(layerSelector(device)).forEach((el) => {
    if (inLayer(el, device) && layout.props[el.dataset.prop!]?.at) els.set(el.dataset.prop!, el);
  });

  const place1 = (el: HTMLElement, id: string, box: ReturnType<typeof photoBox>, cr: { width: number; height: number }) => {
    const at = layout.props[id].at!;
    const transition = el.style.transition;
    el.style.transition = "none";
    el.style.translate = "";
    el.style.scale = "";
    el.style.transformOrigin = "50% 100%";
    const pic = (el.querySelector("img") as HTMLElement | null) ?? el;
    const r = pic.getBoundingClientRect();
    if (r.width && r.height) {
      // how much bigger things are drawn than their own size (the computer's room is scaled to fit)
      const own = pic.offsetWidth || el.offsetWidth;
      const zoom = own ? r.width / own : 1;
      const dx = (box.x + at.cx * box.w - (r.left + r.width / 2)) / zoom;
      const dy = (box.y + at.b * box.h - r.bottom) / zoom;
      el.style.translate = `${((dx / cr.width) * 100).toFixed(3)}cqw ${((dy / cr.height) * 100).toFixed(3)}cqh`;
      el.style.scale = ((at.w * box.w) / r.width).toFixed(3);
      el.style.zIndex = String(layout.props[id].z);
    }
    void el.offsetWidth;
    el.style.transition = transition;
  };

  const attempt = () => {
    if (cancelled) return;
    const img = roomPhoto(stage, place);
    if (!img) {
      if (Date.now() - started < 20000) timer = setTimeout(attempt, 250);
      return;
    }
    const box = photoBox(img);
    // the box the stickers' cqw and cqh are measured against
    const container = stage.querySelector<HTMLElement>(device === "phone" ? ".palais-layer .palais-frame" : ".palais-layer .palais-scene");
    const cr = container ? { width: container.offsetWidth, height: container.offsetHeight } : stage.getBoundingClientRect();
    els.forEach((el, id) => {
      const pic = el.querySelector("img");
      if (pic && !pic.complete) {
        // not loaded yet: its base isn't where it will be, so place it once it is
        pic.setAttribute("loading", "eager");
        pic.addEventListener("load", () => !cancelled && place1(el, id, photoBox(roomPhoto(stage, place) ?? img), cr), { once: true });
        return;
      }
      place1(el, id, box, cr);
    });
  };
  attempt();
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
