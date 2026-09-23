import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CLOTHES, closetSrc, garment, type ClothesKind } from "./clothes";

/**
 * The dress form: an outfit, made up a slot at a time.
 *
 * A modal over the Wardrobe Wing, the way the jewellery box is (JewelryBox).
 * It works like the wardrobe in Clueless: a row for each thing you can wear,
 * and arrows to walk through everything in the closet of that kind. A dress
 * or a gown is one piece for two rows, so choosing one takes over the skirt
 * row and leaves it empty until you put her in a shirt again.
 *
 * A piece can still be dragged about on her and sized, because a photograph
 * of a dress never sits on a mannequin quite right first time.
 *
 * The outfit is kept in this browser, so it is still on her tomorrow. Nothing
 * here is saved to the database and nothing here touches the closet itself.
 */

const MANNEQUIN = `${process.env.PUBLIC_URL}/palais/mannequin.webp`;
/** the leopard the whole wardrobe is papered in, as it is in the film */
const PAPER = `url("${process.env.PUBLIC_URL}/palais/clueless-cheetah.webp")`;
/** the film's own buttons, worn by every arrow in here */
const BACK = `url("${process.env.PUBLIC_URL}/palais/clueless_left_arrow.png")`;
const ON = `url("${process.env.PUBLIC_URL}/palais/clueless_right_arrow.png")`;
const KEPT = "palais-dress-form";

/** the rows, down the modal in the order she drew them, each with its stripe:
    a rainbow from hot pink at the top, laid over the leopard at low opacity.
 *
 * There are two pages of them, and the switch in the corner turns from one to
 * the other. The second page is the same seven bands of the body — head,
 * throat, chest, over it, hands, waist, feet — holding the smaller things, so
 * a row is always across from the part of her it belongs to. The stripes never
 * move: only what is offered on them.
 *
 * Both pages dress the SAME figure. Turning the switch takes nothing off. */
const CLOTHES_PAGE = [
  { key: "hat", label: "Hat", emoji: "👒", kinds: ["hat"], band: "255, 45, 190" },
  { key: "glasses", label: "Glasses", brief: "Specs", emoji: "🕶️", kinds: ["glasses"], band: "244, 40, 40" },
  { key: "top", label: "Shirt", emoji: "👚", kinds: ["top", "dress", "swim"], band: "255, 138, 0" },
  { key: "coat", label: "Coat", emoji: "🧥", kinds: ["coat"], band: "250, 214, 0" },
  { key: "bag", label: "Bag", emoji: "👜", kinds: ["bag"], band: "0, 205, 70" },
  { key: "bottom", label: "Pants / Skirt", brief: "Pants", emoji: "🩳", kinds: ["bottom"], band: "45, 90, 230" },
  { key: "shoes", label: "Shoes", emoji: "👠", kinds: ["shoes"], band: "150, 50, 220" },
] as const;

const EXTRAS_PAGE = [
  { key: "bow", label: "Bows", emoji: "🎀", kinds: ["bow"], band: "255, 45, 190" },
  { key: "neck", label: "Neck", emoji: "🧣", kinds: ["neck"], band: "244, 40, 40" },
  { key: "wings", label: "Wings", emoji: "✨", kinds: ["accessory"], band: "255, 138, 0" },
  { key: "cardigan", label: "Cardigan", brief: "Cardi", emoji: "🥼", kinds: ["cardigan"], band: "250, 214, 0" },
  { key: "glove", label: "Gloves", emoji: "🧤", kinds: ["glove"], band: "0, 205, 70" },
  { key: "belt", label: "Belts", emoji: "🪢", kinds: ["belt"], band: "45, 90, 230" },
  { key: "sock", label: "Socks", emoji: "🧦", kinds: ["sock"], band: "150, 50, 220" },
] as const;

const PAGES = [CLOTHES_PAGE, EXTRAS_PAGE] as const;
/** every row of both pages: what she is wearing is the whole of them */
const SLOTS = [...CLOTHES_PAGE, ...EXTRAS_PAGE];

