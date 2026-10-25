import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { coverBox } from "./GlobeEgg";
import { usePlace } from "./place";
import { propSrc } from "./props";
import { shelvesToFileOn } from "./shelves";
import { fileSticker, makeSticker, useMadeStickers, type Draft } from "./madeStickers";
import { finishSticker, shrinkPhoto, type Finished } from "./stickerCut";
import { useAccount } from "../components/AccountCard";
import { amIAccepted, askForReview, noteDoing } from "./visits";

/**
 * The sticker maker at Brat Academy: a lime and pink Create-A-Sticker Mini on a
 * student's desk by the first window, beside the iBook and the pink cup,
 * lined up with the photograph however the room has cropped it (coverBox, as
 * the chalkboard is).
 *
 * Press it and it opens as the machine itself: drop a photo in the tray, turn
 * the knob, and the palais-stickers function has Claude look at it and
 * OpenAI's image model draw the object alone (docs/sticker-maker-prompt.md).
 * The cutout is finished here (stickerCut.ts) and comes out of the slot to be
 * looked over: its caption, and the shelf it goes on, one already in the
 * catalogue or a new one. Then it's in the catalogue for everyone
 * (madeStickers.ts).
 *
 * It's for members: signed in, and accepted by Molly. Anyone else is told how
 * to become one.
 */

const MACHINE = "sticker_maker_create_a_sticker_mini_pink_lime_sticker";
/** the machine's own shape (1000 × 918) */
const SHAPE = 918 / 1000;
/** where it stands on the desk, as a fraction of the photograph: the middle
    of it, its feet, and how wide. The four wide photographs share one; each
    tall one for a phone was painted on its own (as schoolSpots.ts has it) */
const ON_THE_DESK: Record<string, { x: number; base: number; w: number }> = {
  wide: { x: 0.19, base: 0.668, w: 0.0825 },
  "portrait-spring": { x: 0.24, base: 0.635, w: 0.11 },
  "portrait-summer": { x: 0.23, base: 0.655, w: 0.1 },
  "portrait-autumn": { x: 0.31, base: 0.655, w: 0.11 },
  "portrait-winter": { x: 0.23, base: 0.655, w: 0.1 },
};
/** never closer to the left of the screen than this, in pixels: a narrow
    window crops the left of the wide photograph, and the machine slides along
    the same row of desks under the windows until it's in view, and clear of
    the record player in the corner (RoomRadio.tsx) */
const EDGE = 110;
/** and a little further right than its spot on the desk, in pixels, clear of
    the turntable's open sleeve */
const NUDGE = 75;
const deskOf = (img: HTMLImageElement) => {
  const tall = /school-portrait-(\w+)\.webp$/.exec(img.src);
  return ON_THE_DESK[tall ? `portrait-${tall[1]}` : "wide"] ?? ON_THE_DESK.wide;
};

const NEW_SHELF = "+new";

type Stage =
  | { at: "tray" }
  | { at: "making"; step: number }
  | { at: "made"; draft: Draft; done: Finished }
  | { at: "filing"; draft: Draft; done: Finished }
  | { at: "filed"; label: string; shelf: string; src: string };

const STEPS = ["Claude is looking at it…", "Drawing the cutout…", "Still drawing: the good ones take a minute…", "Trimming the edges…"];

