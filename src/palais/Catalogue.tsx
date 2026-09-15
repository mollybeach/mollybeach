import { useEffect, useRef, useState } from "react";
import { propSrc, propSpec, type PropId } from "./props";
import { stock } from "./shelves";
import { capture, type SeasonLayout } from "./arrangement";
import { LayoutsShelf, SignIn } from "./LayoutsShelf";
import { VisitorsShelf } from "./VisitorsShelf";
import type { Season } from "./seasons";
import { WARDROBE_SHELVES, closetSrc, garment } from "./clothes";
import { RacksShelf } from "./RacksShelf";
import { SeasonsShelf, SEASON_EMOJI, titleCase } from "./SeasonsShelf";
import { closetMovesNow, hiddenChanged, movesChanged, publishRacks, racksChanged, resetRacks, useRackOrder, type Which } from "./closetRacks";
import { resizeSticker } from "./Draggable";
import { saveSeasonDefault, type Device } from "./layoutsDb";
import { defaultLook } from "./roomLayouts";
import { PLACE_NAMES, type Place } from "./place";
import { differs } from "./roomLayouts";
import { messageOf, type Collection } from "./useCollection";

/** the one account that sees the visitor book, and whose Done saves the room */
const OWNER = "mollyjbeach@gmail.com";

/**
 * The room's catalogue, like the wardrobe screen in a dress-up game: every
 * sticker on a shelf, with a tick to put it in the room or take it out, and a
 * tick on each shelf for the whole lot at once. It's the same in every room on
 * the map, and it says which room and season it's dressing.
 *
 * It reads what's in the room off the page when it opens, so the phone layout
 * and the desktop layout each list exactly their own stickers.
 *
 * Its other pages:
 * - Seasons (SeasonsShelf.tsx): the room's eight layouts, a season each on a
 *   computer and a phone, and what's in each.
 * - Saved looks (LayoutsShelf.tsx): whole arrangements of the room, kept.
 * - In the Wardrobe Wing, Clothes (clothes.ts, a shelf per kind of thing) and
 *   Racks (RacksShelf.tsx), for arranging them on the closet's rails.
 *
 * Signed in, Molly's Done saves the room as its layout for the season it's in,
 * on this device, and the closet's rails as they are.
 */

type Page = "clothes" | "racks" | "stickers" | "seasons" | "looks" | "visitors";

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

const idsIn = (stage: Element | null | undefined, selector: string) =>
  Array.from(stage?.querySelectorAll<HTMLElement>(selector) ?? [])
    .map((el) => el.dataset.prop!)
    .filter((id, i, all) => all.indexOf(id) === i);

