import { createContext } from "react";
import type { Styled } from "./styled";
import type { Season } from "./seasons";
import springLayout from "./layouts/spring.json";
import summerLayout from "./layouts/summer.json";
import autumnLayout from "./layouts/autumn.json";
import winterLayout from "./layouts/winter.json";

/**
 * The room as Molly arranged it by hand.
 *
 * She dragged and resized everything into place on the live page, and these
 * are the moves she made, read back off it: how far each sticker was pulled
 * from where the layout in PalaisHome puts it, how much it was scaled, and
 * which way round things overlap.
 *
 * The offsets were measured in pixels on a stage 2766 × 1654 pixels wide, and
 * are turned into fractions of the stage here, so the arrangement holds at any
 * size. Only the desktop room uses it (see `ArrangedRoom`); the phone room has
 * its own layout.
 */

const STAGE_W = 2766;
const STAGE_H = 1654;

interface Move {
  /** pulled across and down, in pixels on the measuring stage */
  x: number;
  y: number;
  /** grown or shrunk from its feet */
  s?: number;
  /** stacking order */
  z: number;
}

export const ARRANGEMENT: Record<string, Move> = {
  /* on the walls and ceiling */
  "wisteria-branch-purple": { x: 0, y: 0, z: 161 },
  "panel-four-seasons": { x: 735.8, y: -31.9, s: 0.798, z: 423 },
  "cherub-gilded": { x: 1173.8, y: -180.9, s: 0.91, z: 780 },
  "relief-gold-frame": { x: 24.3, y: -14.5, z: 408 },
  "mirror-glass-floral": { x: 88.7, y: 131.3, s: 0.712, z: 426 },
  "mirror-glass-blue": { x: -1810.3, y: -124.9, s: 1.215, z: 735 },
  "mirror-glass-tulip": { x: 1192.3, y: -113.7, z: 742 },
  "medallion-lady": { x: -18.8, y: 243.6, z: 736 },
  "cameo-jasperware": { x: -550.6, y: -269.1, z: 764 },
  "plaque-lyre": { x: 702.4, y: -499.9, z: 734 },
  "plaque-ivory": { x: -324.7, y: -319, s: 1.922, z: 405 },
  "plaque-rose-wood": { x: -88.5, y: -177.1, s: 1.696, z: 406 },
  "plaque-wood-dark": { x: 372.3, y: 180.7, s: 1.694, z: 407 },

  /* the garden and the house plants */
  "trellis-wisteria": { x: 119.6, y: 4.4, s: 0.614, z: 271 },
  "trellis-ivy": { x: 721.3, y: 39.8, z: 192 },
  "fiddle-leaf-fig": { x: 835.2, y: -41, s: 0.794, z: 385 },
  dracaena: { x: -1490.5, y: -53.1, s: 0.658, z: 352 },
  "monstera-crystal": { x: -304.8, y: -122.7, s: 1.172, z: 441 },

  /* furniture */
  "bed-iron": { x: -75.3, y: 350.1, z: 365 },
  dresser: { x: -427.9, y: -118.4, s: 0.685, z: 272 },
  loveseat: { x: 342.8, y: 162.8, s: 0.918, z: 380 },
  "armchair-sage": { x: -606.7, y: 131.5, s: 1.197, z: 379 },
  "cabinet-jewelry": { x: 63.6, y: 209.5, s: 1.188, z: 387 },
  vanity: { x: 31.7, y: -79.9, s: 1.042, z: 590 },
  "chair-vanity": { x: -513.4, y: -75.3, s: 1.68, z: 664 },

  /* trinkets */
  "planter-greek-head": { x: 1384, y: 796.6, s: 1.319, z: 781 },
  "perfume-daisy": { x: 808.1, y: 116.3, s: 1.283, z: 552 },
  "plate-blue-gold": { x: 965.1, y: 372.5, s: 1.456, z: 688 },
  "purse-porcelain": { x: 1240.7, y: 337.8, z: 681 },
  "urn-glass": { x: 62.8, y: -275.2, z: 467 },
  "lamp-porcelain": { x: -497.1, y: 93.7, s: 1.484, z: 695 },
  "perfume-cloud": { x: 943.6, y: 367.8, s: 1.269, z: 710 },
  "tissue-holder": { x: 1253, y: 321.9, s: 1.815, z: 680 },
  "mirror-hand": { x: 1028, y: 617, z: 690 },
  "flask-horseshoe": { x: 845.5, y: 334.6, s: 1.036, z: 709 },
  "candles-bottles": { x: 1828.3, y: -346.2, s: 1.612, z: 593 },
  "tea-caddy": { x: -1129.2, y: -50.7, s: 1.944, z: 792 },
  "candle-pillar": { x: -1569.4, y: -352.5, s: 1.409, z: 726 },
  "perfume-flora": { x: 324.8, y: -67.6, s: 1.345, z: 712 },
  "music-box-egg": { x: 57, y: -84.7, s: 2.095, z: 701 },
  "candle-cherub": { x: -1229.5, y: -182.6, s: 1.647, z: 721 },
  "candle-rose-portrait": { x: -1190.4, y: -352.9, s: 2.024, z: 694 },
  "egg-cobalt": { x: -1217.4, y: -348.3, s: 1.704, z: 730 },
  "mirror-tabletop": { x: -2056.1, y: -147.4, z: 791 },
  "perfume-collection": { x: 5.4, y: -81, z: 708 },
  "perfume-butterfly": { x: -12.6, y: -90.6, z: 682 },
  brushes: { x: -43.4, y: -110.5, s: 1.304, z: 599 },
  "trinket-box": { x: 343.9, y: -84, s: 1.363, z: 683 },

  /* cats */
  "cats-birthday": { x: 843.8, y: -103.3, s: 1.555, z: 754 },
  "cat-blueberry-running": { x: -148.7, y: -244, z: 763 },
  "honeysuckle-tricycle": { x: 1062.7, y: -62.2, s: 1.427, z: 783 },
  "cats-toilet": { x: 1577.6, y: 3.6, s: 1.974, z: 750 },
  "honeysuckle-clock": { x: -862.9, y: -1049, z: 487 },
  "cat-strawberry-roses": { x: 596.2, y: -489.7, s: 1.22, z: 595 },
  "honeysuckle-sewing": { x: -382.7, y: -308.5, z: 499 },
  "cats-roses": { x: -1572, y: -1117.4, z: 767 },
  "cat-strawberry": { x: -3, y: 27.6, z: 613 },
  "honeysuckle-bow-alt": { x: -440.9, y: -99.1, z: 762 },
  "kitten-strawberry": { x: -833.5, y: -249.9, z: 760 },
  "cat-blueberry-sitting": { x: -654.3, y: -126.4, z: 667 },
  "honeysuckle-bow": { x: 48.1, y: -1478.3, s: 0.629, z: 787 },
  "cat-honeysuckle": { x: -73.4, y: -8.4, z: 777 },
  "kittens-christmas": { x: -1799.5, y: -1402, s: 0.702, z: 779 },
  "cat-strawberry-window": { x: -2285.7, y: -784.9, z: 625 },
  "cat-blueberry-party": { x: -370.6, y: -279.3, s: 1.125, z: 795 },
  "cat-blueberry-monstera": { x: -220.3, y: -766.3, z: 738 },
};