type SlotKey = (typeof CLOTHES_PAGE)[number]["key"] | (typeof EXTRAS_PAGE)[number]["key"];

/** a dress is one piece for two rows: it takes the skirt row with it.
    Gowns and robes are not offered here — they are their own occasion. */
const HEAD_TO_TOE: ClothesKind[] = ["dress"];

/**
 * Where a piece hangs on her and how much room it gets — both as fractions of
 * her height, measured off THIS figure: crown 0.02, chin 0.12, shoulders 0.19,
 * waist 0.38, hip 0.45, knee 0.67, ankle 0.94, sole 1.0. Everything of a kind
 * gets the SAME box and is fitted inside it, so one shirt is never twice the
 * size of another just because it was photographed closer.
 */
const FIT: Record<ClothesKind, { top: number; w: number; h: number; side?: number }> = {
  bow: { top: 0.0, w: 0.22, h: 0.1 },                // in her hair, over a hat
  hat: { top: 0.0, w: 0.3, h: 0.14 },
  // on her face, not her collarbone: her eyes are at 0.075 of her height and
  // a pair of sunglasses is a little wider than her head
  glasses: { top: 0.055, w: 0.14, h: 0.06 },
  // tall enough for a scarf to hang to the hip. A collar is wider than it is
  // deep, so it still lands on the width and sits up under the chin.
  neck: { top: 0.13, w: 0.22, h: 0.34 },
  accessory: { top: 0.16, w: 0.62, h: 0.34 },        // wings, out past her arms
  top: { top: 0.18, w: 0.42, h: 0.28 },
  swim: { top: 0.19, w: 0.34, h: 0.3 },
  cardigan: { top: 0.15, w: 0.46, h: 0.46 },
  coat: { top: 0.14, w: 0.5, h: 0.58 },
  robe: { top: 0.15, w: 0.54, h: 0.66 },
  dress: { top: 0.18, w: 0.5, h: 0.56 },
  gown: { top: 0.17, w: 0.58, h: 0.8 },
  belt: { top: 0.37, w: 0.38, h: 0.08 },             // at her waist
  bottom: { top: 0.4, w: 0.4, h: 0.46 },
  glove: { top: 0.46, w: 0.4, h: 0.14 },             // the pair, at her hands
  sock: { top: 0.84, w: 0.28, h: 0.12 },             // ankle, under the shoe
  shoes: { top: 0.9, w: 0.3, h: 0.11 },
  bag: { top: 0.5, w: 0.24, h: 0.22, side: -0.3 },   // down by her hand
};

/**
 * The odd piece whose photograph does not sit where the rest of its kind
 * does. Tights are the case that forced it: they share the Socks row, but a
 * pair of tights is a waistband and two legs where a sock is an ankle, and
 * everything of a kind hangs from the same line.
 */
const WEAR: Partial<Record<string, Partial<(typeof FIT)[ClothesKind]>>> = {
  "cider-star-moon-fishnets": { top: 0.38, w: 0.3, h: 0.62 },  // waist to toe
  "cider-brown-knee-high-boots": { top: 0.66, w: 0.24, h: 0.34 },  // knee to sole
  "ar-effortless-pant-black": { top: 0.4, w: 0.3, h: 0.55 },       // hip to ankle
  // a head scarf is a cap and two long tails: the hat box is a cap's worth of
  // room, so the tails would be crushed into her crown without this
  "lavender-lace-head-scarf": { top: 0.0, w: 0.22, h: 0.3 },       // crown to chest
  "etsy-green-lace-veil": { top: 0.0, w: 0.3, h: 0.32 },           // crown to shoulder
  "light-blue-floral-lace-trim-head-scarf": { top: 0.0, w: 0.28, h: 0.34 },  // crown to shoulder
  "etsy-floral-embroidered-veil": { top: 0.0, w: 0.3, h: 0.34 },   // crown to shoulder
  "etsy-gold-floral-veil": { top: 0.0, w: 0.32, h: 0.38 },          // crown to elbow
  "pink-floral-lace-trim-head-scarf": { top: 0.0, w: 0.32, h: 0.36 },  // crown to elbow
  "etsy-purple-veil": { top: 0.0, w: 0.32, h: 0.36 },               // crown to elbow
  // its crown sits a third of the way across, not in the middle, so it is
  // nudged right to land on her head
  "etsy-bernadette-veil": { top: 0.0, w: 0.32, h: 0.36, side: 0.17 },
  // A cathedral veil. Its picture is not centred on the crown — the head sits
  // at a seventh of the way across and the train sweeps off to the right — so
  // it is pushed right until the crown lands on her head.
  "etsy-black-gold-veil-long": { top: 0.0, w: 0.7, h: 0.86, side: 0.86 },
};

