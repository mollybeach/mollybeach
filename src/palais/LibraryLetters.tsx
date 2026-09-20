import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Blossoms } from "./WorldMap";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { usePlace } from "./place";
import { editLetter, postLetter, readLetters, remember, remembered, type Letter } from "./letters";

/**
 * The letter drawer in the library desk.
 *
 * It isn't marked: the left-hand drawer of the writing desk opens if you think
 * to try it. Inside is a drawer of letters — anyone who knows the word can read
 * them, and anyone who signs a name can add one. The word is checked by the
 * database, not here, and the letters live there too, so they're the same for
 * everyone (supabase/migrations/…_palais_letters.sql).
 *
 * The same letters are in the road case on the Lakehouse floor: the drawer and
 * the case are two ways into one panel, which LettersDrawer keeps for the whole
 * house. Anything inside it can open the letters with useLetters().
 */

/** opens the letters, from wherever in the house you are standing */
const Drawer = createContext<() => void>(() => {});
export const useLetters = () => useContext(Drawer);

export function LettersDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pull = useCallback(() => setOpen(true), []);
  return (
    <Drawer.Provider value={pull}>
      {children}
      <LettersPanel open={open} setOpen={setOpen} />
    </Drawer.Provider>
  );
}

/** the left drawer of the desk, as a fraction of the library photograph */
const DRAWER = { x: 0.415, y: 0.634, w: 0.062, h: 0.045 };

const SEALS = ["✿", "☾", "✦", "♡", "✎", "☙"];

const when = (iso: string) =>
  new Date(iso).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });

/** the unmarked drawer in the library desk, one way into the letters */
export function LibraryLetters() {
  const { place } = usePlace();
  const here = place === "library";
  const spot = useRef<HTMLButtonElement>(null);
  const pull = useLetters();

  /* keep the drawer where the photograph put it */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--library img"))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const box = coverBox(img, stage);
      el.style.width = `${box.w * DRAWER.w}px`;
      el.style.height = `${box.h * DRAWER.h}px`;
      el.style.left = `${box.left + box.w * DRAWER.x - (box.w * DRAWER.w) / 2}px`;
      el.style.top = `${box.top + box.h * DRAWER.y - (box.h * DRAWER.h) / 2}px`;
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200);    // the photographs fade in as the seasons turn
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  if (!here) return null;

  return (
    <button
      ref={spot}
      type="button"
      className="palais-letters-spot"
      aria-label="The desk drawer"
      title="The drawer"
      onClick={pull}
    />
  );
}

