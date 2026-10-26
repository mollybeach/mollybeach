import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePlace } from "./place";
import { amIAccepted, askForReview, noteDoing } from "./visits";
import { useAccount } from "../components/AccountCard";
import { shrinkPhoto } from "./stickerCut";
import { SEASON_PICTURES, goMade, loadRooms, paintRoom, planRoom, roomById, useMadeRooms, type MadeRoom } from "./madeRooms";
import { SCENERY, SCENERY_SHELVES, sceneryById, scenerySrc, type Scenery } from "./islandScenery";
import { dressMap, placeIsland, templateOf, useIslandMaps, type MapRow, type Placed, type Plot } from "./islandMaps";

/**
 * The World Island Maker at Brat Academy: a globe that opens on a stand, on the
 * row of desks beside the sticker maker (StickerMaker.tsx), standing where
 * that one stands and just to its right, clear of it and its pill (or on its
 * left, where a narrow screen leaves no room).
 *
 * Press it and it opens as the machine, in three tabs, visited in any order;
 * nothing is made until the last one's Create:
 *
 * 1. Create room: a few photos of what the room should be, and what it's like.
 * 2. Create island sticker: what the room's made from comes over, with the
 *    island template it's painted on, and anything more for its outside.
 * 3. Create map: the open island map, the one everyone's filling
 *    (islandMaps.ts), which the World Map shows after its own two islands:
 *    pick a plot for the island, and dress the map with scenery
 *    (islandScenery.ts).
 *
 * Create then has the palais-rooms function make it all
 * (docs/island-maker-prompts.md): Claude plans the room, OpenAI's image model
 * paints it on the Palais's own floor and ceiling and then in four seasons,
 * wide and tall, then its island, and the island goes on its plot with the
 * scenery saved. Each piece is kept as it's made, so a room left part-made
 * can be finished. Anyone can walk into it after (MadeRoom.tsx). When the
 * map's last plot is taken, the next one opens.
 */

const ART = `${process.env.PUBLIC_URL}/palais_assets/modal_content/island_maker`;
const MACHINE = `${ART}/world_island_maker_machine_sticker.webp?v=2`;
const ISLAND_TEMPLATE = `${ART}/island_sticker_template_generic.png`;
/** the machine's own shape (1253 × 1254) */
const SHAPE = 1254 / 1253;
/** as wide as the sticker maker beside it, times this */
const SIZE = 1.05;
/** and this far to the right of it, in pixels (less on a phone, where the
    machines are small): clear of the sticker maker, so the two don't touch */
const GAP = 46;

/* ---- drawing a map ------------------------------------------------------- */

/** how wide an island is drawn, as a fraction of the painting: smaller the
    further back (higher up) its plot is, as the painting's own trees are */
const islandWidth = (y: number) => 0.19 * (0.72 + 0.5 * y) * 0.86;
/** a made room's island is square (the island template), its whole
    coastline in view, so most of it stands up from its plot */
const LIFT = 0.8;
/** how wide a piece of scenery is drawn: smaller the further back it stands,
    as the islands are; the sky stays the size it is */
const sceneryWidth = (sc: Scenery, p: Placed) => sc.w * p.s * (sc.sky ? 1 : (0.72 + 0.5 * p.y) / 0.99);
/** a ground piece stands on its feet, near the bottom of its picture */
const FEET = 0.92;

/**
 * An island map as it stands: the empty painting, its scenery, and the rooms'
 * islands on their plots, each drawn back to front. The World Map shows it
 * like this, to look at and walk into (WorldMap.tsx); Create map hands it
 * what it needs to be built on.
 */
