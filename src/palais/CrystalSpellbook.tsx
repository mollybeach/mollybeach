import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { modalButton } from "./modalButtons";
import { coverBox } from "./GlobeEgg";
import { usePlace } from "./place";
import { noteDoing } from "./visits";
import { AUTHOR, BREAK, CHAPTERS, TITLE, chapterStarts, pagesOf, paragraphsOf, type Page as StoryPage } from "./crystalStory";

/**
 * The spellbook on the Crystal Ballroom's stage, and the story in it.
 *
 * The book (the moon-phase sticker, brass clasp and all) lies on the front of
 * the stage, lined up with the picture however the room has cropped it
 * (coverBox, as the pool table is). Press it and it opens on a night sky: an
 * open book of old paper, two pages to a spread (one on a phone). A page turns
 * as a page does, one leaf lifting at the spine and laid over to the other
 * side, turned with the crescents either side, the arrow keys, or the row of moons underneath,
 * one to a chapter, which wax as you read.
 *
 * The story is Jessica Chase's "Portland on the Cusp of Spring", kept in
 * crystalStory.ts and cut into pages to fit the screen: a title page, the
 * contents (press a chapter to go to it), then the chapters.
 */

/** where the book lies, as a fraction of the picture: on the front of the
    stage: left of the drums on the wide pictures, right of them on the tall
    ones, clear of whoever stands at the bar */
const ON_THE_FLOOR = {
  wide: { x: 0.36, base: 0.615, w: 0.065 },
  tall: { x: 0.64, base: 0.555, w: 0.13 },
};
/** the sticker's own shape (1000 × 863) */
const BOOK = 863 / 1000;

const MOONS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

/** one page to a spread on a narrow screen */
function useNarrow() {
  const q = "(max-width: 760px)";
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}

/**
 * Cuts the book into pages that fit: each chapter's paragraphs are poured into
 * `probe` (a hidden page the size of the real ones, in the same type) until it
 * overflows, and a paragraph that won't fit is split between its words, the
 * rest carried over to the next page.
 */
function measurePages(probe: HTMLElement): StoryPage[] {
  const pages: StoryPage[] = [{ kind: "title" }, { kind: "contents" }];
  const fits = () => probe.scrollHeight <= probe.clientHeight + 1;
  const para = (text: string, first: boolean) => {
    const p = document.createElement("p");
    if (text === BREAK) {
      p.className = "sb-break";
      p.textContent = "✦";
    } else if (text.startsWith("♪")) {
      p.className = "sb-song";
      p.textContent = text.slice(1).trim();
    } else {
      if (first) p.className = "sb-first";
      p.textContent = text;
    }
    probe.appendChild(p);
    return p;
  };
  CHAPTERS.forEach((ch, chapter) => {
    let page: Extract<StoryPage, { kind: "text" }>;
    const fresh = (heading?: string) => {
      page = { kind: "text", chapter, heading, paragraphs: [] };
      probe.replaceChildren();
      if (heading) {
        const h = document.createElement("h3");
        h.className = "sb-heading";
        h.textContent = heading;
        probe.appendChild(h);
      }
    };
    const flush = () => {
      while (page.paragraphs[page.paragraphs.length - 1] === BREAK) page.paragraphs.pop();
      if (page.paragraphs.length) pages.push(page);
      fresh();
    };
    fresh(ch.title);
    for (const text of paragraphsOf(ch.text)) {
      if (text === BREAK && !page!.paragraphs.length) continue;
      const first = !!page!.heading && !page!.paragraphs.length;
      const el = para(text, first);
      if (fits()) {
        page!.paragraphs.push(text);
        continue;
      }
      // it doesn't all fit: as many of its words as do (found by halving),
      // then the rest over the page, as a book breaks a paragraph
      let rest = text.split(/\s+/);
      for (;;) {
        let lo = 0;
        let hi = rest.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          el.textContent = rest.slice(0, mid).join(" ");
          if (fits()) lo = mid;
          else hi = mid - 1;
        }
        if (!lo && !page!.paragraphs.length) lo = rest.length;   // nothing fits even on an empty page: let it scroll
        if (lo) page!.paragraphs.push(rest.slice(0, lo).join(" "));
        rest = rest.slice(lo);
        if (!rest.length) break;
        // the rest goes on over the page, without the chapter's big letter
        flush();
        el.classList.remove("sb-first");
        probe.appendChild(el);
      }
    }
    flush();
  });
  probe.replaceChildren();
  return pages;
}