/** the letters themselves — one panel for the whole house */
function LettersPanel({ open, setOpen }: { open: boolean; setOpen: (b: boolean) => void }) {
  const paper = useFloral("map");
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");

  const [key, setKey] = useState(() => remembered("key"));
  const [tried, setTried] = useState("");
  const [letters, setLetters] = useState<Letter[] | null>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);
  const [name, setName] = useState(() => remembered("name"));
  const [draft, setDraft] = useState({ title: "", body: "", seal: SEALS[0], editing: 0 });
  const [trouble, setTrouble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchLetters = useCallback(
    async (word: string) => {
      setBusy(true);
      setTrouble(null);
      try {
        const got = await readLetters(word);
        setLetters(got);
        setReading((r) => r ?? got[0]?.id ?? null);
        setKey(word);
        remember("key", word);
      } catch (e) {
        setLetters(null);
        setTrouble(e instanceof Error && /word/.test(e.message) ? "That word doesn't open the drawer." : "The drawer is stuck; try again in a moment.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (open && key && letters === null) fetchLetters(key);
  }, [open, key, letters, fetchLetters]);

  const shut = useCallback(() => {
    setOpen(false);
    setWriting(false);
    setTrouble(null);
  }, [setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && shut();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shut]);

  const letter = letters?.find((l) => l.id === reading) ?? null;
  const mine = letter && name && letter.author.toLowerCase() === name.trim().toLowerCase();

  const send = async () => {
    if (!name.trim()) return setTrouble("A letter wants a name at the bottom of it.");
    if (!draft.body.trim()) return setTrouble("An empty letter is not a letter.");
    setBusy(true);
    setTrouble(null);
    try {
      if (draft.editing) await editLetter(key, draft.editing, name.trim(), draft.title, draft.body);
      else await postLetter(key, name.trim(), draft.title, draft.body, draft.seal);
      remember("name", name.trim());
      setWriting(false);
      setDraft({ title: "", body: "", seal: SEALS[0], editing: 0 });
      const got = await readLetters(key);
      setLetters(got);
      if (!draft.editing) setReading(got[0]?.id ?? null);
    } catch (e) {
      setTrouble(e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "That letter wouldn't go.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="wm-backdrop"
      style={{
        ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
        ["--wm-jewel-side" as string]: paletteOf(chips.now).jewel,
        ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).jewel,
      }}
      onPointerDown={(e) => e.target === e.currentTarget && shut()}
    >
      <div
        className="wm-panel lt-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lt-title"
        style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.965), rgba(250, 243, 229, 0.975)), url("${floralSrc(paper.now)}")` }}
      >
        <Blossoms className="wm-bloom wm-bloom--tl" posy="tl" />
        <Blossoms className="wm-bloom wm-bloom--bl" posy="bl" />
        <Blossoms className="wm-bloom wm-bloom--tr" posy="tr" />
        <Blossoms className="wm-bloom wm-bloom--br" posy="br" />

        <div className="wm-title">
          <Blossoms className="wm-bloom wm-bloom--title-l" posy="title-l" />
          <h2 id="lt-title">
            <span aria-hidden>✿</span> Letters <span aria-hidden>✿</span>
          </h2>
          <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
        </div>
        <button type="button" className="wm-close" onClick={shut} aria-label="Close the drawer">
          ×
        </button>

        {!letters ? (
          /* the drawer is locked: the word, and nothing else */
          <form
            className="lt-gate"
            onSubmit={(e) => {
              e.preventDefault();
              fetchLetters(tried.trim());
            }}
          >
            <p className="lt-gate-line">A drawer of letters. It opens to a word.</p>
            <input
              type="password"
              className="lt-input"
              value={tried}
              onChange={(e) => setTried(e.target.value)}
              placeholder="the word"
              autoComplete="off"
              aria-label="The word that opens the drawer"
              autoFocus
            />
            <button type="submit" className="wm-btn wm-btn--visit" disabled={busy || !tried.trim()}>
              {busy ? "Trying…" : "Open the drawer ✿"}
            </button>
            {trouble && <p className="lt-trouble">{trouble}</p>}
          </form>
        ) : (
          <div className="lt-body">
            {/* the letters, newest first, pinned ones on top */}
            <ol className="lt-list">
              {letters.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    className={`lt-item${l.id === reading ? " is-on" : ""}`}
                    onClick={() => {
                      setReading(l.id);
                      setWriting(false);
                    }}
                  >
                    <span className="lt-seal" aria-hidden>{l.seal ?? "✉"}</span>
                    <span className="lt-item-words">
                      <b>{l.title}</b>
                      <small>
                        {l.author} · {when(l.at)}
                        {l.pinned ? " · pinned" : ""}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
              {letters.length === 0 && <li className="lt-empty">The drawer is empty. Write the first one.</li>}
            </ol>

            <div className="lt-sheet">
              <div className="lt-paper">
              {writing ? (
                <form
                  className="lt-write"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  {/* the author form: a name, kept at the bottom of the letter */}
                  <label className="lt-field">
                    <span>Signed</span>
                    <input
                      className="lt-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="your name"
                      maxLength={40}
                      required
                    />
                  </label>
                  <label className="lt-field">
                    <span>Subject</span>
                    <input
                      className="lt-input"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="a line to call it by"
                      maxLength={80}
                    />
                  </label>
                  {!draft.editing && (
                    <fieldset className="lt-seals">
                      <legend>Seal</legend>
                      {SEALS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`lt-seal-pick${draft.seal === s ? " is-on" : ""}`}
                          onClick={() => setDraft({ ...draft, seal: s })}
                          aria-pressed={draft.seal === s}
                          aria-label={`Seal ${s}`}
                        >
                          {s}
                        </button>
                      ))}
                    </fieldset>
                  )}
                  <textarea
                    className="lt-area"
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    placeholder="Dear whoever finds this…"
                    maxLength={8000}
                    rows={10}
                    required
                  />
                  {trouble && <p className="lt-trouble">{trouble}</p>}
                  <div className="wm-nav">
                    <button type="button" className="wm-btn" onClick={() => setWriting(false)}>
                      ◀ Back
                    </button>
                    <button type="submit" className="wm-btn wm-btn--visit" disabled={busy}>
                      {busy ? "Sending…" : draft.editing ? "Save the letter ✿" : "Put it in the drawer ✿"}
                    </button>
                  </div>
                </form>
              ) : letter ? (
                <article className="lt-read">
                  <header>
                    <h3>
                      <span aria-hidden>{letter.seal ?? "✉"}</span> {letter.title}
                    </h3>
                    <p className="wm-tag">
                      {letter.author} · {when(letter.at)}
                      {letter.edited ? " · tidied since" : ""}
                    </p>
                  </header>
                  <p className="lt-prose">{letter.body}</p>
                  <div className="wm-actions">
                    <button
                      type="button"
                      className="wm-btn wm-btn--visit"
                      onClick={() => {
                        setDraft({ title: "", body: "", seal: SEALS[0], editing: 0 });
                        setTrouble(null);
                        setWriting(true);
                      }}
                    >
                      Write a letter ✎
                    </button>
                    {mine && (
                      <button
                        type="button"
                        className="wm-btn"
                        onClick={() => {
                          setDraft({ title: letter.title, body: letter.body, seal: letter.seal ?? SEALS[0], editing: letter.id });
                          setTrouble(null);
                          setWriting(true);
                        }}
                      >
                        Tidy this one up
                      </button>
                    )}
                  </div>
                </article>
              ) : (
                <div className="lt-read">
                  <p className="cat-note">Nothing in the drawer yet.</p>
                  <button type="button" className="wm-btn wm-btn--visit" onClick={() => setWriting(true)}>
                    Write the first one ✎
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
