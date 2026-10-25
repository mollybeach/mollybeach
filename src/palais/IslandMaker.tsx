import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePlace, type Place } from "./place";
import { ROOM_LIST } from "./WorldMap";
import { amIAccepted, askForReview, noteDoing } from "./visits";
import { useAccount } from "../components/AccountCard";
import { shrinkPhoto } from "./stickerCut";
import { ALL_PICTURES, goMade, loadRooms, paintRoom, planRoom, useMadeRooms, type MadeRoom } from "./madeRooms";

/**
 * The World Island Maker at Brat Academy: a globe that opens on a stand, on the
 * row of desks beside the sticker maker (StickerMaker.tsx), standing where
 * that one stands and just to its right (or its left, where a narrow screen
 * leaves no room).
 *
 * Press it and it opens as the machine, with two sides:
 *
 * - Build a room: a member puts in a few photos and says what room they want,
 *   and the palais-rooms function has Claude plan it and OpenAI's image model
 *   paint it (docs/island-maker-prompts.md): first one master room on the
 *   Palais's own floor and ceiling, to be looked at and painted again until
 *   it's right; then its four seasons, wide and tall, and its own little
 *   island. Then anyone can walk into it (MadeRoom.tsx, madeRooms.ts).
 *
 * - The island: an empty painted island with plots on it, and every room's
 *   island as a disc on the stand, the made ones first. Put a disc on a plot
 *   and that room's island goes there, drawn smaller the further back it
 *   sits so it looks like it belongs; pick one that's down to walk into it.
 *   Name the island, and save it as a picture. The island is kept in this
 *   browser (KEPT).
 */

const ART = `${process.env.PUBLIC_URL}/palais_assets/modal_content/island_maker`;
const MACHINE = `${ART}/world_island_maker_machine_sticker.webp?v=2`;
/** the machine's own shape (1253 × 1254) */
const SHAPE = 1254 / 1253;
/** as wide as the sticker maker beside it, times this */
const SIZE = 1.05;
/** and this far to the right of it, in pixels */
const GAP = 6;

interface Plot {
  name: string;
  /** the middle of the plot, as a fraction of the square painting */
  x: number;
  y: number;
  water?: boolean;
}

interface IslandMap {
  id: string;
  name: string;
  src: string;
  /** the painting's size, in pixels (it's square) */
  px: number;
  plots: Plot[];
}

/** the empty islands to build on. Each painting's plots were found by eye */
const MAPS: IslandMap[] = [
  {
    id: "sunset",
    name: "Sunset Isle",
    src: `${ART}/island_map_template.webp`,
    px: 1254,
    plots: [
      { name: "The summit", x: 0.459, y: 0.226 },
      { name: "West terrace", x: 0.335, y: 0.329 },
      { name: "East terrace", x: 0.682, y: 0.325 },
      { name: "Cliffside", x: 0.861, y: 0.472 },
      { name: "The meadow", x: 0.287, y: 0.524 },
      { name: "The lagoon", x: 0.606, y: 0.585, water: true },
      { name: "The beach", x: 0.51, y: 0.705 },
      { name: "Out at sea", x: 0.51, y: 0.89, water: true },
    ],
  },
];

/** how wide an island is drawn, as a fraction of the painting: smaller the
    further back (higher up) its plot is, as the painting's own trees are */
const widthAt = (y: number) => 0.19 * (0.72 + 0.5 * y);
/** and how much of it sits above its plot's middle: the islands' ground is
    the bottom of the picture, so most of it stands up from the plot */
const LIFT = 0.72;

const KEPT = "palais-island-maker";
interface Kept {
  map: string;
  name: string;
  /** which room's island is on each plot, by the plot's number: a room's own
      name, or "made:<id>" for a made one */
  on: Record<number, string>;
}
function loadKept(): Kept {
  try {
    const k = JSON.parse(localStorage.getItem(KEPT) ?? "null");
    if (k && typeof k === "object" && k.on) return { map: String(k.map ?? MAPS[0].id), name: String(k.name ?? ""), on: k.on };
  } catch {
    /* nothing kept, or it can't be read */
  }
  return { map: MAPS[0].id, name: "", on: {} };
}
function keep(k: Kept) {
  try {
    localStorage.setItem(KEPT, JSON.stringify(k));
  } catch {
    /* private browsing: it just isn't kept */
  }
}