export function StickerMaker() {
  const { place } = usePlace();
  const here = place === "school";
  const spot = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  /* keep it on its desk, wherever the photograph has landed */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--school img"))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const box = coverBox(img, stage);
      const on = deskOf(img);
      const w = box.w * on.w;
      const h = w * SHAPE;
      // its pill is wider than it is, and has to fit on screen too
      const pill = el.querySelector<HTMLElement>(".palais-stickermaker-hint")?.offsetWidth ?? 0;
      const cx = Math.max(box.left + box.w * on.x, EDGE + Math.max(w, pill) / 2) + NUDGE;
      const base = box.top + box.h * on.base;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${cx - w / 2}px`;
      el.style.top = `${base - h}px`;
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!here) return null;

  return (
    <>
      <button
        ref={spot}
        type="button"
        className="palais-stickermaker"
        style={{ visibility: "hidden" }}
        aria-label="Open the sticker maker"
        title="Make a sticker"
        onClick={() => {
          setOpen(true);
          noteDoing("sticker-maker");
        }}
      >
        <img src={propSrc(MACHINE)} alt="" decoding="async" />
        <span className="palais-stickermaker-hint" aria-hidden>
          <span>✂ Make a sticker</span>
          <small>to add to the catalogue</small>
        </span>
      </button>
      {open && <Machine onClose={() => setOpen(false)} />}
    </>
  );
}

function Machine({ onClose }: { onClose: () => void }) {
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

  // every shelf there is, the made ones too (useMadeStickers re-renders when one is added)
  useMadeStickers();
  const shelves = shelvesToFileOn();

  const [photo, setPhoto] = useState<{ b64: string; type: string; preview: string } | null>(null);
  const [stage, setStage] = useState<Stage>({ at: "tray" });
  const [trouble, setTrouble] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [shelf, setShelf] = useState("");
  const [newShelf, setNewShelf] = useState({ name: "", emoji: "✨" });
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const take = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return setTrouble("That isn't a photo.");
    setTrouble(null);
    try {
      setPhoto(await shrinkPhoto(file));
      setStage({ at: "tray" });
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    }
  }, []);

  /* turn the knob */
  const make = useCallback(async () => {
    if (!photo) return;
    setTrouble(null);
    setStage({ at: "making", step: 0 });
    const ticks = [9000, 24000];
    const timers = ticks.map((t, n) => setTimeout(() => setStage((s) => (s.at === "making" ? { at: "making", step: n + 1 } : s)), t));
    try {
      const got = await makeSticker(photo.b64, photo.type, shelves.map(({ key, name }) => ({ key, name })));
      timers.forEach(clearTimeout);
      if (!got.ok) {
        setStage({ at: "tray" });
        return setTrouble(got.why);
      }
      setStage({ at: "making", step: 3 });
      const done = await finishSticker(got.png, got.sticker.glass);
      setCaption(got.sticker.label.charAt(0).toUpperCase() + got.sticker.label.slice(1));
      setShelf(got.sticker.shelf ?? shelves[0]?.key ?? NEW_SHELF);
      setStage({ at: "made", draft: got.sticker, done });
      noteDoing("sticker-made", got.sticker.label);
    } catch (e) {
      timers.forEach(clearTimeout);
      setStage({ at: "tray" });
      setTrouble(e instanceof Error ? e.message : String(e));
    }
  }, [photo, shelves]);

  /* and put it in the catalogue */
  const file = useCallback(async () => {
    if (stage.at !== "made") return;
    const label = caption.trim();
    if (!label) return setTrouble("It wants a caption.");
    const isNew = shelf === NEW_SHELF;
    if (isNew && !newShelf.name.trim()) return setTrouble("Give the new shelf a name.");
    setTrouble(null);
    const { draft, done } = stage;
    setStage({ at: "filing", draft, done });
    try {
      const lower = label.charAt(0).toLowerCase() + label.slice(1);
      const got = await fileSticker(done.b64, done.type, { ...draft, label: lower }, isNew ? { name: newShelf.name.trim(), emoji: newShelf.emoji.trim() || "✨" } : { key: shelf });
      const on = got.shelf?.name ?? shelves.find((s) => s.key === got.sticker.shelf)?.name ?? "its";
      setStage({ at: "filed", label, shelf: on, src: done.url });
      noteDoing("sticker-filed", lower);
    } catch (e) {
      setStage({ at: "made", draft, done });
      setTrouble(e instanceof Error ? e.message : String(e));
    }
  }, [stage, caption, shelf, newShelf, shelves]);

  const again = () => {
    setPhoto(null);
    setStage({ at: "tray" });
    setTrouble(null);
    setNewShelf({ name: "", emoji: "✨" });
  };

  const working = stage.at === "making" || stage.at === "filing";
  const out = stage.at === "made" || stage.at === "filing" || stage.at === "filed";

  return (
    <div className="wm-backdrop sm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && !working && onClose()}>
      <div className="wm-panel sm-panel" role="dialog" aria-modal="true" aria-labelledby="sm-title">
        {/* a few stickers already on the sheet, round its edges */}
        <Doodles />
        <div className="sm-lid">
          <h2 id="sm-title">
            <img src={`${process.env.PUBLIC_URL}/palais/ui/sticker-maker-title.webp`} alt="Create-A-Sticker Mini" />
          </h2>
          <small>at Brat Academy ✂</small>
        </div>
        <button type="button" className="wm-close sm-close" onClick={onClose} disabled={working} aria-label="Close the sticker maker">
          ×
        </button>

        {!me ? (
          <div className="sm-door">
            <p>The sticker maker is for members of the Palais. Sign in, and once you're accepted you can make stickers from your own photos and add them to the catalogue.</p>
            <button type="button" className="sm-btn sm-btn--go" onClick={signIn} disabled={busy}>
              {busy ? "Signing in…" : "Sign in with Google"}
            </button>
          </div>
        ) : accepted === null ? (
          <div className="sm-door">
            <p>Checking you're on the list…</p>
          </div>
        ) : !accepted ? (
          <div className="sm-door">
            <p>You're signed in as {me.email}, and waiting to be accepted. Molly's been told: once she lets you in, the machine is yours.</p>
          </div>
        ) : (
          <div className="sm-body">
            {/* the slot: what comes out */}
            <div className={`sm-slot${working ? " is-working" : ""}`} aria-hidden={!out}>
              <span className="sm-slot-mouth" aria-hidden />
              {out && (
                <div className="sm-sheet">
                  <img src={stage.at === "filed" ? stage.src : stage.done.url} alt={stage.at === "filed" ? stage.label : caption} />
                </div>
              )}
            </div>

            {stage.at === "filed" ? (
              <div className="sm-filed">
                <p>
                  <b>{stage.label}</b> is in the catalogue, on the <b>{stage.shelf}</b> shelf. Open the Catalogue to put it in any room.
                </p>
                <button type="button" className="sm-btn sm-btn--go" onClick={again}>
                  Make another ✂
                </button>
              </div>
            ) : out ? (
              <form
                className="sm-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  file();
                }}
              >
                <label className="sm-field">
                  <span>Caption</span>
                  <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} disabled={working} />
                </label>
                <label className="sm-field">
                  <span>Shelf</span>
                  <select value={shelf} onChange={(e) => setShelf(e.target.value)} disabled={working}>
                    {shelves.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.emoji} {s.name}
                      </option>
                    ))}
                    <option value={NEW_SHELF}>＋ Start a new shelf…</option>
                  </select>
                </label>
                {shelf === NEW_SHELF && (
                  <div className="sm-newshelf">
                    <label className="sm-field sm-field--emoji">
                      <span>Picture</span>
                      <input value={newShelf.emoji} onChange={(e) => setNewShelf({ ...newShelf, emoji: e.target.value })} maxLength={8} aria-label="An emoji for the new shelf" />
                    </label>
                    <label className="sm-field">
                      <span>New shelf</span>
                      <input value={newShelf.name} onChange={(e) => setNewShelf({ ...newShelf, name: e.target.value })} maxLength={40} placeholder="e.g. Instruments" />
                    </label>
                  </div>
                )}
                <div className="sm-doing">
                  <button type="button" className="sm-btn" onClick={again} disabled={working}>
                    Try another photo
                  </button>
                  <button type="submit" className="sm-btn sm-btn--go" disabled={working}>
                    {stage.at === "filing" ? "Adding it…" : "Add to the catalogue ♡"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="sm-front">
                {/* the tray the photo goes in */}
                <label
                  className={`sm-tray${dragging ? " is-over" : ""}${photo ? " has-photo" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    take(e.dataTransfer.files[0]);
                  }}
                >
                  <input ref={input} type="file" accept="image/*" onChange={(e) => take(e.target.files?.[0])} disabled={working} hidden />
                  {photo ? (
                    <img src={photo.preview} alt="What you put in the tray" />
                  ) : (
                    <span className="sm-tray-say">
                      <span className="sm-tray-icon" aria-hidden />
                      <span>
                        Drop a photo in the tray, or press to{" "}
                        <span className="sm-upload">
                          Upload one
                          <svg viewBox="0 0 24 24" aria-hidden>
                            <path d="M12 15V4M7 9l5-5 5 5" />
                            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                          </svg>
                        </span>
                      </span>
                    </span>
                  )}
                </label>
                {/* the knob that makes it */}
                <div className="sm-knob-side">
                  <button type="button" className={`sm-knob${working ? " is-turning" : ""}`} onClick={make} disabled={!photo || working} aria-label="Turn the knob to make the sticker">
                    {/* the yellow star in the middle of the knob, smiling */}
                    <svg className="sm-knob-star" viewBox="0 0 60 60" aria-hidden>
                      <path d="M30 6l7 15 16 2-12 11 3 16-14-8-14 8 3-16L7 23l16-2z" fill="#ffd36e" stroke="#3d3030" strokeWidth={2.4} strokeLinejoin="round" />
                      <circle cx={26} cy={30} r={1.8} fill="#3d3030" />
                      <circle cx={34} cy={30} r={1.8} fill="#3d3030" />
                      <path d="M27 34.5 Q30 37.5 33 34.5" fill="none" stroke="#3d3030" strokeWidth={1.6} strokeLinecap="round" />
                    </svg>
                  </button>
                  <span className="sm-knob-say">{stage.at === "making" ? STEPS[stage.step] : photo ? "Turn the knob" : "A photo first"}</span>
                </div>
              </div>
            )}

            {trouble && (
              <p className="sm-trouble" role="alert">
                {trouble}
              </p>
            )}
            {!out && !working && (
              <p className="sm-small">One object a photo, the closer the better. The background comes off by itself. Up to 10 a day.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- the stickers round the sheet's edges ------------------------------- */

/** drawn like the ones on a sticker sheet: soft colours, a dark outline, and a
    white die-cut edge round each one (the white stroke drawn first, behind) */
const INK = "#3d3030";
const cut = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const, paintOrder: "stroke" };

function Face({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={INK} stroke="none">
      <circle cx={-4} cy={0} r={1.6} />
      <circle cx={4} cy={0} r={1.6} />
      <path d="M-2.4 3 Q0 5.4 2.4 3" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={-7.5} cy={3.2} r={1.6} fill="#f59ab0" opacity={0.8} />
      <circle cx={7.5} cy={3.2} r={1.6} fill="#f59ab0" opacity={0.8} />
    </g>
  );
}

function Doodles() {
  return (
    <div className="sm-doodles" aria-hidden>
      {/* a smiling star */}
      <svg className="sm-doodle sm-doodle--star" viewBox="0 0 60 60">
        <path d="M30 6l7 15 16 2-12 11 3 16-14-8-14 8 3-16L7 23l16-2z" fill="#ffd36e" {...cut} />
        <Face x={30} y={31} />
      </svg>
      {/* a heart */}
      <svg className="sm-doodle sm-doodle--heart" viewBox="0 0 60 60">
        <path d="M30 50C14 39 8 30 10 21c2-8 13-11 20-2 7-9 18-6 20 2 2 9-4 18-20 29z" fill="#f7a1b5" {...cut} />
        <Face x={30} y={28} s={0.9} />
      </svg>
      {/* a cloud */}
      <svg className="sm-doodle sm-doodle--cloud" viewBox="0 0 80 50">
        <path d="M18 42c-8 0-12-7-9-13 2-4 6-5 9-5 1-8 9-13 17-10 4-6 14-6 18 1 7-1 13 4 13 11 6 1 9 6 7 11-1 3-4 5-8 5z" fill="#fffaf3" {...cut} />
        <Face x={40} y={29} />
      </svg>
      {/* a rainbow */}
      <svg className="sm-doodle sm-doodle--rainbow" viewBox="0 0 80 50">
        <path d="M10 40a30 30 0 0 1 60 0" fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
        <path d="M10 40a30 30 0 0 1 60 0" fill="none" stroke="#f7a1b5" strokeWidth={13} strokeLinecap="round" />
        <path d="M18 40a22 22 0 0 1 44 0" fill="none" stroke="#ffd36e" strokeWidth={6} />
        <path d="M24 40a16 16 0 0 1 32 0" fill="none" stroke="#9fd8f2" strokeWidth={6} />
        <circle cx={12} cy={42} r={7} fill="#fffaf3" {...cut} />
        <circle cx={68} cy={42} r={7} fill="#fffaf3" {...cut} />
      </svg>
      {/* a little sprig */}
      <svg className="sm-doodle sm-doodle--sprig" viewBox="0 0 40 60">
        <path d="M20 56V12" fill="none" {...cut} />
        <ellipse cx={13} cy={22} rx={6} ry={4} transform="rotate(-35 13 22)" fill="#8ccf9e" {...cut} />
        <ellipse cx={27} cy={30} rx={6} ry={4} transform="rotate(35 27 30)" fill="#8ccf9e" {...cut} />
        <ellipse cx={13} cy={38} rx={6} ry={4} transform="rotate(-35 13 38)" fill="#8ccf9e" {...cut} />
        <ellipse cx={20} cy={10} rx={4} ry={6} fill="#8ccf9e" {...cut} />
      </svg>
    </div>
  );
}