function Page({ page, n, side, starts, goTo }: { page?: StoryPage; n: number; side: "left" | "right"; starts: number[]; goTo: (page: number) => void }) {
  return (
    <div className={`sb-page sb-page--${side}${page?.kind === "title" ? " sb-page--title" : ""}`}>
      {page?.kind === "title" && (
        <>
          <span className="sb-title-moons" aria-hidden>🌒 🌓 🌔 🌕 🌖 🌗 🌘</span>
          <h3 className="sb-book-title">{TITLE}</h3>
          <p className="sb-byline">by {AUTHOR}</p>
        </>
      )}
      {page?.kind === "contents" && (
        <>
          <h3 className="sb-heading">Contents</h3>
          <ol className="sb-contents">
            {CHAPTERS.map((ch, i) => (
              <li key={ch.title}>
                <button type="button" onClick={() => goTo(starts[i])}>
                  <span>{ch.title}</span>
                  <i aria-hidden />
                  <span>{starts[i] + 1}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
      {page?.kind === "text" && (
        <>
          {page.heading && <h3 className="sb-heading">{page.heading}</h3>}
          {page.paragraphs.map((p, i) =>
            p === "* * *" ? (
              <p key={i} className="sb-break" aria-hidden>✦</p>
            ) : p.startsWith("♪") ? (
              <p key={i} className="sb-song">{p.slice(1).trim()}</p>
            ) : (
              <p key={i} className={page.heading && i === 0 ? "sb-first" : undefined}>
                {p}
              </p>
            ),
          )}
        </>
      )}
      {page && page.kind !== "title" && <span className="sb-folio">{n}</span>}
    </div>
  );
}

export function CrystalSpellbook() {
  const { place } = usePlace();
  const here = place === "crystal";
  const spot = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const narrow = useNarrow();
  const per = narrow ? 1 : 2;
  // the pages, cut to fit the open book (a guess until it's been measured)
  const guess = useMemo(() => pagesOf(narrow ? 90 : 120), [narrow]);
  const [fitted, setFitted] = useState<StoryPage[] | null>(null);
  const pages = fitted ?? guess;
  const starts = useMemo(() => chapterStarts(pages), [pages]);
  const spreads = Math.max(1, Math.ceil(pages.length / per));
  const [at, setAt] = useState(0);
  // a page being turned: the spread it's turned from, and which way
  const [flip, setFlip] = useState<{ from: number; dir: "on" | "back" } | null>(null);
  const spread = Math.min(at, spreads - 1);

  /* keep the book where the picture put it */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--crystal img")).find((i) => i.naturalWidth);
      if (!img) return;
      const on = img.naturalHeight > img.naturalWidth ? ON_THE_FLOOR.tall : ON_THE_FLOOR.wide;
      const box = coverBox(img, stage);
      const w = box.w * on.w;
      const h = w * BOOK;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${box.left + box.w * on.x - w / 2}px`;
      el.style.top = `${box.top + box.h * on.base - h}px`;
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

  const shut = useCallback(() => setOpen(false), []);
  const go = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(spreads - 1, to));
      if (next === spread) return;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setFlip(still ? null : { from: spread, dir: next > spread ? "on" : "back" });
      setAt(next);
    },
    [spread, spreads],
  );
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") shut();
      if (e.key === "ArrowRight") go(spread + 1);
      if (e.key === "ArrowLeft") go(spread - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shut, go, spread]);

  /* fit the pages to the book as it's shown, and again if the window changes */
  const bookRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const size = useRef("");
  useLayoutEffect(() => {
    const reader = bookRef.current;
    const probe = probeRef.current;
    if (!open || !reader || !probe) return;
    const measure = () => {
      const page = reader.querySelector<HTMLElement>(".sb-book .sb-page");
      if (!page) return;
      const now = `${page.clientWidth}x${page.clientHeight}`;
      if (now === size.current) return;
      size.current = now;
      probe.style.width = `${page.offsetWidth}px`;
      probe.style.height = `${page.offsetHeight}px`;
      setFitted((was) => {
        const next = measurePages(probe);
        // stay in the same chapter when the pages are cut again
        if (was) setAt((n) => {
          const p = was[n * per];
          const c = p?.kind === "text" ? p.chapter : -1;
          return c < 0 ? n : Math.floor(chapterStarts(next)[c] / per);
        });
        return next;
      });
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(reader);
    return () => watch.disconnect();
  }, [open, per]);

  if (!here) return null;

  const first = spread * per;
  const goTo = (n: number) => go(Math.floor(n / per));
  const page = (i: number, side: "left" | "right") => <Page page={pages[i]} n={i + 1} side={side} starts={starts} goTo={goTo} />;
  // while a page turns, the spread it left stays under it until it lands
  const was = flip ? Math.min(flip.from, spreads - 1) * per : first;
  const on = flip?.dir === "on";
  const back = flip?.dir === "back";
  // a moon for the cover and one for each chapter, waxing as you read; the
  // one you're in is the last that starts at or before this spread
  const marks = [{ label: "The cover", page: 0 }, ...CHAPTERS.map((ch, i) => ({ label: ch.title, page: starts[i] }))];
  const inMark = marks.reduce((now, m, i) => (Math.floor(m.page / per) <= spread ? i : now), 0);

  return (
    <>
      <button
        ref={spot}
        type="button"
        className="palais-spellbook"
        style={{ visibility: "hidden" }}
        aria-label="Open the spellbook"
        title="Open the spellbook"
        onClick={() => {
          setOpen(true);
          noteDoing("spellbook");       // Molly hears that someone opened it (visits.ts)
        }}
      >
        <img src={modalButton("book_witchy_moon_phases_purple_galaxy_clasp_sticker")} alt="" decoding="async" />
        <span className="palais-spellbook-hint" aria-hidden>
          <span>☾ <span>Read me</span></span>
          <small>{TITLE}</small>
          <small className="palais-spellbook-by">by {AUTHOR}</small>
        </span>
      </button>

      {open && (
        <div className="wm-backdrop sb-backdrop" onPointerDown={(e) => e.target === e.currentTarget && shut()}>
          <div className="wm-panel sb-panel" role="dialog" aria-modal="true" aria-labelledby="sb-title">
            <div className="wm-title sb-title">
              <h2 id="sb-title">
                <span aria-hidden>☾</span> {TITLE} <span aria-hidden>☽</span>
              </h2>
            </div>
            <button type="button" className="wm-close sb-close" onClick={shut} aria-label="Close the spellbook">
              ×
            </button>

            <div ref={bookRef} className="sb-reader">
              {/* a page nobody sees, for measuring how much fits on one */}
              <div ref={probeRef} className="sb-page sb-probe" aria-hidden />
              <button type="button" className="sb-turn sb-turn--back" onClick={() => go(spread - 1)} disabled={spread === 0} aria-label="The page before">
                ☾
              </button>

              <div className={`sb-book${narrow ? " sb-book--one" : ""}`} aria-live="polite">
                {narrow ? (
                  // one page: the old one turns away to the left, or the one
                  // before comes back over from the left
                  page(back ? was : first, "left")
                ) : (
                  <>
                    {page(on ? was : first, "left")}
                    {page(back ? was + 1 : first + 1, "right")}
                  </>
                )}
                {flip && (
                  /* the leaf being turned: the page it was on its front, the
                     page it lands as on its back */
                  <div
                    key={`${flip.from}-${spread}`}
                    className={`sb-leaf sb-leaf--${narrow ? (on ? "away" : "over") : flip.dir}`}
                    onAnimationEnd={(e) => e.target === e.currentTarget && setFlip(null)}
                    aria-hidden
                  >
                    {narrow ? (
                      <div className="sb-leaf-face">{page(on ? was : first, "left")}</div>
                    ) : (
                      <>
                        <div className="sb-leaf-face">{on ? page(was + 1, "right") : page(was, "left")}</div>
                        <div className="sb-leaf-face sb-leaf-face--back">{on ? page(first, "left") : page(first + 1, "right")}</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button type="button" className="sb-turn sb-turn--on" onClick={() => go(spread + 1)} disabled={spread >= spreads - 1} aria-label="The next page">
                ☽
              </button>
            </div>

            <nav className="sb-moons" aria-label="Chapters">
              {marks.map((m, i) => (
                <button
                  key={m.label}
                  type="button"
                  className={`sb-moon${i === inMark ? " is-now" : ""}${i < inMark ? " is-read" : ""}`}
                  onClick={() => go(Math.floor(m.page / per))}
                  aria-label={m.label}
                  title={m.label}
                  aria-current={i === inMark ? "true" : undefined}
                >
                  {MOONS[i % MOONS.length]}
                </button>
              ))}
              <span className="sb-tally">
                {first + 1}
                {!narrow && first + 2 <= pages.length ? `–${first + 2}` : ""} of {pages.length}
              </span>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
