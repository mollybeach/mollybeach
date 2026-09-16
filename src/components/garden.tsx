// path: src/components/garden.tsx
import React from 'react';
import { paletteOf, useFloral } from '../palais/florals';

/**
 * The dressing the portfolio pages share, the way the Skills page wears it: a
 * flower and a colour for each section, a rule that fades out across the page,
 * a count at the end, and tags tinted to match.
 *
 * The flowers are Molly's own, cut from her sheet (public/palais/blooms).
 * Sections take their colour by position, so a page of eight reads as a border
 * of eight different plants rather than eight of the same.
 */

export interface Shelf {
  /** the writing */
  ink: string;
  /** the fill behind a tag */
  tint: string;
  /** the rim of a tag, and the rule beside the heading */
  edge: string;
  /** which flower stands beside the heading */
  bloom: string;
}

export const SHELVES: Shelf[] = [
  { ink: '#0a5a60', tint: '#e6f4f2', edge: '#7fbfba', bloom: 'lily-pink' },
  { ink: '#7a1748', tint: '#fdeaf1', edge: '#e79ab8', bloom: 'violet-pink' },
  { ink: '#2f1d5e', tint: '#eeeafb', edge: '#a795e0', bloom: 'violet-purple' },
  { ink: '#1d3d1c', tint: '#e9f3e4', edge: '#8fbd84', bloom: 'leaf-sprig' },
  { ink: '#7a3405', tint: '#fdeee0', edge: '#e8ab73', bloom: 'daisy-yellow' },
  { ink: '#4a0f2c', tint: '#fbe9ef', edge: '#d792ac', bloom: 'tulip-bud-pink' },
  { ink: '#6b5406', tint: '#fbf3d9', edge: '#d9bf63', bloom: 'daisy-cream' },
  { ink: '#12466b', tint: '#e7f0fa', edge: '#8ab4d8', bloom: 'cornflower-blue' },
];

export const shelfAt = (i: number) => SHELVES[i % SHELVES.length];

export const bloomSrc = (name: string) => `${process.env.PUBLIC_URL}/palais/blooms/${name}.webp`;

/** a section heading: the flower, the name, a rule that fades, and a count */
export function GardenHeading({
  shelf,
  children,
  count,
  note,
  as = 'h3',
  size = 'text-xl',
}: {
  shelf: Shelf;
  children: React.ReactNode;
  count?: number | string;
  note?: React.ReactNode;
  as?: 'h2' | 'h3' | 'h4';
  size?: string;
}) {
  const Tag = as;
  return (
    <div className="space-y-0.5">
      <Tag className={`flex items-center gap-2 ${size} font-medium`} style={{ color: shelf.ink }}>
        <img src={bloomSrc(shelf.bloom)} alt="" aria-hidden className="h-6 w-6 shrink-0 object-contain" />
        <span className="min-w-0">{children}</span>
        <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${shelf.edge}, transparent)` }} />
        {count !== undefined && <span className="shrink-0 text-xs font-normal opacity-70">{count}</span>}
      </Tag>
      {note && <p className="pl-8 text-sm opacity-70" style={{ color: shelf.ink }}>{note}</p>}
    </div>
  );
}

/** a tag, tinted to its section, with a bud on the front */
export function GardenTag({ shelf, children }: { shelf: Shelf; children: React.ReactNode }) {
  return (
    <span
      className="skill-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
      style={{ background: shelf.tint, border: `1.5px solid ${shelf.edge}`, color: shelf.ink }}
    >
      <span aria-hidden className="skill-pill__dot" style={{ background: shelf.edge }} />
      {children}
    </span>
  );
}

/** the bullets in a card, with the section's own colour for the marks */
export function GardenList({ shelf, items, small = false }: { shelf: Shelf; items: string[]; small?: boolean }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-2 ${small ? 'text-sm' : ''}`}>
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: shelf.edge }} />
          <span className="text-gray-700">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---- the page title, dressed like the ribbon over the map ---------------- */

/** a small posy for the side of a title: a few flowers laid over each other */
const TITLE_POSY: { name: string; x: number; y: number; w: number; rot?: number }[] = [
  { name: 'leaf-sprig', x: 2, y: 40, w: 48, rot: -18 },
  { name: 'violet-pink', x: 20, y: 8, w: 46, rot: 12 },
  { name: 'cornflower-blue', x: 54, y: 40, w: 34, rot: -10 },
  { name: 'daisy-yellow', x: 52, y: 2, w: 38, rot: 20 },
];

function Posy({ flip = false }: { flip?: boolean }) {
  return (
    <span aria-hidden className="page-ribbon__posy" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      {TITLE_POSY.map((p, i) => (
        <img
          key={i}
          src={bloomSrc(p.name)}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, rotate: `${p.rot ?? 0}deg` }}
        />
      ))}
    </span>
  );
}

/**
 * The title at the top of a page: the same plaque as the map's, filled with the
 * stone of whichever floral the Palais footer is wearing, with a posy tucked
 * behind each end.
 */
export function PageTitle({ children }: { children: React.ReactNode }) {
  const jewel = paletteOf(useFloral('footer').now).jewel;
  return (
    <div className="page-ribbon">
      <Posy />
      <h2 style={{ backgroundColor: jewel }}>
        <span aria-hidden>✿</span> {children} <span aria-hidden>✿</span>
      </h2>
      <Posy flip />
    </div>
  );
}
