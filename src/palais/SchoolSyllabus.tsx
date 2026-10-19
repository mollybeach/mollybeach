import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { usePlace } from "./place";
import { placeOver, schoolSpot } from "./schoolSpots";
import { GUIDES, type Guide } from "./setupGuides";
import { COURSES, MATERIALS, RANKS, SHEETS, UNITS, type Unit } from "./bratCourse";
import { SPRITES, type SpriteName } from "./bratSprites";

/**
 * The chalkboard at Brat Academy, and the binder it opens.
 *
 * Brat Academy is where Molly tutors girls to code. The board in the
 * photograph already says so; this lays a button over it, worked out from
 * where the photograph sits once the room has cropped it (the same trick as
 * the library globe), and pressing it opens the whole course as a binder of
 * file folders: a welcome, the path through it unit by unit, the courses,
 * the brainbook's cheat sheets, and setting up a computer (bratCourse.ts and
 * setupGuides.ts hold the words).
 *
 * The ticks on the path are kept in this browser only: they're for whoever is
 * working through it, and nobody else needs to see them.
 */

type Tab = "welcome" | "path" | "courses" | "sheets" | "setup";

const TABS: { id: Tab; label: string }[] = [
  { id: "welcome", label: "🎀 Welcome" },
  { id: "path", label: "🗺️ The Path" },
  { id: "courses", label: "📚 Courses" },
  { id: "sheets", label: "📓 Cheat Sheets" },
  { id: "setup", label: "💻 Setup" },
];

const HOW: { emoji: string; title: string; text: string }[] = [
  { emoji: "💻", title: "Set up", text: "Get your computer ready and make your first commit." },
  { emoji: "🗺️", title: "Learn", text: "Work down the path a unit at a time, with me alongside." },
  { emoji: "🛠️", title: "Build", text: "Make each unit's project and push it to your brat-academy repo." },
  { emoji: "💌", title: "Show me", text: "Send your certificate or your link when a unit's done." },
  { emoji: "👑", title: "Graduate", text: "Demo day, and a portfolio that's all yours." },
];

/** where the loader's sprites sit around the logo on the Welcome page */
const SCATTER: { name: SpriteName; left: string; top: string; size: number; delay: number }[] = [
  { name: "coconut", left: "6%", top: "14%", size: 40, delay: 0 },
  { name: "heart", left: "18%", top: "62%", size: 22, delay: 0.6 },
  { name: "star", left: "11%", top: "40%", size: 18, delay: 1.2 },
  { name: "drink", left: "84%", top: "12%", size: 38, delay: 0.3 },
  { name: "pinkHeart", left: "78%", top: "58%", size: 24, delay: 0.9 },
  { name: "star", left: "90%", top: "44%", size: 16, delay: 1.5 },
  { name: "heart", left: "30%", top: "10%", size: 16, delay: 1.8 },
  { name: "coconut", left: "66%", top: "70%", size: 30, delay: 0.4 },
  { name: "pinkHeart", left: "34%", top: "76%", size: 18, delay: 1.1 },
];

/** one of the loading screen's pixel sprites (bratSprites.ts) */
const Sprite = ({ name, className, style }: { name: SpriteName; className?: string; style?: React.CSSProperties }) => (
  <span aria-hidden className={`sc-sprite ${className ?? ""}`} style={style} dangerouslySetInnerHTML={{ __html: SPRITES[name] }} />
);

/* ---------------------------------------------- ticks, kept in this browser */

const KEPT = "brat-academy:done";
function readDone(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEPT) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
function keepDone(done: Set<string>) {
  try {
    localStorage.setItem(KEPT, JSON.stringify(Array.from(done)));
  } catch {
    /* private window: the ticks last as long as the page */
  }
}
const TOTAL = UNITS.reduce((n, u) => n + u.checklist.length, 0);
const rankOf = (share: number) => [...RANKS].reverse().find((r) => share >= r.at) ?? RANKS[0];

/* ------------------------------------------------------------- the pieces */

/** a block of commands, with a button that copies them */
function Commands({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="sc-code">
      <pre>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        className="sc-copy"
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
      >
        {copied ? "Copied ♡" : "Copy"}
      </button>
    </div>
  );
}

/** a section that folds, open to begin with, with a chevron you can't miss */
function Fold({ num, title, sub, children, open = true }: { num?: number | string; title: string; sub?: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="sc-fold" open={open}>
      <summary>
        {num !== undefined && <span className="sc-num">{num}</span>}
        <span className="sc-fold-title">
          {title}
          {sub && <small>{sub}</small>}
        </span>
        <span className="sc-chevron" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="sc-fold-body">{children}</div>
    </details>
  );
}

