import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePlace } from "./place";
import { amIAccepted, askForReview, noteDoing } from "./visits";
import { useAccount } from "../components/AccountCard";
import { finishSticker, type Finished } from "./stickerCut";
import { fileSticker } from "./madeStickers";
import { DOLL_ROLES, editDoll, makeDoll, type Doll, type DollRole } from "./dolls";
import { shrinkPhoto } from "./stickerCut";
import { Door, PhotoTray, Twinkles, usePastedPhotos, useTaker, type Photo } from "./IslandMaker";

/**
 * The Dolly Maker at Brat Academy: a pink and mint dress-up studio standing on
 * the desks above the sticker maker and the island maker (StickerMaker.tsx,
 * IslandMaker.tsx), centred over the two and clear of them.
 *
 * Press it and it opens as the studio, in three steps:
 *
 * 1. Design: six photo boxes (you or a friend first, then an outfit, hair,
 *    shoes, jewellery and wings or a crown, each role changeable), and what
 *    the character should be. Generate has the palais-dolls function plan the
 *    character and paint it, full length, on a transparent background
 *    (docs/dolly-maker-prompts.md).
 * 2. Style: the character beside its plan. Say what to change, lock what
 *    mustn't, and paint the change: only what's asked changes. Every version
 *    is kept, to go back to.
 * 3. Dress the shelf: the approved one is cut out and checked in the browser
 *    (stickerCut.ts), sized to the cast's own height so every character
 *    stands the same in a room, and filed on the catalogue's Characters shelf
 *    (madeStickers.ts).
 */

const ART = `${process.env.PUBLIC_URL}/palais_assets/modal_content/dolly_maker`;
const MACHINE = `${ART}/dolly_maker_machine_sticker.webp`;
/** the studio's own shape (1223 × 1244) */
const SHAPE = 1244 / 1223;
/** as wide as the sticker maker, times this */
const SIZE = 1.2;
/** and this far above the other two machines' pills, in pixels */
const GAP = 14;

/** every character in the cast is drawn this tall, in pixels, and stands
    this tall in a room, in metres (props.ts): a made one is the same */
const CAST_PX = 1400;
const CAST_METRES = 1.77;

/** the six photo boxes: the person first, then the rest, each with the role
    it starts with (and can be changed to another) */
const SLOTS: { role: DollRole; say: string; icon: string }[] = [
  { role: "person", say: "You or a friend", icon: "👤" },
  { role: "outfit", say: "An outfit", icon: "👗" },
  { role: "hair", say: "Hair", icon: "💇" },
  { role: "shoes", say: "Shoes", icon: "👠" },
  { role: "accessories", say: "Jewellery & bags", icon: "💍" },
  { role: "fantasy", say: "Wings, a crown…", icon: "🪽" },
];
const ROLE_NAMES: Record<DollRole, string> = { person: "👤 Person", outfit: "👗 Outfit", hair: "💇 Hair", makeup: "💄 Make-up", shoes: "👠 Shoes", accessories: "💍 Accessories", fantasy: "🪽 Fantasy", style: "🎨 Style" };
/** more photos for an edit: a new dress, the shoes, the wings */
const MOST_EDIT_PHOTOS = 3;
const LOCKS = ["Face", "Hair", "Body", "Pose", "Outfit", "Shoes", "Accessories", "Wings & fantasy"];

