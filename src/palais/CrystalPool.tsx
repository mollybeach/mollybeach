import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { coverBox } from "./GlobeEgg";
import { usePlace } from "./place";
import { noteDoing } from "./visits";
import {
  DEFAULT_PATTERN,
  STEPS,
  TRACK_IDS,
  TRACK_LABELS,
  hit,
  loadPattern,
  makeRig,
  randomState,
  savePattern,
  type Rig,
  type TrackId,
  type TrackState,
} from "./billiards";

/**
 * The pool table on the Crystal Ballroom's dance floor, and the game in it.
 *
 * On a computer the table sticker stands on the marble dance floor in front
 * of the stage; the phone's tall pictures have a table of their own painted
 * in, blue felt on the right by the sofas, so there the painted one is what
 * you press. Either
 * way it's lined up with the picture however the room has cropped it
 * (coverBox, as the cookbook does). Press it and it opens the Billiards Master Sequencer: a rack of
 * balls that counts the beat, and five rows of sixteen balls to arm, played
 * from real billiards samples or a little synth (billiards.ts). Space starts
 * and stops it while it's open; shutting it stops the music.
 */

/** where the sticker stands on the wide pictures, as a fraction of them:
    down on the floor to the left */
const ON_THE_FLOOR = { x: 0.27, base: 0.985, w: 0.3 };
/** the table painted into the tall pictures, felt to feet, as fractions of
    them (all four seasons have it in the same place) */
const PAINTED = { left: 0.72, top: 0.605, right: 1, bottom: 0.83 };
/** the table sticker's own shape (854 × 423) */
const TABLE = 423 / 854;

const RACK = [[1], [2, 3], [4, 8, 5], [6, 7, 9, 10], [11, 12, 13, 14, 15]];

type Tracks = Record<TrackId, TrackState>;
type Vols = Record<TrackId, number>;
const fresh = () => ({
  tracks: Object.fromEntries(TRACK_IDS.map((k) => [k, DEFAULT_PATTERN[k].state.slice()])) as Tracks,
  vols: Object.fromEntries(TRACK_IDS.map((k) => [k, DEFAULT_PATTERN[k].vol])) as Vols,
});

/** a pool ball: solid 1–8, striped 9–15, and 16 is the cue ball */
const ballClass = (n: number) => `bl-ball bl-ball--${n}${n > 8 && n < 16 ? " bl-ball--stripe" : ""}${n === 16 ? " bl-ball--cue" : ""}`;

