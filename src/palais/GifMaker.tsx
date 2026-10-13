import { useEffect, useRef, useState } from "react";
import { GIFEncoder, applyPalette, quantize } from "gifenc";

/**
 * The GIF maker on the library iMac.
 *
 * Pick a video, choose the stretch of it you want, and it comes back as a GIF
 * you can save. It all happens here in the browser: the video is never sent
 * anywhere, each frame is drawn onto a canvas and handed to the encoder.
 */

/** past this many frames a GIF gets heavy, so the clip is cut short */
const MOST_FRAMES = 300;

const RATES = [8, 10, 15] as const;
const WIDTHS = [240, 320, 480] as const;

type Made = { url: string; bytes: number; frames: number };

/** move the video to a moment and wait until that frame is ready to draw */
function seek(video: HTMLVideoElement, t: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      clearTimeout(id);
      resolve();
    };
    const id = setTimeout(done, 1500); // some browsers never say seeked for the frame they're already on
    video.addEventListener("seeked", done);
    video.currentTime = t;
  });
}

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
const secs = (n: number) => Math.round(n * 10) / 10;

export function GifMaker() {
  const video = useRef<HTMLVideoElement>(null);
  const stop = useRef(false);
  const [src, setSrc] = useState<string | null>(null);
  const [name, setName] = useState("palais");
  const [length, setLength] = useState(0);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [rate, setRate] = useState<number>(10);
  const [width, setWidth] = useState<number>(320);
  const [making, setMaking] = useState<number | null>(null);
  const [made, setMade] = useState<Made | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);

  /* let go of the files when they're replaced or the window shuts */
  useEffect(() => () => void (src && URL.revokeObjectURL(src)), [src]);
  useEffect(() => () => void (made && URL.revokeObjectURL(made.url)), [made]);
  useEffect(() => () => void (stop.current = true), []);

  const choose = (file: File | undefined) => {
    if (!file) return;
    setTrouble(null);
    setMade(null);
    setName(file.name.replace(/\.[^.]+$/, "") || "palais");
    setSrc(URL.createObjectURL(file));
  };

  const loaded = () => {
    const v = video.current;
    if (!v) return;
    /* videos recorded in a browser often don't know how long they are until
       they're asked to look past the end */
    if (!Number.isFinite(v.duration)) {
      const known = () => {
        if (!Number.isFinite(v.duration)) return;
        v.removeEventListener("durationchange", known);
        seek(v, 0).then(loaded);
      };
      v.addEventListener("durationchange", known);
      v.currentTime = 1e9;
      return;
    }
    setLength(v.duration);
    setFrom(0);
    setTo(secs(Math.min(v.duration, 4)));
  };

  const frames = Math.max(1, Math.round((to - from) * rate));
  const tooLong = frames > MOST_FRAMES;

  const make = async () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    stop.current = false;
    setTrouble(null);
    setMade(null);
    setMaking(0);
    v.pause();

    const w = Math.min(width, v.videoWidth);
    const h = Math.max(1, Math.round((w * v.videoHeight) / v.videoWidth));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setTrouble("This browser can't draw the frames.");
      setMaking(null);
      return;
    }

    const count = Math.min(frames, MOST_FRAMES);
    const gif = GIFEncoder();
    try {
      for (let i = 0; i < count; i++) {
        if (stop.current) return;
        await seek(v, Math.min(from + i / rate, length));
        ctx.drawImage(v, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const palette = quantize(data, 256);
        gif.writeFrame(applyPalette(data, palette), w, h, { palette, delay: 1000 / rate });
        setMaking((i + 1) / count);
      }
      gif.finish();
      const bytes = gif.bytes();
      setMade({ url: URL.createObjectURL(new Blob([bytes], { type: "image/gif" })), bytes: bytes.length, frames: count });
    } catch {
      setTrouble("Something went wrong making that one. Try a shorter stretch or a different video.");
    } finally {
      if (!stop.current) setMaking(null);
    }
  };

  const restart = () => {
    setSrc(null);
    setMade(null);
    setLength(0);
    setTrouble(null);
  };

  if (made) {
    return (
      <div className="gifm">
        <img className="gifm-made" src={made.url} alt="The GIF you made" />
        <p className="gifm-note">
          {made.frames} frames · {kb(made.bytes)}
        </p>
        <div className="gifm-row">
          <a className="gifm-go" href={made.url} download={`${name}.gif`}>
            Save the GIF
          </a>
          <button type="button" className="gifm-plain" onClick={() => setMade(null)}>
            Change it
          </button>
          <button type="button" className="gifm-plain" onClick={restart}>
            New video
          </button>
        </div>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="gifm">
        <p>Pick a video and turn a few seconds of it into a GIF. It stays on your computer, nothing is uploaded.</p>
        <label className="gifm-go gifm-pick">
          Choose a video…
          <input type="file" accept="video/*" onChange={(e) => choose(e.target.files?.[0])} />
        </label>
        {trouble && <p className="gifm-trouble">{trouble}</p>}
      </div>
    );
  }

  return (
    <div className="gifm">
      <video
        ref={video}
        className="gifm-video"
        src={src}
        muted
        playsInline
        controls
        preload="auto"
        onLoadedMetadata={loaded}
        onError={() => {
          setTrouble("That video won't open here. Try an .mp4 or .mov.");
          setSrc(null);
        }}
      />
      <div className="gifm-grid">
        <label>
          From (s)
          <input
            type="number"
            min={0}
            max={secs(length)}
            step={0.1}
            value={from}
            disabled={making !== null}
            onChange={(e) => setFrom(Math.max(0, Math.min(Number(e.target.value) || 0, to)))}
          />
        </label>
        <label>
          To (s)
          <input
            type="number"
            min={0}
            max={secs(length)}
            step={0.1}
            value={to}
            disabled={making !== null}
            onChange={(e) => setTo(Math.max(from, Math.min(Number(e.target.value) || 0, length)))}
          />
        </label>
        <label>
          Frames/s
          <select value={rate} disabled={making !== null} onChange={(e) => setRate(Number(e.target.value))}>
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Width
          <select value={width} disabled={making !== null} onChange={(e) => setWidth(Number(e.target.value))}>
            {WIDTHS.map((w) => (
              <option key={w} value={w}>
                {w}px
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="gifm-row">
        <button type="button" className="gifm-plain" disabled={making !== null} onClick={() => video.current && setFrom(secs(video.current.currentTime))}>
          Start here
        </button>
        <button
          type="button"
          className="gifm-plain"
          disabled={making !== null}
          onClick={() => video.current && setTo(Math.max(from, secs(video.current.currentTime)))}
        >
          End here
        </button>
        <button type="button" className="gifm-go" disabled={making !== null || to <= from} onClick={make}>
          {making === null ? "Make GIF" : `Making… ${Math.round(making * 100)}%`}
        </button>
      </div>
      {making !== null && <progress className="gifm-progress" value={making} max={1} />}
      <p className="gifm-note">
        {secs(to - from)}s · {Math.min(frames, MOST_FRAMES)} frames
        {tooLong && ` (cut to ${secs(MOST_FRAMES / rate)}s, longer gets heavy)`}
      </p>
      {trouble && <p className="gifm-trouble">{trouble}</p>}
      <button type="button" className="gifm-plain" disabled={making !== null} onClick={restart}>
        Choose a different video
      </button>
    </div>
  );
}