export function DollyMaker() {
  const { place } = usePlace();
  const here = place === "school";
  const spot = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  /* stand on the desks above the other two machines, centred over them */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const sticker = stage.querySelector<HTMLElement>(".palais-stickermaker:not(.palais-islandmaker):not(.palais-dollymaker)");
      const island = stage.querySelector<HTMLElement>(".palais-islandmaker");
      if (!sticker || !island || sticker.style.visibility !== "visible" || island.style.visibility !== "visible") return;
      const w = sticker.offsetWidth * SIZE;
      const h = w * SHAPE;
      // clear of the two machines and the pills over them
      const pillTop = (m: HTMLElement) => m.offsetTop - (m.querySelector<HTMLElement>(".palais-stickermaker-hint")?.offsetHeight ?? 0);
      const bottom = Math.min(pillTop(sticker), pillTop(island)) - GAP;
      const left = Math.min(sticker.offsetLeft, island.offsetLeft);
      const right = Math.max(sticker.offsetLeft + sticker.offsetWidth, island.offsetLeft + island.offsetWidth);
      const cx = Math.min(Math.max((left + right) / 2, w / 2 + 6), stage.clientWidth - w / 2 - 6);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${cx - w / 2}px`;
      el.style.top = `${Math.max(4, bottom - h)}px`;
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
        className="palais-stickermaker palais-dollymaker"
        style={{ visibility: "hidden" }}
        aria-label="Open the Dolly Maker"
        title="Make a character"
        onClick={() => {
          setOpen(true);
          noteDoing("dolly-maker");
        }}
      >
        <img src={MACHINE} alt="" decoding="async" />
        <span className="palais-stickermaker-hint" aria-hidden>
          <span>💖 Make a doll</span>
          <small>dress up a character &amp; add them to the character catalogue</small>
        </span>
      </button>
      {open && <Studio onClose={() => setOpen(false)} />}
    </>
  );
}

/** one photo box: drop, paste or press to fill it, with what it's for */
function Slot({ main, icon, say, photo, role, disabled, onFile, onRemove, onRole }: { main: boolean; icon: string; say: string; photo: Photo | null; role: DollRole; disabled: boolean; onFile: (f: File | undefined) => void; onRemove: () => void; onRole: (r: DollRole) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div className={`dm-slot${main ? " dm-slot--main" : ""}${photo ? " has-photo" : ""}${over ? " is-over" : ""}`}>
      <label
        className="dm-slot-box"
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFile(e.dataTransfer.files[0]);
        }}
      >
        <input type="file" accept="image/*" hidden disabled={disabled} onChange={(e) => onFile(e.target.files?.[0])} />
        {photo ? (
          <img src={photo.preview} alt={say} />
        ) : (
          <span className="dm-slot-empty">
            <i aria-hidden>{icon}</i>
            <b>{say}</b>
            {main && <small>whose face the doll has</small>}
            <small className="dm-slot-plus">＋ add</small>
          </span>
        )}
        {photo && !disabled && (
          <button
            type="button"
            className="dm-slot-x"
            aria-label={`Take out ${say.toLowerCase()}`}
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
          >
            ×
          </button>
        )}
      </label>
      <select value={role} onChange={(e) => onRole(e.target.value as DollRole)} aria-label={`What ${say.toLowerCase()} is for`}>
        {DOLL_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_NAMES[r]}
          </option>
        ))}
      </select>
    </div>
  );
}

type Step = "design" | "style" | "shelf";
const STEPS: { step: Step; label: string; short: string; dot: string }[] = [
  { step: "design", label: "Design your doll", short: "Design", dot: "📸" },
  { step: "style", label: "Style & edit", short: "Style", dot: "💄" },
  { step: "shelf", label: "Put on the shelf", short: "Shelf", dot: "💖" },
];

interface Version {
  png: string;
  doll: Doll;
  /** what was asked for it, or empty for the first */
  asked: string;
}

function Studio({ onClose }: { onClose: () => void }) {
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

  const [step, setStep] = useState<Step>("design");
  const [slots, setSlots] = useState<(Photo | null)[]>(() => SLOTS.map(() => null));
  const [roles, setRoles] = useState<DollRole[]>(() => SLOTS.map((s) => s.role));
  const [slotTrouble, setSlotTrouble] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keep, setKeep] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [at, setAt] = useState(0);
  const [instruction, setInstruction] = useState("");
  const [editPhotos, setEditPhotos] = useState<Photo[]>([]);
  const editTaker = useTaker(setEditPhotos, editPhotos.length, MOST_EDIT_PHOTOS);
  const [locks, setLocks] = useState<string[]>(["Face"]);
  const [busy, setBusy] = useState<string | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [caption, setCaption] = useState("");
  const [filed, setFiled] = useState<string | null>(null);

  const current = versions[at];
  // the person goes first, so Claude reads it as whose face the doll is
  const refs = slots.flatMap((p, i) => (p ? [{ image: p.b64, type: p.type, role: roles[i] }] : []));
  const filled = slots.filter(Boolean).length;
  /** a photo into a box: the one given, or the first empty one */
  const putIn = useCallback(async (file: File | undefined, at?: number) => {
    if (!file || !/^image\//.test(file.type)) return;
    setSlotTrouble(null);
    try {
      const photo = await shrinkPhoto(file);
      setSlots((s) => {
        const i = at ?? s.findIndex((x) => !x);
        if (i < 0) {
          setSlotTrouble("All six boxes are full: take one out to put another in.");
          return s;
        }
        return s.map((x, k) => (k === i ? photo : x));
      });
    } catch (e) {
      setSlotTrouble(e instanceof Error ? e.message : String(e));
    }
  }, []);
  // pasted photos go in the first empty boxes
  usePastedPhotos((files) => {
    if (step === "design" && !busy) Array.from(files).forEach((f) => putIn(f));
  });

  const close = useCallback(() => {
    if (busy && !window.confirm("Your doll's still being painted. Close anyway?")) return;
    onClose();
  }, [busy, onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  /* Generate: the plan, then the character painted (from any tab) */
  const generate = async () => {
    if (!filled && !description.trim()) return setStep("design");
    setTrouble(null);
    setBusy("Claude is reading your photos, then the doll's painted… a minute or two");
    try {
      const got = await makeDoll(refs, description.trim(), name.trim(), keep.trim());
      if (!got.ok) return setTrouble(got.why);
      setVersions((v) => [...v, { png: got.png, doll: got.doll, asked: "" }]);
      setAt(versions.length);
      setName((n) => n || got.doll.name);
      setStep("style");
      noteDoing("doll-made", got.doll.name);
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  /* an edit: only what's asked changes */
  const edit = async () => {
    if (!current || !instruction.trim()) return;
    setTrouble(null);
    setBusy("Changing only that… a minute or so");
    try {
      const got = await editDoll(current.png, current.doll, refs, instruction.trim(), locks, editPhotos.map((p) => ({ image: p.b64, type: p.type })));
      if (!got.ok) return setTrouble(got.why);
      setVersions((v) => [...v.slice(0, at + 1), { png: got.png, doll: got.doll, asked: instruction.trim() }]);
      setAt(at + 1);
      setInstruction("");
      setEditPhotos([]);
      noteDoing("doll-edited", instruction.trim());
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  /* approve it: cut out, checked, and sized to the cast's own height */
  const approve = async () => {
    if (!current) return;
    setTrouble(null);
    setBusy("Cutting it out…");
    try {
      const done = await finishSticker(current.png, false, CAST_PX);
      setFinished(done);
      setCaption(current.doll.label.charAt(0).toUpperCase() + current.doll.label.slice(1));
      setStep("shelf");
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  /* and onto the Characters shelf, standing as tall as everyone else */
  const file = async () => {
    if (!finished || !current) return;
    setTrouble(null);
    setBusy("Putting it on the shelf…");
    try {
      const label = (name.trim() || current.doll.name || caption).slice(0, 160);
      const got = await fileSticker(finished.b64, finished.type, { id: current.doll.id, label, plane: "near", metres: (finished.width * CAST_METRES) / finished.height, glass: false, lit: false, shelf: "characters" }, { key: "characters" });
      setFiled(got.sticker.label);
      noteDoing("doll-filed", got.sticker.label);
    } catch (e) {
      setTrouble(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const again = () => {
    setSlots(SLOTS.map(() => null));
    setRoles(SLOTS.map((s) => s.role));
    setName("");
    setDescription("");
    setKeep("");
    setVersions([]);
    setAt(0);
    setFinished(null);
    setFiled(null);
    setTrouble(null);
    setStep("design");
  };

  const canMake = member === true && !busy;
  const d = current?.doll;

  return (
    <div className="wm-backdrop sm-backdrop im-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div className="wm-panel sm-panel im-panel dm-panel" role="dialog" aria-modal="true" aria-labelledby="dm-title">
        <Twinkles />
        <div className="im-lid">
          <span className="im-ring" aria-hidden />
          <h2 id="dm-title">
            <img src={`${ART}/dolly-maker-title.webp`} alt="Dolly Maker" />
          </h2>
          <small>
            <span>a magical dress-up studio for the character catalogue · </span>at Brat Academy
          </small>
          <div className="im-sides" role="tablist" aria-label="The Dolly Maker">
            {STEPS.map((s, i) => (
              <button
                key={s.step}
                type="button"
                role="tab"
                aria-selected={step === s.step}
                className={step === s.step ? "is-on" : undefined}
                onClick={() => setStep(s.step)}
              >
                <i className={`im-side-dot dm-side-dot--${s.step}`} aria-hidden>
                  {s.dot}
                </i>
                <span className="im-side-n">{i + 1}.</span> <span className="im-side-long">{s.label}</span>
                <span className="im-side-short">{s.short}</span>
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="wm-close sm-close im-close" onClick={close} aria-label="Close the Dolly Maker">
          ×
        </button>

        <div className="im-pane">
          {step === "design" ? (
            <div className="im-build im-build--fill">
              <Door member={member} say="The Dolly Maker is for members of the Palais. Sign in, and once you're accepted you can turn yourself, a friend or anyone you dream up into a doll for every room." />
              <div className="dm-design">
                <div className="im-col">
                  {/* six boxes: the person first and biggest, then what they wear */}
                  <div className="dm-slots">
                    {SLOTS.map((slot, i) => (
                      <Slot
                        key={slot.role}
                        main={i === 0}
                        icon={slot.icon}
                        say={slot.say}
                        photo={slots[i]}
                        role={roles[i]}
                        disabled={!!busy}
                        onFile={(f) => putIn(f, i)}
                        onRemove={() => setSlots((s) => s.map((x, k) => (k === i ? null : x)))}
                        onRole={(r) => setRoles((x) => x.map((y, k) => (k === i ? r : y)))}
                      />
                    ))}
                    {/* the sixth cell, beside the last box: how they work */}
                    <p className="dm-slots-say">💖 Drop, paste or press a box to add a photo. Leave any of them empty, and change what one's for underneath it.</p>
                  </div>
                  {slotTrouble && <p className="sm-trouble">{slotTrouble}</p>}
                </div>
                <div className="im-col">
                  <label className="sm-field">
                    <span>Their name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="e.g. Princess Moonbeam" />
                  </label>
                  <label className="sm-field im-grow">
                    <span>Who should they be?</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="Use my face and make me look super pretty, with long brown hair, in the pink gown, with little angel wings and matching heels…"
                    />
                  </label>
                  <label className="sm-field">
                    <span>
                      Keep exactly <small className="im-field-note">optional</small>
                    </span>
                    <input value={keep} onChange={(e) => setKeep(e.target.value)} maxLength={600} placeholder="e.g. my freckles, the gown's embroidery" />
                  </label>
                </div>
              </div>
            </div>
          ) : step === "style" ? (
            <div className="im-build im-build--fill">
              <div className="dm-style">
                {/* the doll, on a soft pink stage, with every version under it */}
                <div className={`dm-stage${busy ? " is-painting" : ""}${current ? "" : " dm-stage--empty"}`}>
                  {current && d ? <img src={`data:image/png;base64,${current.png}`} alt={d.name} /> : <span className="dm-ghost" aria-hidden>👗</span>}
                  {!current && !busy && <small className="dm-stage-say">Your doll appears here once it's generated</small>}
                  {busy && <span className="im-wait">{busy}</span>}
                  {versions.length > 1 && (
                    <ol className="dm-versions" aria-label="Versions">
                      {versions.map((v, i) => (
                        <li key={i}>
                          <button type="button" className={i === at ? "is-on" : undefined} onClick={() => setAt(i)} title={v.asked || "The first"}>
                            <img src={`data:image/png;base64,${v.png}`} alt={`Version ${i + 1}`} />
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                {/* what can be changed, there all along, greyed out until there's a doll */}
                <div className={`im-col${current ? "" : " dm-waiting"}`}>
                  <div className="dm-plan">
                    <h3>{d?.name ?? (name.trim() || "Your doll")}</h3>
                    {d ? (
                      <dl>
                        {[
                          ["💇 Hair", d.hair],
                          ["💄 Make-up", d.makeup],
                          ["👗 Outfit", d.outfit],
                          ["👠 Shoes", d.shoes],
                          ["💍 Accessories", d.accessories.join(", ")],
                          ["🪽 Fantasy", d.fantasy.join(", ")],
                          ["🧍 Pose", d.pose],
                        ]
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <div key={k}>
                              <dt>{k}</dt>
                              <dd>{v}</dd>
                            </div>
                          ))}
                      </dl>
                    ) : (
                      <p className="dm-note">Their hair, make-up, outfit, shoes, accessories, wings and pose show here once they're painted: generate them from Design, or here.</p>
                    )}
                    {d && d.ambiguities.length > 0 && <p className="dm-asks">It wondered: {d.ambiguities.join(" ")}</p>}
                  </div>
                  <div className="dm-edit">
                    <label className="sm-field im-grow">
                      <span>What should change?</span>
                      <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} maxLength={800} rows={3} placeholder="Make her hair longer… give her bigger wings… put her in the dress from this photo" disabled={!!busy || !current} />
                    </label>
                    {/* more photos, for the change: a new dress, the shoes, the wings */}
                    <PhotoTray
                      photos={editPhotos}
                      most={MOST_EDIT_PHOTOS}
                      onTake={editTaker.take}
                      onDrop={(n) => setEditPhotos((p) => p.filter((_, i) => i !== n))}
                      disabled={!!busy || !current}
                      say={`Photos for the change? Up to ${MOST_EDIT_PHOTOS}`}
                    />
                  </div>
                  <div className="dm-locks" aria-label="Keep these as they are">
                    <span>Keep as they are:</span>
                    {LOCKS.map((l) => (
                      <button key={l} type="button" disabled={!current} className={locks.includes(l) ? "is-on" : undefined} aria-pressed={locks.includes(l)} onClick={() => setLocks((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>
                        {locks.includes(l) ? "🔒" : "🔓"} {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="im-build im-build--fill">
              <div className="dm-style">
                <div className={`dm-stage dm-stage--done${finished ? "" : " dm-stage--empty"}`}>
                  {finished ? <img src={finished.url} alt={name || d?.name || "Your doll"} /> : current ? <img src={`data:image/png;base64,${current.png}`} alt="" className="dm-faded" /> : <span className="dm-ghost" aria-hidden>💖</span>}
                  {!finished && <small className="dm-stage-say">{current ? "Approve it on Style & edit, and it's cut out here" : "Your approved doll, cut out, appears here"}</small>}
                </div>
                <div className={`im-col dm-shelf${finished ? "" : " dm-waiting"}`}>
                  {filed ? (
                    <div className="im-none">
                      <p>
                        <b>{filed}</b> is on the Characters shelf of the catalogue, standing as tall as everyone else. Open the catalogue in any room to put them in.
                      </p>
                      <button type="button" className="sm-btn sm-btn--go" onClick={again}>
                        💖 Make another doll
                      </button>
                    </div>
                  ) : (
                    <div className="dm-plan dm-shelf-card">
                      <h3>💖 {name.trim() || d?.name || "Your doll"}</h3>
                      <p className="dm-note">{finished ? `Cut out and ready: ${finished.width} × ${finished.height}, the same height as the rest of the cast.` : "Cut out, sized to stand as tall as the rest of the cast, and added to the character catalogue for every room."}</p>
                      <label className="sm-field">
                        <span>Their name in the catalogue</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={d?.name ?? "e.g. Princess Moonbeam"} disabled={!finished} />
                      </label>
                      <label className="sm-field">
                        <span>Caption</span>
                        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} placeholder="a gothic princess in black tulle with feathered wings" disabled={!finished} />
                      </label>
                      <ul className="dm-shelf-list">
                        <li>✂️ Cut out cleanly, every strand of hair and feather kept</li>
                        <li>📏 Sized to stand 1.77 m tall, like the rest of the cast</li>
                        <li>🗂 On the catalogue's Characters shelf, for every room</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* back and on in the bottom corners, with what each step does between */}
        <div className="im-foot">
          {step !== "design" ? (
            <button type="button" className="sm-btn im-foot-back" onClick={() => setStep(step === "shelf" ? "style" : "design")} disabled={!!busy}>
              ← {step === "shelf" ? "Style" : "Design"}
            </button>
          ) : (
            <span />
          )}
          <small className="im-foot-say" aria-live="polite">
            {trouble ??
              busy ??
              (member !== true
                ? "For members of the Palais: sign in to make a doll."
                : step === "design"
                  ? "Generate paints your doll full length, ready to style."
                  : !current
                    ? "Fill in Design, then Generate paints your doll: from here or there."
                    : step === "style"
                    ? "Change only what you ask; lock what mustn't. Every version's kept above."
                    : filed
                      ? ""
                      : "Onto the Characters shelf, for every room.")}
          </small>
          <span className="im-foot-right">
            {/* on each tab, as on the island maker: its own make-it button, then Next */}
            {step === "design" && (
              <button type="button" className="sm-btn im-foot-gen" onClick={generate} disabled={!canMake}>
                {busy ? "Painting…" : versions.length ? "✦ Generate a new one" : "✦ Generate my doll"}
              </button>
            )}
            {step === "style" &&
              (current ? (
                <>
                  <button type="button" className="sm-btn im-foot-gen" onClick={edit} disabled={!!busy || !instruction.trim() || member !== true}>
                    ✦ Paint the change
                  </button>
                  <button type="button" className="sm-btn sm-btn--go im-foot-next" onClick={approve} disabled={!!busy}>
                    Approve 💖 →
                  </button>
                </>
              ) : (
                <button type="button" className="sm-btn im-foot-gen" onClick={generate} disabled={!canMake}>
                  {busy ? "Painting…" : "✦ Generate my doll"}
                </button>
              ))}
            {step === "design" && (
              <button type="button" className="sm-btn sm-btn--go im-foot-next" onClick={() => setStep("style")}>
                Next: style →
              </button>
            )}
            {step === "style" && !current && (
              <button type="button" className="sm-btn sm-btn--go im-foot-next" onClick={() => setStep("shelf")}>
                Next: shelf →
              </button>
            )}
            {step === "shelf" && !filed && (
              finished ? (
                <button type="button" className="sm-btn sm-btn--go im-foot-next" onClick={file} disabled={!!busy || member !== true}>
                  💖 Put on the Characters shelf
                </button>
              ) : current ? (
                <button type="button" className="sm-btn sm-btn--go im-foot-next" onClick={approve} disabled={!!busy}>
                  Approve 💖
                </button>
              ) : (
                <button type="button" className="sm-btn sm-btn--go im-foot-next" disabled>
                  💖 Put on the Characters shelf
                </button>
              )
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
