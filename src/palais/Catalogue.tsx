import { useEffect, useRef, useState } from "react";
import { propSrc, propSpec, type PropId } from "./props";
import { stock } from "./shelves";
import { capture, type SeasonLayout } from "./arrangement";
import { LayoutsShelf } from "./LayoutsShelf";
import { VisitorsShelf } from "./VisitorsShelf";
import type { Season } from "./seasons";
import type { Collection } from "./useCollection";
import { WARDROBE_SHELVES, closetSrc, garment } from "./clothes";
import { RacksShelf } from "./RacksShelf";
import { racksChanged, resetRacks, useRackOrder, type Which } from "./closetRacks";

/** the one account that sees the visitor book */
const OWNER = "mollyjbeach@gmail.com";

/**
 * The room's catalogue, like the wardrobe screen in a dress-up game: every
 * sticker on a shelf, with a tick to put it in the room or take it out, and a
 * tick on each shelf for the whole lot at once.
 *
 * It reads what's in the room off the page when it opens, so the phone layout
 * and the desktop layout each list exactly their own stickers.
 *
 * Its second page, Saved looks (LayoutsShelf.tsx), keeps whole arrangements
 * of the room. Only the desktop room is arranged, so the phone doesn't get it.
 *
 * In the Wardrobe Wing it's the wardrobe instead: the clothes (clothes.ts),
 * on a shelf per kind of thing, and a second page, Racks (RacksShelf.tsx),
 * for arranging them on the closet's rails.
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

/** the closet's clothes, sorted onto a shelf per kind of thing */
function wardrobeStock(inCloset: string[]) {
  return WARDROBE_SHELVES.map((shelf) => ({
    shelf,
    items: inCloset.filter((id) => garment(id)?.kind === shelf.key),
  })).filter((s) => s.items.length > 0);
}

