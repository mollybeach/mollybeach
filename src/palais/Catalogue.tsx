import { useEffect, useRef, useState } from "react";
import { propSrc, propSpec, type PropId } from "./props";
import { stock } from "./shelves";

/**
 * The room's catalogue, like the wardrobe screen in a dress-up game: every
 * sticker on a shelf, with a tick to put it in the room or take it out, and a
 * tick on each shelf for the whole lot at once.
 *
 * It reads what's in the room off the page when it opens, so the phone layout
 * and the desktop layout each list exactly their own stickers.
 */

const nice = (id: string) => {
  let label: string = id;
  try {
    label = propSpec(id as PropId).label;
  } catch {
    /* not in the catalogue of images: fall back to its id */
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function ShelfTick({ all, some, onChange, label }: { all: boolean; some: boolean; onChange: () => void; label: string }) {
  const box = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (box.current) box.current.indeterminate = some && !all;
  }, [all, some]);
  return (
    <label className="cat-shelf-tick">
      <input ref={box} type="checkbox" checked={all} onChange={onChange} aria-label={label} />
      <span aria-hidden className="cat-heart" />
    </label>
  );
}

export function Catalogue({
  open,
  onClose,
  hidden,
  setHidden,
}: {
  open: boolean;
  onClose: () => void;
  hidden: Set<string>;
  setHidden: (next: Set<string>) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [inRoom, setInRoom] = useState<string[]>([]);
  const [tab, setTab] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const stage = panel.current?.closest(".palais-stage");
    const ids = Array.from(stage?.querySelectorAll<HTMLElement>(".palais-layer [data-prop]") ?? [])
      .map((el) => el.dataset.prop!)
      .filter((id, i, all) => all.indexOf(id) === i);
    setInRoom(ids);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return <div ref={panel} hidden />;

  const shelves = stock(inRoom);
  const shown = inRoom.filter((id) => !hidden.has(id)).length;

  const setMany = (ids: string[], show: boolean) => {
    const next = new Set(hidden);
    for (const id of ids) {
      if (show) next.delete(id);
      else next.add(id);
    }
    setHidden(next);
  };

  const jump = (key: string) => {
    setTab(key);
    // scroll just the list: scrollIntoView would also scroll the page under it
    const list = panel.current?.querySelector<HTMLElement>(".cat-scroll");
    const shelfEl = panel.current?.querySelector<HTMLElement>(`#cat-shelf-${key}`);
    if (list && shelfEl) list.scrollTo({ top: shelfEl.offsetTop, behavior: "smooth" });
  };

  return (
    <div className="cat-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className="cat-panel" role="dialog" aria-modal="true" aria-labelledby="cat-title">
        <header className="cat-head">
          <span aria-hidden className="cat-sparkle cat-sparkle--a">✦</span>
          <span aria-hidden className="cat-sparkle cat-sparkle--b">✧</span>
          <h2 id="cat-title">
            <span aria-hidden>♡ </span>Palais Catalogue<span aria-hidden> ♡</span>
          </h2>
          <p className="cat-count">
            {shown} of {inRoom.length} in the room
          </p>
          <button type="button" className="cat-close" onClick={onClose} aria-label="Close the catalogue">
            ×
          </button>
          <nav className="cat-tabs" aria-label="Shelves">
            {shelves.map(({ shelf }) => (
              <button
                key={shelf.key}
                type="button"
                className={`cat-tab${tab === shelf.key ? " is-on" : ""}`}
                onClick={() => jump(shelf.key)}
              >
                <span aria-hidden>{shelf.emoji}</span> {shelf.name}
              </button>
            ))}
          </nav>
        </header>

        <div className="cat-scroll">
          {shelves.map(({ shelf, items }) => {
            const on = items.filter((id) => !hidden.has(id)).length;
            const all = on === items.length;
            return (
              <section key={shelf.key} id={`cat-shelf-${shelf.key}`} className="cat-shelf">
                <div className="cat-shelf-head">
                  <ShelfTick
                    all={all}
                    some={on > 0}
                    onChange={() => setMany(items, !all)}
                    label={`${all ? "Take out" : "Put in"} all the ${shelf.name.toLowerCase()}`}
                  />
                  <h3>
                    <span aria-hidden>{shelf.emoji}</span> {shelf.name}
                  </h3>
                  <span className="cat-shelf-count">
                    {on}/{items.length}
                  </span>
                </div>
                <ul className="cat-grid">
                  {items.map((id) => {
                    const inIt = !hidden.has(id);
                    return (
                      <li key={id}>
                        <label className={`cat-card${inIt ? " is-on" : ""}`}>
                          <input
                            type="checkbox"
                            checked={inIt}
                            onChange={() => setMany([id], !inIt)}
                            aria-label={nice(id)}
                          />
                          <span aria-hidden className="cat-heart cat-heart--card" />
                          <span className="cat-thumb">
                            <img src={propSrc(id as PropId)} alt="" loading="lazy" decoding="async" />
                          </span>
                          <span className="cat-name">{nice(id)}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="cat-foot">
          <button type="button" className="cat-btn" onClick={() => setMany(inRoom, true)}>
            Show everything
          </button>
          <button type="button" className="cat-btn cat-btn--ghost" onClick={() => setMany(inRoom, false)}>
            Hide everything
          </button>
          <button type="button" className="cat-btn cat-btn--done" onClick={onClose}>
            Done ♡
          </button>
        </footer>
      </div>
    </div>
  );
}
