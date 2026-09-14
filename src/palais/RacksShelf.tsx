import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CLOTHES, CLOSET_LINES, closetSrc, garment } from "./clothes";
import { movePiece, useRackOrder, type Which } from "./closetRacks";

/* what each kind of place gets as a picture, and which way its order runs */
const LOOK: [RegExp, string, string][] = [
  [/hooks-side/, "🪝", "top → bottom"],
  [/hooks/, "🪝", "left → right"],
  [/rack/, "🧺", "front → back"],
  [/rail|bar|mirror/, "🪝", "front → back"],
  [/shoes|floor/, "👠", "left → right"],
  [/seat/, "🪟", "left → right"],
  [/cubby/, "🗄️", "left → right"],
  [/shelf|shelves/, "📚", "front → back"],
];
const lookOf = (id: string, name: string) => LOOK.find(([re]) => re.test(id) || re.test(name.toLowerCase())) ?? [/./, "✨", "front → back"];

/* the Racks page lists the closet from the floor up and left to right, so
   it reads roughly the way the room does */
const ORDER = [
  "rack-left", "rack-right", "rack-back", "rack-front",
  "outer-left-top", "outer-left-low", "outer-left-bottom",
  "left-top", "left-rail", "left-shelf", "left-bottom",
  "cubby-rail", "cubby-top", "cubby-row-1", "cubby-row-2", "cubby-row-3",
  "seat", "window-hooks-top", "window-hooks-side", "mirror", "mirror-shelves",
  "right-top", "right-middle", "right-low", "right-shelf", "right-bottom",
  "outer-right-top", "outer-right-second", "outer-right-upper", "outer-right-lower", "outer-right-bottom",
  "floor-front", "shoes",
];
/** a drop-down of everything in the closet that isn't on these hooks, as little pictures, to hang one here with a tap */
function HookPicker({ here, onPick, onClose }: { here: Set<string>; onPick: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const ids = Object.keys(CLOTHES).filter((id) => !here.has(id) && (!q || id.includes(q) || (garment(id)?.label ?? "").toLowerCase().includes(q)));
  return (
    <div className="season-add rack-hook-add" role="dialog" aria-label="Hang something on the hooks">
      <div className="season-add-head">
        <input className="cat-input season-add-search" type="search" placeholder="Search the closet…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        <button type="button" className="cat-mini" onClick={onClose}>
          Done
        </button>
      </div>
      {ids.length ? (
        <ul className="season-grid season-grid--add">
          {ids.map((id) => (
            <li key={id}>
              <button type="button" title={`Hang ${garment(id)?.label ?? id} here`} aria-label={`Hang ${garment(id)?.label ?? id} here`} onClick={() => onPick(id)}>
                <img src={closetSrc(id)} alt="" loading="lazy" decoding="async" />
                <span aria-hidden className="season-add-plus">+</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="season-empty">Nothing by that name.</p>
      )}
    </div>
  );
}

const rank = (id: string) => {
  const i = ORDER.indexOf(id);
  return i < 0 ? ORDER.length : i;
};

/**
 * The catalogue's Racks page, in the Wardrobe Wing: every rail, rack and shelf
 * in the closet with its clothes in order, first at the front. Drag a card to
 * a new spot, on the same rail or another, and the closet rearranges to match.
 *
 * Dragging follows the pointer itself rather than the browser's own drag and
 * drop, which is unreliable over a scrolling list. A mouse drags straight away;
 * a finger scrolls the list as usual, so on a phone you tap a card to pick it
 * up, then tap where it should go: another card, to go in front of it, or a
 * rail's "+" to go last. The arrows nudge a piece one place along its rail.
 */
export function RacksShelf({ which, hidden }: { which: Which; hidden: Set<string> }) {
  const order = useRackOrder(which);
  const [picked, setPicked] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<{ line: string; index: number } | null>(null);
  // the hooks section whose + drop-down is open
  const [adding, setAdding] = useState<string | null>(null);
  const ghost = useRef<HTMLDivElement>(null);
  // folded-away sections, remembered in this browser, so a far-off rail is a short drag away
  const [folded, setFolded] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("palais-racks-folded") || "[]"));
    } catch {
      return new Set();
    }
  });
  const fold = (next: Set<string>) => {
    setFolded(next);
    try {
      localStorage.setItem("palais-racks-folded", JSON.stringify(Array.from(next)));
    } catch {
      /* not remembered */
    }
  };
  const press = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const latest = useRef(target);
  latest.current = target;

  const lines = [...CLOSET_LINES[which]].sort((a, b) => rank(a.id) - rank(b.id));
  /** where a piece goes when it's taken off the hooks: where the closet keeps it, or else the window seat */
  const homeOf = (id: string) => lines.find((l) => !l.hooks && (l.ids as string[]).includes(id))?.id ?? "seat";

  const place = (line: string, index: number, id = picked) => {
    if (!id) return;
    movePiece(which, id, line, index);
    setPicked(null);
    setDragging(null);
    setTarget(null);
  };

  /** the spot under the pointer: in front of or behind a card, or the end of a rail */
  const spotAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-rack-line]");
    if (!el) return null;
    const line = el.dataset.rackLine!;
    if (el.dataset.rackIndex === undefined) return { line, index: Number(el.dataset.rackCount) };
    const i = Number(el.dataset.rackIndex);
    const r = el.getBoundingClientRect();
    return { line, index: x < r.left + r.width / 2 ? i : i + 1 };
  };

  const down = (e: ReactPointerEvent<HTMLElement>, id: string) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if ((e.target as Element).closest("button")) return;
    press.current = { id, x: e.clientX, y: e.clientY, moved: false };
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = press.current;
      if (!p) return;
      if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return;
      if (!p.moved) {
        p.moved = true;
        setDragging(p.id);
        setPicked(null);
      }
      e.preventDefault();
      if (ghost.current) ghost.current.style.transform = `translate(${e.clientX - 40}px, ${e.clientY - 48}px)`;
      const spot = spotAt(e.clientX, e.clientY);
      const t = latest.current;
      if (spot?.line !== t?.line || spot?.index !== t?.index) setTarget(spot);
      // scroll the list when dragging near its top or bottom edge
      const list = ghost.current?.closest(".cat-panel")?.querySelector<HTMLElement>(".cat-scroll");
      if (list) {
        const r = list.getBoundingClientRect();
        if (e.clientY < r.top + 40) list.scrollBy(0, -14);
        else if (e.clientY > r.bottom - 40) list.scrollBy(0, 14);
      }
    };
    const up = () => {
      const p = press.current;
      press.current = null;
      if (!p?.moved) return;
      const t = latest.current;
      if (t) place(t.line, t.index, p.id);
      else {
        setDragging(null);
        setTarget(null);
      }
      // swallow the click that follows a drag
      const stop = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
        window.removeEventListener("click", stop, true);
      };
      window.addEventListener("click", stop, true);
      setTimeout(() => window.removeEventListener("click", stop, true), 0);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // place and spotAt only read refs and stable module functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [which]);

  return (
    <div className="rack-page">
      <p className="rack-intro">
        Drag the clothes to arrange the closet, or tap one and then tap where it goes. On each rail the first piece is at the
        front. Fold sections away to bring far-off rails closer; drop onto a folded one to put it at the back. The hooks round
        the window have a + to hang anything there, and a − on each piece to take it down.
      </p>
      <div className="rack-folds">
        <button type="button" className="cat-btn cat-btn--ghost" onClick={() => fold(new Set(lines.map((l) => l.id)))}>
          Fold all
        </button>
        <button type="button" className="cat-btn cat-btn--ghost" onClick={() => fold(new Set())}>
          Unfold all
        </button>
      </div>
      {lines.map((line) => {
        const ids = order[line.id] ?? [];
        const [, emoji, direction] = lookOf(line.id, line.name);
        const hooked = !!line.hooks;
        return (
          <section key={line.id} className={`cat-shelf rack-shelf${folded.has(line.id) ? " is-folded" : ""}`}>
            <div
              className={`cat-shelf-head rack-head${target?.line === line.id && folded.has(line.id) ? " is-drop" : ""}`}
              data-rack-line={line.id}
              data-rack-count={ids.length}
            >
              <button
                type="button"
                className="rack-fold"
                aria-expanded={!folded.has(line.id)}
                aria-label={`${folded.has(line.id) ? "Unfold" : "Fold"} ${line.name}`}
                onClick={() => {
                  const next = new Set(folded);
                  if (next.has(line.id)) next.delete(line.id);
                  else next.add(line.id);
                  fold(next);
                }}
              >
                ▾
              </button>
              <h3>
                <span aria-hidden>{emoji}</span> {line.name}
              </h3>
              {picked && folded.has(line.id) && (
                <button type="button" className="rack-put" onClick={() => place(line.id, ids.length)}>
                  Put here
                </button>
              )}
              <span className="rack-direction">{direction}</span>
              <span className="cat-shelf-count">
                {ids.length}
                {hooked ? ` / ${line.hooks} hooks` : ""}
              </span>
              {hooked && (
                <button
                  type="button"
                  className={`season-plus${adding === line.id ? " is-open" : ""}`}
                  aria-expanded={adding === line.id}
                  aria-label={`Hang something on the ${line.name.toLowerCase()}`}
                  onClick={() => setAdding(adding === line.id ? null : line.id)}
                >
                  +
                </button>
              )}
            </div>
            {hooked && adding === line.id && (
              <HookPicker here={new Set(ids)} onClose={() => setAdding(null)} onPick={(id) => movePiece(which, id, line.id, ids.length)} />
            )}
            {!folded.has(line.id) && (
            <ul
              className={`rack-row${target?.line === line.id && target.index === ids.length ? " is-drop-end" : ""}`}
              data-rack-line={line.id}
              data-rack-count={ids.length}
            >
              {ids.map((id, i) => {
                const g = garment(id);
                const before = target?.line === line.id && target.index === i;
                const after = target?.line === line.id && target.index === i + 1 && i === ids.length - 1;
                return (
                  <li
                    key={id}
                    className={[
                      "rack-card",
                      picked === id ? "is-picked" : "",
                      dragging === id ? "is-dragging" : "",
                      before ? "is-drop-before" : "",
                      after ? "is-drop-after" : "",
                      hidden.has(id) ? "is-hidden" : "",
                    ].join(" ")}
                    data-rack-line={line.id}
                    data-rack-index={i}
                    onPointerDown={(e) => down(e, id)}
                    onClick={() => {
                      if (!picked) setPicked(id);
                      else if (picked === id) setPicked(null);
                      else place(line.id, i);
                    }}
                    title={g ? `${g.label} · ${g.store}` : id}
                  >
                    <span className="rack-pos">{i + 1}</span>
                    <span className="cat-thumb">
                      <img src={closetSrc(id)} alt="" loading="lazy" decoding="async" draggable={false} />
                    </span>
                    <span className="cat-name">{g?.label ?? id}</span>
                    <span className="rack-nudge">
                      <button
                        type="button"
                        aria-label={`Move ${g?.label ?? id} forward`}
                        disabled={i === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePiece(which, id, line.id, i - 1);
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${g?.label ?? id} back`}
                        disabled={i === ids.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePiece(which, id, line.id, i + 2);
                        }}
                      >
                        ›
                      </button>
                      {hooked && (
                        <button
                          type="button"
                          className="rack-off"
                          aria-label={`Take ${g?.label ?? id} off the hooks`}
                          title="Take it off the hooks"
                          onClick={(e) => {
                            e.stopPropagation();
                            const home = homeOf(id);
                            movePiece(which, id, home, order[home]?.length ?? 0);
                          }}
                        >
                          −
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
              <li
                className={`rack-end${picked ? " is-ready" : ""}`}
                data-rack-line={line.id}
                data-rack-count={ids.length}
              >
                <button
                  type="button"
                  onClick={() => place(line.id, ids.length)}
                  disabled={!picked}
                  aria-label={`Put it at the back of ${line.name}`}
                >
                  +
                </button>
              </li>
            </ul>
            )}
          </section>
        );
      })}
      {/* the card, following the pointer while it's dragged */}
      <div ref={ghost} className="rack-ghost" hidden={!dragging} aria-hidden>
        {dragging && <img src={closetSrc(dragging)} alt="" />}
      </div>
    </div>
  );
}
