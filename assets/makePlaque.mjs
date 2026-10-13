/**
 * Draws the Palais plaque as a standalone SVG, the way the portfolio's page
 * titles wear it (index.css .page-ribbon): a rounded plaque filled with the
 * floral's own stone, a gold rim inside a cream one, a posy tucked behind each
 * end, and the writing in cream with a shadow under it.
 *
 * The colours walk through the ten patterns on a timer, so the picture keeps
 * changing on the profile the way the site does.
 */
import { readFileSync, writeFileSync } from "node:fs";

const BLOOMS = "/Users/beachmolly/Documents/git/portfolio/public/palais/blooms";
const b64 = (name) =>
  "data:image/webp;base64," + readFileSync(`${BLOOMS}/${name}.webp`).toString("base64");

/* the ten patterns' stones, from palais/florals.ts */
const PALETTES = [
  { jewel: "#1a8f8a", gold: "#e8c774" }, // teal
  { jewel: "#c43b6e", gold: "#f0d79a" }, // pink
  { jewel: "#d8b55c", gold: "#f0d894" }, // black-gold
  { jewel: "#2f7a3d", gold: "#e8c774" }, // green
  { jewel: "#a8244f", gold: "#f0d79a" }, // maroon
  { jewel: "#6a4bb0", gold: "#e8c774" }, // purple
  { jewel: "#d2651b", gold: "#ffe1a3" }, // orange
  { jewel: "#c9a227", gold: "#e8c774" }, // yellow
  { jewel: "#c0392b", gold: "#c9a44c" }, // cream
  { jewel: "#8f1420", gold: "#c9a44c" }, // red toile
];
const EVERY = 3; // seconds on each one
const CYCLE = PALETTES.length * EVERY;
const ring = (k) => [...PALETTES.map((p) => p[k]), PALETTES[0][k]].join(";");
const turn = (k) =>
  `<animate attributeName="${k === "jewel" ? "fill" : "stroke"}" values="${ring(k)}" dur="${CYCLE}s" repeatCount="indefinite"/>`;

const FONT = "'Roboto Mono','SF Mono',SFMono-Regular,ui-monospace,Menlo,monospace";
const CREAM = "#fffaf0";

/* the posy at the end of a title, from components/garden.tsx */
const POSY = [
  { name: "leaf-sprig", x: 2, y: 40, w: 48, rot: -18 },
  { name: "violet-pink", x: 20, y: 8, w: 46, rot: 12 },
  { name: "cornflower-blue", x: 54, y: 40, w: 34, rot: -10 },
  { name: "daisy-yellow", x: 52, y: 2, w: 38, rot: 20 },
];
const posy = (box) =>
  POSY.map((p) => {
    const w = (p.w / 100) * box;
    const x = (p.x / 100) * box;
    const y = (p.y / 100) * box;
    return `<g transform="translate(${(x + w / 2).toFixed(1)} ${(y + w / 2).toFixed(1)}) rotate(${p.rot})"><image x="${(-w / 2).toFixed(1)}" y="${(-w / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}" href="${b64(p.name)}"/></g>`;
  }).join("\n      ");

/**
 * @param lines  one or two lines of writing for the plaque
 * @param w      how wide the whole picture is
 */
function plaque({ lines, w = 360, h = 96, label }) {
  const box = 66; // the posy's square
  const pad = 30; // how far the plaque sits in from the ends
  const px = pad, py = 18, pw = w - pad * 2, ph = h - 36, r = ph / 2;
  const mid = w / 2;
  const writing =
    lines.length === 1
      ? `<text x="${mid}" y="${py + ph / 2 + 7}" text-anchor="middle" font-family="${FONT}" font-size="21" font-weight="700" fill="${CREAM}" filter="url(#under)">${lines[0]}</text>`
      : `<text x="${mid}" y="${py + ph / 2 - 2}" text-anchor="middle" font-family="${FONT}" font-size="19" font-weight="700" fill="${CREAM}" filter="url(#under)">${lines[0]}</text>
    <text x="${mid}" y="${py + ph / 2 + 16}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="600" letter-spacing="1.4" fill="${CREAM}" fill-opacity=".92">${lines[1]}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
  <defs>
    <filter id="under" x="-20%" y="-60%" width="140%" height="260%">
      <feDropShadow dx="0" dy="2" stdDeviation="0" flood-color="#281e0e" flood-opacity=".35"/>
    </filter>
    <filter id="lift" x="-30%" y="-60%" width="160%" height="260%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#46320a" flood-opacity=".3"/>
    </filter>
    <g id="posy">
      ${posy(box)}
    </g>
  </defs>

  <!-- the plaque: the floral's own stone, a gold rim inside a cream one -->
  <g filter="url(#lift)">
    <rect x="${px - 5.5}" y="${py - 5.5}" width="${pw + 11}" height="${ph + 11}" rx="${r + 5.5}" fill="none" stroke="#cfa956" stroke-opacity=".8" stroke-width="1.5">${turn("gold")}</rect>
    <rect x="${px - 4}" y="${py - 4}" width="${pw + 8}" height="${ph + 8}" rx="${r + 4}" fill="none" stroke="${CREAM}" stroke-width="4"/>
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${r}" fill="${PALETTES[0].jewel}">${turn("jewel")}</rect>
    <rect x="${px + 1.5}" y="${py + 1.5}" width="${pw - 3}" height="${ph - 3}" rx="${r - 1.5}" fill="none" stroke="#cfa956" stroke-width="3">${turn("gold")}</rect>
    <rect x="${px + 4.5}" y="${py + 4.5}" width="${pw - 9}" height="${ph - 9}" rx="${r - 4.5}" fill="none" stroke="${CREAM}" stroke-opacity=".5" stroke-width="3"/>
  </g>

  <!-- a posy tucked behind each end -->
  <use xlink:href="#posy" x="0" y="${(h - box) / 2}"/>
  <g transform="translate(${w} 0) scale(-1 1)"><use xlink:href="#posy" x="0" y="${(h - box) / 2}"/></g>

  ${writing}
</svg>`;
}

const out = process.argv[2];
writeFileSync(
  `${out}/visitSite.svg`,
  plaque({
    lines: ["✿ mollybeach.app ✿", "PORTFOLIO &amp; THE PALAIS"],
    label: "Visit mollybeach.app — portfolio and the Palais",
  }),
);
console.log("wrote visitSite.svg");
