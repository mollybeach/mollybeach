/**
 * The drum machine in the Crystal Ballroom's pool table, brought over from
 * the Billiards Master Sequencer (github.com/mollybeach/billiards-rack): five
 * tracks of sixteen steps, each step a pool ball, played from real billiards
 * samples by Jess Chase or from a little Web Audio synth.
 */

export type TrackId = "kick" | "snare" | "hihat" | "clap" | "crash";
export type TrackState = boolean[];
export interface TrackData {
  state: TrackState;
  vol: number;
}
export type SavedPattern = { bpm: number } & Record<TrackId, TrackData>;

export const TRACK_IDS: TrackId[] = ["kick", "snare", "hihat", "clap", "crash"];
export const TRACK_LABELS: Record<TrackId, string> = { kick: "KICK", snare: "SNARE", hihat: "HI-HAT", clap: "CLAP", crash: "CRASH" };
export const STEPS = 16;
const STORAGE_KEY = "billiardsPatternFinal";

const SAMPLES: Record<TrackId, string> = {
  kick: "kick_pocket.wav",
  snare: "snare_slap.wav",
  hihat: "hihat_click.wav",
  clap: "clap_cuehit.wav",
  crash: "crash_break.wav",
};

/* ---- patterns ------------------------------------------------------------ */

const steps = (on: number[]) => Array.from({ length: STEPS }, (_, i) => on.includes(i));

export const DEFAULT_PATTERN: SavedPattern = {
  bpm: 250,
  kick: { state: steps([0, 2, 6, 7, 9, 13]), vol: 0.8 },
  snare: { state: steps([4, 11, 14, 15]), vol: 0.6 },
  hihat: { state: steps([1, 3, 5, 8, 10, 12, 15]), vol: 0.4 },
  clap: { state: steps([5, 12]), vol: 0.5 },
  crash: { state: steps([0, 10]), vol: 0.4 },
};

export function loadPattern(): SavedPattern | null {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!data || typeof data !== "object" || !("bpm" in data)) return null;
    const out = { bpm: Number(data.bpm) || 120 } as SavedPattern;
    for (const key of TRACK_IDS) {
      const t = data[key];
      out[key] = {
        state: Array.isArray(t?.state) ? t.state.slice(0, STEPS).map(Boolean) : Array(STEPS).fill(false),
        vol: typeof t?.vol === "number" ? t.vol : parseFloat(t?.vol) || DEFAULT_PATTERN[key].vol,
      };
    }
    return out;
  } catch {
    return null;
  }
}

export function savePattern(p: SavedPattern) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* private browsing: it just isn't kept */
  }
}

/** "Classic Beats": about one step in seven, on every track */
export const randomState = (): TrackState => Array.from({ length: STEPS }, () => Math.random() > 0.85);

/* ---- sound --------------------------------------------------------------- */

export interface Rig {
  ctx: AudioContext;
  gains: Record<TrackId, GainNode>;
  buffers: Record<TrackId, AudioBuffer | null>;
}

export async function makeRig(vols: Record<TrackId, number>): Promise<Rig> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const gains = {} as Rig["gains"];
  const buffers = {} as Rig["buffers"];
  await Promise.all(
    TRACK_IDS.map(async (key) => {
      const g = ctx.createGain();
      g.gain.value = vols[key];
      g.connect(ctx.destination);
      gains[key] = g;
      try {
        const res = await fetch(`${process.env.PUBLIC_URL}/palais/billiards/${SAMPLES[key]}`);
        buffers[key] = await ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        buffers[key] = null;     // that track stays quiet on samples; the synth still plays it
      }
    }),
  );
  return { ctx, gains, buffers };
}

function noise(ctx: AudioContext, seconds: number) {
  const src = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  src.buffer = buf;
  return src;
}

function filtered(ctx: AudioContext, out: AudioNode, seconds: number, type: BiquadFilterType | null, freq: number, level: number, decay: number) {
  const now = ctx.currentTime;
  const src = noise(ctx, seconds);
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, now);
  g.gain.exponentialRampToValueAtTime(0.01, now + decay);
  if (type) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    src.connect(f).connect(g).connect(out);
  } else {
    src.connect(g).connect(out);
  }
  src.start(now);
}

const SYNTH: Record<TrackId, (ctx: AudioContext, out: AudioNode) => void> = {
  kick: (ctx, out) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g).connect(out);
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
    g.gain.setValueAtTime(1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start();
    osc.stop(now + 0.2);
  },
  snare: (ctx, out) => filtered(ctx, out, 0.1, null, 0, 0.4, 0.1),
  hihat: (ctx, out) => filtered(ctx, out, 0.05, "highpass", 8000, 0.2, 0.05),
  clap: (ctx, out) => filtered(ctx, out, 0.1, "bandpass", 1000, 0.5, 0.1),
  crash: (ctx, out) => filtered(ctx, out, 1.5, "highpass", 3000, 0.3, 1.2),
};

export function hit(rig: Rig, key: TrackId, synth: boolean) {
  const buf = rig.buffers[key];
  if (synth || !buf) {
    if (synth) SYNTH[key](rig.ctx, rig.gains[key]);
    return;
  }
  const src = rig.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(rig.gains[key]);
  src.start(0);
}