export function CrystalPool() {
  const { place } = usePlace();
  const here = place === "crystal";
  const spot = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  // on the tall picture, which has its own table painted in
  const [painted, setPainted] = useState(false);

  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(1);
  const [bpm, setBpm] = useState(DEFAULT_PATTERN.bpm);
  const [synth, setSynth] = useState(false);
  const [tracks, setTracks] = useState<Tracks>(() => fresh().tracks);
  const [vols, setVols] = useState<Vols>(() => fresh().vols);
  const [saved, setSaved] = useState(false);

  const rig = useRef<Rig | null>(null);
  // the interval reads these, so changing a step doesn't restart the beat
  const now = useRef({ tracks, synth, step: 1 });
  now.current.tracks = tracks;
  now.current.synth = synth;

  /* keep the table where the picture put it */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      // the four season pictures are all framed alike, so any loaded one will do
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--crystal img")).find((i) => i.naturalWidth);
      if (!img) return;
      const box = coverBox(img, stage);
      const s = stage.getBoundingClientRect();
      const tall = img.naturalHeight > img.naturalWidth;
      setPainted(tall);
      if (tall) {
        el.style.width = `${box.w * (PAINTED.right - PAINTED.left)}px`;
        el.style.height = `${box.h * (PAINTED.bottom - PAINTED.top)}px`;
        el.style.left = `${box.left + box.w * PAINTED.left}px`;
        el.style.top = `${box.top + box.h * PAINTED.top}px`;
        return;
      }
      const w = box.w * ON_THE_FLOOR.w;
      const h = w * TABLE;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${box.left + box.w * ON_THE_FLOOR.x - w / 2}px`;
      el.style.top = `${Math.min(box.top + box.h * ON_THE_FLOOR.base, s.height) - h}px`;
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

  /* the beat */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const next = (now.current.step % STEPS) + 1;
      now.current.step = next;
      setStep(next);
      const r = rig.current;
      if (!r) return;
      for (const key of TRACK_IDS) if (now.current.tracks[key][next - 1]) hit(r, key, now.current.synth);
    }, 60000 / Math.max(bpm, 1));
    return () => clearInterval(id);
  }, [running, bpm]);

  const playPause = useCallback(async () => {
    if (running) {
      setRunning(false);
      setStep(1);
      now.current.step = 1;
      return;
    }
    if (!rig.current) rig.current = await makeRig(vols);
    if (rig.current.ctx.state === "suspended") await rig.current.ctx.resume();
    now.current.step = 1;
    setStep(1);
    setRunning(true);
  }, [running, vols]);

  const shut = useCallback(() => {
    setOpen(false);
    setRunning(false);
    setStep(1);
    now.current.step = 1;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") shut();
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        playPause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shut, playPause]);

  // leaving the room stops the band
  useEffect(() => {
    if (!here) shut();
  }, [here, shut]);

  /* the pattern you left, if there is one */
  const apply = useCallback((p: ReturnType<typeof loadPattern>) => {
    if (!p) return;
    setBpm(p.bpm);
    setTracks(Object.fromEntries(TRACK_IDS.map((k) => [k, p[k].state.slice()])) as Tracks);
    setVols(Object.fromEntries(TRACK_IDS.map((k) => [k, p[k].vol])) as Vols);
    TRACK_IDS.forEach((k) => rig.current && (rig.current.gains[k].gain.value = p[k].vol));
  }, []);
  useEffect(() => {
    if (open) apply(loadPattern());
  }, [open, apply]);

  if (!here) return null;

  const toggle = (key: TrackId, i: number) =>
    setTracks((t) => ({ ...t, [key]: t[key].map((on, j) => (j === i ? !on : on)) }));
  const volume = (key: TrackId, v: number) => {
    setVols((o) => ({ ...o, [key]: v }));
    if (rig.current) rig.current.gains[key].gain.value = v;
  };
  const save = () => {
    savePattern({ bpm, ...(Object.fromEntries(TRACK_IDS.map((k) => [k, { state: tracks[k], vol: vols[k] }])) as Record<TrackId, { state: TrackState; vol: number }>) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <>
      <button
        ref={spot}
        type="button"
        className={painted ? "palais-pooltable palais-pooltable--painted" : "palais-pooltable"}
        aria-label="The pool table on the dance floor"
        title="Rack 'em up"
        onClick={() => {
          setOpen(true);
          noteDoing("billiards");       // Molly hears that someone racked up (visits.ts)
        }}
      >
        {!painted && <img src={`${process.env.PUBLIC_URL}/palais/props/pool_table_retro_walnut_green_felt_sticker.webp`} alt="" decoding="async" />}
        <span className="palais-pooltable-hint" aria-hidden>
          🎱 <span>Rack 'em up</span>
        </span>
      </button>

      {open && (
        <div className="wm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && shut()}>
          <div className="wm-panel bl-panel" role="dialog" aria-modal="true" aria-labelledby="bl-title">
            <div className="wm-title bl-title">
              <h2 id="bl-title">
                <span aria-hidden>★</span> Billiards Master Sequencer <span aria-hidden>★</span>
              </h2>
            </div>
            <button type="button" className="wm-close" onClick={shut} aria-label="Close the pool table">
              ×
            </button>

            <div className="bl-table">
              {/* the rack counts the beat: the ball for this step lights up */}
              <div className="bl-rack" aria-label="Billiards rack">
                <div className={`${ballClass(16)}${step === 16 ? " is-now" : ""}`} style={{ left: 80, top: -40 }} />
                {RACK.flatMap((row, r) =>
                  row.map((n, i) => (
                    <div
                      key={n}
                      className={`${ballClass(n)}${step === n ? " is-now" : ""}`}
                      style={{ left: (200 - row.length * 36) / 2 + i * 36, top: r * 36 }}
                    >
                      <b>{n}</b>
                    </div>
                  )),
                )}
              </div>

              <button type="button" className={`bl-play${running ? " is-on" : ""}`} onClick={playPause} aria-label={running ? "Stop" : "Play"} />

              <div className="bl-controls">
                <label className="bl-engine">
                  <span>SAMPLES</span>
                  <input type="checkbox" checked={synth} onChange={(e) => setSynth(e.target.checked)} />
                  <i aria-hidden />
                  <span>SYNTH</span>
                </label>
                <label className="bl-tempo">
                  TEMPO
                  <input type="range" min={0} max={800} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
                </label>
              </div>

              <div className="bl-tracks">
                {TRACK_IDS.map((key) => (
                  <div className="bl-track" key={key}>
                    <div className="bl-track-head">
                      <span>{TRACK_LABELS[key]}</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={vols[key]}
                        onChange={(e) => volume(key, parseFloat(e.target.value))}
                        aria-label={`${TRACK_LABELS[key]} volume`}
                      />
                    </div>
                    <div className="bl-steps">
                      {tracks[key].map((on, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`${ballClass(i + 1)} bl-step${on ? " is-armed" : ""}${step === i + 1 ? " is-now" : ""}`}
                          onClick={() => toggle(key, i)}
                          aria-pressed={on}
                          aria-label={`${TRACK_LABELS[key]} step ${i + 1}`}
                        >
                          {i < 15 && <b>{i + 1}</b>}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="bl-clear"
                      onClick={() => setTracks((t) => ({ ...t, [key]: Array(STEPS).fill(false) }))}
                      aria-label={`Clear ${TRACK_LABELS[key]}`}
                    />
                  </div>
                ))}
              </div>

              <div className="bl-system">
                <button type="button" className="bl-btn bl-btn--beats" onClick={() => setTracks(Object.fromEntries(TRACK_IDS.map((k) => [k, randomState()])) as Tracks)}>
                  Classic Beats
                </button>
                <button type="button" className="bl-btn bl-btn--save" onClick={save}>
                  {saved ? "Saved ★" : "Save Pattern"}
                </button>
                <button type="button" className="bl-btn bl-btn--load" onClick={() => apply(loadPattern())}>
                  Load Pattern
                </button>
              </div>

              <p className="bl-credit">
                Made with real billiards samples by{" "}
                <a href="https://www.jesschase.com/about" target="_blank" rel="noreferrer noopener">
                  Jess Chase
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