/** a disc on the stand: a room of the Palais, or one made here */
interface Disc {
  key: string;
  name: string;
  icon: string;
  made?: MadeRoom;
  /** how much of it stands above its plot (LIFT), and how big it's drawn */
  lift: number;
  scale: number;
}
/** a made room's island is square, its whole coastline in view and its
    ground lower in the picture than the map's own 3:2 islands */
const MADE_LIFT = 0.8;
const MADE_SCALE = 0.86;

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
      const other = stage.querySelector<HTMLElement>(".palais-stickermaker:not(.palais-islandmaker)");
      if (!other || other.style.visibility !== "visible") return;
      const w = other.offsetWidth * SIZE;
      const h = w * SHAPE;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      // on a narrow screen the sticker maker's been slid right, and there's
      // no room past it: then this one stands on its left instead
      const right = other.offsetLeft + other.offsetWidth + GAP;
      el.style.left = `${right + w > stage.clientWidth - 4 ? other.offsetLeft - GAP - w : right}px`;
      el.style.top = `${other.offsetTop + other.offsetHeight - h}px`;
      el.style.visibility = "visible";
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200);
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
          <span>🏝 Make an island</span>
          <small>add room to the map</small>
        </span>
      </button>
      {open && <Machine onClose={() => setOpen(false)} />}
    </>
  );
}

