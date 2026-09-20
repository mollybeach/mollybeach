import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

/** a rabbit's head, drawn for this room: a round face and two long ears */
function Rabbit() {
  return (
    <svg viewBox="0 0 24 34" aria-hidden focusable="false">
      <ellipse cx="8.4" cy="10" rx="3.1" ry="9.2" transform="rotate(-14 8.4 10)" />
      <ellipse cx="16.2" cy="10.4" rx="2.9" ry="8.8" transform="rotate(13 16.2 10.4)" />
      <ellipse cx="12" cy="25.6" rx="7.4" ry="6.6" />
    </svg>
  );
}

/** the wait while the dresser is being opened: rabbits, going round */
function Waiting({ say }: { say: string }) {
  return (
    <p className="bd-wait">
      <span className="bd-wait-ring" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
          <span key={n} style={{ ["--n" as string]: n }}>
            <Rabbit />
          </span>
        ))}
      </span>
      {say}
    </p>
  );
}

/** the white dresser, as a fraction of the photograph — one for each of the two */
const DRESSER = {
  wide: { x: 0.128, y: 0.565, w: 0.215, h: 0.35 },
  tall: { x: 0.125, y: 0.507, w: 0.25, h: 0.171 },
};

/** the bunny sitting on the marble in front of the dresser, off to its right:
    where his feet are, and how tall he stands, as fractions of the photograph */
const BUNNY = {
  wide: { x: 0.27, base: 0.82, h: 0.2 },
  tall: { x: 0.3, base: 0.665, h: 0.13 },      // a phone crops the room in, so he sits up bigger
};
/** his own shape, so the width follows the height (631 x 1100) */
const BUNNY_SHAPE = 631 / 1100;

export function BoudoirPictures() {
  const { place } = usePlace();
  const here = place === "boudoir";
  const spot = useRef<HTMLButtonElement>(null);
  const bunny = useRef<HTMLButtonElement>(null);
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
  // the frame is measured to the room it has, so a tall portrait can't push
  // the panel off the screen and a wide one doesn't leave a band of paper
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  /* a picture is hung only once its shape is known, so the frame is never
     built at the wrong size and then jump: the shapes it has learned, and the
     one picture it is ready to show */
  const shapes = useRef(new Map<string, number>());
  const [ready, setReady] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pit = useRef<HTMLDivElement>(null);

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
      const tall = img.naturalHeight > img.naturalWidth;
      const on = tall ? DRESSER.tall : DRESSER.wide;
      const box = coverBox(img, stage);
      el.style.width = `${box.w * on.w}px`;
      el.style.height = `${box.h * on.h}px`;
      el.style.left = `${box.left + box.w * on.x - (box.w * on.w) / 2}px`;
      el.style.top = `${box.top + box.h * on.y - (box.h * on.h) / 2}px`;

      // and the bunny, standing on the floor in front of it
      const rabbit = bunny.current;
      if (rabbit) {
        const sits = tall ? BUNNY.tall : BUNNY.wide;
        const height = box.h * sits.h;
        const width = height * BUNNY_SHAPE;
        rabbit.style.width = `${width}px`;
        rabbit.style.height = `${height}px`;
        rabbit.style.left = `${box.left + box.w * sits.x - width / 2}px`;
        rabbit.style.top = `${box.top + box.h * sits.base - height}px`;
      }
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

  /* learn a picture's shape before hanging it, and have the next one ready */
  const onNow = hanging?.[at] ?? hanging?.[0] ?? null;
  useEffect(() => {
    const url = onNow?.url;
    if (!url) return;
    const learn = (u: string, then?: (r: number) => void) => {
      const known = shapes.current.get(u);
      if (known) return then?.(known);
      const img = new Image();
      img.onload = () => {
        const r = img.naturalWidth / img.naturalHeight || 4 / 3;
        shapes.current.set(u, r);
        then?.(r);
      };
      img.onerror = () => {
        shapes.current.set(u, 4 / 3);
        then?.(4 / 3);
      };
      img.src = u;
    };
    let gone = false;
    learn(url, (r) => {
      if (gone) return;
      setShape(r);
      setReady(url);
      // the one along, so stepping to it is instant
      const next = hanging?.[(at + 1) % (hanging.length || 1)];
      if (next && next.url !== url) learn(next.url);
    });
    return () => {
      gone = true;
    };
  }, [onNow?.url, hanging, at]);

  /* the frame, measured rather than guessed: the biggest box of the picture's
     own shape that the panel can hold, and then the panel drawn down to it, so
     a tall portrait fits on the screen and a wide one isn't hung in the middle
     of a sheet of empty paper */
  const hung = inside && hanging?.length;
  useLayoutEffect(() => {
    const card = panel.current;
    const room = pit.current;
    if (!card) return;
    if (!hung || !room) {
      card.style.height = "";
      return;
    }
    const fit = () => {
      card.style.height = "";                        // full size, to measure by
      const spare = card.clientHeight - room.clientHeight;   // title, beads, padding
      // the room the panel stands in can be taller than the window, so the
      // window has the last word: a tall portrait must not hang off the screen
      const view = document.documentElement.clientHeight;
      const h = Math.max(
        200,
        Math.min(room.clientHeight, view - spare - 80, room.clientWidth / shape),
      );
      setFrame({ w: Math.round(h * shape), h: Math.round(h) });
      card.style.height = `${Math.round(h + spare)}px`;
    };
    fit();
    // the backdrop is the window's size, never the panel's, so watching it
    // can't chase its own tail
    const watch = new ResizeObserver(fit);
    if (card.parentElement) watch.observe(card.parentElement);
    return () => watch.disconnect();
  }, [hung, shape, at]);

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

      {/* the bunny on the marble, who opens the same dresser */}
      <button
        ref={bunny}
        type="button"
        className="palais-bunny"
        aria-label="The bunny by the dresser"
        title="The portraits"
        onClick={() => setOpen(true)}
      >
        <img src={`${process.env.PUBLIC_URL}/palais/boudoir-bunny.webp`} alt="" decoding="async" />
      </button>

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
            ref={panel}
            className="wm-panel bd-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bd-title"
          >
            {/* no posies in here: the dresser is papered in pink stripes
                instead (.bd-panel in palais.css) */}
            <div className="wm-title">
              <h2 id="bd-title">
                <span aria-hidden>✿</span> Portraits <span aria-hidden>✿</span>
              </h2>
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
                <p className="lt-gate-line">A dresser of private portraits. Enter the passphrase ;) to enter.</p>
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
                {busy && <Waiting say="Trying the word…" />}
                {trouble && <p className="lt-trouble">{trouble}</p>}
              </form>
            ) : (
              /* one picture at a time, an arrow either side */
              <div className="bd-look">
                {!showing || ready !== showing.url ? (
                  hanging?.length === 0 ? (
                    <p className="cat-note">Nothing hanging in here yet.</p>
                  ) : (
                    <Waiting say="Opening the dresser…" />
                  )
                ) : (
                  <>
                    <div className="bd-hang" ref={pit}>
                      {many > 1 && (
                        <button type="button" className="bd-arrow bd-arrow--back" onClick={() => step(-1)} aria-label="The one before">
                          ‹
                        </button>
                      )}

                      <figure
                        className={`bd-frame${frame ? " is-fitted" : ""}`}
                        style={frame ? { width: `${frame.w}px`, height: `${frame.h}px` } : undefined}
                      >
                        {/* already fetched and measured above, so it paints
                            straight into a frame of the right shape */}
                        <img src={showing.url} alt={showing.title} decoding="async" />
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