/* ---- a layout per season -------------------------------------------------

   Molly arranges a season on the live page and saves it to the collection
   from the catalogue (layoutsDb.ts), or copies it ("Copy layout") to paste
   into layouts/<season>.json here. A season's default in the collection wins;
   then the file here; a season with neither uses the arrangement above. A
   layout says, for every sticker, whether it's shown, where it's been moved to
   (in pixels on the stage it was made on, which it records), its size and its
   stacking order. */

export interface SeasonLayout {
  /** `portable`: saved on the other device, with where each sticker should land (crossDevice.ts) */
  stage: { w: number; h: number; portable?: boolean };
  season?: string;
  props: Record<string, { shown: boolean; x: number; y: number; s: number; z: number; at?: { cx: number; b: number; w: number } }>;
}

/** the layouts that ship with the code */
export const BUNDLED_LAYOUTS: Partial<Record<Season, SeasonLayout>> = {
  // spring, summer and winter start as copies of autumn, to be rearranged
  spring: springLayout as SeasonLayout,
  summer: summerLayout as SeasonLayout,
  autumn: autumnLayout as SeasonLayout,
  winter: winterLayout as SeasonLayout,
};

/** true inside the desktop room, where the arrangement applies */
export const ArrangedRoom = createContext(false);
/** the layout the room is dressed in right now; none means the one above */
export const LayoutNow = createContext<SeasonLayout | undefined>(undefined);
/** true inside the phone room (PortraitTerrace.tsx), which has its own layouts */
export const InPhoneRoom = createContext(false);
/** the phone room's layout right now (phoneLayout.ts) */
export const PhoneLayoutNow = createContext<SeasonLayout | undefined>(undefined);

