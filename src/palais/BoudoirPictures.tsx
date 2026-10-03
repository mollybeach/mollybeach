import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { coverBox } from "./GlobeEgg";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { hashExtra, usePlace } from "./place";
import { currentEditor, onEditorChange, signInWith, signOut, type Editor, type Provider } from "./layoutsDb";
import Livestream from "./Livestream";
import { lettersOpen, remember, remembered } from "./letters";
import {
  addPortrait,
  dropNote,
  grabFirstFrame,
  keepPoster,
  knownShape,
  PORTRAIT_TYPES,
  postNote,
  readNotes,
  readPortraits,
  readPosters,
  rememberShape,
  type Poster,
  type Portrait,
  type PortraitNote,
} from "./portraits";
import { noteDoing, noteSigninAttempt } from "./visits";

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

/* mollybeach.app/#boudoir/portraits walks straight up to the dresser, and
   /#boudoir/live walks up to it with the camera showing. The word is still
   asked for: the link opens the drawer, it doesn't unlock it. */
const WANTED = (extra: string) => /^(portraits|live)/.test(extra);

/* Whether this visit ARRIVED on the dresser's own link rather than finding the
   bunny in the room. Read once as the page loads: by the time it is open the
   address says #boudoir/portraits either way. */
const CAME_IN_ON_THE_LINK =
  typeof window !== "undefined" && WANTED(window.location.hash.replace("#", "").split("/")[1] ?? "");

/* Which door this visit came in by, so the visitors' book can tell a link that
   was passed around from somebody who found the rabbit standing in the room.
   The little landing pages — public/rabbit and public/boudoir/portraits —
   leave their name in this tab on the way past; a plain hash link leaves none
   and is read off the address instead. Read once as the page loads and rubbed
   out behind us, because only the way in counts. */
/* A keyboard that opens by itself is a jolt on a phone, and iOS answers it by
   scrolling and scaling the page about under a modal that is already the size
   of the screen. On a touch screen the word is waited for instead. */
const COARSE =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: coarse)").matches
    : false;

