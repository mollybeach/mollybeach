import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { JEWELRY, JEWELRY_BOX_SRC, JEWELRY_SHELVES, jewelSrc, layOutBox, type Jewel } from "./jewelry";

const ALL = Object.keys(JEWELRY);
const jewel = (id: string) => (JEWELRY as Record<string, Jewel>)[id];

/**
 * The jewellery box, opened: a modal over the Wardrobe Wing, with the closet
 * blurred behind it. It has two pages, turned with the arrows. The box shows
 * every piece in its place: rings on the ring rolls, necklaces on the door
 * hooks, bracelets and earrings in the drawers, hair pieces in the door
 * pockets. The Jewellery Catalogue lists
 * them all, with a heart to put each one in the box or take it out.
 */
export function JewelryBox({ stage, onClose }: { stage: HTMLElement; onClose: () => void }) {
  const [page, setPage] = useState<"box" | "catalogue">("box");
  const [out, setOut] = useState<Set<string>>(() => new Set());
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") setPage((p) => (p === "box" ? "catalogue" : "box"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inBox = ALL.filter((id) => !out.has(id));
  const placed = layOutBox(inBox);
  const flip = () => setPage((p) => (p === "box" ? "catalogue" : "box"));
  const toggle = (id: string) =>
    setOut((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return createPortal(
    <div className="jb-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="jb-frame" role="dialog" aria-modal="true" aria-label={page === "box" ? "Jewelry Box" : "Jewelry Catalogue"}>
        <span aria-hidden className="jb-rose jb-rose--tl">🌹</span>
        <span aria-hidden className="jb-rose jb-rose--tr">🌹</span>
        <span aria-hidden className="jb-rose jb-rose--bl">🌹</span>
        <span aria-hidden className="jb-rose jb-rose--br">🌹</span>
        <button type="button" className="jb-close" onClick={onClose} aria-label="Close the jewelry box">
          ×
        </button>
        <button type="button" className="jb-arrow jb-arrow--left" onClick={flip} aria-label={page === "box" ? "The jewelry catalogue" : "The jewelry box"}>
          ‹
        </button>
        <button type="button" className="jb-arrow jb-arrow--right" onClick={flip} aria-label={page === "box" ? "The jewelry catalogue" : "The jewelry box"}>
          ›
        </button>

        {page === "box" ? (
          <div className="jb-box">
            <img className="jb-box-img" src={JEWELRY_BOX_SRC} alt="The jewelry box, open" draggable={false} />
            {placed.map(({ id, slot }) => {
              const j = jewel(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`jb-piece jb-piece--${j.kind}${slot.hang ? " is-hung" : ""}`}
                  style={{
                    left: `${slot.x - slot.w / 2}%`,
                    top: `${slot.hang ? slot.y : slot.y - slot.h / 2}%`,
                    width: `${slot.w}%`,
                    height: `${slot.h}%`,
                  }}
                  onPointerEnter={() => setHover(id)}
                  onPointerLeave={() => setHover((h) => (h === id ? null : h))}
                  onFocus={() => setHover(id)}
                  onBlur={() => setHover((h) => (h === id ? null : h))}
                  aria-label={`${j.label} (${j.store})`}
                >
                  <img src={jewelSrc(id)} alt="" draggable={false} />
                </button>
              );
            })}
            <p className="jb-caption" aria-live="polite">
              {hover ? `${jewel(hover).label} · ${jewel(hover).store}` : `${inBox.length} pieces`}
            </p>
          </div>
        ) : (
          <div className="jb-catalogue">
            {JEWELRY_SHELVES.map((shelf) => {
              const items = ALL.filter((id) => jewel(id).kind === shelf.key);
              if (!items.length) return null;
              return (
                <section key={shelf.key} className="jb-shelf">
                  <h3>
                    <span aria-hidden>{shelf.emoji}</span> {shelf.name}{" "}
                    <span className="jb-count">
                      {items.filter((id) => !out.has(id)).length}/{items.length}
                    </span>
                  </h3>
                  <ul className="jb-grid">
                    {items.map((id) => {
                      const on = !out.has(id);
                      const j = jewel(id);
                      return (
                        <li key={id}>
                          <label className={`jb-card${on ? " is-on" : ""}`}>
                            <input type="checkbox" checked={on} onChange={() => toggle(id)} aria-label={j.label} />
                            <span aria-hidden className="jb-heart">{on ? "♥" : "♡"}</span>
                            <span className="jb-thumb">
                              <img src={jewelSrc(id)} alt="" loading="lazy" decoding="async" />
                            </span>
                            <span className="jb-name">{j.label}</span>
                            <span className="jb-store">{j.store}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <div className="jb-plaque">{page === "box" ? "Jewelry Box" : "Jewelry Catalogue"}</div>
      </div>
    </div>,
    stage,
  );
}
