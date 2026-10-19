/**
 * Where things are in the Brat Academy photographs, as a fraction of each one:
 * the chalkboard (SchoolSyllabus.tsx), the iBook on the teacher's desk
 * (LibraryImac.tsx), the bare patch of board under "and more…" where
 * Professor Beach Babe signs it, where she stands, by the lamp at the left
 * end of the desk, the apple on the desk that calls her in, and the middle
 * of the desk front, where the syllabus badge hangs. The four wide photographs share one layout; each tall
 * one for a phone was painted on its own, so each has its own.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const box = (x0: number, y0: number, x1: number, y1: number): Box => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });

const SPOTS: Record<string, { board: Box; ibook: Box; sig: Box; prof: Box; apple: Box; badge: Box }> = {
  wide: { board: box(0.57, 0.235, 0.848, 0.585), ibook: box(0.624, 0.552, 0.677, 0.612), sig: box(0.7, 0.517, 0.8, 0.543), prof: box(0.5052, 0.5150, 0.5948, 0.7950), apple: box(0.5972, 0.5830, 0.6128, 0.6130), badge: box(0.745, 0.645, 0.745, 0.645) },
  "portrait-spring": { board: box(0.553, 0.251, 0.859, 0.478), ibook: box(0.604, 0.478, 0.683, 0.51), sig: box(0.632, 0.444, 0.836, 0.466), prof: box(0.4842, 0.4900, 0.6358, 0.6400), apple: box(0.5702, 0.4920, 0.5998, 0.5100), badge: box(0.74, 0.535, 0.74, 0.535) },
  "portrait-summer": { board: box(0.614, 0.304, 0.995, 0.518), ibook: box(0.624, 0.518, 0.718, 0.556), sig: box(0.69, 0.49, 0.894, 0.51), prof: box(0.5092, 0.5400, 0.6608, 0.6900), apple: box(0.5852, 0.5380, 0.6148, 0.5560), badge: box(0.79, 0.585, 0.79, 0.585) },
  "portrait-autumn": { board: box(0.547, 0.29, 0.855, 0.547), ibook: box(0.707, 0.553, 0.789, 0.586), sig: box(0.641, 0.507, 0.836, 0.53), prof: box(0.4942, 0.5400, 0.6458, 0.6900), apple: box(0.6652, 0.5670, 0.6948, 0.5850), badge: box(0.79, 0.615, 0.79, 0.615) },
  "portrait-winter": { board: box(0.614, 0.304, 0.995, 0.518), ibook: box(0.624, 0.518, 0.718, 0.556), sig: box(0.69, 0.49, 0.894, 0.51), prof: box(0.5092, 0.5400, 0.6608, 0.6900), apple: box(0.5852, 0.5380, 0.6148, 0.5560), badge: box(0.79, 0.585, 0.79, 0.585) },
};

/** where the chalkboard or the iBook is in whichever photograph is showing */
export function schoolSpot(img: HTMLImageElement, what: "board" | "ibook" | "sig" | "prof" | "apple" | "badge"): Box {
  const tall = /school-portrait-(\w+)\.webp$/.exec(img.src);
  return (SPOTS[tall ? `portrait-${tall[1]}` : "wide"] ?? SPOTS.wide)[what];
}

/** lay a button over a spot, trimmed to what's on screen: a button hanging
    off the edge gets scrolled into view when it's clicked, and drags the
    whole room sideways with it */
export function placeOver(el: HTMLElement, box: { left: number; top: number; w: number; h: number }, spot: Box, stage: HTMLElement) {
  const x0 = Math.max(0, box.left + box.w * spot.x);
  const y0 = Math.max(0, box.top + box.h * spot.y);
  const x1 = Math.min(stage.clientWidth, box.left + box.w * (spot.x + spot.w));
  const y1 = Math.min(stage.clientHeight, box.top + box.h * (spot.y + spot.h));
  el.style.left = `${x0}px`;
  el.style.top = `${y0}px`;
  el.style.width = `${Math.max(0, x1 - x0)}px`;
  el.style.height = `${Math.max(0, y1 - y0)}px`;
}
