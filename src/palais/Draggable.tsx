import { useEffect, useRef } from "react";

/**
 * Pick up anything in the room and put it somewhere else.
 *
 * One listener on the stage handles every sticker, so no prop needs to know
 * about dragging. Each movable thing is marked `data-prop` on its outermost,
 * positioned element.
 *
 * - It only picks a sticker up by its picture, not by the transparent box
 *   around it. Stickers overlap a great deal, and grabbing a cat through the
 *   empty corner of the dresser's image would be maddening, so the pixel under
 *   the pointer is checked, and if it's see-through the search carries on to
 *   whatever is underneath.
 * - Something faded out (mid-conjure, or waiting its turn in a shared spot)
 *   can't be picked up.
 * - The move is applied with the `translate` property, which adds to a
 *   sticker's own `transform` animations (bobbing, swinging, fading) instead
 *   of replacing them, so it keeps moving the way it did.
 * - Everything moves on its own, furniture included (see `groupOf`).
 * - Whatever was picked up last comes to the front of the room.
 * - Pointing at a sticker (or tapping it, on a phone) shows a small handle on
 *   its corner. Dragging the handle away from the sticker makes it bigger,
 *   towards it smaller. It grows from its feet, so it stays standing where it
 *   was.
 *
 * Positions aren't saved: a reload puts the room back the way it was.
 */

interface Carried {
  el: HTMLElement;
  baseX: number;
  baseY: number;
}

interface Grab {
  el: HTMLElement;
  carried: Carried[];
  pointer: number;
  startX: number;
  startY: number;
}

/* read off the computed style, which is in pixels whatever units the
   arrangement set it in */
const offset = (el: HTMLElement) => {
  const t = getComputedStyle(el).translate;
  const [x = "0", y = "0"] = t === "none" ? [] : t.split(" ");
  return { baseX: parseFloat(x) || 0, baseY: parseFloat(y) || 0 };
};

/** the z-index it was given in the layout, before any dragging raised it */
const layoutZ = (el: HTMLElement) => {
  if (el.dataset.z0 === undefined) el.dataset.z0 = getComputedStyle(el).zIndex;
  return Number(el.dataset.z0) || 0;
};

/* a small copy of each sticker's alpha channel, for hit-testing */
const ALPHA = new Map<string, { data: Uint8ClampedArray; w: number; h: number } | null>();

function alphaAt(img: HTMLImageElement, clientX: number, clientY: number) {
  if (img.dataset.hit === "box") return 255;
  const key = img.currentSrc || img.src;
  let map = ALPHA.get(key);
  if (map === undefined) {
    if (!img.complete || !img.naturalWidth) return 0;
    try {
      const scale = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0, c.width, c.height);
      map = { data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
    } catch {
      map = null;
    }
    ALPHA.set(key, map);
  }
  if (!map) return 255;
  const r = img.getBoundingClientRect();
  let u = (clientX - r.left) / r.width;
  const v = (clientY - r.top) / r.height;
  // a flipped sticker is mirrored on screen but not in its pixels
  if (img.closest<HTMLElement>('[style*="scaleX(-1)"]')) u = 1 - u;
  const x = Math.min(map.w - 1, Math.max(0, Math.floor(u * map.w)));
  const y = Math.min(map.h - 1, Math.max(0, Math.floor(v * map.h)));
  return map.data[(y * map.w + x) * 4 + 3];
}

/** how visible something really is, counting every fading wrapper above it */
function seenOpacity(node: Element, upTo: Element) {
  let o = 1;
  for (let n: Element | null = node; n && n !== upTo.parentElement; n = n.parentElement) {
    o *= Number(getComputedStyle(n).opacity);
  }
  return o;
}

/** the point a sticker grows and shrinks around: its feet, or for a hanging
    light, the ceiling it hangs from */
function anchorOf(el: HTMLElement) {
  if (!el.style.transformOrigin) el.style.transformOrigin = "50% 100%";
  const r = el.getBoundingClientRect();
  const fromTop = el.style.transformOrigin.trim().endsWith(" 0%");
  return { x: r.left + r.width / 2, y: fromTop ? r.top : r.bottom };
}

const scaleOf = (el: HTMLElement) => parseFloat(getComputedStyle(el).scale) || 1;

interface Sized {
  el: HTMLElement;
  baseX: number;
  baseY: number;
  scale: number;
  anchor: { x: number; y: number };
}

interface Resize {
  el: HTMLElement;
  members: Sized[];
  pointer: number;
  anchor: { x: number; y: number };
  startDist: number;
}