/** the first two words of a name, which is all a phone has room for */
const inBrief = (name: string) => name.split(/\s+/).slice(0, 2).join(" ");

/** and twenty characters is all the strip beside her will take: past that a
    name runs on under the window she stands in, so it is cut off here rather
    than left to the stylesheet to hide */
const cut = (name: string) => (name.length > 20 ? `${name.slice(0, 20).trimEnd()}…` : name);

/** her own shape, so a box measured in her height can be given a width */
const SHE = 415 / 1400;

/** where a piece hangs on her: the same box for everything of a kind, with
    the picture fitted inside it rather than deciding its own size. Kept apart
    from the drawing so the cardigan can be drawn twice in the same place. */
const place = (id: string, nudge?: Nudge): React.CSSProperties => {
  const fit = { ...FIT[garment(id)!.kind], ...WEAR[id] };
  const n = nudge ?? STILL;
  return {
    width: `${((fit.w / SHE) * n.scale * 100).toFixed(1)}%`,
    height: `${(fit.h * n.scale * 100).toFixed(1)}%`,
    top: `${((fit.top + n.dy) * 100).toFixed(1)}%`,
    left: `${(50 + (fit.side ?? 0) * 100 + n.dx * 100).toFixed(1)}%`,
  };
};

/** How they stack, back to front. The coat sits BEHIND what she has on — hung
    off her shoulders the way a coat is in a lookbook, so the outfit still
    shows — and the cardigan between the coat and the shirt, which is the whole
    reason for having both. Wings are behind everything; socks go under the
    shoe and a bow on top of the hat. */
const LAYER: Record<SlotKey, number> = {
  wings: 1,
  /* the whole cardigan goes UNDER the coat, sleeves and all, the way it does
     when you put a coat on over one. Only a strip of its front comes back
     over the coat, at 5 — see CARDI_FRONT and .du-cardi-front. */
  cardigan: 2,
  coat: 3,
  /* 4 — .du-chest: a column of her, over the coat */
  /* 5 — .du-cardi-front: the cardigan's front again, over both */
  /* 6 — .du-crown: the top of her head, so a hood falls behind it */
  /* socks and tights go on first, so trousers and a skirt cover them — only
     the shoe comes back over the top */
  sock: 7,
  bottom: 8,
  top: 9,
  shoes: 10,
  belt: 11,
  glove: 12,
  bag: 13,
  /* 14 — .du-neck-mid: over everything but the scarf, which wraps round it */
  neck: 15,
  hat: 16,
  /* 17 — .du-face: the hat goes UNDER it, so her head scoops the hat rather
     than the hat swallowing her head */
  glasses: 18,
  bow: 19,
  /* 20 — .du-neck-high: the throat, over the whole lot */
};

/** the one garment drawn twice: once whole under the coat, once as the strip
    of front that a coat leaves showing */
const CARDI_FRONT = 5;

interface Nudge {
  dx: number;
  dy: number;
  scale: number;
}
const STILL: Nudge = { dx: 0, dy: 0, scale: 1 };

/** everything in the closet of the kinds a row takes, and "nothing" in front */
const rackFor = (kinds: readonly string[]) => [
  null,
  ...Object.keys(CLOTHES).filter((id) => kinds.includes(garment(id)?.kind ?? "")),
];

type Chosen = Partial<Record<SlotKey, string | null>>;