function move(x: number, y: number, s: number | undefined, z: number, w: number, h: number): Styled {
  const style: Styled = { zIndex: z };
  if (x || y) style.translate = `${((x / w) * 100).toFixed(3)}cqw ${((y / h) * 100).toFixed(3)}cqh`;
  if (s !== undefined && s !== 1) {
    style.scale = String(s); // a string: React would add "px" to a bare number
    style.transformOrigin = "50% 100%";
  }
  return style;
}

/** the style that puts one sticker where this layout (or the arrangement
    above) puts it */
export function arranged(id: string, layout?: SeasonLayout): Styled | undefined {
  if (layout) {
    const m = layout.props[id];
    return m ? move(m.x, m.y, m.s, m.z, layout.stage.w, layout.stage.h) : undefined;
  }
  const m = ARRANGEMENT[id];
  return m ? move(m.x, m.y, m.s, m.z, STAGE_W, STAGE_H) : undefined;
}

/** which stickers a layout leaves out of the room */
export function hiddenOf(layout: SeasonLayout): string[] {
  return Object.entries(layout.props)
    .filter(([, m]) => !m.shown)
    .map(([id]) => id);
}

/**
 * Put every sticker exactly where the layout says, undoing any dragging.
 *
 * React only writes a style when its own value changes, so a sticker that was
 * dragged, in a layout that doesn't move it, would stay where it was dragged.
 * This writes them all.
 */
export function settle(scope: ParentNode, layout?: SeasonLayout, phoneLayout?: SeasonLayout) {
  scope.querySelectorAll<HTMLElement>(".palais-layer [data-prop]").forEach((el) => {
    // the phone room has its own layouts (phoneLayout.ts)
    const phone = !!el.closest(".palais-frame");
    if (phone && !phoneLayout) return;
    const style = arranged(el.dataset.prop!, phone ? phoneLayout : layout);
    el.style.translate = style?.translate ? String(style.translate) : "";
    el.style.scale = style?.scale ? String(style.scale) : "";
    if (style?.scale && !el.style.transformOrigin) el.style.transformOrigin = "50% 100%";
    if (style?.zIndex !== undefined) el.style.zIndex = String(style.zIndex);
    else if (el.dataset.z0 !== undefined) el.style.zIndex = el.dataset.z0; // as it was before any dragging
  });
}

/** the room as it is right now, in the same form as a saved layout. The
    closet's clothes (Wardrobe.tsx) are measured on their photograph's frame. */
export function capture(
  stage: HTMLElement,
  hidden: Set<string>,
  scope: "room" | "closet" = "room",
): SeasonLayout & { layout: "desktop" | "phone" | "closet-wide" | "closet-tall" } {
  const closet = scope === "closet";
  // a phone layout is measured on the photograph's frame, so it holds on any phone;
  // a computer one on the stickers' own box (sceneFit.ts), unscaled
  const frame = stage.querySelector<HTMLElement>(closet ? ".palais-closet-frame" : ".palais-layer .palais-frame");
  const scene = closet || frame ? null : stage.querySelector<HTMLElement>(".palais-layer .palais-scene");
  const r = scene ? { width: scene.offsetWidth, height: scene.offsetHeight } : (frame ?? stage).getBoundingClientRect();
  const props: SeasonLayout["props"] = {};
  stage.querySelectorAll<HTMLElement>(closet ? ".palais-closet [data-prop]" : ".palais-layer [data-prop]").forEach((el) => {
    const cs = getComputedStyle(el);
    const [x = "0", y = "0"] = cs.translate === "none" ? [] : cs.translate.split(" ");
    props[el.dataset.prop!] = {
      shown: !hidden.has(el.dataset.prop!),
      x: Math.round((parseFloat(x) || 0) * 10) / 10,
      y: Math.round((parseFloat(y) || 0) * 10) / 10,
      s: Math.round((parseFloat(cs.scale) || 1) * 1000) / 1000,
      z: Number(cs.zIndex) || 0,
    };
  });
  return {
    stage: { w: Math.round(r.width), h: Math.round(r.height) },
    layout: closet
      ? frame?.classList.contains("palais-closet-frame--tall")
        ? "closet-tall"
        : "closet-wide"
      : stage.querySelector(".palais-layer .palais-frame")
        ? "phone"
        : "desktop",
    season: stage.querySelector<HTMLElement>(".palais-arrive")?.dataset.season ?? "spring",
    props,
  };
}