const DOOR = "palais-door";
const CAME_IN_BY: string | undefined = (() => {
  if (typeof window === "undefined") return undefined;
  let door: string | null = null;
  try {
    door = sessionStorage.getItem(DOOR);
    sessionStorage.removeItem(DOOR);
  } catch {
    /* no storage: the address still says something */
  }
  if (door === "rabbit") return "came in by the rabbit · /rabbit";
  if (door === "portraits") return "came in through the door · /boudoir/portraits";
  return CAME_IN_ON_THE_LINK ? "came in on the link · #boudoir/portraits" : undefined;
})();

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

  const [open, setOpen] = useState(() => CAME_IN_ON_THE_LINK);
  const [key, setKey] = useState(() => remembered("key"));
  const [inside, setInside] = useState(false);
  /* the dresser has two drawers now: the pictures, and her, live */
  const [tab, setTab] = useState<"portraits" | "live">(() =>
    /^live/.test(hashExtra()) ? "live" : "portraits",
  );
  /* anyone past the word may watch; only Molly, signed in, may be watched */
  const [editor, setEditor] = useState<Editor | null>(null);
  /* once the word is right, the dresser asks you to sign in before it shows
     anything — no way past but a real provider (layoutsDb.ts). onEditorChange
     sets `editor` when the session lands, and the pictures follow. */
  /* The greeting shows every time the dresser is opened, even to a session
     that is already signed in — so the sign-in screen is always met, never
     skipped past. `passed` is set only by an action in the greeting itself
     (a provider, the password, or continuing as who you already are) and is
     cleared again when the dresser shuts. */
  const [passed, setPassed] = useState(false);
  const [authBusy, setAuthBusy] = useState<string | null>(null);
  const [authTrouble, setAuthTrouble] = useState<string | null>(null);
  const arrived = useRef<string | undefined>(CAME_IN_BY);
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
  /* the one that has actually arrived, so the rest can shimmer while it comes */
  const [painted, setPainted] = useState<string | null>(null);
  /* a signed link is good for ten minutes; a slow connection can outlive one */
  const signedAt = useRef(0);
  const resigning = useRef(false);
  const pit = useRef<HTMLDivElement>(null);
  /* putting one in: the file picker, and what to say while it goes */
  const picker = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  /* what people have said about them: the whole drawer's worth, fetched once,
     so a count can sit against the picture without asking again */
  const [notes, setNotes] = useState<PortraitNote[]>([]);
  /* each film's first frame, so the gilt frame has a face to wear at once */
  const [posters, setPosters] = useState<Record<string, Poster>>({});
  /* films already asked for their frame this sitting, so it is drawn once */
  const drawn = useRef(new Set<string>());
  const [talking, setTalking] = useState(true);       // the notes lie over the picture unless the pen puts them away
  const [saying, setSaying] = useState("");
  const [posting, setPosting] = useState(false);
  const [noteTrouble, setNoteTrouble] = useState<string | null>(null);
  const scroll = useRef<HTMLUListElement>(null);   // one run of them, to measure
  const window_ = useRef<HTMLDivElement>(null);    // the window they run through

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
        /* A phone has only the wide photograph to show, so it is blown up and
           cropped hard at the sides — and his place on the marble, a quarter
           of the way across the room, falls clean off the left of the screen.
           He is the only way into the dresser you can see, so he is kept on
           the floor he stands on but brought back inside the screen. On
           anything wide enough he is already in it and nothing moves him. */
        const edge = Math.min(14, stage.clientWidth * 0.04);
        const far = Math.max(edge, stage.clientWidth - width - edge);
        const x = box.left + box.w * sits.x - width / 2;
        rabbit.style.left = `${Math.min(Math.max(x, edge), far)}px`;
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
  /* a provider button: hand off to Google or Apple's own page and come back
     signed in. onEditorChange then sees the session and the dresser moves on
     to the word on its own. */
  /* the footer's slot, where the "sign out" rides while someone is signed in */
  const [footSlot, setFootSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setFootSlot(open ? document.getElementById("palais-footer-actions") : null);
  }, [open]);

  /* leave the dresser's sign-in: back to the greeting, and the account dropped */
  const goSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch {
      /* nothing to do: onEditorChange will settle the state either way */
    }
    setPassed(false);
  }, []);

  const goProvider = useCallback(async (provider: Provider) => {
    setAuthTrouble(null);
    setAuthBusy(provider);
    // let Molly know someone's at the door before we hand off to the provider
    void noteSigninAttempt(provider);
    try {
      await signInWith(provider, window.location.href);
      // the page is navigating away to the provider; nothing after this runs
    } catch {
      setAuthBusy(null);
      setAuthTrouble(
        provider === "apple"
          ? "Apple sign-in isn't switched on yet."
          : "Google sign-in isn't switched on yet.",
      );
    }
  }, []);


  const tryWord = useCallback(async (word: string, typed = false) => {
    setBusy(true);
    setTrouble(null);
    try {
      /* A browser that already knows the word doesn't wait to be told it was
         right before asking for the pictures: both questions go at once and
         the pictures are thrown away if the word turns out not to fit. On a
         connection where a round trip costs most of a second, that is half the
         wait to the first picture gone. Somebody standing at the dresser
         having a go is asked properly, one thing at a time. */
      const soon = typed ? null : readPortraits(word).catch(() => null);
      if (await lettersOpen(word)) {
        if (typed) noteDoing("portrait-try", "and it opened");
        setInside(true);
        setKey(word);
        remember("key", word);
        // Molly hears that someone looked, and how they got here (visits.ts)
        noteDoing("pictures", arrived.current);
        arrived.current = undefined;    // only the way in counts as arriving
        // the pictures themselves, signed for ten minutes at a time
        // (portraits.ts). Before the bucket exists, nothing comes back.
        (soon ?? readPortraits(word))
          .then(async (got) => got ?? (await readPortraits(word)))
          .then((got) => {
            signedAt.current = Date.now();
            setHanging(got);
            setAt(0);
          })
          .catch(() => setHanging([]));
        // and what has been said about them, which is as private as they are
        readNotes(word)
          .then(setNotes)
          .catch(() => setNotes([]));
        // and the films' faces, which come back inline and need no signing
        readPosters(word)
          .then(setPosters)
          .catch(() => setPosters({}));
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
  const drifting = showingNow ? notes.filter((n) => n.path === showingNow.path).length : 0;
  /* They rise up the picture, out at the top, and in again at the bottom —
     the way the comments do on a TikTok you're watching back. One run of them
     is measured, then laid end to end enough times to fill the window and
     over again, so the loop has no seam to see. CSS does the moving: nothing
     here touches the layout, and pointing at them holds them still. */
  useEffect(() => {
    if (!open) return;
    currentEditor()
      .then(setEditor)
      .catch(() => {});
    return onEditorChange(setEditor);
  }, [open]);

  const [reel, setReel] = useState({ copies: 2, rise: 0, gap: 0 });
  useEffect(() => {
    const box = window_.current;
    const one = scroll.current;
    if (!talking || !box || !one || drifting < 1) return;
    const fit = () => {
      const run = one.getBoundingClientRect().height;
      const tall = box.getBoundingClientRect().height;
      if (run < 8) return;
      /* They always go round. Two runs, with a gap between them as deep as
         whatever the window has left over — so the second run begins exactly
         at the bottom edge as the first starts to rise, and the whole thing
         moves up by one run plus that gap before starting again. At any
         moment the window holds one run's worth, part of it the tail of the
         first and part the head of the second: a circle, never a stutter of
         the same note twice. */
      const gap = Math.max(12, Math.round(tall - run));
      const rise = Math.round(run + gap);
      setReel((was) =>
        Math.abs(was.rise - rise) < 1 && Math.abs(was.gap - gap) < 1 ? was : { copies: 2, rise, gap },
      );
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(box);
    watch.observe(one);
    return () => watch.disconnect();
  }, [talking, drifting, at, ready]);

  const shut = useCallback(() => {
    setOpen(false);
    setTrouble(null);
    setSent(null);
    setNoteTrouble(null);
    setTalking(false);
  }, []);
  /* While the dresser is open the weather comes over the top of it, so the
     snow keeps falling down the front of the pictures instead of stopping at
     the edge of the room behind. The canvas takes no clicks, so the drawer
     works exactly as before underneath it. */
  useEffect(() => {
    if (!open || !here) return;
    const stage =
      spot.current?.closest<HTMLElement>(".palais-stage") ??
      document.querySelector<HTMLElement>(".palais-stage");
    if (!stage) return;
    stage.classList.add("palais-stage--weather-over");
    return () => stage.classList.remove("palais-stage--weather-over");
  }, [open, here]);

  /* leaving the room shuts the dresser behind you */
  useEffect(() => {
    if (!here) setOpen(false);
  }, [here]);
  /* the greeting is met afresh each opening */
  useEffect(() => {
    if (!open) setPassed(false);
  }, [open]);
  /* a completed sign-in advances past the greeting on its own (the job the
     old "continue as…" link did) */
  useEffect(() => {
    if (editor) setPassed(true);
  }, [editor]);
  /* the address says whether the dresser is open and which drawer, so the page
     can be sent to somebody and open where it left off */
  useEffect(() => {
    if (!here) return;
    /* only ever the part after #boudoir. When the address changes to another
       room this runs once more before `place` has caught up, and without this
       it would write #boudoir straight back over it and you could never leave
       the room by a link. */
    if (window.location.hash.replace("#", "").split("/")[0] !== "boudoir") return;
    const want = open ? `#boudoir/${tab === "live" ? "live" : "portraits"}` : "#boudoir";
    if (window.location.hash !== want) window.history.replaceState(window.history.state, "", want);
  }, [open, tab, here]);
  /* and the back button, or a link followed while it is already open */
  useEffect(() => {
    const onHash = () => {
      const extra = hashExtra();
      setOpen(WANTED(extra));
      if (WANTED(extra)) setTab(/^live/.test(extra) ? "live" : "portraits");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
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

  /* The frame is built from what this browser remembers of the picture's
     shape, so it is standing before a byte of the picture has arrived; the
     picture paints into it as it comes and puts the frame right on the way in
     if the memory was wrong. Waiting for the whole file first — which is what
     this did — meant a minute of rabbits on aeroplane wifi before anything
     was seen at all. */
  const onNow = hanging?.[at] ?? hanging?.[0] ?? null;
  useEffect(() => {
    const url = onNow?.url;
    if (!url) return;
    const face = onNow?.path ? posters[onNow.path] : undefined;
    const fromFace = face?.w && face?.h ? face.w / face.h : undefined;
    const known = shapes.current.get(url) ?? (onNow?.path ? knownShape(onNow.path) : undefined) ?? fromFace;
    if (known) {
      shapes.current.set(url, known);
      setShape(known);
    }
    setReady(url);
    /* and the ones either side, fetched behind this one so that stepping on is
       instant — at low priority, so they never hold up the one being looked at */
    const soon = window.setTimeout(() => {
      const near = many > 1 ? [hanging?.[(at + 1) % many], hanging?.[(at - 1 + many) % many]] : [];
      near.forEach((p) => {
        if (!p || p.url === url || p.kind === "film") return;
        const img = new Image();
        img.decoding = "async";
        try {
          (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
        } catch {
          /* a browser that has never heard of it fetches it normally */
        }
        img.src = p.url;
      });
    }, 350);
    return () => window.clearTimeout(soon);
  }, [onNow, at, hanging, many, posters]);

  /* A film with no face yet sits for its portrait: its own reel is fetched to
     one side, a frame a moment in is drawn to a canvas and the still is sent
     back for the next person. Whoever gets there first gives it its face and
     it keeps it; everybody after that finds it already hanging. */
  useEffect(() => {
    if (!inside || !key || !onNow || onNow.kind !== "film") return;
    const path = onNow.path;
    if (!path || posters[path] || drawn.current.has(path)) return;
    drawn.current.add(path);     // one reel at a time for this film, not one per render
    void grabFirstFrame(onNow.url).then((still) => {
      if (!still) {
        // it wouldn't draw this time — walked away from, or too slow. Let the
        // next person who stops on it have a go rather than leaving it faceless.
        drawn.current.delete(path);
        return;
      }
      // the face belongs to the film, not to whatever is in the frame now, so
      // it is kept even if they have already stepped along
      setPosters((all) => (all[path] ? all : { ...all, [path]: { poster: still.poster, w: still.w, h: still.h } }));
      rememberShape(path, still.w / still.h);
      void keepPoster(key, path, still.poster, still.w, still.h).catch(() => {});
    });
  }, [inside, key, onNow, posters]);

  /* A link out of the dresser is signed for ten minutes. On a slow connection
     a sitting can outlast one, and every picture goes dead at once; rather
     than leave a broken frame, the drawer is read again and the links renewed. */
  const reSign = useCallback(() => {
    if (resigning.current || !key) return;
    if (Date.now() - signedAt.current < 20000) return;   // not the link's age: a bad file
    resigning.current = true;
    readPortraits(key)
      .then((got) => {
        signedAt.current = Date.now();
        setHanging(got);
      })
      .catch(() => {})
      .finally(() => {
        resigning.current = false;
      });
  }, [key]);

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
          className="wm-backdrop bd-backdrop"
          /* The dresser's furniture is black rather than the pattern's stone:
             the pill over the top, the ×, the +, the pen and the count. The
             black is the one in the wallpaper's own palette, so it stays of a
             piece with whatever the room is wearing. */
          style={{
            ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
            ["--bd-coal" as string]: paletteOf(chips.now).ink,
            ["--wm-jewel-side" as string]: paletteOf(chips.now).ink,
            ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).ink,
          }}
          onPointerDown={(e) => e.target === e.currentTarget && shut()}
        >
          <div
            className={`wm-panel bd-panel${inside ? " bd-panel--tabbed" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bd-title"
          >
            {/* no posies in here: the dresser is papered in black and grey
                stripes instead (.bd-panel in palais.css) */}
            <div className="wm-title">
              <h2 id="bd-title">
                <span aria-hidden>✿</span> Portraits <span aria-hidden>✿</span>
              </h2>
            </div>
            <button type="button" className="wm-close" onClick={shut} aria-label="Close the dresser">
              ×
            </button>
            {/* opposite the ×: the way to put one in, once they're inside */}
            {inside && passed && tab === "portraits" && (
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
                {/* which one of them you're on, in the corner left over.
                    A phone keeps its own count on the rail instead. */}
                {many > 1 && (
                  <span className="bd-count-corner" aria-hidden>
                    {at + 1} / {many}
                  </span>
                )}
              </>
            )}

            {inside && passed && (
              <nav className="cat-tabs bd-tabs" aria-label="The dresser's drawers">
                {([["portraits", "Portraits"], ["live", "Livestream"]] as const).map(([which, name]) => (
                  <button
                    key={which}
                    type="button"
                    className={`cat-tab${tab === which ? " is-on" : ""}`}
                    onClick={() => setTab(which)}
                    aria-pressed={tab === which}
                  >
                    {name}
                  </button>
                ))}
              </nav>
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
                  autoFocus={!COARSE}
                />
                <button type="submit" className="wm-btn wm-btn--visit" disabled={busy || !tried.trim()}>
                  {busy ? "Trying…" : "Open the dresser ✿"}
                </button>
                {busy && <Waiting say="Trying the word…" />}
                {trouble && <p className="lt-trouble">{trouble}</p>}
              </form>
            ) : !passed ? (
              /* the word is right; now a choice of sign-in before the
                 pictures show — a name to put to the visit. The buttons hand
                 off to the provider's own page (layoutsDb.ts). The dresser is
                 already unlocked, so coming in with just the word skips it. */
              <div className="bd-hello">
                <span className="bd-hello-crest" aria-hidden>
                  <img src={`${process.env.PUBLIC_URL}/palais/boudoir-crest.webp`} alt="" decoding="async" />
                </span>
                <h3 className="bd-hello-name">The Boudoir</h3>
                <p className="bd-hello-line">please sign in to continue</p>

                <div className="bd-hello-ways">
                  <button type="button" className="bd-way bd-way--apple" onClick={() => void goProvider("apple")} disabled={Boolean(authBusy)}>
                    <span className="bd-way-mark" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M16.4 1.9c0 1.1-.4 2.1-1.2 3-.9 1-2 1.6-3.1 1.5-.1-1.1.4-2.2 1.2-3 .8-.9 2.1-1.5 3.1-1.5zM20 17.1c-.5 1.2-.8 1.7-1.5 2.8-1 1.5-2.3 3.3-4 3.3-1.5 0-1.9-1-4-1-2 0-2.5 1-4 1-1.6 0-2.9-1.7-3.9-3.1-2.7-4-3-8.6-1.3-11.1 1.2-1.7 3-2.7 4.8-2.7 1.8 0 2.9 1 4.4 1 1.4 0 2.3-1 4.4-1 1.6 0 3.2.9 4.4 2.4-3.9 2.1-3.3 7.6.7 9.4z"/>
                      </svg>
                    </span>
                    {authBusy === "apple" ? "Taking you to Apple…" : "Sign in with Apple"}
                  </button>
                </div>

                {authTrouble && <p className="lt-trouble">{authTrouble}</p>}
              </div>
            ) : tab === "live" ? (
              /* her camera, while she is in front of it */
              <div className="bd-look bd-look--live">
                <Livestream word={key} canHost={Boolean(editor?.canSave)} />
              </div>
            ) : (
              /* one picture at a time, an arrow either side */
              <div className="bd-look">
                {/* the rabbits are for the drawer being opened, not for the
                    picture coming down the wire: once we know there is one, the
                    frame goes up and it paints into it */}
                {!showing ? (
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
                        {/* the frame is already the shape this browser
                            remembers it being; what arrives corrects it */}
                        {showing.kind === "film" ? (
                          <video
                            key={showing.url}
                            src={showing.url}
                            controls
                            playsInline
                            preload="metadata"
                            poster={posters[showing.path]?.poster}
                            aria-label={showing.title}
                            onLoadedMetadata={(e) => {
                              const reel = e.currentTarget;
                              const r = reel.videoWidth / reel.videoHeight;
                              if (r) {
                                shapes.current.set(showing.url, r);
                                rememberShape(showing.path, r);
                                setShape(r);
                              }
                              setPainted(showing.url);
                            }}
                            onError={reSign}
                          />
                        ) : (
                          <img
                            key={showing.url}
                            src={showing.url}
                            alt={showing.title}
                            decoding="async"
                            className={painted === showing.url ? undefined : "is-coming"}
                            onLoad={(e) => {
                              const pic = e.currentTarget;
                              const r = pic.naturalWidth / pic.naturalHeight;
                              if (r) {
                                shapes.current.set(showing.url, r);
                                rememberShape(showing.path, r);
                                setShape(r);
                              }
                              setPainted(showing.url);
                            }}
                            onError={reSign}
                          />
                        )}

                        {/* A black blink over the swap. The frame goes
                            black at the moment the picture changes and lifts
                            again. Keyed to the picture, so it plays once per change. */}
                        <span className="bd-blink" key={`blink-${showing.url}`} aria-hidden />

                        {/* The notes, lying over the corner of the picture the
                            way they do on a TikTok you're watching back. They
                            are out of the layout altogether, so however many
                            there are nothing moves and the panel cannot change
                            size. A film keeps its controls: they sit above. */}
                        {talking && (
                          <div className={`bd-say${showing.kind === "film" ? " bd-say--film" : ""}`} ref={window_}>
                            {mine.length === 0 ? (
                              <p className="bd-say-none">Nothing said about this one yet.</p>
                            ) : (
                              <div
                                className={`bd-say-reel${reel.rise ? " is-going-round" : ""}`}
                                style={
                                  reel.rise
                                    ? ({
                                        ["--bd-rise" as string]: `${reel.rise}px`,
                                        ["--bd-gap" as string]: `${reel.gap}px`,
                                        animationDuration: `${Math.max(9, reel.rise / 26)}s`,
                                      } as React.CSSProperties)
                                    : undefined
                                }
                              >
                                {Array.from({ length: reel.copies }, (_, copy) => (
                                  <ul className="bd-say-list" key={copy} ref={copy === 0 ? scroll : undefined} aria-hidden={copy > 0}>
                                    {mine.map((n) => (
                                      <li key={n.id}>
                                        <p className="bd-say-body">{n.body}</p>
                                        <p className="bd-say-by">
                                          <span className={n.named ? "bd-say-name" : "bd-say-id"}>{n.author}</span>
                                          <span className="bd-say-when">{new Date(n.at).toLocaleDateString()}</span>
                                          {n.mine && copy === 0 && (
                                            <button type="button" className="bd-say-drop" onClick={() => unsay(n.id)}>
                                              take it back
                                            </button>
                                          )}
                                        </p>
                                      </li>
                                    ))}
                                  </ul>
                                ))}
                              </div>
                            )}
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
                      /* exactly as wide as the picture above it, so the box
                         starts where the picture starts and Send ends where
                         it ends */
                      style={frame ? { width: `${frame.w}px` } : undefined}
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

      {/* the way out of the sign-in: in the page footer, only while someone is
          signed in and inside the dresser (portaled out of this modal) */}
      {open && inside && passed && editor && footSlot &&
        createPortal(
          <button type="button" className="bd-signout" onClick={() => void goSignOut()}>
            Sign out{editor.email ? ` · ${editor.email}` : ""}
          </button>,
          footSlot,
        )}
    </>
  );
}