export function MapPainting({
  map,
  rooms,
  showPlots = false,
  pickedPlot = null,
  pickedDecor = null,
  overPlot = null,
  onPlot,
  onIsland,
  decorHandlers,
  boardRef,
  onDragOver,
  onDragLeave,
  onDrop,
  ghost,
}: {
  map: MapRow;
  rooms: Map<string, MadeRoom>;
  showPlots?: boolean;
  pickedPlot?: number | null;
  pickedDecor?: number | null;
  overPlot?: number | null;
  onPlot?: (i: number) => void;
  onIsland?: (i: number, room: MadeRoom) => void;
  decorHandlers?: (pl: Placed) => Partial<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  boardRef?: React.Ref<HTMLDivElement>;
  onDragOver?: React.DragEventHandler<HTMLDivElement>;
  onDragLeave?: React.DragEventHandler<HTMLDivElement>;
  onDrop?: React.DragEventHandler<HTMLDivElement>;
  /** an island that isn't made yet, shown on the plot it'll go on */
  ghost?: { plot: number; src: string; name: string };
}) {
  const t = templateOf(map);
  return (
    <div ref={boardRef} className="im-board" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <img className="im-map" src={t.src} alt={`${t.name}, island ${map.n}`} draggable={false} />
      {map.decor.map((pl) => {
        const sc = sceneryById.get(pl.id);
        if (!sc) return null;
        const style = {
          left: `${pl.x * 100}%`,
          top: `${pl.y * 100}%`,
          width: `${sceneryWidth(sc, pl) * 100}%`,
          zIndex: sc.sky ? 3 : 10 + Math.round(pl.y * 100),
          translate: `-50% -${(sc.sky ? 0.5 : FEET) * 100}%`,
        };
        const img = <img src={scenerySrc(pl.id)} alt="" draggable={false} style={pl.flip ? { scale: "-1 1" } : undefined} />;
        return decorHandlers ? (
          <button key={pl.n} type="button" className={`im-decor${sc.sky ? " im-decor--sky" : ""}${pickedDecor === pl.n ? " is-picked" : ""}`} style={style} title={sc.name} {...decorHandlers(pl)}>
            {img}
          </button>
        ) : (
          <span key={pl.n} className={`im-decor im-decor--still${sc.sky ? " im-decor--sky" : ""}`} style={style} aria-hidden>
            {img}
          </span>
        );
      })}
      {t.plots.map((p, i) => {
        const room = map.plots[i] ? rooms.get(map.plots[i]) : undefined;
        const w = islandWidth(p.y);
        if (ghost?.plot === i && !room)
          return (
            <button
              key={i}
              type="button"
              className="im-placed im-placed--ghost"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${w * 100}%`, zIndex: 10 + Math.round(p.y * 100), translate: `-50% -${LIFT * 100}%`, transformOrigin: `50% ${LIFT * 100}%` }}
              onClick={() => onPlot?.(i)}
              aria-label={`${ghost.name} goes here, on ${p.name}`}
              title={`${ghost.name} goes here`}
            >
              <img src={ghost.src} alt="" draggable={false} />
              <span className="im-ghost-tag">{ghost.name}</span>
            </button>
          );
        if (room?.pictures.island)
          return (
            <button
              key={i}
              type="button"
              className={`im-placed${pickedPlot === i ? " is-picked" : ""}${overPlot === i ? " is-over" : ""}`}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${w * 100}%`, zIndex: 10 + Math.round(p.y * 100), translate: `-50% -${LIFT * 100}%`, transformOrigin: `50% ${LIFT * 100}%` }}
              onClick={() => onIsland?.(i, room)}
              aria-label={`${room.name}, on ${p.name}`}
              title={`${room.name} · made by ${room.made_by_name?.split(" ")[0] ?? "a member"}`}
            >
              <span className="im-shadow" aria-hidden />
              <img src={room.pictures.island} alt="" draggable={false} />
            </button>
          );
        if (!showPlots) return null;
        return (
          <button
            key={i}
            type="button"
            className={`im-plot${p.water ? " im-plot--water" : ""}${pickedPlot === i ? " is-picked" : ""}${overPlot === i ? " is-over" : ""}`}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${w * 100 * 0.72}%` }}
            onClick={() => onPlot?.(i)}
            aria-label={`${p.name}, empty`}
            title={p.name}
          >
            <span>{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- the machine on the desk --------------------------------------------- */

export function IslandMaker() {
  const { place } = usePlace();
  const here = place === "school";
  const spot = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  /* stand beside the sticker maker, wherever that one has been put */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const other = stage.querySelector<HTMLElement>(".palais-stickermaker:not(.palais-islandmaker):not(.palais-dollymaker)");
      if (!other || other.style.visibility !== "visible") return;
      const w = other.offsetWidth * SIZE;
      const h = w * SHAPE;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      // far enough along that the two machines don't touch, and nor do their
      // pills (which are wider than the machines on a phone): to the right,
      // or to the left where there's no room past it
      const theirPill = other.querySelector<HTMLElement>(".palais-stickermaker-hint")?.offsetWidth ?? 0;
      const ourPill = el.querySelector<HTMLElement>(".palais-stickermaker-hint")?.offsetWidth ?? 0;
      const gap = Math.min(GAP, other.offsetWidth * 0.4);
      const apart = Math.max(other.offsetWidth / 2 + w / 2 + gap, (theirPill + ourPill) / 2 + 8);
      const theirs = other.offsetLeft + other.offsetWidth / 2;
      const fits = theirs + apart + Math.max(w, ourPill) / 2 <= stage.clientWidth - 4;
      el.style.left = `${(fits ? theirs + apart : theirs - apart) - w / 2}px`;
      el.style.top = `${other.offsetTop + other.offsetHeight - h}px`;
      el.style.visibility = "visible";
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 3000);
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  if (!here) return null;

  return (
    <>
      <button
        ref={spot}
        type="button"
        className="palais-stickermaker palais-islandmaker"
        style={{ visibility: "hidden" }}
        aria-label="Open the island maker"
        title="Make an island"
        onClick={() => {
          setOpen(true);
          noteDoing("island-maker");
        }}
      >
        <img src={MACHINE} alt="" decoding="async" />
        <span className="palais-stickermaker-hint" aria-hidden>
          <span>🏝 Make <span className="pill-long">an island</span><span className="pill-short">Island</span></span>
          <small>add room to the map</small>
        </span>
      </button>
      {open && <Machine onClose={() => setOpen(false)} />}
    </>
  );
}

/* ---- the machine, opened: three tabs and one Create ---------------------- */

type Tab = "room" | "island" | "map";
const TABS: { tab: Tab; label: string; short: string; dot: string }[] = [
  { tab: "room", label: "Create room", short: "Room", dot: "★" },
  { tab: "island", label: "Create island sticker", short: "Island", dot: "🌴" },
  { tab: "map", label: "Create map", short: "Map", dot: "🗺" },
];

const MOST_PHOTOS = 4;
const MOST_ISLAND_PHOTOS = 3;
/** the room's seasons, painted from the master two at a time */
const AT_ONCE = 2;
/** a room's pictures, in the order they're made */
const ROOM_PICTURES = ["master", ...SEASON_PICTURES];
const pictureName = (w: string) => w.replace(/^(\w+)-(\w+)$/, (_, s: string, d: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)} · ${d === "desktop" ? "computer" : "phone"}`);

export type Photo = { b64: string; type: string; preview: string };

/** everything put in across the three tabs, before Create makes it */
interface Draft {
  name: string;
  description: string;
  /** the story of the room, for its card on the World Map */
  story: string;
  photos: Photo[];
  islandNotes: string;
  islandPhotos: Photo[];
  /** pieces of the scenery picked to be painted on its island */
  islandScenery: string[];
  /** the plot its island goes on, on the open map */
  plot: number | null;
  /** the open map's scenery as it's being dressed, or null while untouched */
  decor: Placed[] | null;
  /** the room once it's been generated, kept in the database as a draft */
  roomId: string | null;
  /** what to change about the room when it's painted again */
  roomChanges: string;
  /** where the scenery picked for its island sits on the template, to play with */
  islandPlaced: Record<string, { x: number; y: number }>;
}
const EMPTY_DRAFT: Draft = { name: "", description: "", story: "", photos: [], islandNotes: "", islandPhotos: [], islandScenery: [], plot: null, decor: null, roomId: null, roomChanges: "", islandPlaced: {} };
const MOST_ISLAND_SCENERY = 6;

/** where Create has got to: planning, painting, placing, then done */
interface Run {
  /** a tab's own Generate, or Create making the lot */
  scope: "room" | "seasons" | "island" | "all";
  id: string | null;
  at: "plan" | "room" | "island" | "map" | "done";
  painting: Set<string>;
  trouble: string | null;
}

function Machine({ onClose }: { onClose: () => void }) {
  const { me } = useAccount();
  const [member, setMember] = useState<boolean | null>(null);
  useEffect(() => {
    if (!me) return setMember(null);
    let gone = false;
    amIAccepted().then((ok) => {
      if (gone) return;
      setMember(ok);
      if (!ok) askForReview();
    });
    return () => {
      gone = true;
    };
  }, [me]);

  const [tab, setTab] = useState<Tab>("room");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const change = (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next }));
  const [run, setRun] = useState<Run | null>(null);
  const rooms = useMadeRooms();
  const maps = useIslandMaps();
  const openMap = maps[maps.length - 1];

  const working = !!run && run.at !== "done" && !run.trouble;
  const close = useCallback(() => {
    if (working && !window.confirm("Your room's still being made. Close anyway? What's made is kept, and you can finish it later.")) return;
    onClose();
  }, [working, onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  /** what's still wanted before Create, if anything */
  const wanting = !draft.photos.length ? "a photo or two of the room (Create room)" : !draft.description.trim() ? "a few words on what the room's like (Create room)" : draft.plot === null ? "a plot for its island (Create map)" : null;

  /* Making it, a piece at a time or all at once. Each tab's Generate paints
     its own part (the room on the first, its island on the second), kept in
     the database as a draft only its maker sees; Create on the last paints
     whatever's still missing, then puts the island on the map with the
     scenery, and only then is the room out for anyone to walk into. If
     anything goes wrong, going again picks up where it stopped. */
  const create = useCallback(
    async (scope: Run["scope"], again = false) => {
      const step = (at: Run["at"], id: string | null) => setRun((r) => ({ scope, id, at, painting: r?.painting ?? new Set(), trouble: null }));
      const paintingNow = (what: string, on: boolean) =>
        setRun((r) => {
          if (!r) return r;
          const painting = new Set(r.painting);
          if (on) painting.add(what);
          else painting.delete(what);
          return { ...r, painting };
        });
      let id = draft.roomId;
      try {
        // the room: planned, then its master, the room in spring on a computer,
        // looked over and painted again (with changes) until it's right
        if (!id) {
          step("plan", null);
          const got = await planRoom(draft.name.trim(), draft.description.trim(), draft.photos.map((p) => ({ image: p.b64, type: p.type })), draft.story.trim());
          if (!got.ok) {
            setRun(null);
            setTab("room");
            return window.alert(got.why);
          }
          id = got.room.id;
          setDraft((d) => ({ ...d, roomId: got.room.id }));
          noteDoing("room-planned", got.room.name);
        }
        const have = () => roomById(id!)?.pictures ?? {};
        step("room", id);
        if (!have().master || (scope === "room" && again)) {
          paintingNow("master", true);
          await paintRoom(id, "master", undefined, again ? draft.roomChanges.trim() : undefined);
          paintingNow("master", false);
          if (again) setDraft((d) => ({ ...d, roomChanges: "" }));
        }
        if (scope === "room") return step("done", id);
        // the rest of its pictures, once the master's right: for Create too
        if (scope === "seasons" || scope === "all") {
          const queue = SEASON_PICTURES.filter((w) => !have()[w]);
          const roomId = id;
          let failed: unknown = null;
          await Promise.all(
            Array.from({ length: AT_ONCE }, async () => {
              for (let w = queue.shift(); w && !failed; w = queue.shift()) {
                paintingNow(w, true);
                try {
                  await paintRoom(roomId, w);
                } catch (e) {
                  failed = e;
                }
                paintingNow(w, false);
              }
            }),
          );
          if (failed) throw failed;
        }
        if (scope === "seasons") return step("done", id);
        // its island: painted for the island tab, or for Create if it's not yet
        if (scope === "island" || !have().island) {
          step("island", id);
          paintingNow("island", true);
          await paintRoom(id, "island", { notes: draft.islandNotes.trim(), photos: draft.islandPhotos.map((p) => ({ image: p.b64, type: p.type })), scenery: draft.islandScenery });
          paintingNow("island", false);
        }
        if (scope === "island") return step("done", id);
        step("map", id);
        // the plot picked, or the first still empty if someone's taken it since
        try {
          await placeIsland(id, draft.plot);
        } catch {
          const open = maps[maps.length - 1];
          const empty = templateOf(open).plots.findIndex((_, i) => !open.plots[i]);
          await placeIsland(id, empty);
        }
        if (draft.decor) await dressMap(openMap.n, draft.decor);
        await loadRooms(true);
        noteDoing("room-ready", id);
        step("done", id);
      } catch (e) {
        setRun((r) => ({ scope, id, at: r?.at ?? "plan", painting: new Set(), trouble: e instanceof Error ? e.message : String(e) }));
      }
    },
    [draft, maps, openMap.n],
  );

  const runRoom = run?.id ? rooms.find((r) => r.id === run.id) : undefined;
  /** the draft room, once generated */
  const draftRoom = draft.roomId ? rooms.find((r) => r.id === draft.roomId) : undefined;
  /** Create taking over the modal, versus a tab's Generate working inside it */
  const showRun = run?.scope === "all";
  const job = run && run.scope !== "all" ? run : null;
  const jobBusy = !!job && job.at !== "done" && !job.trouble;
  const seasonsDone = !!draftRoom && SEASON_PICTURES.every((w) => draftRoom.pictures[w]);
  const roomWanting = !draft.photos.length ? "a photo or two" : !draft.description.trim() ? "a few words on what it's like" : null;
  const JOB_SAY: Record<Run["at"], string> = { plan: "Claude is planning the room…", room: "Painting the room… a minute or two each", island: "Painting its island…", map: "", done: "" };
  // rooms left part-made (the only unfinished ones anyone's sent are their own)
  const unfinished = me ? rooms.filter((r) => r.status !== "ready") : [];
  const footSay =
    job?.trouble
                ? `${job.trouble} What's painted is kept.`
                : jobBusy
                  ? JOB_SAY[job!.at]
                  : member !== true
                    ? "For members of the Palais: sign in on Create room."
                    : tab === "map"
                      ? wanting
                        ? `Still wanting ${wanting}.`
                        : draftRoom?.pictures.island
                          ? "That's your island on its plot. Add it, and it's on the map for everyone."
                          : "Preview your island on its plot, or add it straight away: it paints whatever's still to paint."
                      : tab === "room"
                        ? seasonsDone
                          ? "All 8 pictures are painted: it's kept as a draft until you add it to the map."
                          : draftRoom?.pictures.master
                            ? "That's your room in spring. Paint it again with changes until it's right, then generate the other seasons."
                            : "Generate it in spring first, to look it over, or carry on: nothing's out until it's on the map."
                        : draftRoom?.pictures.island
                          ? "Its island's painted: kept as a draft until you Create it on the map."
                          : "Generate its island to see it now, or carry on to the map.";
  const { ref: fitRef, style: fitStyle } = useFitZoom();

  return (
    <div ref={fitRef} style={fitStyle} className="wm-backdrop sm-backdrop im-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div
        className="wm-panel sm-panel im-panel imf-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="im-title"
        /* the frame's pieces, by their address, for the stylesheet */
        style={Object.fromEntries([
          ...["top_left", "top_right", "crown", "rail_top", "rail_left", "rail_right", "bottom_left", "bottom_right", "rail_bottom"].map((k) => [`--imf-${k.replace("_", "-")}`, `url("${ART}/modal_parts/f_${k}.webp")`]),
          ...["top", "bottom", "rail_left", "rail_right"].map((k) => [`--imp-${k.replace("_", "-")}`, `url("${ART}/modal_parts/p_${k}.webp")`]),
        ])}
      >
        {/* from the back: the sky, then the island frame (palms, falls,
            clouds and the globe at its top, the sea along the bottom), in
            pieces so it fits any size, then everything in the machine */}
        <div className="imf-box imf-fill" aria-hidden>
          <span className="imf imf--inside" />
        </div>
        <div className="imf-box" aria-hidden>
          <span className="imf imf--rail-top imf--rail-top-l" />
          <span className="imf imf--rail-top imf--rail-top-r" />
          <span className="imf imf--rail-left" />
          <span className="imf imf--rail-right" />
          <span className="imf imf--rail-bottom" />
          <span className="imf imf--top-left" />
          <span className="imf imf--top-right" />
          <span className="imf imf--bottom-left" />
          <span className="imf imf--bottom-right" />
          <span className="imf imf--crown" />
        </div>
        <div className="imf-phone" aria-hidden>
          <span className="imp imp--rail-left" />
          <span className="imp imp--rail-right" />
          <span className="imp imp--top" />
          <span className="imp imp--bottom" />
        </div>
        {/* the machine's own things round the edges: its glowing stars, the
            clouds round the globe, and the pink ring that circles it */}
        <Twinkles />
        <div className="im-lid">
          <span className="im-ring" aria-hidden />
          <h2 id="im-title">
            <img src={`${ART}/island-maker-title.webp`} alt="Create An Island" />
          </h2>
          <small>
            <span>the World Island Maker · </span>at Brat Academy
          </small>
          {/* the three tabs, as the round buttons on the machine's stand; any
              can be visited in any order, and nothing's made until Create */}
          {!showRun && (
            <div className="im-sides" role="tablist" aria-label="The island maker">
              {TABS.map((t, i) => (
                <button key={t.tab} type="button" role="tab" aria-selected={tab === t.tab} className={tab === t.tab ? "is-on" : undefined} onClick={() => setTab(t.tab)}>
                  <i className={`im-side-dot im-side-dot--${t.tab}`} aria-hidden>
                    {t.dot}
                  </i>
                  <span className="im-side-n">{i + 1}.</span> <span className="im-side-long">{t.label}</span>
                  <span className="im-side-short">{t.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="wm-close sm-close im-close" onClick={close} aria-label="Close the island maker">
          ×
        </button>

        <div className="im-pane">
          {showRun && run ? (
            <Creating
              run={run}
              room={runRoom}
              onAgain={() => create("all")}
              onBack={() => setRun(null)}
              onVisit={() => {
                if (!run.id) return;
                onClose();
                goMade(run.id);
              }}
              onNew={() => {
                setDraft(EMPTY_DRAFT);
                setRun(null);
                setTab("room");
              }}
            />
          ) : tab === "room" ? (
            <RoomTab draft={draft} change={change} member={member} unfinished={unfinished} room={draftRoom} job={job} onCarryOn={(id) => change({ roomId: id })} />
          ) : tab === "island" ? (
            <IslandTab draft={draft} change={change} member={member} room={draftRoom} job={job} />
          ) : (
            <MapTab
              draft={draft}
              change={change}
              member={member}
              room={draftRoom}
              onVisit={(id) => {
                onClose();
                goMade(id);
              }}
            />
          )}
        </div>

        {/* back and next in the bottom corners, and on the last tab, the one
            button that makes it all */}
        {!showRun && (
          <div className="im-foot">
            {tab !== "room" ? (
              <button type="button" className="sm-btn im-foot-back" onClick={() => setTab(tab === "map" ? "island" : "room")}>
                ← {tab === "map" ? <>Island<span className="gen-long"> sticker</span></> : "Room"}
              </button>
            ) : (
              <span />
            )}
            {/* what each step does shows when the buttons are pointed at; only
                what's happening, or what went wrong, stays in view */}
            {job?.trouble || jobBusy ? (
              <small className="im-foot-say" aria-live="polite">
                {footSay}
              </small>
            ) : null}
            {/* a tab can put its photo tray here, beside the buttons */}
            <div id="im-foot-slot" className="im-foot-slot" />
            <span className="im-foot-right" title={footSay}>
              {/* the make-it buttons in the middle, Next in the corner */}
              <span className="im-foot-mid">
              {/* the room, once its master's painted and looked over: all its
                  other pictures, from it */}
              {member === true && tab === "room" && draftRoom?.pictures.master && !seasonsDone && (
                <button type="button" className="sm-btn im-foot-gen" disabled={jobBusy} onClick={() => create("seasons")}>
                  {jobBusy && job?.scope === "seasons" ? "Painting…" : <>✦ {Object.keys(draftRoom.pictures).length > 2 ? "Finish" : "Generate"} all 8<span className="gen-long"> pictures</span></>}
                </button>
              )}
              {member === true && (
                <button
                  type="button"
                  className="sm-btn im-foot-gen"
                  disabled={jobBusy || !!roomWanting}
                  title={roomWanting ? `It wants ${roomWanting} on Create room first` : undefined}
                  onClick={() => (tab === "room" ? create("room", !!draftRoom?.pictures.master) : create("island"))}
                >
                  {jobBusy
                    ? job?.scope === "seasons" && tab === "room"
                      ? "✦ Paint it again"
                      : "Painting…"
                    : tab === "room"
                      ? draftRoom?.pictures.master
                        ? "✦ Paint it again"
                        : <>✦ Gen<span className="gen-long">erate</span> room</>
                      : tab === "island"
                        ? draftRoom?.pictures.island
                          ? "✦ Paint it again"
                          : <>✦ Gen<span className="gen-long">erate</span> island</>
                        : draftRoom?.pictures.island
                          ? "✦ Paint its island again"
                          : "✦ Preview my island"}
                </button>
              )}
              </span>
              {tab !== "map" ? (
                <button type="button" className="sm-btn sm-btn--go im-foot-next" onClick={() => setTab(tab === "room" ? "island" : "map")}>
                  Next<span className="gen-long">: {tab === "room" ? "island sticker" : "map"}</span> →
                </button>
              ) : (
                <button type="button" className="sm-btn sm-btn--go im-foot-next im-create-btn" onClick={() => create("all")} disabled={member !== true || !!wanting || jobBusy}>
                  <span className="gen-long">🏝 Add my island to the map ♡</span><span className="gen-short">Add island 🗺</span>
                </button>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** who may make things: anyone may look; members make */
export function Door({ member, say = "Creating rooms is for members of the Palais. Sign in, and once you're accepted your photos can become a room anyone can walk into, with its own island on the map." }: { member: boolean | null; say?: string }) {
  const { me, busy, signIn } = useAccount();
  if (!me)
    return (
      <div className="im-door-note">
        <p>
          <span className="door-long">{say}</span>
          <span className="door-short">Members only: sign in to start.</span>
        </p>
        <button type="button" className="sm-btn sm-btn--go" onClick={signIn} disabled={busy}>
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>
      </div>
    );
  if (member === null)
    return (
      <div className="im-door-note">
        <p>Checking you're on the list…</p>
      </div>
    );
  if (!member)
    return (
      <div className="im-door-note">
        <p>You're signed in as {me.email}, and waiting to be accepted. Molly's been told: once she lets you in, the machine is yours.</p>
      </div>
    );
  return null;
}

export function useTaker(set: (f: (p: Photo[]) => Photo[]) => void, have: number, most: number) {
  const [trouble, setTrouble] = useState<string | null>(null);
  const take = async (files: FileList | null | undefined) => {
    if (!files?.length) return;
    setTrouble(null);
    const space = most - have;
    const picked = Array.from(files).filter((f) => /^image\//.test(f.type)).slice(0, space);
    if (!picked.length) return setTrouble(space ? "Those aren't photos." : `That's ${most} photos, which is all it takes.`);
    try {
      const shrunk = await Promise.all(picked.map(shrinkPhoto));
      set((p) => [...p, ...shrunk].slice(0, most));
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    }
  };
  return { take, trouble };
}

/** what a tab puts on the footer, beside its buttons (the slot the machine leaves there) */
function FootSlot({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => setSlot(document.getElementById("im-foot-slot")), []);
  return slot ? createPortal(children, slot) : null;
}

/* ---- 1. the room ---- */

const TEMPLATE_SEASONS = ["spring", "summer", "autumn", "winter"] as const;
const SEASON_DOTS: Record<(typeof TEMPLATE_SEASONS)[number], string> = { spring: "🌸", summer: "☀️", autumn: "🍂", winter: "❄️" };
const roomTemplate = (device: "desktop" | "mobile", season: string) => `${ART}/room_templates/room-template-${device}-${season}.webp`;

/** the empty room every made room is painted in: the Palais's own mosaic
    floor and painted ceiling, on a computer and on a phone, in each season */
function RoomTemplates({ room, painting, changes }: { room?: MadeRoom; painting: boolean; changes?: { value: string; set: (v: string) => void } }) {
  const [season, setSeason] = useState<(typeof TEMPLATE_SEASONS)[number]>("spring");
  // once it's generated, the room itself in the season picked (spring on a
  // computer is the master; the rest come once it's right), else the template
  const wide = room?.pictures[`${season}-desktop`] ?? roomTemplate("desktop", season);
  const tall = room?.pictures[`${season}-mobile`] ?? roomTemplate("mobile", season);
  return (
    <div className="im-templates">
      <div className="im-templates-frames">
        <figure className={`im-screen im-screen--desktop${painting ? " is-painting" : ""}`}>
          <span className="im-screen-glass">
            <img src={wide} alt={`${room?.name ?? "The empty room"} on a computer, in ${season}`} />
          </span>
          <figcaption>Computer</figcaption>
        </figure>
        <figure className={`im-screen im-screen--mobile${painting ? " is-painting" : ""}`}>
          <span className="im-screen-glass">
            <img src={tall} alt={`${room?.name ?? "The empty room"} on a phone, in ${season}`} />
          </span>
          <figcaption>Phone</figcaption>
        </figure>
      </div>
      <div className="im-templates-say">
        <p>
          {room?.pictures.master ? (
            <>
              <b>{room.name}</b>, as painted: flip through the seasons to see each one.
            </>
          ) : (
            <>
              <b>Your room is painted in here,</b> on the Palais's own floor and ceiling, in all four seasons.
            </>
          )}
        </p>
        {/* the master's looked over: what to change when it's painted again */}
        {changes && (
          <label className="sm-field im-changes">
            <span>Anything to change?</span>
            <input value={changes.value} onChange={(e) => changes.set(e.target.value)} maxLength={300} placeholder="e.g. make the counter pink, and add a chandelier" />
          </label>
        )}
        <div className="im-seasons" role="tablist" aria-label="Season">
          {TEMPLATE_SEASONS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={season === s} className={`im-season im-season--${s}${season === s ? " is-on" : ""}`} onClick={() => setSeason(s)}>
              <i aria-hidden>{SEASON_DOTS[s]}</i>
              <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoomTab({ draft, change, member, unfinished, room, job, onCarryOn }: { draft: Draft; change: (d: Partial<Draft>) => void; member: boolean | null; unfinished: MadeRoom[]; room?: MadeRoom; job: Run | null; onCarryOn: (id: string) => void }) {
  const photos = useTaker((f) => change({ photos: f(draft.photos) }), draft.photos.length, MOST_PHOTOS);
  return (
    <div className="im-build im-build--fill">
      <Door member={member} />
      {/* the empty room beside its name and what it's like; then, the whole
          way across, the photos of what goes in it */}
      <div className="im-room-cols">
        <RoomTemplates
          room={room}
          painting={!!job && !job.trouble && (job.at === "plan" || job.at === "room")}
          changes={room?.pictures.master ? { value: draft.roomChanges, set: (v) => change({ roomChanges: v }) } : undefined}
        />
        <div className="im-col">
          <label className="sm-field">
            <span>The room's name</span>
            <input value={draft.name} onChange={(e) => change({ name: e.target.value })} maxLength={40} placeholder="e.g. The Strawberry Parlour" />
          </label>
          <label className="sm-field im-grow">
            <span>What should it be like?</span>
            <textarea
              value={draft.description}
              onChange={(e) => change({ description: e.target.value })}
              maxLength={2000}
              rows={3}
              placeholder="A pink sweet shop with a marble counter, jars of candy on glass shelves, and a window onto a snowy street…"
            />
          </label>
          <label className="sm-field im-grow">
            <span>
              Its story <small className="im-field-note">for its card on the World Map</small>
            </span>
            <textarea
              value={draft.story}
              onChange={(e) => change({ story: e.target.value })}
              maxLength={2000}
              rows={3}
              placeholder="My grandma ran a sweet shop on a snowy street in Kraków, and every winter she let me pick one jar to take home…"
            />
          </label>
          {member && unfinished.filter((r) => r.id !== draft.roomId).length > 0 && (
            <div className="im-unfinished">
              <span>Left part-made:</span>
              {unfinished
                .filter((r) => r.id !== draft.roomId)
                .map((r) => (
                  <button key={r.id} type="button" className="sm-btn" onClick={() => onCarryOn(r.id)}>
                    Finish {r.name} →
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
      {/* the photo tray, down on the footer beside the buttons */}
      <FootSlot>
      <div className="im-room-photos im-room-photos--foot">
        <PhotoTray
          photos={draft.photos}
          most={MOST_PHOTOS}
          onTake={photos.take}
          onDrop={(n) => change({ photos: draft.photos.filter((_, i) => i !== n) })}
          disabled={false}
          say={`Drop up to ${MOST_PHOTOS} photos of anything you love for it (a room, furniture, colours, a view out of the window)`}
          short="Upload photos for your room"
        />
        {photos.trouble && <p className="sm-trouble">{photos.trouble}</p>}
      </div>
      </FootSlot>
    </div>
  );
}

/* ---- 2. its island sticker ---- */
function IslandTab({ draft, change, member, room, job }: { draft: Draft; change: (d: Partial<Draft>) => void; member: boolean | null; room?: MadeRoom; job: Run | null }) {
  const photos = useTaker((f) => change({ islandPhotos: f(draft.islandPhotos) }), draft.islandPhotos.length, MOST_ISLAND_PHOTOS);
  const painting = !!job && !job.trouble && job.at !== "done";
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  /** where a picked piece sits on the template: where it was put, or spread
      along the island's edge to start */
  const spotOf = (id: string, n: number) => draft.islandPlaced[id] ?? { x: 0.2 + ((n * 0.27) % 0.6), y: 0.42 + ((n * 0.19) % 0.28) };
  const toggle = (id: string) => {
    const on = draft.islandScenery.includes(id);
    change({ islandScenery: on ? draft.islandScenery.filter((x) => x !== id) : [...draft.islandScenery, id] });
  };
  return (
    <div className="im-build im-build--fill">
      <Door member={member} />
      {/* two by two: the island and the scenery for it, then the photos for
          its outside and the words; each row's two the same height, and all
          four filling the tab */}
      <div className="im-island-grid">
        <div className={`im-island-stage${painting ? " is-painting" : ""}`}>
          {/* the template (or its island, once painted), with the picked
              scenery set out on it to drag about, just for fun: the painting
              puts it where it'd naturally grow */}
          <div className="im-island-canvas" ref={canvas}>
            <img src={room?.pictures.island ?? ISLAND_TEMPLATE} alt={room?.pictures.island ? `${room.name}'s island` : "The island template every room's island is painted on"} draggable={false} />
            {!room?.pictures.island &&
              draft.islandScenery.map((id, n) => {
                const sc = sceneryById.get(id);
                if (!sc) return null;
                const at = spotOf(id, n);
                return (
                  <span
                    key={id}
                    className="im-island-piece"
                    style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%`, width: `${Math.min(30, sc.w * 260)}%`, zIndex: 2 + Math.round(at.y * 100) }}
                    title={`${sc.name}: drag it about`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const r = canvas.current!.getBoundingClientRect();
                      drag.current = { id, dx: at.x - (e.clientX - r.left) / r.width, dy: at.y - (e.clientY - r.top) / r.height };
                    }}
                    onPointerMove={(e) => {
                      const d = drag.current;
                      if (!d || d.id !== id) return;
                      const r = canvas.current!.getBoundingClientRect();
                      const x = Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width + d.dx));
                      const y = Math.min(0.95, Math.max(0.1, (e.clientY - r.top) / r.height + d.dy));
                      change({ islandPlaced: { ...draft.islandPlaced, [id]: { x, y } } });
                    }}
                    onPointerUp={() => (drag.current = null)}
                    onDoubleClick={() => toggle(id)}
                  >
                    <img src={scenerySrc(id)} alt="" draggable={false} />
                  </span>
                );
              })}
            {painting && <span className="im-wait">{job?.at === "island" ? "Painting its island…" : "Painting the room first…"}</span>}
          </div>
          <small>
            {room?.pictures.island
              ? "Its island sticker, as painted: kept as a draft until you Create it on the map."
              : draft.islandScenery.length
                ? "Drag the scenery about the island (double-click one to take it off): it's all painted in when its island's made."
                : "The island template: your room's island is painted on it, so every island sits together on the map."}
          </small>
        </div>
        {/* pieces of the map's own scenery to be painted on it */}
        <div className="im-pick-scenery">
          <span className="im-carried-label">
            Scenery for its island <small>{draft.islandScenery.length ? `${draft.islandScenery.length} of ${MOST_ISLAND_SCENERY}` : `pick up to ${MOST_ISLAND_SCENERY}`}</small>
          </span>
          <div className="im-scenery-row">
            {SCENERY.filter((sc) => !sc.sky).map((sc) => {
              const on = draft.islandScenery.includes(sc.id);
              return (
                <button
                  key={sc.id}
                  type="button"
                  className={`im-scenery-tile${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  disabled={!on && draft.islandScenery.length >= MOST_ISLAND_SCENERY}
                  onClick={() => toggle(sc.id)}
                  title={on ? `${sc.name}: on its island` : `Put ${sc.name.toLowerCase()} on its island`}
                >
                  <img src={scenerySrc(sc.id)} alt="" draggable={false} loading="lazy" />
                  <span>{sc.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="im-island-cell">
          <PhotoTray
            photos={draft.islandPhotos}
            most={MOST_ISLAND_PHOTOS}
            onTake={photos.take}
            onDrop={(n) => change({ islandPhotos: draft.islandPhotos.filter((_, i) => i !== n) })}
            disabled={false}
            say={`Any photos for its outside? Drop up to ${MOST_ISLAND_PHOTOS}`}
          />
          {photos.trouble && <p className="sm-trouble">{photos.trouble}</p>}
        </div>
        <label className="sm-field im-grow">
          <span>What should its island be like?</span>
          <textarea
            value={draft.islandNotes}
            onChange={(e) => change({ islandNotes: e.target.value })}
            maxLength={1200}
            rows={4}
            placeholder="A pink sweet shop with a striped awning on a cliff, a candy-cane bridge, and a little beach of sugar-white sand…"
          />
        </label>
      </div>
    </div>
  );
}

/* ---- 3. the map ---- */
function MapTab({ draft, change, member, room, onVisit }: { draft: Draft; change: (d: Partial<Draft>) => void; member: boolean | null; room?: MadeRoom; onVisit: (id: string) => void }) {
  const maps = useIslandMaps();
  const open = maps[maps.length - 1];
  const t = templateOf(open);
  const made = useMadeRooms();
  const byId = useMemo(() => new Map(made.map((r) => [r.id, r])), [made]);
  // the open map, wearing the scenery as it's being dressed here
  const decor = draft.decor ?? open.decor;
  const map: MapRow = { ...open, decor };
  // the plot picked for the new room's island, unless someone's taken it since
  const plot = draft.plot !== null && !open.plots[draft.plot] ? draft.plot : null;

  const [shelf, setShelf] = useState<"plot" | "scenery">("plot");
  const [pickedIsland, setPickedIsland] = useState<number | null>(null);
  const [pickedDecor, setPickedDecor] = useState<number | null>(null);
  const [overPlot, setOverPlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [trouble, setTrouble] = useState<string | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ n: number; dx: number; dy: number; moved: boolean; x0: number; y0: number } | null>(null);
  const canDress = member === true;

  const setDecor = (next: Placed[]) => change({ decor: next });
  const boardPoint = (clientX: number, clientY: number) => {
    const r = board.current?.getBoundingClientRect();
    if (!r) return { x: 0.5, y: 0.5 };
    return { x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)) };
  };
  const addDecor = (id: string, at?: { x: number; y: number }) => {
    const sc = sceneryById.get(id);
    if (!sc) return;
    const n = Math.max(0, ...decor.map((d) => d.n)) + 1;
    // somewhere to start that isn't on top of the last one put down
    const spot = at ?? { x: 0.3 + ((n * 0.137) % 0.4), y: sc.sky ? 0.1 + ((n * 0.05) % 0.12) : 0.45 + ((n * 0.11) % 0.3) };
    setDecor([...decor, { n, id, x: spot.x, y: spot.y, s: 1 }]);
    setPickedDecor(n);
    setPickedIsland(null);
    noteDoing("island-scenery", id);
  };
  const updateDecor = (n: number, patch: Partial<Placed>) => setDecor(decor.map((d) => (d.n === n ? { ...d, ...patch } : d)));
  const removeDecor = (n: number) => {
    setDecor(decor.filter((d) => d.n !== n));
    setPickedDecor(null);
  };
  const picked = pickedDecor !== null ? decor.find((d) => d.n === pickedDecor) : undefined;
  const pickedScenery = picked ? sceneryById.get(picked.id) : undefined;
  const islandHere = pickedIsland !== null ? byId.get(open.plots[pickedIsland]) : undefined;

  /** scatter some scenery: clouds and a mountain in the sky, and trees and
      flowers about the land, clear of the plots */
  const scatter = () => {
    const pick = <T,>(xs: T[], k: number) => [...xs].sort(() => Math.random() - 0.5).slice(0, k);
    const sky = pick(SCENERY.filter((sc) => sc.sky), 3);
    const land = pick(SCENERY.filter((sc) => sc.shelf === "Trees & palms" || sc.shelf === "Flowers"), 7);
    let n = Math.max(0, ...decor.map((d) => d.n));
    const clear = (x: number, y: number) => t.plots.every((p) => Math.hypot(p.x - x, p.y - y) > 0.11);
    const spot = () => {
      for (let i = 0; i < 40; i++) {
        const x = 0.15 + Math.random() * 0.7;
        const y = 0.3 + Math.random() * 0.45;
        if (clear(x, y)) return { x, y };
      }
      return { x: 0.2 + Math.random() * 0.6, y: 0.35 + Math.random() * 0.4 };
    };
    setDecor([
      ...decor,
      ...sky.map((sc, i) => ({ n: ++n, id: sc.id, x: 0.15 + i * 0.35 + Math.random() * 0.1, y: 0.06 + Math.random() * 0.1, s: 1 })),
      ...land.map((sc) => ({ n: ++n, id: sc.id, ...spot(), s: 0.85 + Math.random() * 0.3, flip: Math.random() < 0.5 })),
    ]);
    setPickedDecor(null);
  };

  /** which plot a point on the board is nearest, within reach */
  const plotAt = (clientX: number, clientY: number) => {
    const { x, y } = boardPoint(clientX, clientY);
    let best: number | null = null;
    let d = 0.16;
    t.plots.forEach((p, i) => {
      const dd = Math.hypot(p.x - x, p.y - y);
      if (dd < d) {
        d = dd;
        best = i;
      }
    });
    return best;
  };

  /* save it as a picture: the painting, the sky, then everything on the ground back to front */
  const savePicture = async () => {
    setSaving(true);
    try {
      const S = t.px;
      const c = document.createElement("canvas");
      c.width = S;
      c.height = S;
      const g = c.getContext("2d")!;
      const load = (src: string) =>
        new Promise<HTMLImageElement>((ok, no) => {
          const i = new Image();
          // the made rooms' islands come from Supabase's storage, which allows it
          i.crossOrigin = "anonymous";
          i.onload = () => ok(i);
          i.onerror = () => no(new Error(`Couldn't load ${src}`));
          i.src = src;
        });
      g.drawImage(await load(t.src), 0, 0, S, S);
      const drawScenery = async (pl: Placed) => {
        const sc = sceneryById.get(pl.id)!;
        const img = await load(scenerySrc(pl.id));
        const w = sceneryWidth(sc, pl) * S;
        const h = (w * img.naturalHeight) / img.naturalWidth;
        g.save();
        g.translate(pl.x * S, pl.y * S);
        if (pl.flip) g.scale(-1, 1);
        g.drawImage(img, -w / 2, sc.sky ? -h / 2 : -h * FEET, w, h);
        g.restore();
      };
      const drawIsland = async (p: Plot, src: string) => {
        const img = await load(src);
        const w = islandWidth(p.y) * S;
        const h = (w * img.naturalHeight) / img.naturalWidth;
        g.save();
        g.fillStyle = "rgba(30, 20, 40, 0.28)";
        g.filter = "blur(8px)";
        g.beginPath();
        g.ellipse(p.x * S, p.y * S + h * (1 - LIFT) * 0.55, w * 0.42, w * 0.1, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
        g.drawImage(img, p.x * S - w / 2, p.y * S - h * LIFT, w, h);
      };
      for (const pl of decor.filter((d) => sceneryById.get(d.id)?.sky)) await drawScenery(pl);
      const things: { y: number; draw: () => Promise<void> }[] = decor.filter((d) => sceneryById.has(d.id) && !sceneryById.get(d.id)?.sky).map((pl) => ({ y: pl.y, draw: () => drawScenery(pl) }));
      t.plots.forEach((p, i) => {
        const src = byId.get(open.plots[i])?.pictures.island;
        if (src) things.push({ y: p.y, draw: () => drawIsland(p, src) });
      });
      for (const th of things.sort((a, b) => a.y - b.y)) await th.draw();
      const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
      if (!blob) throw new Error("Couldn't draw it");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `palais-island-${open.n}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    }
    setSaving(false);
  };

  const filled = Object.keys(open.plots).length;
  const newName = draft.name.trim() || "Your island";

  return (
    <div className="im-body">
      {/* the globe, open, with the map in it */}
      <div className="im-globe">
        <MapPainting
          map={map}
          rooms={byId}
          showPlots
          pickedPlot={pickedIsland}
          pickedDecor={pickedDecor}
          overPlot={overPlot}
          boardRef={board}
          ghost={plot !== null ? { plot, src: room?.pictures.island ?? ISLAND_TEMPLATE, name: newName } : undefined}
          onPlot={(i) => {
            change({ plot: plot === i ? null : i });
            setPickedIsland(null);
            setPickedDecor(null);
          }}
          onIsland={(i) => {
            setPickedIsland(pickedIsland === i ? null : i);
            setPickedDecor(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverPlot(plotAt(e.clientX, e.clientY));
          }}
          onDragLeave={() => setOverPlot(null)}
          onDrop={(e) => {
            e.preventDefault();
            setOverPlot(null);
            const scenery = e.dataTransfer.getData("text/x-scenery");
            if (scenery && canDress) addDecor(scenery, boardPoint(e.clientX, e.clientY));
          }}
          decorHandlers={
            canDress
              ? (pl) => ({
                  "aria-label": `${sceneryById.get(pl.id)?.name}. Drag it about, or press to pick it`,
                  onPointerDown: (e) => {
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    const at = boardPoint(e.clientX, e.clientY);
                    dragging.current = { n: pl.n, dx: pl.x - at.x, dy: pl.y - at.y, moved: false, x0: e.clientX, y0: e.clientY };
                  },
                  onPointerMove: (e) => {
                    const d = dragging.current;
                    if (!d || d.n !== pl.n) return;
                    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 4) return;
                    d.moved = true;
                    const at = boardPoint(e.clientX, e.clientY);
                    updateDecor(pl.n, { x: Math.min(1, Math.max(0, at.x + d.dx)), y: Math.min(1, Math.max(0, at.y + d.dy)) });
                  },
                  onPointerUp: () => {
                    const d = dragging.current;
                    dragging.current = null;
                    setPickedIsland(null);
                    setPickedDecor(d && !d.moved && pickedDecor === pl.n ? null : pl.n);
                  },
                  onKeyDown: (e) => {
                    const step = e.shiftKey ? 0.05 : 0.01;
                    const by: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
                    if (by[e.key]) {
                      e.preventDefault();
                      updateDecor(pl.n, { x: Math.min(1, Math.max(0, pl.x + by[e.key][0])), y: Math.min(1, Math.max(0, pl.y + by[e.key][1])) });
                    } else if (e.key === "Delete" || e.key === "Backspace") removeDecor(pl.n);
                  },
                })
              : undefined
          }
        />
      </div>

      {/* the stand */}
      <div className="im-stand">
        <div className="im-map-head">
          <b>Island {open.n}</b>
          <span>
            {filled} of {t.plots.length} plots taken{maps.length > 1 ? ` · ${maps.length - 1} island${maps.length > 2 ? "s" : ""} finished` : ""}
          </span>
        </div>
        <div className="im-say" aria-live="polite">
          {picked && pickedScenery ? (
            <span>
              <b>{pickedScenery.name}</b>: drag it about, size it, flip it, or take it off.
            </span>
          ) : islandHere ? (
            <>
              <span>
                <b>{islandHere.name}</b>, made by {islandHere.made_by_name?.split(" ")[0] ?? "a member"}.
              </span>
              <button type="button" className="sm-btn sm-btn--go im-visit" onClick={() => onVisit(islandHere.id)}>
                Walk in →
              </button>
            </>
          ) : shelf === "scenery" ? (
            "Press a piece of scenery to put it on the island, or drag it where you want it."
          ) : plot !== null ? (
            <span>
              <b>{newName}</b> goes on {t.plots[plot].name}. Press another empty plot to move it, then dress the island with scenery.
            </span>
          ) : (
            "Press an empty plot for your room's island to go on."
          )}
        </div>
        {canDress && picked && pickedScenery && (
          <div className="im-decor-tools">
            <label className="im-size">
              <span>Size</span>
              <input type="range" min={0.4} max={2.6} step={0.05} value={picked.s} onChange={(e) => updateDecor(picked.n, { s: Number(e.target.value) })} />
            </label>
            <button type="button" className="sm-btn" onClick={() => updateDecor(picked.n, { flip: !picked.flip })}>
              ⇋ Flip
            </button>
            <button type="button" className="sm-btn" onClick={() => removeDecor(picked.n)}>
              × Take off
            </button>
            <button type="button" className="sm-btn" onClick={() => setPickedDecor(null)}>
              Done
            </button>
          </div>
        )}
        <div className="im-shelves" role="tablist" aria-label="What to do on the island">
          <button type="button" role="tab" aria-selected={shelf === "plot"} className={shelf === "plot" ? "is-on" : undefined} onClick={() => setShelf("plot")}>
            🏝 Its plot
          </button>
          <button type="button" role="tab" aria-selected={shelf === "scenery"} className={shelf === "scenery" ? "is-on" : undefined} onClick={() => setShelf("scenery")}>
            🌸 Scenery
          </button>
        </div>
        {shelf === "scenery" ? (
          <div className="im-scenery" aria-label="The scenery">
            {SCENERY_SHELVES.map((sh) => (
              <section key={sh}>
                <h4>{sh}</h4>
                <div className="im-scenery-row" role="list">
                  {SCENERY.filter((sc) => sc.shelf === sh).map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      role="listitem"
                      className="im-scenery-tile"
                      draggable={canDress}
                      onDragStart={(e) => e.dataTransfer.setData("text/x-scenery", sc.id)}
                      onClick={() => canDress && addDecor(sc.id)}
                      disabled={!canDress}
                      title={`${sc.name}: press to put it on the island, or drag it there`}
                    >
                      <img src={scenerySrc(sc.id)} alt="" draggable={false} loading="lazy" />
                      <span>{sc.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <ol className="im-plots">
            {t.plots.map((p, i) => {
              const r = byId.get(open.plots[i]);
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={`${r ? "is-taken" : ""}${plot === i ? " is-on" : ""}`}
                    disabled={!!r}
                    onClick={() => change({ plot: plot === i ? null : i })}
                  >
                    <i>{i + 1}</i>
                    <span>
                      <b className="im-plot-icon" aria-hidden>
                        {p.icon}
                      </b>
                      {p.name}
                    </span>
                    <small>{r ? r.name : plot === i ? `${newName} ♡` : "empty"}</small>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {trouble && <p className="sm-trouble">{trouble}</p>}
        <div className="im-buttons">
          {canDress && (
            <button type="button" className="sm-btn" onClick={scatter}>
              ★ Scatter scenery
            </button>
          )}
          <button type="button" className="sm-btn" onClick={savePicture} disabled={saving}>
            {saving ? "Drawing it…" : "Save as a picture"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ---- making it ---- */
const RUN_STEPS: { at: Run["at"]; say: string }[] = [
  { at: "plan", say: "Claude plans the room" },
  { at: "room", say: "The room, in four seasons" },
  { at: "island", say: "Its island sticker" },
  { at: "map", say: "Onto the map" },
];

function Creating({ run, room, onAgain, onBack, onVisit, onNew }: { run: Run; room?: MadeRoom; onAgain: () => void; onBack: () => void; onVisit: () => void; onNew: () => void }) {
  const now = RUN_STEPS.findIndex((s) => s.at === run.at);
  const done = run.at === "done";
  return (
    <div className="im-build">
      <div className="im-progress">
        <h3>{done ? `${room?.name ?? "Your room"} is made! ♡` : room?.name ?? "Making your room…"}</h3>
        <ol className="im-steps" aria-label="How it's going">
          {RUN_STEPS.map((s, i) => (
            <li key={s.at} className={done || i < now ? "is-done" : i === now ? "is-now" : undefined}>
              <i>{done || i < now ? "✓" : i + 1}</i>
              {s.say}
            </li>
          ))}
        </ol>
        <div className="im-made">
          <div className={`im-master${run.painting.has("master") ? " is-painting" : ""}`}>
            {room?.pictures.master ? <img src={room.pictures.master} alt={`${room.name}`} /> : <span className="im-easel" aria-hidden />}
            {run.at === "plan" && !run.trouble && <span className="im-wait">Claude is planning it…</span>}
            {run.painting.has("master") && <span className="im-wait">Painting the room… a minute or two</span>}
          </div>
          <div className={`im-island-stage im-island-stage--small${run.painting.has("island") ? " is-painting" : ""}`}>
            <img src={room?.pictures.island ?? ISLAND_TEMPLATE} alt="" />
            <small>{room?.pictures.island ? "Its island" : run.painting.has("island") ? "Painting its island…" : "Its island, next"}</small>
          </div>
        </div>
        <ol className="im-pictures">
          {ROOM_PICTURES.slice(1).map((w) => (
            <li key={w} className={`${room?.pictures[w] ? "is-done" : ""}${run.painting.has(w) ? " is-painting" : ""}${/-mobile$/.test(w) ? " is-tall" : ""}`}>
              <span className="im-picture">{room?.pictures[w] ? <img src={room.pictures[w]} alt="" /> : <span className="im-easel" aria-hidden />}</span>
              <small>{pictureName(w)}</small>
            </li>
          ))}
        </ol>
        {run.trouble && (
          <p className="sm-trouble" role="alert">
            {run.trouble} What's made is kept.
          </p>
        )}
        <div className="sm-doing">
          {done ? (
            <>
              <button type="button" className="sm-btn" onClick={onNew}>
                Create another
              </button>
              <button type="button" className="sm-btn sm-btn--go" onClick={onVisit}>
                Walk into it ♡
              </button>
            </>
          ) : run.trouble ? (
            <>
              <button type="button" className="sm-btn" onClick={onBack}>
                ← Back to the tabs
              </button>
              {run.id && (
                <button type="button" className="sm-btn sm-btn--go" onClick={onAgain}>
                  Carry on making it ✦
                </button>
              )}
            </>
          ) : (
            <span className="sm-small">The seasons are painted two at a time, a minute or so each. You can close this: what's made is kept, and you can finish it from Create room.</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** the stars and clouds round the panel, drawn like the machine's: puffy
    white clouds and soft four-pointed stars that glow gold */
export function Twinkles() {
  const star = "M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z";
  return (
    <div className="im-twinkles" aria-hidden>
      {["a", "b", "c", "d", "e", "f"].map((k) => (
        <svg key={k} className={`im-star im-star--${k}`} viewBox="0 0 24 24">
          <path d={star} />
        </svg>
      ))}
      <span className="im-cloud im-cloud--a" />
      <span className="im-cloud im-cloud--b" />
      <span className="im-cloud im-cloud--c" />
    </div>
  );
}

/**
 * A framed maker's modal laid out as on a big window and shrunk, whole, to
 * fit a smaller one, so nothing has to scroll or run off the page. The
 * backdrop is made the size of that big window (a container, so the modal's
 * own measures go by it) and zoomed down to fill the real one. Phones keep
 * their own tall layout.
 */
const FIT_W = 1300;
const FIT_H = 1000;
export function useFitZoom() {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties | undefined>();
  useLayoutEffect(() => {
    const el = ref.current;
    const stage = el?.parentElement;
    if (!el || !stage) return;
    // the page may have been scrolled (a phone): bring the room fully into view, so the modal is too
    if (Math.abs(stage.getBoundingClientRect().top) > 1) stage.scrollIntoView({ block: "start", behavior: "auto" });
    const fit = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const k = Math.min(1, W / FIT_W, H / FIT_H);
      // even at full size it's measured against the room in view, never the whole page
      setStyle(W <= 760 ? undefined : { zoom: k, inset: "auto", left: 0, top: 0, width: W / k, height: H / k, containerType: "size" });
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    return () => watch.disconnect();
  }, []);
  return { ref, style };
}

/** photos pasted anywhere while the tray's showing go in it (as long as a
    picture's what was pasted: pasting words into a box is left alone) */
export function usePastedPhotos(take: (files: FileList) => void) {
  const latest = useRef(take);
  latest.current = take;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files?.length || !Array.from(files).some((f) => /^image\//.test(f.type))) return;
      e.preventDefault();
      latest.current(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);
}

/** a tray to drop photos in, glowing like the orb inside the globe */
export function PhotoTray({ photos, most, onTake, onDrop, disabled, say, short }: { photos: Photo[]; most: number; onTake: (files: FileList | null | undefined) => void; onDrop: (n: number) => void; disabled: boolean; say: string; short?: string }) {
  const [over, setOver] = useState(false);
  usePastedPhotos((files) => !disabled && onTake(files));
  return (
    <label
      className={`sm-tray im-tray${over ? " is-over" : ""}${photos.length ? " has-photo" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onTake(e.dataTransfer.files);
      }}
    >
      <input type="file" accept="image/*" multiple onChange={(e) => onTake(e.target.files)} disabled={disabled || photos.length >= most} hidden />
      {photos.length ? (
        <span className="im-photos">
          {photos.map((p, n) => (
            <span key={n} className="im-photo">
              <img src={p.preview} alt={`What you put in, ${n + 1}`} />
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Take photo ${n + 1} out`}
                  onClick={(e) => {
                    e.preventDefault();
                    onDrop(n);
                  }}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {photos.length < most && <span className="im-photo im-photo--more">＋</span>}
        </span>
      ) : (
        <span className="sm-tray-say">
          <span className="sm-tray-icon" aria-hidden />
          <span>
            <span className="tray-long">
              {say}, paste them in, or press to <span className="sm-upload">upload them</span>
            </span>
            {short && (
              <span className="tray-short">
                <span className="sm-upload">{short}</span> ✨
              </span>
            )}
          </span>
        </span>
      )}
    </label>
  );
}