export function Catalogue({
  open,
  onClose,
  place,
  device,
  hidden,
  setHidden,
  closetHidden,
  setClosetHidden,
  collection,
  season,
  wearing,
  onWear,
  onPutIn,
}: {
  open: boolean;
  onClose: () => void;
  place: Place;
  device: Device;
  /** the stickers taken out of the room */
  hidden: Set<string>;
  setHidden: (next: Set<string>) => void;
  /** the clothes taken out of the closet */
  closetHidden: Set<string>;
  setClosetHidden: (next: Set<string>) => void;
  collection: Collection;
  season: Season;
  /** the layout the room has on, for this device */
  wearing: SeasonLayout | undefined;
  onWear: (layout: SeasonLayout) => void;
  /** put stickers into the room as it is now */
  onPutIn: (ids: string[]) => void;
}) {
  const wardrobe = place === "closet";
  const panel = useRef<HTMLDivElement>(null);
  const [stickers, setStickers] = useState<string[]>([]);
  const [clothes, setClothes] = useState<string[]>([]);
  const [tab, setTab] = useState<string | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const [page, setPage] = useState<Page>(wardrobe ? "clothes" : "stickers");
  // which of the closet's photographs is showing, for the Racks page
  const [which, setWhich] = useState<Which>("wide");
  const rackOrder = useRackOrder(which);
  const [saving, setSaving] = useState<"" | "busy" | "saved">("");
  const [saveError, setSaveError] = useState("");
  const owner = Boolean(collection.editor?.canSave && collection.editor.email.toLowerCase() === OWNER);
  const phone = device === "phone";
  const stageOf = () => panel.current?.closest<HTMLElement>(".palais-stage") ?? null;

  useEffect(() => {
    if (!open) return;
    const stage = panel.current?.closest(".palais-stage");
    setStickers(idsIn(stage, ".palais-layer [data-prop]"));
    setClothes(idsIn(stage, ".palais-closet [data-prop]"));
    setPage(place === "closet" ? "clothes" : "stickers");
    setWhich(stage?.querySelector(".palais-closet-frame--tall") ? "tall" : "wide");
    setSaveError("");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, place]);

  if (!open) return <div ref={panel} hidden />;

  const clothesPage = page === "clothes";
  const inRoom = clothesPage ? clothes : stickers;
  const out = clothesPage ? closetHidden : hidden;
  const setOut = clothesPage ? setClosetHidden : setHidden;
  const shelves = clothesPage ? wardrobeStock(clothes) : stock(stickers);
  const shown = inRoom.filter((id) => !out.has(id)).length;

  const setMany = (ids: string[], show: boolean) => {
    const next = new Set(out);
    for (const id of ids) {
      if (show) next.delete(id);
      else next.add(id);
    }
    setOut(next);
  };

  /** make a piece in the room (or the closet) bigger or smaller, like its size handle */
  const nudge = (id: string, factor: number) => {
    const stage = stageOf();
    if (stage) resizeSticker(stage, clothesPage ? ".palais-closet [data-prop]" : ".palais-layer [data-prop]", id, factor);
  };
  /** the same, for a whole shelf of pieces, or everything on the page, at once
      (only what's in the room: a piece taken out keeps its size) */
  const nudgeMany = (ids: string[], factor: number) => ids.filter((id) => !out.has(id)).forEach((id) => nudge(id, factor));
  const sizeGroup = (ids: string[], what: string) => {
    const none = !ids.some((id) => !out.has(id));
    return (
      <span className="cat-size cat-size--group" role="group" aria-label={`Size of ${what}`}>
        <button type="button" disabled={none} aria-label={`Make ${what} smaller`} title={`Make ${what} smaller`} onClick={() => nudgeMany(ids, 1 / 1.12)}>
          −
        </button>
        <button type="button" disabled={none} aria-label={`Make ${what} bigger`} title={`Make ${what} bigger`} onClick={() => nudgeMany(ids, 1.12)}>
          +
        </button>
      </span>
    );
  };

  /** the stickers in the room as they are right now, in the form a layout keeps */
  const roomNow = () => {
    const stage = stageOf();
    if (!stage) throw new Error("Couldn't find the room");
    return capture(stage, hidden);
  };

  /** save the room as it is into one of its season layouts, for this device */
  const saveTo = async (s: Season) => {
    const { stage, props } = roomNow();
    await saveSeasonDefault(collection.saved, {
      place,
      season: s,
      device,
      name: `${PLACE_NAMES[place]} · ${titleCase(s)} · ${phone ? "phone" : "computer"}`,
      stage,
      props,
    });
    await collection.refresh();
  };

  const withSaving = async (job: () => Promise<boolean>, close: boolean) => {
    setSaving("busy");
    setSaveError("");
    try {
      const didSave = await job();
      if (!didSave) {
        setSaving("");
        if (close) onClose();
        return;
      }
      setSaving("saved");
      setTimeout(() => {
        setSaving("");
        if (close) onClose();
      }, 700);
    } catch (e) {
      setSaving("");
      setSaveError(`Couldn't save: ${messageOf(e)}`);
    }
  };

  /* Done: for Molly, keep what she's changed — the closet's rails, and the
     room as this season's layout on this device — then close */
  const done = () => {
    if (!owner) {
      onClose();
      return;
    }
    void withSaving(async () => {
      let saved = false;
      if (wardrobe) {
        // the rails; where the clothes have been dragged and how big they've been
        // made (− and +); and which have been unhearted
        const stage = stageOf();
        const moves = stage ? closetMovesNow(stage) : undefined;
        const outChanged = hiddenChanged(closetHidden);
        const moved = !!moves && movesChanged(which, moves);
        if (racksChanged(which) || moved || outChanged) {
          await publishRacks(which, moved ? moves : undefined, outChanged ? closetHidden : undefined);
          saved = true;
        }
      }
      if (differs(roomNow(), wearing ?? { stage: { w: 1, h: 1 }, props: {} }, place)) {
        await saveTo(season);
        saved = true;
      }
      return saved;
    }, true);
  };

  /**
   * The room as it is right now, as JSON: what's in it, and for each sticker
   * how far it's been moved from where the layout puts it, its size and its
   * stacking order — the same numbers arrangement.ts keeps, so a copy of this
   * can become the new default.
   */
  const copyLayout = async () => {
    const stage = stageOf();
    if (!stage) return;
    let text: string;
    if (page === "racks") {
      // the order of the clothes on every rail, to become the default in clothes.ts
      text = JSON.stringify({ closet: which, racks: rackOrder }, null, 2);
    } else {
      const { stage: size, layout: kind, season: at, props } = capture(stage, out, clothesPage ? "closet" : "room");
      text = JSON.stringify({ place, stage: size, layout: kind, season: at, props }, null, 2);
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

  const pages: [Page, string][] = [
    ...(wardrobe ? ([["clothes", "♡ Clothes"], ["racks", "🪝 Racks"]] as [Page, string][]) : []),
    ["stickers", wardrobe ? "✿ Stickers" : "♡ Stickers"],
    ["seasons", `${SEASON_EMOJI[season]} Seasons`],
    ["looks", "✦ Saved looks"],
    // the visitor book is Molly's alone (the database also only answers editors)
    ...(owner ? ([["visitors", "☆ Visitors"]] as [Page, string][]) : []),
  ];

  const where = `${phone ? "phone" : "computer"}`;
  const saveNote = !collection.configured ? null : owner ? (
    <p>
      ✦ Signed in — <b>Save</b> keeps {wardrobe ? "the rails and " : ""}this room as its {SEASON_EMOJI[season]} {season} layout on a {where}.
    </p>
  ) : (
    <>
      <p>Changes here are only for you, until the page reloads.</p>
      <SignIn editor={collection.editor} onError={setSaveError} label="Molly? Sign in to save the room" />
    </>
  );

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
            <span className="cat-season-now">
              {SEASON_EMOJI[season]} {titleCase(season)}
            </span>{" "}
            · {PLACE_NAMES[place]}
            {(clothesPage || page === "stickers") && (
              <>
                {" "}
                · {shown} of {inRoom.length} in the {clothesPage ? "closet" : "room"}
              </>
            )}
          </p>
          <button type="button" className="cat-close" onClick={onClose} aria-label="Close the catalogue">
            ×
          </button>
          <div className="cat-pages" role="tablist" aria-label="Catalogue pages">
            {pages.map(([key, name]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={page === key}
                className={`cat-page${page === key ? " is-on" : ""}`}
                onClick={() => setPage(key)}
              >
                {name}
              </button>
            ))}
          </div>
          {(clothesPage || page === "stickers") && (
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
          {page !== "visitors" && page !== "looks" && (saveNote || saveError) && (
            <div className="rack-save-note">
              {saveNote}
              {saveError && <p className="rack-save-error">{saveError}</p>}
            </div>
          )}
          {page === "racks" ? (
            <RacksShelf which={which} hidden={closetHidden} />
          ) : page === "seasons" ? (
            <SeasonsShelf
              place={place}
              season={season}
              device={device}
              collection={collection}
              wearing={wearing}
              owner={owner}
              busy={saving === "busy"}
              onWear={onWear}
              stickers={stickers}
              hidden={hidden}
              onPutIn={onPutIn}
              onAddTo={(s, d, ids) =>
                withSaving(async () => {
                  // the other device's layout isn't on screen: add to it in the collection
                  const look = defaultLook(collection.saved, place, s, d);
                  const props = { ...look.layout.props };
                  for (const id of ids) {
                    const before = props[id] as (typeof props)[string] | undefined;
                    props[id] = before ? { ...before, shown: true } : { x: 0, y: 0, s: 1, z: 60, shown: true };
                  }
                  await saveSeasonDefault(collection.saved, {
                    place,
                    season: s,
                    device: d,
                    name: `${PLACE_NAMES[place]} · ${titleCase(s)} · ${d === "phone" ? "phone" : "computer"}`,
                    stage: look.layout.stage,
                    props,
                  });
                  await collection.refresh();
                  return true;
                }, false)
              }
              onSaveTo={(s) => {
                if (s === season || window.confirm(`Save the room as it is now as its ${s} layout on a ${where}?`)) {
                  void withSaving(async () => {
                    await saveTo(s);
                    return true;
                  }, false);
                }
              }}
            />
          ) : page === "visitors" ? (
            <VisitorsShelf />
          ) : page === "looks" ? (
            <LayoutsShelf
              collection={collection}
              place={place}
              device={device}
              season={season}
              wearing={wearing}
              onWear={onWear}
              hidden={hidden}
              stageOf={stageOf}
            />
          ) : (
            shelves.map(({ shelf, items }) => {
              const on = items.filter((id) => !out.has(id)).length;
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
                    {sizeGroup(items, `all the ${shelf.name.toLowerCase()}`)}
                  </div>
                  <ul className="cat-grid">
                    {items.map((id) => {
                      const inIt = !out.has(id);
                      const g = clothesPage ? garment(id) : undefined;
                      const name = g ? g.label : nice(id);
                      return (
                        <li key={id}>
                          <div className={`cat-card${inIt ? " is-on" : ""}`}>
                            <button
                              type="button"
                              className={`cat-heart cat-heart--card${inIt ? " is-on" : ""}`}
                              aria-pressed={inIt}
                              aria-label={`${inIt ? "Take out" : "Put in"} ${name}`}
                              title={inIt ? "Take it out" : "Put it in"}
                              onClick={() => setMany([id], !inIt)}
                            />
                            <span className="cat-size" role="group" aria-label={`Size of ${name}`}>
                              <button type="button" disabled={!inIt} aria-label={`Make ${name} smaller`} title="Smaller" onClick={() => nudge(id, 1 / 1.12)}>
                                −
                              </button>
                              <button type="button" disabled={!inIt} aria-label={`Make ${name} bigger`} title="Bigger" onClick={() => nudge(id, 1.12)}>
                                +
                              </button>
                            </span>
                            <span className="cat-thumb">
                              <img src={clothesPage ? closetSrc(id) : propSrc(id as PropId)} alt="" loading="lazy" decoding="async" />
                            </span>
                            <span className="cat-name">{name}</span>
                            {g && <span className="cat-store">{g.store}</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
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
          {(clothesPage || page === "stickers") && (
            <>
              <span className="cat-size-all">
                Size of everything {sizeGroup(inRoom, clothesPage ? "all the clothes" : "everything in the room")}
              </span>
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
          <button type="button" className="cat-btn cat-btn--done" onClick={done} disabled={saving === "busy"}>
            {saving === "busy" ? "Saving…" : saving === "saved" ? "Saved ♡" : owner ? "Save ♡" : "Done ♡"}
          </button>
        </footer>
      </div>
    </div>
  );
}
