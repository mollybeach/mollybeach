import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Blossoms } from "./WorldMap";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { usePlace } from "./place";
import { lettersOpen, remember, remembered } from "./letters";
import { readPortraits, type Portrait } from "./portraits";
import { noteDoing } from "./visits";

/**
 * The pictures kept in the Boudoir's white dresser.
 *
 * The dresser opens like the library's desk drawer, and it opens to the same
 * word as the letters — anyone who knows one knows the other, and a browser
 * that has already opened the drawer walks straight in (letters.ts). Inside,
 * the pictures hang one at a time in a carved gilt frame, the gold of the
 * mirrors in the catalogue (.bd-frame in palais.css), with an arrow either
 * side and the arrow keys to walk along them.
 *
 * PICTURES is the whole gallery — swap these for Molly's own and the room
 * follows.
 */

/** the white dresser, as a fraction of the photograph — one for each of the two */
const DRESSER = {
  wide: { x: 0.128, y: 0.565, w: 0.215, h: 0.35 },
  tall: { x: 0.125, y: 0.507, w: 0.25, h: 0.171 },
};

export function BoudoirPictures() {
  const { place } = usePlace();
  const here = place === "boudoir";
  const spot = useRef<HTMLButtonElement>(null);
  const paper = useFloral("map");
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");

  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(() => remembered("key"));
  const [inside, setInside] = useState(false);
  const [tried, setTried] = useState("");
  const [trouble, setTrouble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [at, setAt] = useState(0);
  const [hanging, setHanging] = useState<Portrait[] | null>(null);   // null while they're still coming
  // the frame takes the picture's own shape, so it can grow to fill the panel
  // whatever shape the picture is
  const [shape, setShape] = useState(4 / 3);

  /* keep the dresser where the photograph put it, whichever photograph it is */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--boudoir img"))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const on = img.naturalHeight > img.naturalWidth ? DRESSER.tall : DRESSER.wide;
      const box = coverBox(img, stage);
      el.style.width = `${box.w * on.w}px`;
      el.style.height = `${box.h * on.h}px`;
      el.style.left = `${box.left + box.w * on.x - (box.w * on.w) / 2}px`;
      el.style.top = `${box.top + box.h * on.y - (box.h * on.h) / 2}px`;
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200);      // the photographs fade in as the seasons turn
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  /** the same word as the letters; the database checks it, not this */
  const tryWord = useCallback(async (word: string) => {
    setBusy(true);
    setTrouble(null);
    try {
      if (await lettersOpen(word)) {
        setInside(true);
        setKey(word);
        remember("key", word);
        noteDoing("pictures");          // Molly hears that someone looked (visits.ts)
        // the pictures themselves, signed for ten minutes at a time
        // (portraits.ts). Before the bucket exists, the bundled ones stay up.
        readPortraits(word)
          .then((got) => {
            setHanging(got);
            setAt(0);
          })
          .catch(() => setHanging([]));
      } else {
        setTrouble("That word doesn't open the dresser.");
      }
    } catch {
      setTrouble("The dresser is stuck; try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  /* a browser that already knows the word (from the letters) walks in */
  useEffect(() => {
    if (open && key && !inside && !busy) tryWord(key);
  }, [open, key, inside, busy, tryWord]);

  const shut = useCallback(() => {
    setOpen(false);
    setTrouble(null);
  }, []);
  const many = hanging?.length ?? 0;
  const step = useCallback((by: number) => setAt((n) => (n + by + many) % many), [many]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") shut();
      if (!inside) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, inside, shut, step]);

  if (!here) return null;

  const showing = hanging?.[at] ?? hanging?.[0] ?? null;

  return (
    <>
      <button
        ref={spot}
        type="button"
        className="palais-pictures-spot"
        aria-label="The portraits in the dresser"
        title="The portraits"
        onClick={() => setOpen(true)}
      />

      {open && (
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
            className={`wm-panel bd-panel${showing ? " bd-panel--hung" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bd-title"
            style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.96), rgba(250, 243, 229, 0.97)), url("${floralSrc(paper.now)}")` }}
          >
            <Blossoms className="wm-bloom wm-bloom--bl" posy="bl" />
            <Blossoms className="wm-bloom wm-bloom--tr" posy="tr" />
            <Blossoms className="wm-bloom wm-bloom--br" posy="br" />

            <div className="wm-title">
              <Blossoms className="wm-bloom wm-bloom--title-l" posy="title-l" />
              <h2 id="bd-title">
                <span aria-hidden>✿</span> Portraits <span aria-hidden>✿</span>
              </h2>
              <Blossoms className="wm-bloom wm-bloom--title-r" posy="title-r" />
            </div>
            <button type="button" className="wm-close" onClick={shut} aria-label="Close the dresser">
              ×
            </button>

            {!inside ? (
              /* the dresser is locked: the same word as the letters */
              <form
                className="lt-gate"
                onSubmit={(e) => {
                  e.preventDefault();
                  tryWord(tried.trim());
                }}
              >
                <p className="lt-gate-line">A dresser of portraits. It opens to the same word as the letters.</p>
                <input
                  type="password"
                  className="lt-input"
                  value={tried}
                  onChange={(e) => setTried(e.target.value)}
                  placeholder="the word"
                  autoComplete="off"
                  aria-label="The word that opens the dresser"
                  autoFocus
                />
                <button type="submit" className="wm-btn wm-btn--visit" disabled={busy || !tried.trim()}>
                  {busy ? "Trying…" : "Open the dresser ✿"}
                </button>
                {trouble && <p className="lt-trouble">{trouble}</p>}
              </form>
            ) : (
              /* one picture at a time, an arrow either side */
              <div className="bd-look">
                {!showing ? (
                  <p className="cat-note">
                    {hanging === null ? "Opening the dresser…" : "Nothing hanging in here yet."}
                  </p>
                ) : (
                  <>
                    <div className="bd-hang">
                      {many > 1 && (
                        <button type="button" className="bd-arrow bd-arrow--back" onClick={() => step(-1)} aria-label="The one before">
                          ‹
                        </button>
                      )}

                      <figure className="bd-frame" style={{ aspectRatio: String(shape) }}>
                        <img
                          src={showing.url}
                          alt={showing.title}
                          decoding="async"
                          onLoad={(e) => setShape(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 4 / 3)}
                        />
                      </figure>

                      {many > 1 && (
                        <button type="button" className="bd-arrow bd-arrow--on" onClick={() => step(1)} aria-label="The next one">
                          ›
                        </button>
                      )}
                    </div>

                    {many > 1 && (
                      <span className="bd-count" aria-hidden>
                        {hanging!.map((p, n) => (
                          <i key={p.url} className={n === at ? "is-on" : undefined} />
                        ))}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