export function Catalogue({
  open,
  onClose,
  wardrobe = false,
  hidden,
  setHidden,
  collection,
  season,
  wearing,
  onWear,
}: {
  open: boolean;
  onClose: () => void;
  /** the Wardrobe Wing's clothes rather than the terrace's stickers */
  wardrobe?: boolean;
  hidden: Set<string>;
  setHidden: (next: Set<string>) => void;
  collection: Collection;
  season: Season;
  wearing: SeasonLayout | undefined;
  onWear: (layout: SeasonLayout) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [inRoom, setInRoom] = useState<string[]>([]);
  const [tab, setTab] = useState<string | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const [page, setPage] = useState<"stickers" | "looks" | "visitors" | "racks">("stickers");
  const [phone, setPhone] = useState(false);
  // which of the closet's photographs is showing, for the Racks page
  const [which, setWhich] = useState<Which>("wide");
  const rackOrder = useRackOrder(which);

  useEffect(() => {
    if (!open) return;
    const stage = panel.current?.closest(".palais-stage");
    const ids = Array.from(stage?.querySelectorAll<HTMLElement>(wardrobe ? ".palais-closet [data-prop]" : ".palais-layer [data-prop]") ?? [])
      .map((el) => el.dataset.prop!)
      .filter((id, i, all) => all.indexOf(id) === i);
    setInRoom(ids);
    const onPhone = Boolean(stage?.querySelector(".palais-layer .palais-frame"));
    setPhone(onPhone);
    if (onPhone || wardrobe) setPage("stickers");
    setWhich(stage?.querySelector(".palais-closet-frame--tall") ? "tall" : "wide");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, wardrobe]);

  if (!open) return <div ref={panel} hidden />;

  const shelves = wardrobe ? wardrobeStock(inRoom) : stock(inRoom);
  const shown = inRoom.filter((id) => !hidden.has(id)).length;

  const setMany = (ids: string[], show: boolean) => {
    const next = new Set(hidden);
    for (const id of ids) {
      if (show) next.delete(id);
      else next.add(id);
    }
    setHidden(next);
  };

  /**
   * The room as it is right now, as JSON: what's in it, and for each sticker
   * how far it's been moved from where the layout puts it, its size and its
   * stacking order — the same numbers arrangement.ts keeps, so a copy of this
   * can become the new default.
   */
  const copyLayout = async () => {
    const stage = panel.current?.closest<HTMLElement>(".palais-stage");
    if (!stage) return;
    let text: string;
    if (page === "racks") {
      // the order of the clothes on every rail, to become the default in clothes.ts
      text = JSON.stringify({ closet: which, racks: rackOrder }, null, 2);
    } else {
      const { stage: size, layout: device, season: at, props } = capture(stage, hidden, wardrobe ? "closet" : "room");
      text = JSON.stringify({ stage: size, layout: device, season: at, props }, null, 2);
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      // older browsers, or no permission: the textarea trick
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      setCopied(document.execCommand("copy") ? "ok" : "fail");
      ta.remove();
    }
    setTimeout(() => setCopied(""), 2200);
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
        <header
          className="cat-head"
          // the same teal lily pattern as the footer (Footer.tsx)
          style={{ backgroundImage: `url("${process.env.PUBLIC_URL}/palais/catalogue-floral.webp")` }}
        >
          <span aria-hidden className="cat-sparkle cat-sparkle--a">✦</span>
          <span aria-hidden className="cat-sparkle cat-sparkle--b">✧</span>
          <h2 id="cat-title">
            <span aria-hidden>♡ </span>
            {wardrobe ? "Wardrobe Catalogue" : "Palais Catalogue"}
            <span aria-hidden> ♡</span>
          </h2>
          <p className="cat-count">
            {shown} of {inRoom.length} in the {wardrobe ? "closet" : "room"}
          </p>
          <button type="button" className="cat-close" onClick={onClose} aria-label="Close the catalogue">
            ×
          </button>
          {wardrobe && (
            <div className="cat-pages" role="tablist" aria-label="Wardrobe pages">
              <button
                type="button"
                role="tab"
                aria-selected={page === "stickers"}
                className={`cat-page${page === "stickers" ? " is-on" : ""}`}
                onClick={() => setPage("stickers")}
              >
                ♡ Clothes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={page === "racks"}
                className={`cat-page${page === "racks" ? " is-on" : ""}`}
                onClick={() => setPage("racks")}
              >
                🪝 Racks
              </button>
            </div>
          )}
          {!phone && !wardrobe && (
            <div className="cat-pages" role="tablist" aria-label="Catalogue pages">
              <button
                type="button"
                role="tab"
                aria-selected={page === "stickers"}
                className={`cat-page${page === "stickers" ? " is-on" : ""}`}
                onClick={() => setPage("stickers")}
              >
                ♡ Stickers
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={page === "looks"}
                className={`cat-page${page === "looks" ? " is-on" : ""}`}
                onClick={() => setPage("looks")}
              >
                ✦ Saved looks
              </button>
              {/* the visitor book is Molly's alone (the database also only answers editors) */}
              {collection.editor?.canSave && collection.editor.email.toLowerCase() === OWNER && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={page === "visitors"}
                  className={`cat-page${page === "visitors" ? " is-on" : ""}`}
                  onClick={() => setPage("visitors")}
                >
                  ☆ Visitors
                </button>
              )}
            </div>
          )}
          {page === "stickers" && (
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
          )}
        </header>

        <div className="cat-scroll">
          {page === "racks" ? (
            <RacksShelf which={which} hidden={hidden} />
          ) : page === "visitors" ? (
            <VisitorsShelf />
          ) : page === "looks" ? (
            <LayoutsShelf
              collection={collection}
              season={season}
              wearing={wearing}
              onWear={onWear}
              hidden={hidden}
              stageOf={() => panel.current?.closest<HTMLElement>(".palais-stage") ?? null}
            />
          ) : (
          <>
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
                    const g = wardrobe ? garment(id) : undefined;
                    const name = g ? g.label : nice(id);
                    return (
                      <li key={id}>
                        <label className={`cat-card${inIt ? " is-on" : ""}`}>
                          <input
                            type="checkbox"
                            checked={inIt}
                            onChange={() => setMany([id], !inIt)}
                            aria-label={name}
                          />
                          <span aria-hidden className="cat-heart cat-heart--card" />
                          <span className="cat-thumb">
                            <img src={wardrobe ? closetSrc(id) : propSrc(id as PropId)} alt="" loading="lazy" decoding="async" />
                          </span>
                          <span className="cat-name">{name}</span>
                          {g && <span className="cat-store">{g.store}</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          </>
          )}
        </div>

        <footer className="cat-foot">
          {page === "racks" && (
            <button
              type="button"
              className="cat-btn cat-btn--ghost"
              onClick={() => resetRacks(which)}
              disabled={!racksChanged(which)}
              title="Put every piece back where it started"
            >
              Put it all back
            </button>
          )}
          {page === "stickers" && (
            <>
              <button type="button" className="cat-btn" onClick={() => setMany(inRoom, true)}>
                Show everything
              </button>
              <button type="button" className="cat-btn cat-btn--ghost" onClick={() => setMany(inRoom, false)}>
                Hide everything
              </button>
            </>
          )}
          <button
            type="button"
            className="cat-btn cat-btn--copy"
            onClick={copyLayout}
            title={page === "racks" ? "Copy the order of the clothes on every rail, to send to Claude" : "Copy what's in the room and where everything is, to send to Claude"}
          >
            {copied === "ok" ? "Copied ♡" : copied === "fail" ? "Couldn't copy" : page === "racks" ? "Copy arrangement" : "Copy layout"}
          </button>
          <button type="button" className="cat-btn cat-btn--done" onClick={onClose}>
            Done ♡
          </button>
        </footer>
      </div>
    </div>
  );
}
