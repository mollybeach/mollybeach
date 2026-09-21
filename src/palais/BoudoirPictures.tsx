import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { usePlace } from "./place";
import { lettersOpen, remember, remembered } from "./letters";
import {
  addPortrait,
  dropNote,
  PORTRAIT_TYPES,
  postNote,
  readNotes,
  readPortraits,
  type Portrait,
  type PortraitNote,
} from "./portraits";
import { noteDoing } from "./visits";

/**
 * The pictures kept in the Boudoir's white dresser.
 *
 * The dresser opens like the library's desk drawer, and it opens to the same
 * word as the letters — anyone who knows one knows the other, and a browser
 * that has already opened the drawer walks straight in (letters.ts). Inside,
 * the pictures hang one at a time in a carved gilt frame, the gold of the
 * mirrors in the catalogue (.bd-frame in palais.css), with an arrow either
 * side and the arrow keys to walk along them. A film hangs in the same frame
 * and plays there.
 *
 * Whoever opened the dresser can also put one in — the button under the frame
 * sends the file straight to the bucket on a link signed for it alone
 * (portraits.ts), and the drawer is read again so the new one hangs last.
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

/** under this many seconds on a picture is walking past it, not looking */
const SHORT = 3;
/** "12s", "1m 5s", "4m" */
const howLong = (secs: number) =>
  secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m${secs % 60 ? ` ${secs % 60}s` : ""}`;

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
  const pit = useRef<HTMLDivElement>(null);
  /* putting one in: the file picker, and what to say while it goes */
  const picker = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  /* what people have said about them: the whole drawer's worth, fetched once,
     so a count can sit against the picture without asking again */
  const [notes, setNotes] = useState<PortraitNote[]>([]);
  const [talking, setTalking] = useState(true);       // the notes lie over the picture unless the pen puts them away
  const [saying, setSaying] = useState("");
  const [posting, setPosting] = useState(false);
  const [noteTrouble, setNoteTrouble] = useState<string | null>(null);
  const scroll = useRef<HTMLUListElement>(null);

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

  /** the same word as the letters; the database checks it, not this.
      `typed` is someone standing at the dresser having a go — a browser that
      already knows the word walks in without one, and that isn't an attempt.
      What they typed is never written down: only whether it fitted. */
  const tryWord = useCallback(async (word: string, typed = false) => {
    setBusy(true);
    setTrouble(null);
    try {
      if (await lettersOpen(word)) {
        if (typed) noteDoing("portrait-try", "and it opened");
        setInside(true);
        setKey(word);
        remember("key", word);
        noteDoing("pictures");          // Molly hears that someone looked (visits.ts)
        // the pictures themselves, signed for ten minutes at a time
        // (portraits.ts). Before the bucket exists, nothing comes back.
        readPortraits(word)
          .then((got) => {
            setHanging(got);
            setAt(0);
          })
          .catch(() => setHanging([]));
        // and what has been said about them, which is as private as they are
        readNotes(word)
          .then(setNotes)
          .catch(() => setNotes([]));
      } else {
        if (typed) noteDoing("portrait-try", "the word didn't fit");
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

  /* putting one in: straight from here to the bucket, on a link signed for
     this one file (portraits.ts). Then the drawer is read again, and the new
     one is the one hanging — it is stamped, so it hangs last. */
  const takeIn = useCallback(
    async (file: File | null | undefined) => {
      if (!file || !key) return;
      setSending(true);
      setTrouble(null);
      setSent(null);
      try {
        await addPortrait(key, file);
        noteDoing("portrait", file.name);      // Molly hears that one went in
        const got = await readPortraits(key);
        setHanging(got);
        setAt(Math.max(0, got.length - 1));
        setSent(`${file.name} is in the dresser.`);
      } catch (e) {
        setTrouble(e instanceof Error ? e.message : "It didn't get there. Try again?");
      } finally {
        setSending(false);
        if (picker.current) picker.current.value = "";
      }
    },
    [key],
  );

  /* Leaving one. Nobody types a name: the database signs it with whoever the
     visitor book says is reading, and with their name instead once Molly has
     given them one (20260921120000_palais_portrait_notes.sql). */
  const say = useCallback(
    async (path: string, title: string) => {
      if (!key || !saying.trim()) return;
      setPosting(true);
      setNoteTrouble(null);
      try {
        await postNote(key, path, saying.trim());
        setSaying("");
        setNotes(await readNotes(key));
        noteDoing("portrait-note", title);     // Molly hears that one was left
      } catch (e) {
        setNoteTrouble(e instanceof Error ? e.message : "That note wouldn't go in.");
      } finally {
        setPosting(false);
      }
    },
    [key, saying],
  );

  const unsay = useCallback(
    async (id: number) => {
      if (!key) return;
      setNoteTrouble(null);
      try {
        await dropNote(key, id);
        setNotes(await readNotes(key));
      } catch (e) {
        setNoteTrouble(e instanceof Error ? e.message : "That note wouldn't come back.");
      }
    },
    [key],
  );

  const showingNow = hanging?.[at] ?? hanging?.[0] ?? null;
  /* They drift by on their own, the way the comments do on a TikTok you're
     watching back: down to the last one, a beat, then round again. Pointing
     at them stops it, so one can be read or taken back; so does asking for
     less motion. Nothing here touches the layout. */
  const drifting = showingNow ? notes.filter((n) => n.path === showingNow.path).length : 0;
  useEffect(() => {
    const list = scroll.current;
    if (!talking || !list || drifting < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let held = 0;
    let stopped = false;
    const step = () => {
      const most = list.scrollHeight - list.clientHeight;
      if (most > 1) {
        if (held > 0) held -= 1;
        else if (list.scrollTop >= most - 0.5) held = 110;   // a beat at the end
        else if (list.scrollTop <= 0.5 && held === 0 && list.scrollTop === 0) list.scrollTop += 0.3;
        else list.scrollTop += 0.3;
        if (held === 1) list.scrollTop = 0;                  // and round again
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    const hold = () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
    const go = () => {
      if (!stopped) return;
      stopped = false;
      frame = requestAnimationFrame(step);
    };
    list.addEventListener("pointerenter", hold);
    list.addEventListener("pointerleave", go);
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("pointerenter", hold);
      list.removeEventListener("pointerleave", go);
    };
    // `ready` matters: the notes only exist once the picture they lie on is
    // up, which is after the notes themselves have arrived
  }, [talking, drifting, at, ready]);

  const shut = useCallback(() => {
    setOpen(false);
    setTrouble(null);
    setSent(null);
    setNoteTrouble(null);
    setTalking(false);
  }, []);
  const many = hanging?.length ?? 0;
  const step = useCallback((by: number) => setAt((n) => (n + by + many) % many), [many]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") shut();
      if (!inside) return;
      // a film's own controls use the arrows to run it back and forth, so
      // while it has the focus they're its, not the drawer's
      const on = e.target as HTMLElement | null;
      if (on && (on.tagName === "VIDEO" || on.closest?.("video"))) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, inside, shut, step]);

  /* learn a picture's shape before hanging it, and have the next one ready.
     A film is asked the same question of its first frame: enough of it is
     fetched to know how big it is, and no more. */
  const onNow = hanging?.[at] ?? hanging?.[0] ?? null;
  useEffect(() => {
    const url = onNow?.url;
    if (!url) return;
    const learn = (u: string, film?: boolean, then?: (r: number) => void) => {
      const known = shapes.current.get(u);
      if (known) return then?.(known);
      const take = (r: number) => {
        shapes.current.set(u, r || 4 / 3);
        then?.(r || 4 / 3);
      };
      if (film) {
        const reel = document.createElement("video");
        reel.preload = "metadata";
        reel.muted = true;
        reel.onloadedmetadata = () => take(reel.videoWidth / reel.videoHeight);
        reel.onerror = () => take(16 / 9);
        reel.src = u;
        return;
      }
      const img = new Image();
      img.onload = () => take(img.naturalWidth / img.naturalHeight);
      img.onerror = () => take(4 / 3);
      img.src = u;
    };
    let gone = false;
    learn(url, onNow?.kind === "film", (r) => {
      if (gone) return;
      setShape(r);
      setReady(url);
      // the one along, so stepping to it is instant
      const next = hanging?.[(at + 1) % (hanging.length || 1)];
      if (next && next.url !== url) learn(next.url, next.kind === "film");
    });
    return () => {
      gone = true;
    };
  }, [onNow?.url, onNow?.kind, hanging, at]);

  /* What they stopped on, and how long they stayed with it.
     Each one is told when they leave it — stepping to the next, shutting the
     dresser, putting the phone down — so the time spent can go with it.
     Walking past on the way to another one doesn't count. */
  const stay = useRef<{ which: string; kind: string; since: number } | null>(null);
  const leave = useCallback(() => {
    const was = stay.current;
    stay.current = null;
    if (!was) return;
    const secs = Math.round((Date.now() - was.since) / 1000);
    if (secs < SHORT) return;          // they only passed it
    noteDoing(was.kind, `${was.which} · ${howLong(secs)}`);
  }, []);

  useEffect(() => {
    if (!open || !inside || !onNow) return;
    const which = `${onNow.title} (${at + 1}/${many})`;
    const kind = onNow.kind === "film" ? "portrait-film" : "portrait-seen";
    const begin = () => {
      stay.current = { which, kind, since: Date.now() };
    };
    begin();
    // a phone put down or a tab left behind isn't time spent looking: the
    // clock stops when the page is hidden and starts again when it's back
    const watch = () => (document.hidden ? leave() : begin());
    document.addEventListener("visibilitychange", watch);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", watch);
      window.removeEventListener("pagehide", leave);
      leave();                          // stepping away from this one
    };
  }, [open, inside, onNow, at, many, leave]);

  /* The panel is always the same size — no modal in the Palais changes shape
     with what's in it. The picture is measured to the fixed area it hangs in
     instead: the biggest box of its own shape that fits, and if it somehow
     can't be made to fit, the area scrolls rather than the panel growing. */
  const hung = inside && hanging?.length;
  useLayoutEffect(() => {
    const room = pit.current;
    if (!hung || !room) return;
    const fit = () => {
      // the picture's own shape, asked of the picture itself when it is there:
      // the remembered one can belong to the picture before this one
      const hangs = room.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
      const own =
        hangs instanceof HTMLVideoElement
          ? { w: hangs.videoWidth, h: hangs.videoHeight }
          : { w: hangs?.naturalWidth ?? 0, h: hangs?.naturalHeight ?? 0 };
      const real = own.w && own.h ? own.w / own.h : shape;
      const room_ = { w: room.clientWidth, h: room.clientHeight };
      // the biggest box of that shape that fits inside the area, bounded on
      // BOTH sides so it can never be wider than the panel it hangs in
      const h = Math.max(48, Math.min(room_.h, room_.w / real));
      const w = Math.min(Math.round(h * real), room_.w);
      setFrame({ w, h: Math.round(Math.min(h, w / real)) });
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(room);
    return () => watch.disconnect();
  }, [hung, shape, at]);

  if (!here) return null;

  const showing = showingNow;
  const mine = showing ? notes.filter((n) => n.path === showing.path) : [];

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
            {/* opposite the ×: the way to put one in, once they're inside */}
            {inside && (
              <>
                <input
                  ref={picker}
                  type="file"
                  className="bd-picker"
                  accept={PORTRAIT_TYPES}
                  onChange={(e) => takeIn(e.target.files?.[0])}
                  disabled={sending}
                />
                <button
                  type="button"
                  className="wm-close bd-add-corner"
                  onClick={() => picker.current?.click()}
                  disabled={sending}
                  aria-label="Add a picture or a film"
                  title="Add a picture or a film"
                >
                  {sending ? "…" : "+"}
                </button>
                {/* and what's been said about the one in the frame */}
                <button
                  type="button"
                  className={`wm-close bd-say-corner${talking ? " is-on" : ""}`}
                  onClick={() => setTalking((t) => !t)}
                  aria-expanded={talking}
                  aria-label={mine.length ? `${mine.length} notes on this one` : "Leave a note on this one"}
                  title={mine.length ? `${mine.length} notes on this one` : "Leave a note on this one"}
                >
                  <span aria-hidden>✎</span>
                  {mine.length > 0 && <span className="bd-say-tally" aria-hidden>{mine.length}</span>}
                </button>
              </>
            )}

            {!inside ? (
              /* the dresser is locked: the same word as the letters */
              <form
                className="lt-gate"
                onSubmit={(e) => {
                  e.preventDefault();
                  tryWord(tried.trim(), true);
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
                      <figure
                        className={`bd-frame${frame ? " is-fitted" : ""}`}
                        style={frame ? { width: `${frame.w}px`, height: `${frame.h}px` } : undefined}
                      >
                        {/* already fetched and measured above, so it paints
                            straight into a frame of the right shape */}
                        {showing.kind === "film" ? (
                          <video
                            key={showing.url}
                            src={showing.url}
                            controls
                            playsInline
                            preload="metadata"
                            aria-label={showing.title}
                          />
                        ) : (
                          <img src={showing.url} alt={showing.title} decoding="async" />
                        )}

                        {/* The notes, lying over the corner of the picture the
                            way they do on a TikTok you're watching back. They
                            are out of the layout altogether, so however many
                            there are nothing moves and the panel cannot change
                            size. A film keeps its controls: they sit above. */}
                        {talking && (
                          <div className={`bd-say${showing.kind === "film" ? " bd-say--film" : ""}`}>
                          <ul className="bd-say-list" ref={scroll}>
                            {mine.length === 0 && <li className="bd-say-none">Nothing said about this one yet.</li>}
                            {mine.map((n) => (
                              <li key={n.id}>
                                <p className="bd-say-body">{n.body}</p>
                                <p className="bd-say-by">
                                  <span className={n.named ? "bd-say-name" : "bd-say-id"}>{n.author}</span>
                                  <span className="bd-say-when">{new Date(n.at).toLocaleDateString()}</span>
                                  {n.mine && (
                                    <button type="button" className="bd-say-drop" onClick={() => unsay(n.id)}>
                                      take it back
                                    </button>
                                  )}
                                </p>
                              </li>
                            ))}
                            </ul>
                          </div>
                        )}
                      </figure>
                    </div>

                    {/* the rail under the pictures: an arrow either side of the
                        beads. On a screen with room the arrows ride on the
                        picture's own edges instead (palais.css). */}
                    <div className="bd-foot">
                      {many > 1 && (
                        <button type="button" className="bd-arrow bd-arrow--back" onClick={() => step(-1)} aria-label="The one before">
                          ‹
                        </button>
                      )}
                      {many > 1 && (
                        <>
                          {/* a bead for each picture on a screen with room for
                              them; a phone gets the count instead, since sixty
                              dots is not a rail, it's a carpet */}
                          <span className="bd-count" aria-hidden>
                            {hanging!.map((p, n) => (
                              <i key={p.url} className={n === at ? "is-on" : undefined} />
                            ))}
                          </span>
                          <span className="bd-tally">
                            {at + 1} / {many}
                          </span>
                        </>
                      )}
                      {many > 1 && (
                        <button type="button" className="bd-arrow bd-arrow--on" onClick={() => step(1)} aria-label="The next one">
                          ›
                        </button>
                      )}
                    </div>

                  </>
                )}

                {/* and the way to put one in, under everything, the way the
                    cookbook keeps its pen under the left page */}
                <div className="bd-add">
                  {/* always here, so showing the notes moves nothing */}
                  {inside && (
                    <form
                      className="bd-say-new"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (showing) say(showing.path, showing.title);
                      }}
                    >
                      <input
                        className="lt-input bd-say-what"
                        value={saying}
                        onChange={(e) => setSaying(e.target.value)}
                        placeholder="say something about this one…"
                        aria-label="What to say about this picture"
                        maxLength={1000}
                      />
                      <button type="submit" className="wm-btn bd-say-post" disabled={posting || !saying.trim()}>
                        {posting ? "…" : "Send"}
                      </button>
                    </form>
                  )}
                  {sending && <Waiting say="Putting it in the dresser…" />}
                  {noteTrouble && <p className="lt-trouble">{noteTrouble}</p>}
                  {trouble && <p className="lt-trouble">{trouble}</p>}
                  {sent && !trouble && <p className="bd-said">{sent}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
