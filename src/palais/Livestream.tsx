import { useEffect, useRef, useState } from "react";
import { relayReady, useLivestream } from "./liveRoom";

/**
 * What hangs in the gilt frame when the dresser is on its Livestream tab.
 *
 * For Molly, signed in: a button that turns her camera on, her own picture
 * back at her while she is on (silent, or the room would howl), and a count
 * of who is watching. For everyone else: her, if she is there, and a closed
 * frame if she isn't.
 *
 * A browser will not let a film start with its sound up unless the person
 * asked for it, and a tab is not always enough of an asking. So if it is
 * refused the picture runs on quietly and the frame offers the sound.
 */
export default function Livestream({ word, canHost }: { word: string | null; canHost: boolean }) {
  const live = useLivestream(word, canHost);
  const screen = useRef<HTMLVideoElement>(null);
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    const v = screen.current;
    if (!v) return;
    if (v.srcObject !== live.stream) v.srcObject = live.stream;
    if (!live.stream) return;
    // her own picture is always silent; a watcher's tries for sound and
    // settles for none rather than not playing at all
    v.muted = live.hosting;
    v.play()
      .then(() => setQuiet(false))
      .catch(() => {
        v.muted = true;
        setQuiet(!live.hosting);
        void v.play().catch(() => {});
      });
  }, [live.stream, live.hosting]);

  const sound = () => {
    const v = screen.current;
    if (!v) return;
    v.muted = false;
    void v.play().then(() => setQuiet(false)).catch(() => {});
  };

  return (
    <div className="bd-live">
      <figure className="bd-frame bd-frame--live">
        {live.stream ? (
          <video ref={screen} className="bd-live-screen" autoPlay playsInline controls={!live.hosting} />
        ) : (
          <div className="bd-live-none">
            {live.on ? (
              <p>Reaching her camera…</p>
            ) : (
              <>
                <p className="bd-live-dark" aria-hidden>
                  ✿
                </p>
                <p>She isn't on at the moment.</p>
                <p className="bd-live-small">The frame goes bright when she is.</p>
              </>
            )}
          </div>
        )}

        {live.stream && (
          <span className={`bd-live-badge${live.hosting ? " is-mine" : ""}`}>
            <span className="bd-live-dot" aria-hidden />
            {live.hosting ? `On air · ${live.watching} watching` : "Live"}
          </span>
        )}
      </figure>

      <div className="bd-live-foot">
        {canHost &&
          (live.hosting ? (
            <button type="button" className="wm-btn wm-btn--visit" onClick={live.stop}>
              Stop the camera
            </button>
          ) : (
            <button type="button" className="wm-btn wm-btn--visit" onClick={() => void live.goLive()} disabled={live.on}>
              {live.on ? "Someone else is on" : "Go live ✿"}
            </button>
          ))}
        {quiet && (
          <button type="button" className="wm-btn" onClick={sound}>
            Turn the sound on
          </button>
        )}
        {live.say && <p className="bd-live-small">{live.say}</p>}
        {live.trouble && <p className="lt-trouble">{live.trouble}</p>}
        {canHost && !relayReady && (
          <p className="bd-live-small">
            No relay is set up, so anyone on a strict network won't get through.
          </p>
        )}
      </div>
    </div>
  );
}