export function Draggable() {
  const probe = useRef<HTMLSpanElement>(null);
  const handle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stage = probe.current?.closest<HTMLElement>(".palais-stage");
    const knob = handle.current;
    if (!stage || !knob) return;

    let grab: Grab | null = null;
    let resize: Resize | null = null;
    let front = 150;
    /** the sticker the size handle belongs to */
    let target: { el: HTMLElement; img: HTMLImageElement } | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let follow = 0;

    /** the visible sticker under a point, if any */
    const pick = (x: number, y: number) => {
      for (const node of document.elementsFromPoint(x, y)) {
        if (!(node instanceof HTMLImageElement)) continue;
        const el = node.closest<HTMLElement>("[data-prop]");
        if (!el || !stage.contains(el)) continue;
        if (seenOpacity(node, el) < 0.3) continue;
        if (alphaAt(node, x, y) < 40) continue;
        return { el, img: node };
      }
      return null;
    };

    /**
     * What moves together. For now that's always just the thing picked up:
     * furniture used to carry everything set down on it, which got in the way
     * of arranging the room piece by piece. To bring it back, return the
     * props sharing `el.dataset.set` when `el` is the furthest back of them.
     */
    const groupOf = (el: HTMLElement) => {
      layoutZ(el); // note where it sat before anything raises it
      return [el];
    };

    const raise = (group: HTMLElement[]) => {
      // to the front, keeping their order among themselves
      group.sort((a, b) => layoutZ(a) - layoutZ(b));
      for (const g of group) g.style.zIndex = String(++front);
    };

    /* ---- the size handle, pinned to the top-right corner of the picture ---- */
    const place = () => {
      follow = 0;
      if (!target) return;
      if (
        !target.el.isConnected ||
        getComputedStyle(target.img).visibility === "hidden" ||
        seenOpacity(target.img, target.el) < 0.3
      ) {
        hide(0);
        return;
      }
      const r = target.img.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      knob.style.left = `${(r.right - s.left).toFixed(1)}px`;
      knob.style.top = `${(r.top - s.top).toFixed(1)}px`;
      follow = requestAnimationFrame(place);
    };
    const show = (t: { el: HTMLElement; img: HTMLImageElement }) => {
      clearTimeout(hideTimer);
      if (target?.el !== t.el) target = t;
      knob.hidden = false;
      if (!follow) follow = requestAnimationFrame(place);
    };
    const hide = (delay = 500) => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (resize) return;
        target = null;
        knob.hidden = true;
        cancelAnimationFrame(follow);
        follow = 0;
      }, delay);
    };

    let hoverFrame = 0;
    const hover = (e: PointerEvent) => {
      if (grab || resize || e.pointerType !== "mouse") return;
      if (hoverFrame) return;
      const { clientX, clientY, target: over } = e;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        if (over instanceof Element && over.closest(".cat-backdrop")) {
          if (target) hide(0);
          return;
        }
        if (over instanceof Element && knob.contains(over)) {
          clearTimeout(hideTimer);
          return;
        }
        const hit = pick(clientX, clientY);
        if (hit) show(hit);
        else if (target) hide();
      });
    };

    /* ---- moving -------------------------------------------------------------- */
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || grab || resize) return;
      if ((e.target as Element).closest("button, a, input, label, .cat-backdrop")) return;
      const hit = pick(e.clientX, e.clientY);
      if (!hit) {
        if (e.pointerType !== "mouse") hide(0);
        return;
      }
      const group = groupOf(hit.el);
      raise(group);
      grab = {
        el: hit.el,
        carried: group.map((g) => ({ el: g, ...offset(g) })),
        pointer: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
      };
      hit.el.dataset.dragging = "";
      show(hit);
      stage.setPointerCapture(e.pointerId);
      // keep it from also selecting text, dragging the image natively, or
      // spinning the vanity chair
      e.preventDefault();
      e.stopPropagation();
    };

    const move = (e: PointerEvent) => {
      if (resize && e.pointerId === resize.pointer) {
        const dist = Math.hypot(e.clientX - resize.anchor.x, e.clientY - resize.anchor.y);
        const f0 = dist / resize.startDist;
        for (const m of resize.members) {
          const s = Math.min(4, Math.max(0.25, m.scale * f0));
          const f = s / m.scale;
          // things set down on the furniture stay where they were on it
          const x = m.baseX + (m.anchor.x - resize.anchor.x) * (f - 1);
          const y = m.baseY + (m.anchor.y - resize.anchor.y) * (f - 1);
          m.el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
          m.el.style.scale = s.toFixed(3);
          m.el.dataset.scale = String(s);
        }
        return;
      }
      if (!grab || e.pointerId !== grab.pointer) return;
      const dx = e.clientX - grab.startX;
      const dy = e.clientY - grab.startY;
      for (const c of grab.carried) {
        c.el.style.translate = `${(c.baseX + dx).toFixed(1)}px ${(c.baseY + dy).toFixed(1)}px`;
      }
    };

    const up = (e: PointerEvent) => {
      if (resize && e.pointerId === resize.pointer) {
        delete resize.el.dataset.dragging;
        resize = null;
        if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
        return;
      }
      if (!grab || e.pointerId !== grab.pointer) return;
      delete grab.el.dataset.dragging;
      if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      grab = null;
    };

    /* ---- resizing ------------------------------------------------------------ */
    const startResize = (e: PointerEvent) => {
      if (e.button !== 0 || !target) return;
      e.preventDefault();
      e.stopPropagation();
      const el = target.el;
      const group = groupOf(el);
      raise(group);
      const anchor = anchorOf(el);
      resize = {
        el,
        pointer: e.pointerId,
        anchor,
        startDist: Math.max(8, Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y)),
        members: group.map((g) => ({ el: g, ...offset(g), scale: scaleOf(g), anchor: anchorOf(g) })),
      };
      el.dataset.dragging = "";
      stage.setPointerCapture(e.pointerId);
    };

    knob.addEventListener("pointerdown", startResize);
    knob.addEventListener("pointerleave", () => !resize && hide());
    stage.addEventListener("pointerdown", down, true);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointermove", hover);
    stage.addEventListener("pointerleave", () => !resize && !grab && hide());
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    return () => {
      knob.removeEventListener("pointerdown", startResize);
      stage.removeEventListener("pointerdown", down, true);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointermove", hover);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
      cancelAnimationFrame(follow);
      cancelAnimationFrame(hoverFrame);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <span ref={probe} hidden />
      <button
        ref={handle}
        type="button"
        hidden
        className="palais-resize"
        aria-label="Drag to make it bigger or smaller"
        title="Drag to make it bigger or smaller"
      >
        <svg viewBox="0 0 16 16" aria-hidden>
          <path d="M9.5 2.5h4v4M13.5 2.5l-5 5M6.5 13.5h-4v-4M2.5 13.5l5-5" />
        </svg>
      </button>
    </>
  );
}
