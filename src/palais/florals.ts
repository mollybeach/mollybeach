import { useEffect, useState } from "react";

/**
 * Molly's floral patterns, and the slow turn through them.
 *
 * The site wears a pattern in three places: the footer of the Palais, the head
 * of the catalogue, and the sidebar. Each one shows a different pattern at any
 * moment and they all move along together every so often, so the site is never
 * wearing the same thing twice and never the same thing for long.
 *
 * The turn is worked out from the clock rather than kept in a variable, so two
 * tabs open side by side stay in step, and coming back to the page never shows
 * a stale one.
 */

export const FLORALS = [
  "teal",
  "pink",
  "black-gold",
  "green",
  "maroon",
  "purple",
  "orange",
  "yellow",
  "cream",
  "red-toile",
] as const;

export type Floral = (typeof FLORALS)[number];

export const floralSrc = (key: Floral) => `${process.env.PUBLIC_URL}/palais/florals/${key}.webp`;

/**
 * What each pattern lends to the rest of the furniture: a jewel colour picked
 * out of its flowers, an ink dark enough to write with, and the gold of its
 * rim. The gilt frame round the sidebar and the divider beside it wear these,
 * so the gold work belongs to whichever pattern is up.
 */
export interface Palette {
  jewel: string;
  ink: string;
  gold: string;
}

export const PALETTES: Record<Floral, Palette> = {
  teal: { jewel: "#1a8f8a", ink: "#0a5a60", gold: "#e8c774" },
  pink: { jewel: "#c43b6e", ink: "#7a1748", gold: "#f0d79a" },
  "black-gold": { jewel: "#d8b55c", ink: "#12100c", gold: "#f0d894" },
  green: { jewel: "#2f7a3d", ink: "#1d3d1c", gold: "#e8c774" },
  maroon: { jewel: "#a8244f", ink: "#4a0f2c", gold: "#f0d79a" },
  purple: { jewel: "#6a4bb0", ink: "#2f1d5e", gold: "#e8c774" },
  orange: { jewel: "#d2651b", ink: "#7a3405", gold: "#ffe1a3" },
  yellow: { jewel: "#c9a227", ink: "#6b5406", gold: "#e8c774" },
  cream: { jewel: "#c0392b", ink: "#4a4030", gold: "#c9a44c" },
  "red-toile": { jewel: "#8f1420", ink: "#5c0f16", gold: "#c9a44c" },
};

export const paletteOf = (key: Floral) => PALETTES[key];

/** a place that wears one, and how far along the list it starts: spacing them
    out means the three are never wearing the same pattern at once */
const PLACES = { footer: 0, map: 2, catalogue: 3, card: 4, panel: 5, sidebar: 6, admin: 8 } as const;
export type FloralPlace = keyof typeof PLACES;

/** how long each pattern stays on */
const EVERY = 22_500;

const at = (place: FloralPlace, when: number) => FLORALS[(Math.floor(when / EVERY) + PLACES[place]) % FLORALS.length];

/**
 * The pattern this place is wearing, and the one it's just come off, so it can
 * be faded out underneath. `was` goes back to null once the fade is over.
 */
export function useFloral(place: FloralPlace) {
  const [now, setNow] = useState<Floral>(() => at(place, Date.now()));
  const [was, setWas] = useState<Floral | null>(null);

  useEffect(() => {
    let fade: ReturnType<typeof setTimeout> | undefined;
    let waiting: Floral | null = null;
    let live = true;

    /* the new pattern only goes on once its picture has arrived: showing it
       before then leaves a bare moment with nothing behind the flowers */
    const wear = (next: Floral) => {
      if (waiting === next) return;
      waiting = next;
      const picture = new Image();
      const on = () => {
        if (!live || waiting !== next) return;
        setNow((old) => {
          if (old === next) return old;
          setWas(old);
          clearTimeout(fade);
          fade = setTimeout(() => live && setWas(null), 2000);
          return next;
        });
      };
      picture.onload = on;
      picture.onerror = on;
      picture.src = floralSrc(next);
      if (picture.complete) on();
    };

    const tick = () => {
      const next = at(place, Date.now());
      setNow((old) => {
        if (old !== next) wear(next);
        return old;
      });
    };
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      live = false;
      clearInterval(timer);
      clearTimeout(fade);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [place]);

  return { now, was };
}
