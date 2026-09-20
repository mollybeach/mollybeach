import { useEffect, useRef, useState } from "react";
import { usePlace, type Place } from "./place";
import { noteDoing } from "./visits";

/**
 * The record player: a turntable in the corner of a room, with whatever album
 * that room keeps on it (RECORDS below). The Lakehouse has Vulfpeck's "The
 * Beautiful Game" from Vulf's own channel; the Palais has Norah Jones.
 *
 * The record spins while the album plays and stops when it's paused, and the
 * tone arm swings onto the record and back off again. Tapping the record plays
 * or pauses it. Browsers won't start sound on their own, so it always takes one
 * tap.
 *
 * The music is YouTube's own player, embedded (nothing is copied onto the
 * site). YouTube asks that its player stay visible and at least 200px square,
 * so it stands behind the turntable as the album's sleeve. It's the
 * privacy-enhanced youtube-nocookie.com player, driven through YouTube's
 * IFrame API so the turntable knows when the music is playing. Leaving the
 * room takes the turntable away, and the music with it.
 */

/** an album on a deck: the video it plays, and what the label reads */
interface Disc {
  video: string;
  name: string;
  title: string;
}

/** what's on the deck in each room. A room left out of this has no deck. */
const RECORDS: Partial<Record<Place, Disc>> = {
  palace: { video: "Ir1Bl5odrIQ", name: "Norah Jones", title: "Best of, the whole album" },
  lakehouse: { video: "DRdnpKRvMwI", name: "Vulfpeck", title: "The Beautiful Game" },
};

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
  destroy(): void;
};
type YTApi = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host: string;
      width: number;
      height: number;
      playerVars: Record<string, number>;
      events: { onStateChange: (e: { data: number }) => void };
    },
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YTApi> | null = null;

/** YouTube's IFrame API, fetched once and only when someone walks into the Lakehouse */
function youtube(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!loading) {
    loading = new Promise((done) => {
      const before = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        before?.();
        done(window.YT!);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return loading;
}

const PLAYING = 1;

/** narrower than this and the deck folds down to its knob */
const NARROW = 820;
/** is there room for the deck and its 200px sleeve? */
const roomForIt = () => {
  try {
    // the widest honest answer: some browsers report a stale innerWidth on the
    // first paint, and the media query can answer before the window has settled
    return Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0) > NARROW;
  } catch {
    return true;
  }
};

function Turntable({ disc }: { disc: Disc }) {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  // a screen with room for it stands the deck open; a phone hasn't room for a
  // turntable and a 200px sleeve, so there it starts as a knob in the corner
  // and opens when it's tapped
  const [open, setOpen] = useState(roomForIt);

  /* the first render can happen before the window has settled at its real
     width, so ask again once it has, and again whenever the window changes
     size. Putting it away by hand holds until the screen crosses the line
     between a deck and a knob. */
  const wasWide = useRef(roomForIt());
  useEffect(() => {
    const settle = () => {
      const wide = roomForIt();
      if (wide === wasWide.current) return;   // no crossing: leave a hand-made
      wasWide.current = wide;                 // choice alone
      setOpen(wide);
    };
    const frame = requestAnimationFrame(settle);   // after the first paint, when
    window.addEventListener("resize", settle);     // the width is the real one
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", settle);
    };
  }, []);

  /* the player is built when the turntable is out, and taken down when it is
     put away — the div it is built on goes with it, so it can't be kept */
  useEffect(() => {
    if (!open) return;
    let gone = false;
    youtube().then((YT) => {
      if (gone || !holder.current) return;
      player.current = new YT.Player(holder.current, {
        videoId: disc.video,
        host: "https://www.youtube-nocookie.com",
        width: 200,
        height: 200,
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            setPlaying(e.data === PLAYING);
            // worth knowing that someone put the record on (visits.ts)
            if (e.data === PLAYING) noteDoing("record", disc.name);
          },
        },
      });
    });
    return () => {
      gone = true;
      player.current?.destroy();
      player.current = null;
      setPlaying(false);
    };
  }, [open, disc.video, disc.name]);

  const toggle = () => {
    const p = player.current;
    if (!p) return;
    if (p.getPlayerState() === PLAYING) p.pauseVideo();
    else p.playVideo();
  };

  const shut = () => {
    player.current?.pauseVideo();     // nothing plays out of sight; putting it
    setOpen(false);                   // away takes the player down as well
  };

  if (!open) {
    return (
      <button type="button" className="lake-knob" onClick={() => setOpen(true)} aria-label="Open the record player">
        <span className="lake-knob-record" aria-hidden />
        <span aria-hidden>♪</span>
      </button>
    );
  }

  return (
    <aside className={`lake-radio${playing ? " is-playing" : ""}`} aria-label="The record player">
      {/* YouTube's player, standing behind the deck as the album's sleeve. On a
          phone it only comes out while the record plays (see palais.css). */}
      <div className="tt-sleeve">
        <div ref={holder} />
      </div>

      <div className="tt-deck">
        <button
          type="button"
          className="tt-platter"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? "Pause the record" : "Play the record"}
        >
          <span className="tt-record" aria-hidden>
            <span className="tt-label">
              <span className="tt-label-name">{disc.name.toUpperCase()}</span>
              <span className="tt-label-dot" />
              <span className="tt-label-title">{disc.title}</span>
            </span>
          </span>
          <span className="tt-sheen" aria-hidden />
        </button>

        {/* the tone arm: pivots at its base, swings onto the record when it plays */}
        <svg className="tt-arm" viewBox="0 0 60 150" aria-hidden>
          <circle cx="44" cy="16" r="13" fill="#b7995a" stroke="#6b5424" strokeWidth="2" />
          <circle cx="44" cy="16" r="5" fill="#3d2f16" />
          <path d="M44 16 L44 96 Q44 112 30 124" fill="none" stroke="#d9c089" strokeWidth="5" strokeLinecap="round" />
          <rect x="18" y="118" width="18" height="24" rx="3" transform="rotate(35 27 130)" fill="#2a2320" stroke="#b7995a" strokeWidth="1.5" />
        </svg>

        <span className="tt-knob" aria-hidden />
        <span className="tt-light" aria-hidden />
      </div>

      <p className="lake-radio-now">
        <span aria-hidden>♪</span> {playing ? "Now playing" : "Tap the record"} · {disc.name}
        <button type="button" className="lake-radio-shut" onClick={shut} aria-label="Put the record player away">
          ×
        </button>
      </p>
    </aside>
  );
}

export function RoomRadio() {
  const { place } = usePlace();
  const disc = RECORDS[place];
  // a fresh deck (and a fresh player) in each room
  return disc ? <Turntable key={place} disc={disc} /> : null;
}
