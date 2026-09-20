import { useEffect, useRef, useState } from "react";
import { usePlace } from "./place";

/**
 * The Lakehouse record player: Vulfpeck's "The Beautiful Game", the full album
 * from Vulf's own YouTube channel, on a turntable in the corner.
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
 * Lakehouse takes the turntable away, and the music with it.
 */

const VIDEO = "DRdnpKRvMwI";

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

function Turntable() {
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  // a phone hasn't room for a turntable and a 200px sleeve, so there it starts
  // as a knob in the corner and opens when it's tapped
  const [open, setOpen] = useState(() => {
    try {
      return !window.matchMedia("(max-width: 820px)").matches;
    } catch {
      return true;
    }
  });

  /* the player is built when the turntable is out, and taken down when it is
     put away — the div it is built on goes with it, so it can't be kept */
  useEffect(() => {
    if (!open) return;
    let gone = false;
    youtube().then((YT) => {
      if (gone || !holder.current) return;
      player.current = new YT.Player(holder.current, {
        videoId: VIDEO,
        host: "https://www.youtube-nocookie.com",
        width: 200,
        height: 200,
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: { onStateChange: (e) => setPlaying(e.data === PLAYING) },
      });
    });
    return () => {
      gone = true;
      player.current?.destroy();
      player.current = null;
      setPlaying(false);
    };
  }, [open]);

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
    <aside className={`lake-radio${playing ? " is-playing" : ""}`} aria-label="The Lakehouse record player">
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
              <span className="tt-label-name">VULFPECK</span>
              <span className="tt-label-dot" />
              <span className="tt-label-title">The Beautiful Game</span>
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
        <span aria-hidden>♪</span> {playing ? "Now playing" : "Tap the record"} · Vulfpeck
        <button type="button" className="lake-radio-shut" onClick={shut} aria-label="Put the record player away">
          ×
        </button>
      </p>
    </aside>
  );
}

export function LakehouseRadio() {
  const { place } = usePlace();
  return place === "lakehouse" ? <Turntable /> : null;
}