function Machine({ onClose }: { onClose: () => void }) {
  const [side, setSide] = useState<"build" | "island">("build");
  // while a room's being painted, closing would lose sight of it (it carries on
  // being kept, and can be finished later), so it asks first
  const [working, setWorking] = useState(false);
  const close = useCallback(() => {
    if (working && !window.confirm("A room's still being painted. Close anyway? You can finish it later.")) return;
    onClose();
  }, [working, onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  /** a room just built, to be put on the island */
  const [toPlace, setToPlace] = useState<string | null>(null);

  return (
    <div className="wm-backdrop sm-backdrop im-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="wm-panel sm-panel im-panel" role="dialog" aria-modal="true" aria-labelledby="im-title">
        <span className="im-spark im-spark--a" aria-hidden>✦</span>
        <span className="im-spark im-spark--b" aria-hidden>★</span>
        <span className="im-spark im-spark--c" aria-hidden>✦</span>
        <div className="im-lid">
          <h2 id="im-title">
            <span>World</span> Island Maker
          </h2>
          <small>at Brat Academy 🏝</small>
          <div className="im-sides" role="tablist" aria-label="The island maker">
            <button type="button" role="tab" aria-selected={side === "build"} className={side === "build" ? "is-on" : undefined} onClick={() => setSide("build")}>
              ✦ Build a room
            </button>
            <button type="button" role="tab" aria-selected={side === "island"} className={side === "island" ? "is-on" : undefined} onClick={() => setSide("island")}>
              🏝 The island
            </button>
          </div>
        </div>
        <button type="button" className="wm-close sm-close im-close" onClick={close} aria-label="Close the island maker">
          ×
        </button>

        {/* both stay put while the other's showing, so a room being painted
            carries on while you look at the island */}
        <div hidden={side !== "build"}>
          <Builder
            onWorking={setWorking}
            onPlace={(id) => {
              setToPlace(id);
              setSide("island");
            }}
            onVisit={(id) => {
              onClose();
              goMade(id);
            }}
          />
        </div>
        <div hidden={side !== "island"}>
          <Island toPlace={toPlace} onPlaced={() => setToPlace(null)} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ---- building a room ----------------------------------------------------- */

const MOST_PHOTOS = 4;
/** the pictures painted after the master, in order, and two at a time */
const AFTER_MASTER = ALL_PICTURES.filter((w) => w !== "master");
const AT_ONCE = 2;
const PICTURE_NAMES: Record<string, string> = { master: "The room", island: "Its island" };
const pictureName = (w: string) => PICTURE_NAMES[w] ?? w.replace(/^(\w+)-(\w+)$/, (_, s: string, d: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)} · ${d === "desktop" ? "computer" : "phone"}`);

type Build =
  | { at: "form" }
  | { at: "planning" }
  | { at: "master"; id: string; painting: boolean }
  | { at: "rest"; id: string }
  | { at: "done"; id: string };

function Builder({ onWorking, onPlace, onVisit }: { onWorking: (on: boolean) => void; onPlace: (id: string) => void; onVisit: (id: string) => void }) {
  const { me, busy, signIn } = useAccount();
  const [accepted, setAccepted] = useState<boolean | null>(null);
  useEffect(() => {
    if (!me) return setAccepted(null);
    let gone = false;
    amIAccepted().then((ok) => {
      if (gone) return;
      setAccepted(ok);
      if (!ok) askForReview();
    });
    return () => {
      gone = true;
    };
  }, [me]);

  const rooms = useMadeRooms();
  // signed in, your own unfinished rooms come too
  useEffect(() => {
    if (me) loadRooms(true);
  }, [me]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<{ b64: string; type: string; preview: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [build, setBuild] = useState<Build>({ at: "form" });
  const [painting, setPainting] = useState<Set<string>>(new Set());
  const [trouble, setTrouble] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const room = "id" in build ? rooms.find((r) => r.id === build.id) : undefined;
  const working = build.at === "planning" || (build.at === "master" && build.painting) || build.at === "rest";
  useEffect(() => onWorking(working), [working, onWorking]);

  const take = useCallback(async (files: FileList | null | undefined) => {
    if (!files?.length) return;
    setTrouble(null);
    const room = MOST_PHOTOS - photos.length;
    const picked = Array.from(files).filter((f) => /^image\//.test(f.type)).slice(0, room);
    if (!picked.length) return setTrouble(room ? "Those aren't photos." : `That's ${MOST_PHOTOS} photos, which is all it takes.`);
    try {
      const shrunk = await Promise.all(picked.map(shrinkPhoto));
      setPhotos((p) => [...p, ...shrunk].slice(0, MOST_PHOTOS));
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    }
  }, [photos.length]);

  /** paint the master (again) */
  const paintMaster = useCallback(async (id: string) => {
    setTrouble(null);
    setBuild({ at: "master", id, painting: true });
    try {
      await paintRoom(id, "master");
      noteDoing("room-master", id);
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    }
    setBuild({ at: "master", id, painting: false });
  }, []);

  /* the photos and words in, the room planned, and its master painted */
  const design = useCallback(async () => {
    if (!photos.length) return setTrouble("Put in at least one photo of what you'd like.");
    if (!description.trim()) return setTrouble("Say a little about the room you want.");
    setTrouble(null);
    setBuild({ at: "planning" });
    try {
      const got = await planRoom(name.trim(), description.trim(), photos.map((p) => ({ image: p.b64, type: p.type })));
      if (!got.ok) {
        setBuild({ at: "form" });
        return setTrouble(got.why);
      }
      noteDoing("room-planned", got.room.name);
      await paintMaster(got.room.id);
    } catch (e) {
      setBuild({ at: "form" });
      setTrouble(e instanceof Error ? e.message : String(e));
    }
  }, [photos, name, description, paintMaster]);

  /* and everything painted from the master: whatever's still missing */
  const buildRest = useCallback(async (id: string) => {
    setTrouble(null);
    setBuild({ at: "rest", id });
    const have = () => rooms.find((r) => r.id === id)?.pictures ?? {};
    const queue = AFTER_MASTER.filter((w) => !have()[w]);
    let failed: string | null = null;
    const worker = async () => {
      for (let w = queue.shift(); w; w = queue.shift()) {
        const what = w;
        setPainting((s) => new Set(s).add(what));
        try {
          await paintRoom(id, what);
        } catch (e) {
          failed = e instanceof Error ? e.message : String(e);
          queue.length = 0;
        }
        setPainting((s) => {
          const n = new Set(s);
          n.delete(what);
          return n;
        });
      }
    };
    await Promise.all(Array.from({ length: AT_ONCE }, worker));
    if (failed) {
      setTrouble(`${failed} What's painted is kept: carry on to paint the rest.`);
      setBuild({ at: "master", id, painting: false });
    } else {
      noteDoing("room-ready", id);
      setBuild({ at: "done", id });
    }
  }, [rooms]);

  /** a new island for a finished room, the room itself untouched */
  const repaintIsland = useCallback(async (id: string) => {
    setTrouble(null);
    setBuild({ at: "rest", id });
    setPainting(new Set(["island"]));
    try {
      await paintRoom(id, "island");
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    }
    setPainting(new Set());
    setBuild({ at: "done", id });
  }, []);

  const again = () => {
    setName("");
    setDescription("");
    setPhotos([]);
    setTrouble(null);
    setBuild({ at: "form" });
  };

  // the only unfinished rooms anyone's sent are their own (the table's rule)
  const unfinished = me ? rooms.filter((r) => r.status !== "ready") : [];

  if (!me)
    return (
      <div className="sm-door im-door">
        <p>Building rooms is for members of the Palais. Sign in, and once you're accepted you can turn your own photos into a room anyone can walk into, with its own island on the map.</p>
        <button type="button" className="sm-btn sm-btn--go" onClick={signIn} disabled={busy}>
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>
      </div>
    );
  if (accepted === null)
    return (
      <div className="sm-door im-door">
        <p>Checking you're on the list…</p>
      </div>
    );
  if (!accepted)
    return (
      <div className="sm-door im-door">
        <p>You're signed in as {me.email}, and waiting to be accepted. Molly's been told: once she lets you in, the machine is yours.</p>
      </div>
    );

  return (
    <div className="im-build">
      {build.at === "form" || build.at === "planning" ? (
        <form
          className="im-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            design();
          }}
        >
          {/* the photos go in the globe's tray, like the discs */}
          <label
            className={`sm-tray im-tray${dragging ? " is-over" : ""}${photos.length ? " has-photo" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              take(e.dataTransfer.files);
            }}
          >
            <input ref={input} type="file" accept="image/*" multiple onChange={(e) => take(e.target.files)} disabled={build.at === "planning" || photos.length >= MOST_PHOTOS} hidden />
            {photos.length ? (
              <span className="im-photos">
                {photos.map((p, n) => (
                  <span key={n} className="im-photo">
                    <img src={p.preview} alt={`What you put in, ${n + 1}`} />
                    {build.at === "form" && (
                      <button
                        type="button"
                        aria-label={`Take photo ${n + 1} out`}
                        onClick={(e) => {
                          e.preventDefault();
                          setPhotos((ps) => ps.filter((_, i) => i !== n));
                        }}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {photos.length < MOST_PHOTOS && <span className="im-photo im-photo--more">＋</span>}
              </span>
            ) : (
              <span className="sm-tray-say">
                <span className="sm-tray-icon" aria-hidden />
                <span>
                  Drop up to {MOST_PHOTOS} photos of what you'd like your room to be, or press to <span className="sm-upload">upload them</span>
                </span>
              </span>
            )}
          </label>
          <label className="sm-field">
            <span>The room's name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. The Strawberry Parlour" disabled={build.at === "planning"} />
          </label>
          <label className="sm-field">
            <span>What should it be like?</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="A pink sweet shop with a marble counter, jars of candy on glass shelves, and a window onto a snowy street…"
              disabled={build.at === "planning"}
            />
          </label>
          <div className="sm-doing">
            <span className="sm-small">It keeps the Palais's own floor and ceiling, and builds your room between them.</span>
            <button type="submit" className="sm-btn sm-btn--go" disabled={build.at === "planning"}>
              {build.at === "planning" ? "Claude is planning it…" : "Design my room ✦"}
            </button>
          </div>
          {unfinished.length > 0 && build.at === "form" && (
            <div className="im-unfinished">
              <span>Still being built:</span>
              {unfinished.map((r) => (
                <button key={r.id} type="button" className="sm-btn" onClick={() => (r.pictures.master ? setBuild({ at: "master", id: r.id, painting: false }) : paintMaster(r.id))}>
                  {r.name} →
                </button>
              ))}
            </div>
          )}
        </form>
      ) : (
        room && (
          <div className="im-progress">
            <h3>{room.name}</h3>
            {/* the master, big: what every other picture is painted from */}
            <div className={`im-master${build.at === "master" && build.painting ? " is-painting" : ""}`}>
              {room.pictures.master ? <img src={room.pictures.master} alt={`${room.name}, the master`} /> : <span className="im-easel" aria-hidden />}
              {build.at === "master" && build.painting && <span className="im-wait">Painting the room… it takes a minute or two</span>}
            </div>
            {/* and everything painted from it */}
            <ol className="im-pictures">
              {AFTER_MASTER.map((w) => (
                <li key={w} className={`${room.pictures[w] ? "is-done" : ""}${painting.has(w) ? " is-painting" : ""}${w === "island" ? " is-island" : ""}${/-mobile$/.test(w) ? " is-tall" : ""}`}>
                  <span className="im-picture">{room.pictures[w] ? <img src={room.pictures[w]} alt="" /> : <span className="im-easel" aria-hidden />}</span>
                  <small>{pictureName(w)}</small>
                </li>
              ))}
            </ol>
            <div className="sm-doing">
              {build.at === "done" ? (
                <>
                  <button type="button" className="sm-btn" onClick={again}>
                    Build another
                  </button>
                  <button type="button" className="sm-btn" onClick={() => repaintIsland(room.id)}>
                    Paint its island again
                  </button>
                  <button type="button" className="sm-btn" onClick={() => onPlace(room.id)}>
                    🏝 Put it on the island
                  </button>
                  <button type="button" className="sm-btn sm-btn--go" onClick={() => onVisit(room.id)}>
                    Walk into it ♡
                  </button>
                </>
              ) : build.at === "rest" ? (
                <span className="sm-small">Painting the seasons and its island, two at a time. Each takes a minute or so.</span>
              ) : (
                <>
                  <button type="button" className="sm-btn" onClick={() => paintMaster(room.id)} disabled={build.painting}>
                    Paint it again
                  </button>
                  <button type="button" className="sm-btn sm-btn--go" onClick={() => buildRest(room.id)} disabled={build.painting || !room.pictures.master}>
                    {AFTER_MASTER.some((w) => room.pictures[w]) ? "Carry on building ♡" : "That's it, build the rest ♡"}
                  </button>
                </>
              )}
            </div>
          </div>
        )
      )}
      {trouble && (
        <p className="sm-trouble" role="alert">
          {trouble}
        </p>
      )}
    </div>
  );
}

/* ---- the island ---------------------------------------------------------- */

function Island({ toPlace, onPlaced, onClose }: { toPlace: string | null; onPlaced: () => void; onClose: () => void }) {
  const { go } = usePlace();
  const [kept, setKept] = useState(loadKept);
  const map = MAPS.find((m) => m.id === kept.map) ?? MAPS[0];
  const made = useMadeRooms();
  const discs = useMemo<Disc[]>(
    () => [
      ...made.filter((r) => r.status === "ready" && r.pictures.island).map((r) => ({ key: `made:${r.id}`, name: r.name, icon: r.pictures.island, made: r, lift: MADE_LIFT, scale: MADE_SCALE })),
      ...ROOM_LIST.map((r) => ({ key: r.room as string, name: r.name, icon: r.icon, lift: LIFT, scale: 1 })),
    ],
    [made],
  );
  const byKey = useMemo(() => new Map(discs.map((d) => [d.key, d])), [discs]);
  /** the plot that's picked, for the next disc to go on */
  const [picked, setPicked] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const board = useRef<HTMLDivElement>(null);

  const change = useCallback((next: Partial<Kept>) => {
    setKept((k) => {
      const out = { ...k, ...next };
      keep(out);
      return out;
    });
  }, []);

  const used = new Set(Object.values(kept.on));
  const firstEmpty = () => map.plots.findIndex((_, i) => !kept.on[i]);

  /** put a room's island on a plot (the picked one, or the first that's empty),
      taking it off wherever else it was */
  const put = useCallback(
    (key: string, at: number | null) => {
      if (at === null || at < 0) return;
      const on: Record<number, string> = {};
      for (const [k, v] of Object.entries(kept.on)) if (v !== key) on[Number(k)] = v;
      on[at] = key;
      change({ on });
      setPicked(null);
      noteDoing("island-placed", key);
    },
    [kept.on, change],
  );

  /* a room just built goes straight on the first empty plot (or the beach) */
  useEffect(() => {
    if (!toPlace || !byKey.has(`made:${toPlace}`)) return;
    const empty = map.plots.findIndex((_, i) => !kept.on[i]);
    put(`made:${toPlace}`, empty >= 0 ? empty : 6);
    onPlaced();
  }, [toPlace, byKey, map.plots, kept.on, put, onPlaced]);

  const lift = (at: number) => {
    const on = { ...kept.on };
    delete on[at];
    change({ on });
    setPicked(at);
  };
  /** move an island from one plot to another, swapping with whatever's there */
  const move = (from: number, to: number) => {
    if (from === to) return;
    const on = { ...kept.on };
    const a = on[from];
    const b = on[to];
    if (b) on[from] = b;
    else delete on[from];
    on[to] = a;
    change({ on });
  };
  const surprise = () => {
    const pool = discs.map((d) => d.key).sort(() => Math.random() - 0.5);
    const on: Record<number, string> = {};
    map.plots.forEach((_, i) => (on[i] = pool[i % pool.length]));
    change({ on });
    setPicked(null);
  };
  const visit = (d: Disc) => {
    onClose();
    if (d.made) goMade(d.made.id);
    else go(d.key as Place);
  };

  /** which plot a point on the board is nearest, within reach */
  const plotAt = (clientX: number, clientY: number) => {
    const r = board.current?.getBoundingClientRect();
    if (!r) return null;
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    let best: number | null = null;
    let d = 0.16;
    map.plots.forEach((p, i) => {
      const dd = Math.hypot(p.x - x, p.y - y);
      if (dd < d) {
        d = dd;
        best = i;
      }
    });
    return best;
  };

  /* save it as a picture: the painting, then the islands back to front */
  const savePicture = async () => {
    setSaving(true);
    try {
      const S = map.px;
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
      g.drawImage(await load(map.src), 0, 0, S, S);
      const order = map.plots.map((p, i) => ({ p, d: byKey.get(kept.on[i]) })).filter((o): o is { p: Plot; d: Disc } => !!o.d).sort((a, b) => a.p.y - b.p.y);
      for (const { p, d } of order) {
        const img = await load(d.icon);
        const w = widthAt(p.y) * d.scale * S;
        const h = (w * img.naturalHeight) / img.naturalWidth;
        g.save();
        g.fillStyle = "rgba(30, 20, 40, 0.28)";
        g.filter = "blur(8px)";
        g.beginPath();
        g.ellipse(p.x * S, p.y * S + h * (1 - d.lift) * 0.55, w * 0.42, w * 0.1, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
        g.drawImage(img, p.x * S - w / 2, p.y * S - h * d.lift, w, h);
      }
      const title = kept.name.trim();
      if (title) {
        g.font = `700 ${Math.round(S * 0.05)}px Fredoka, ui-rounded, system-ui, sans-serif`;
        g.textAlign = "center";
        g.lineJoin = "round";
        g.lineWidth = S * 0.012;
        g.strokeStyle = "#3d3030";
        g.strokeText(title, S / 2, S * 0.08);
        g.fillStyle = "#fff";
        g.fillText(title, S / 2, S * 0.08);
      }
      const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
      if (!blob) throw new Error("Couldn't draw it");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(title || map.name).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "my-island"}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      noteDoing("island-saved", title || map.name);
    } finally {
      setSaving(false);
    }
  };

  const count = Object.keys(kept.on).filter((k) => byKey.has(kept.on[Number(k)])).length;
  const pickedDisc = picked !== null ? byKey.get(kept.on[picked]) : undefined;

  return (
    <div className="im-body">
      {/* the globe, open, with the island in it */}
      <div className="im-globe">
        <div
          ref={board}
          className="im-board"
          onDragOver={(e) => {
            e.preventDefault();
            setOver(plotAt(e.clientX, e.clientY));
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(null);
            const at = plotAt(e.clientX, e.clientY);
            if (at === null) return;
            const key = e.dataTransfer.getData("text/x-room");
            const from = e.dataTransfer.getData("text/x-plot");
            if (key) put(key, at);
            else if (from !== "") move(Number(from), at);
          }}
        >
          <img className="im-map" src={map.src} alt={`${map.name}, an empty island`} draggable={false} />
          {map.plots.map((p, i) => {
            const d = byKey.get(kept.on[i]);
            const w = widthAt(p.y) * (d?.scale ?? 1);
            return d ? (
              <button
                key={i}
                type="button"
                className={`im-placed${picked === i ? " is-picked" : ""}${over === i ? " is-over" : ""}`}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${w * 100}%`, zIndex: 10 + Math.round(p.y * 100), translate: `-50% -${d.lift * 100}%`, transformOrigin: `50% ${d.lift * 100}%` }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/x-plot", String(i))}
                onClick={() => setPicked(picked === i ? null : i)}
                aria-label={`${d.name} on ${p.name}. Press to pick it`}
                title={`${d.name} · ${p.name}`}
              >
                <span className="im-shadow" aria-hidden />
                <img src={d.icon} alt="" draggable={false} />
                {picked === i && (
                  <span
                    className="im-lift"
                    role="button"
                    tabIndex={0}
                    aria-label={`Take ${d.name} off`}
                    onClick={(e) => {
                      e.stopPropagation();
                      lift(i);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        lift(i);
                      }
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            ) : (
              <button
                key={i}
                type="button"
                className={`im-plot${p.water ? " im-plot--water" : ""}${picked === i ? " is-picked" : ""}${over === i ? " is-over" : ""}`}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${w * 100 * 0.62}%` }}
                onClick={() => setPicked(picked === i ? null : i)}
                aria-label={`${p.name}, empty. Press to pick it, then pick a room`}
                title={p.name}
              >
                <span>{i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* the stand: its name, the discs, and its buttons */}
      <div className="im-stand">
        <label className="sm-field im-name">
          <span>Name your island</span>
          <input value={kept.name} onChange={(e) => change({ name: e.target.value })} maxLength={40} placeholder={map.name} />
        </label>
        <div className="im-say" aria-live="polite">
          {picked !== null ? (
            pickedDisc ? (
              <>
                <span>
                  <b>{pickedDisc.name}</b> is on {map.plots[picked].name}. Pick a room to swap it, or × to take it off.
                </span>
                <button type="button" className="sm-btn sm-btn--go im-visit" onClick={() => visit(pickedDisc)}>
                  Walk in →
                </button>
              </>
            ) : (
              `${map.plots[picked].name}: now pick a room for it.`
            )
          ) : count === map.plots.length ? (
            "Every plot's full! Drag one to another plot to swap them, or pick one to walk in."
          ) : (
            "Pick a plot, then a room. Or drag a room straight onto the island."
          )}
        </div>
        <div className="im-discs" role="list" aria-label="The rooms">
          {discs.map((d) => (
            <button
              key={d.key}
              type="button"
              role="listitem"
              className={`im-disc${used.has(d.key) ? " is-used" : ""}${d.made ? " is-made" : ""}`}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/x-room", d.key)}
              onClick={() => put(d.key, picked ?? firstEmpty())}
              title={d.made ? `${d.name}, made by ${d.made.made_by_name?.split(" ")[0] ?? "a member"}` : d.name}
            >
              <span className="im-disc-face">
                <img src={d.icon} alt="" draggable={false} loading="lazy" />
              </span>
              <span className="im-disc-name">{d.name}</span>
            </button>
          ))}
        </div>
        <div className="im-buttons">
          <button type="button" className="sm-btn" onClick={surprise}>
            ★ Surprise me
          </button>
          <button type="button" className="sm-btn" onClick={() => change({ on: {} })} disabled={!count}>
            Clear it
          </button>
          <button type="button" className="sm-btn sm-btn--go" onClick={savePicture} disabled={!count || saving}>
            {saving ? "Drawing it…" : "Save as a picture ♡"}
          </button>
        </div>
        <p className="sm-small">{count} of {map.plots.length} plots built on · kept in this browser</p>
      </div>
    </div>
  );
}