const read = (): { chosen: Chosen; nudged: Record<string, Nudge> } => {
  try {
    const kept = JSON.parse(localStorage.getItem(KEPT) ?? "{}");
    const chosen: Chosen = {};
    for (const s of SLOTS) {
      const id = kept?.chosen?.[s.key];
      const g = typeof id === "string" ? garment(id) : undefined;
      // and it must still be a kind that row offers, or it is quietly dropped
      if (g && (s.kinds as readonly string[]).includes(g.kind)) chosen[s.key] = id;
    }
    return { chosen, nudged: kept?.nudged && typeof kept.nudged === "object" ? kept.nudged : {} };
  } catch {
    return { chosen: {}, nudged: {} };
  }
};

export function DressUp({ stage, onClose }: { stage: HTMLElement; onClose: () => void }) {
  const [{ chosen, nudged }, setOutfit] = useState(read);
  const [picked, setPicked] = useState<SlotKey | null>(null);
  /** which set of rows the switch is showing. It dresses the same figure
      either way, so nothing comes off when it turns. */
  const [page, setPage] = useState(0);
  const form = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ id: string; from: { x: number; y: number }; was: Nudge } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEPT, JSON.stringify({ chosen, nudged }));
    } catch {
      /* a browser that won't remember is no reason to stop */
    }
  }, [chosen, nudged]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (picked ? setPicked(null) : onClose());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, picked]);

  /** is she in something that dresses her head to toe? */
  const wholePiece = (() => {
    const g = chosen.top ? garment(chosen.top) : undefined;
    return g && HEAD_TO_TOE.includes(g.kind) ? g : null;
  })();

  /** walk a row along to the next thing of its kind */
  const step = useCallback((slot: SlotKey, by: number) => {
    setOutfit((was) => {
      const row = SLOTS.find((s) => s.key === slot)!;
      const rack = rackFor(row.kinds);
      const at = Math.max(0, rack.indexOf(was.chosen[slot] ?? null));
      const next = rack[(at + by + rack.length) % rack.length];
      const chosen: Chosen = { ...was.chosen, [slot]: next };
      // a dress takes the skirt row with it
      const g = next ? garment(next) : undefined;
      if (slot === "top" && g && HEAD_TO_TOE.includes(g.kind)) chosen.bottom = null;
      return { ...was, chosen };
    });
    setPicked(slot);
  }, []);

  useEffect(() => setPicked(null), [page]);

  const nudge = (id: string, how: Partial<Nudge>) =>
    setOutfit((was) => ({
      ...was,
      nudged: { ...was.nudged, [id]: { ...STILL, ...was.nudged[id], ...how } },
    }));

  /* dragging a piece about on her */
  const grab = (e: React.PointerEvent, slot: SlotKey, id: string) => {
    const box = form.current?.getBoundingClientRect();
    if (!box) return;
    setPicked(slot);
    dragging.current = { id, from: { x: e.clientX, y: e.clientY }, was: nudged[id] ?? STILL };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const drag = dragging.current;
    const box = form.current?.getBoundingClientRect();
    if (!drag || !box) return;
    nudge(drag.id, {
      dx: drag.was.dx + (e.clientX - drag.from.x) / box.height,
      dy: drag.was.dy + (e.clientY - drag.from.y) / box.height,
    });
  };
  const drop = () => {
    dragging.current = null;
  };

  /* anything whose garment has since left the wardrobe is quietly dropped: an
     outfit is kept in the browser, so one saved before a piece was deleted
     would otherwise bring the whole dress form down when it is opened */
  const on = SLOTS.map((s) => ({ slot: s, id: chosen[s.key] ?? null })).filter((w) => w.id && garment(w.id));
  const cardigan = chosen.cardigan && garment(chosen.cardigan) ? chosen.cardigan : null;
  /* with a coat on, the cardigan is ONLY its front strip: the whole picture
     is put away rather than hidden behind the coat, because a cardigan cut
     wider than the coat had its sleeves poking out either side of it */
  const cardiUnderCoat = !!cardigan && !!chosen.coat;
  /* unless the coat was photographed done up, in which case there is no front
     to see through: no strip of cardigan, and no strip of her either */
  const coatIsOpen = !!chosen.coat && !garment(chosen.coat)?.closed;
  const pickedId = picked ? chosen[picked] : null;
  const pickedNudge = pickedId ? nudged[pickedId] ?? STILL : null;

  /** one row: its name and ‹ against the left edge, what she has on and ›
      against the right, and her standing in the gap between them */
  const row = (s: (typeof SLOTS)[number]) => {
    const taken = s.key === "bottom" && wholePiece;
    const id = chosen[s.key] ?? null;
    const g = id ? garment(id) : undefined;
    return (
      <div
        key={s.key}
        className={`du-row du-row--${s.key}${taken ? " is-taken" : ""}${picked === s.key ? " is-picked" : ""}`}
        style={{ ["--band" as string]: s.band }}
      >
        {/* the arrow, then what the row is, then either the kind's own mark or
            the very thing she has on */}
        <span className="du-row-left">
          <button
            type="button"
            className="du-arrow"
            style={{ ["--arrow" as string]: BACK }}
            onClick={() => step(s.key, -1)}
            disabled={!!taken}
            aria-label={`The one before, for ${s.label}`}
          />
          <span className="du-row-what">
            <span className="du-long">{s.label}</span>
            <span className="du-short">{"brief" in s ? s.brief : s.label}</span>
          </span>
          <span className="du-row-thumb" onClick={() => id && setPicked(s.key)}>
            {!taken && g ? (
              <img src={closetSrc(id!)} alt="" decoding="async" />
            ) : (
              <span className="du-row-mark" aria-hidden>{s.emoji}</span>
            )}
          </span>
        </span>
        <span className="du-row-gap" aria-hidden />
        <span className="du-row-right">
          <span className="du-row-name" onClick={() => id && setPicked(s.key)}>
            {taken ? (
              <em>
                <span className="du-long">the {wholePiece!.kind} has it</span>
                <span className="du-short">the {wholePiece!.kind}</span>
              </em>
            ) : g ? (
              <>
                <span className="du-long">{cut(g.label)}</span>
                <span className="du-short">{inBrief(g.label)}</span>
              </>
            ) : (
              <em>nothing</em>
            )}
          </span>
          <button
            type="button"
            className="du-arrow"
            style={{ ["--arrow" as string]: ON }}
            onClick={() => step(s.key, 1)}
            disabled={!!taken}
            aria-label={`The next one, for ${s.label}`}
          />
        </span>
      </div>
    );
  };

  return createPortal(
    <div className="du-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="du-panel"
        role="dialog"
        aria-modal="true"
        aria-label="The dress form"
        style={{ ["--du-paper" as string]: PAPER }}
      >
        <div className="du-title">
          {/* a phone drops the "The", so the plaque keeps to one line */}
          <h2>
            <span aria-hidden>✿</span> <span className="du-the">The </span>Dress Form <span aria-hidden>✿</span>
          </h2>
        </div>
        <button type="button" className="du-close" onClick={onClose} aria-label="Close the dress form">
          ×
        </button>
        {/* the switch: clothes on one side, the smaller things on the other.
            It sits in the corner opposite the ×, clear of the rows, which run
            the whole width of the panel. */}
        <button
          type="button"
          className={`du-flip${page ? " is-on" : ""}`}
          onClick={() => setPage((p) => (p + 1) % PAGES.length)}
          aria-pressed={page === 1}
          aria-label={page ? "Back to the clothes" : "On to the extras"}
          title={page ? "Back to the clothes" : "On to the extras"}
        >
          {/* the mark is where the switch will take you, not where you are —
              it reads with the label beside it: "on to the extras" 🎀 */}
          <span className="du-flip-knob" aria-hidden>
            {page ? "👗" : "🎀"}
          </span>
        </button>

        {/* the striped rows, right across the modal */}
        <div className="du-rows">{PAGES[page].map(row)}</div>

        {/* her, standing in the gap down the middle of them */}
        <div className="du-stand">
          <div className="du-form" ref={form} onPointerMove={move} onPointerUp={drop} onPointerCancel={drop}>
            <img className="du-body" src={MANNEQUIN} alt="A dress form" draggable={false} />
            {on.map(({ slot, id }) =>
              slot.key === "cardigan" && cardiUnderCoat ? null : (
              <img
                key={slot.key}
                className={`du-worn${picked === slot.key ? " is-picked" : ""}`}
                src={closetSrc(id!)}
                alt={garment(id!)!.label}
                draggable={false}
                onPointerDown={(e) => grab(e, slot.key, id!)}
                style={{ ...place(id!, nudged[id!]), zIndex: LAYER[slot.key] }}
              />
              ),
            )}
            {/* the cardigan's front, over the coat: the same picture in the
                same place, cut down to the strip a coat leaves showing. Its
                sleeves stay behind the coat where they belong. */}
            {cardiUnderCoat && coatIsOpen && (
              <img
                className="du-cardi-front"
                src={closetSrc(cardigan)}
                alt=""
                aria-hidden
                draggable={false}
                style={{ ...place(cardigan, nudged[cardigan]), zIndex: CARDI_FRONT }}
              />
            )}
            {/* Her again, four more times, each a band of the same picture cut
                out and slipped into the pile at a different height. It is the
                same file every time, so nothing is fetched twice.

                  chest      only under a coat hanging open — over that coat
                  low neck   — the same band, they run together
                  mid neck   over everything but the scarf round it
                  face       over the hat, so her head scoops it
                  high neck  her throat, over the whole lot

                Nothing here can be dragged: they are pictures of her. */}
            {coatIsOpen && <img className="du-chest" src={MANNEQUIN} alt="" aria-hidden draggable={false} />}
            <img className="du-crown" src={MANNEQUIN} alt="" aria-hidden draggable={false} />
            <img className="du-neck-mid" src={MANNEQUIN} alt="" aria-hidden draggable={false} />
            <img className="du-face" src={MANNEQUIN} alt="" aria-hidden draggable={false} />
            <img className="du-neck-high" src={MANNEQUIN} alt="" aria-hidden draggable={false} />
          </div>
        </div>

        {/* always at the foot of the modal, whether or not she has hold of
            anything — they were disappearing the moment nothing was picked,
            which is exactly when you go looking for them */}
        <div className="du-handles">
          <button
            type="button"
            disabled={!pickedId || !pickedNudge}
            onClick={() => pickedId && pickedNudge && nudge(pickedId, { scale: Math.max(0.3, pickedNudge.scale / 1.1) })}
            aria-label="Smaller"
          >
            −
          </button>
          {pickedId ? (
            <span className="du-picked-name">{garment(pickedId)?.label}</span>
          ) : (
            <span className="du-hint">Arrow through the closet either side. Drag anything on her to sit it right.</span>
          )}
          <button
            type="button"
            disabled={!pickedId || !pickedNudge}
            onClick={() => pickedId && pickedNudge && nudge(pickedId, { scale: Math.min(3, pickedNudge.scale * 1.1) })}
            aria-label="Bigger"
          >
            +
          </button>
        </div>

        <div className="du-foot">
          {/* nothing on the left: it holds the column so Put it back stays
              in the middle of the modal */}
          <span aria-hidden />
          {/* always here, even empty, so it holds the middle of the row */}
          <span className="du-foot-mid">
            {pickedId && (
              <button
                type="button"
                className="du-strip du-off"
                onClick={() => nudge(pickedId, STILL)}
                aria-label="Put it back where it was"
              >
                <span className="du-long">Put it back</span>
                <span className="du-short" aria-hidden>×</span>
              </button>
            )}
          </span>
          <button
            type="button"
            className="du-strip"
            onClick={() => setOutfit({ chosen: {}, nudged: {} })}
            disabled={!on.length}
            aria-label="Take it all off"
          >
            <span className="du-long">Take it all off</span>
            <span className="du-short" aria-hidden>0</span>
          </button>
        </div>
      </div>
    </div>,
    stage,
  );
}