function Progress({ done, slim }: { done: Set<string>; slim?: boolean }) {
  const share = done.size / TOTAL;
  const rank = rankOf(share);
  // on the Welcome page it's one line, with what the rank means on hover
  if (slim)
    return (
      <div className="sc-progress sc-progress--slim" title={rank.note}>
        <span>
          Your rank: <b>{rank.name}</b>
        </span>
        <div className="sc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={done.size}>
          <i style={{ width: `${share * 100}%` }} />
        </div>
        <span>
          {done.size} / {TOTAL} ♡
        </span>
      </div>
    );
  return (
    <div className="sc-progress">
      <div className="sc-progress-top">
        <span>
          Your rank: <b>{rank.name}</b>
        </span>
        <span>
          {done.size} / {TOTAL} ♡
        </span>
      </div>
      <div className="sc-bar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={done.size}>
        <i style={{ width: `${share * 100}%` }} />
      </div>
      <p>{rank.note}</p>
    </div>
  );
}

function UnitCard({ unit, n, done, tick }: { unit: Unit; n: number; done: Set<string>; tick: (key: string) => void }) {
  const got = unit.checklist.filter((_, i) => done.has(`${unit.id}:${i}`)).length;
  return (
    <Fold num={n} title={`${unit.emoji} ${unit.title}`} sub={`${got} / ${unit.checklist.length}${got === unit.checklist.length ? " ✓ done!" : ""}`} open={n === 1 || (got > 0 && got < unit.checklist.length)}>
      <p className="sc-why">{unit.why}</p>
      <div className="sc-unit-grid">
        <div>
          <h5>Study</h5>
          <ul className="sc-links">
            {unit.guides.map((g) => (
              <li key={g.href}>
                <a href={g.href} target="_blank" rel="noreferrer">
                  📓 {g.name} ↗
                </a>
              </li>
            ))}
            {unit.courses.map((i) => (
              <li key={i}>
                <a href={COURSES[i].href} target="_blank" rel="noreferrer">
                  {COURSES[i].emoji} {COURSES[i].title} ↗
                </a>
              </li>
            ))}
            {unit.extra && (
              <li>
                <a href={unit.extra.href} target="_blank" rel="noreferrer">
                  ✨ {unit.extra.name} ↗
                </a>
              </li>
            )}
          </ul>
        </div>
        <div className="sc-project">
          <h5>Build: {unit.project.name}</h5>
          <p>{unit.project.brief}</p>
        </div>
      </div>
      <ul className="sc-check">
        {unit.checklist.map((item, i) => {
          const key = `${unit.id}:${i}`;
          return (
            <li key={key}>
              <label>
                <input type="checkbox" checked={done.has(key)} onChange={() => tick(key)} />
                <span>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </Fold>
  );
}

function Setup({ guide }: { guide: Guide }) {
  return (
    <>
      <p className="sc-setup-blurb">
        {guide.blurb}{" "}
        <a href={guide.href} target="_blank" rel="noreferrer">
          The full guide ↗
        </a>
      </p>
      <div className="sc-folds">
        {guide.steps.map((step, i) => (
          <Fold key={step.title} num={i + 1} title={step.title}>
            {step.note && <p>{step.note}</p>}
            {step.code.map((c) => (
              <Commands key={c} code={c} />
            ))}
            {step.after && <p>{step.after}</p>}
            {step.link && (
              <p>
                <a href={step.link.href} target="_blank" rel="noreferrer">
                  {step.link.text} ↗
                </a>
              </p>
            )}
          </Fold>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- the binder */

export function SchoolSyllabus() {
  const { place } = usePlace();
  // dressed like the world map and the globe: cream paper over a floral
  const paper = useFloral("map");
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");
  const here = place === "school";
  const spot = useRef<HTMLButtonElement>(null);
  const sig = useRef<HTMLSpanElement>(null);
  const prof = useRef<HTMLButtonElement>(null);
  const apple = useRef<HTMLButtonElement>(null);
  const badge = useRef<HTMLButtonElement>(null);
  // the professor is in her classroom to begin with; the apple on her desk
  // sends her away, and calls her back
  const [called, setCalled] = useState(true);
  const body = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("welcome");
  // the guide for whatever computer you're reading this on, to begin with
  const [os, setOs] = useState<Guide["id"]>(() => (/Windows/i.test(navigator.userAgent) ? "windows" : "mac"));
  const [done, setDone] = useState(readDone);

  const tick = useCallback((key: string) => {
    setDone((was) => {
      const now = new Set(was);
      if (now.has(key)) now.delete(key);
      else now.add(key);
      keepDone(now);
      return now;
    });
  }, []);

  const goTo = useCallback((next: Tab) => {
    setTab(next);
    body.current?.scrollTo({ top: 0 });
  }, []);

  /* keep the button over the chalkboard, wherever the photograph has landed */
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
      placeOver(el, box, schoolSpot(img, "board"), stage);
      // Professor Beach Babe, standing by the lamp at the end of her desk
      if (prof.current) placeOver(prof.current, box, schoolSpot(img, "prof"), stage);
      if (apple.current) placeOver(apple.current, box, schoolSpot(img, "apple"), stage);
      // the badge hangs on the front of the desk, centred on its spot
      if (badge.current) {
        const at = schoolSpot(img, "badge");
        badge.current.style.left = `${box.left + box.w * at.x}px`;
        badge.current.style.top = `${box.top + box.h * at.y}px`;
        badge.current.classList.toggle("palais-syllabus-badge--tall", img.src.includes("-portrait-"));
      }
      // the signature, in chalk, sized to the patch of board it has
      const name = sig.current;
      if (name) {
        const patch = schoolSpot(img, "sig");
        placeOver(name, box, patch, stage);
        name.style.fontSize = `${Math.min(box.h * patch.h * 0.85, (box.w * patch.w) / 9.5)}px`;
      }
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200); // the photographs fade in as the seasons turn
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!here) return null;

  return (
    <>
      <button
        ref={apple}
        type="button"
        className="palais-apple"
        aria-label={called ? "Send Professor Beach Babe away" : "An apple for the teacher"}
        aria-pressed={called}
        title="An apple for the teacher"
        onClick={() => setCalled((was) => !was)}
      >
        <Sprite name="apple" />
      </button>
      <button
        ref={prof}
        type="button"
        className={`palais-professor${called ? " is-here" : ""}`}
        aria-label="Professor Beach Babe: open the syllabus"
        aria-hidden={!called}
        tabIndex={called ? 0 : -1}
        title="Professor Beach Babe"
        onClick={() => setOpen(true)}
      >
        <img src={`${process.env.PUBLIC_URL}/palais/professor.webp`} alt="" draggable={false} />
      </button>
      <span ref={sig} aria-hidden className="palais-chalk-sig">
        – Professor Beach Babe
      </span>
      <button
        ref={spot}
        type="button"
        className="palais-chalkboard"
        aria-label="Open the Brat Academy syllabus"
        title="The syllabus"
        onClick={() => setOpen(true)}
      />
      {/* and a badge on the front of her desk saying so: just "Syllabus" on a phone */}
      <button ref={badge} type="button" className="palais-syllabus-badge" aria-label="Open the syllabus" onClick={() => setOpen(true)}>
        <span className="palais-chalkboard-hint">
          <span aria-hidden>♡</span>
          <span className="palais-badge-long">Open the syllabus</span>
          <span className="palais-badge-short">Syllabus</span>
          <span aria-hidden>♡</span>
        </span>
      </button>
      {open && (
        <div
          className="wm-backdrop"
          style={{
            ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
            ["--wm-jewel-side" as string]: paletteOf(chips.now).jewel,
            ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).jewel,
          }}
          onPointerDown={(e) => e.target === e.currentTarget && close()}
        >
          <div
            className="wm-panel wm-panel--globe wm-panel--school"
            role="dialog"
            aria-modal="true"
            aria-labelledby="school-title"
            style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.965), rgba(250, 243, 229, 0.975)), url("${floralSrc(paper.now)}")` }}
          >
            {/* the plaque, with the loading screen's coconuts either side */}
            <div className="wm-title sc-title">
              <Sprite name="coconut" className="sc-title-deco" />
              <h2 id="school-title">
                <span aria-hidden>✨</span> Brat Academy <span aria-hidden>💻</span>
              </h2>
              <Sprite name="drink" className="sc-title-deco" />
            </div>
            <button type="button" className="wm-close" onClick={close} aria-label="Close the syllabus">
              ×
            </button>

            <div className="sc-binder">
              <div className="sc-tabs" role="tablist">
                {TABS.map((t) => (
                  <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => goTo(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="sc-body" ref={body} role="tabpanel">
                {tab === "welcome" && (
                  <>
                    {/* the brat-code loading screen, in miniature */}
                    <div className="sc-hero">
                      {SCATTER.map((d, i) => (
                        <Sprite
                          key={i}
                          name={d.name}
                          className="sc-hero-deco"
                          style={{ left: d.left, top: d.top, width: d.size, animationDelay: `${d.delay}s` }}
                        />
                      ))}
                      <img className="sc-hero-logo" src={`${process.env.PUBLIC_URL}/bratcode.webp`} alt="Brat Code" />
                      <div className="sc-hero-bar" aria-hidden>
                        <i />
                      </div>
                      <p className="sc-hero-sub">loading your glow-up…</p>
                    </div>
                    <p className="sc-lede">
                      <em>Level up your coding skills.</em> Professor Beach Babe teaches hot girls how to code. Brat Academy takes you from a brand new
                      computer to your own apps on the internet, one unit at a time, with something real to show for every
                      one. Pretty girls build cool things.
                    </p>
                    <Progress done={done} slim />
                    <h3 className="sc-head">💬 How it works</h3>
                    <ol className="sc-how">
                      {HOW.map((h, i) => (
                        <li key={h.title}>
                          {/* a little window, like the brat code logo's: three
                              dots in a pink title bar over mint-green grid */}
                          <div className="sc-win-bar" aria-hidden>
                            <i />
                            <i />
                            <i />
                          </div>
                          <div className="sc-win-body">
                            <span className="sc-how-emoji" aria-hidden>
                              {h.emoji}
                            </span>
                            <b>
                              {i + 1}. {h.title}
                            </b>
                            <span>{h.text}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="sc-start">
                      <button type="button" className="sc-big" onClick={() => goTo("setup")}>
                        <Sprite name="heart" className="sc-big-heart" /> Set up my computer
                      </button>
                      <button type="button" className="sc-big sc-big--alt" onClick={() => goTo("path")}>
                        <Sprite name="pinkHeart" className="sc-big-heart" /> See the path
                      </button>
                    </div>
                    <p className="sc-outro">
                      Let's get that tech bag, brat 💅💻🧃
                      <br />
                      Questions, or want a spot? Hit up the Brat-Cademy Dean on{" "}
                      <a href="https://www.linkedin.com/in/mollybeach" target="_blank" rel="noreferrer">
                        LinkedIn
                      </a>{" "}
                      😎
                    </p>
                  </>
                )}

                {tab === "path" && (
                  <>
                    <Progress done={done} />
                    <div className="sc-folds">
                      {UNITS.map((u, i) => (
                        <UnitCard key={u.id} unit={u} n={i + 1} done={done} tick={tick} />
                      ))}
                    </div>
                    <p className="sc-note">Your ticks stay in this browser, just for you.</p>
                  </>
                )}

                {tab === "courses" && (
                  <ol className="sc-courses">
                    {COURSES.map((c, i) => (
                      <li key={c.title} className="sc-course">
                        <div className="sc-course-top">
                          <span className="sc-num">{i + 1}</span>
                          <h4>
                            <span aria-hidden>{c.emoji}</span> {c.title}
                          </h4>
                        </div>
                        <p className="sc-meta">
                          <a href={c.href} target="_blank" rel="noreferrer">
                            {c.platform} ↗
                          </a>
                          <span>{c.level}</span>
                          <span>{c.time}</span>
                        </p>
                        <ul className="sc-learn">
                          {c.learn.map((l) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                        {c.bonus && (
                          <p className="sc-bonus">
                            🎯 Bonus:{" "}
                            <a href={c.bonus.href} target="_blank" rel="noreferrer">
                              {c.bonus.text}
                            </a>
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {tab === "sheets" && (
                  <>
                    <p className="sc-setup-blurb">
                      The brainbook: my study guides, to keep open next to whatever you're learning.{" "}
                      <a href="https://github.com/mollybeach/bratcode-brainbook" target="_blank" rel="noreferrer">
                        All of it on GitHub ↗
                      </a>
                    </p>
                    <div className="sc-materials">
                      {MATERIALS.map((m) => (
                        <a key={m.href} className="sc-material" href={m.href} target="_blank" rel="noreferrer">
                          <img src={m.icon} alt="" />
                          <span>{m.name} ↗</span>
                        </a>
                      ))}
                    </div>
                    <div className="sc-shelves">
                      {SHEETS.map((shelf) => (
                        <section key={shelf.shelf} className="sc-shelf">
                          <h4>
                            {shelf.emoji} {shelf.shelf}
                          </h4>
                          <ul>
                            {shelf.items.map((it) => (
                              <li key={it.href}>
                                <a href={it.href} target="_blank" rel="noreferrer">
                                  {it.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </>
                )}

                {tab === "setup" && (
                  <>
                    <div className="sc-os" role="group" aria-label="Which computer">
                      {GUIDES.map((g) => (
                        <button key={g.id} type="button" aria-pressed={os === g.id} onClick={() => setOs(g.id)}>
                          {g.id === "mac" ? "🍎" : "🪟"} {g.name}
                        </button>
                      ))}
                    </div>
                    <Setup key={os} guide={GUIDES.find((g) => g.id === os) ?? GUIDES[0]} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
