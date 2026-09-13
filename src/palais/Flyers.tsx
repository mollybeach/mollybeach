import { useEffect, useRef, useState } from "react";
import { Dragonfly, Hummingbird } from "./Critters";
import { ARRIVAL, INTRO_EMPTY } from "./conjureSchedule";

/**
 * Now and then a hummingbird or a dragonfly crosses the terrace.
 *
 * They fly the way the real ones do, which is nothing like a tween:
 *
 * - The hummingbird darts between flowers — hard acceleration, a slight arc,
 *   a sudden stop — then hangs in the air, jittering, before darting again.
 *   Its body tips forward when it goes and rights itself when it hovers.
 * - The dragonfly moves in straight dashes that stop dead, holds, pivots to a
 *   new heading almost instantly, and dashes again.
 *
 * Each flight is planned as a list of legs when it starts, in fractions of the
 * stage, and played by requestAnimationFrame writing transforms straight to
 * the DOM so React doesn't re-render sixty times a second. They enter and
 * leave off the edge of the stage, which hides them by overflow.
 */

type Kind = "hummingbird" | "dragonfly";
type Pt = { x: number; y: number };
type Leg = { to: Pt; dur: number; move: "dart" | "hover" | "dash"; arc?: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1));
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* where the flowers are, roughly: the wisteria in the top corners, the
   trellis and hydrangea down the left, the monstera and planters to the right */
const FLOWERS = [
  { x: [0.04, 0.24], y: [0.1, 0.42] },
  { x: [0.74, 0.95], y: [0.1, 0.42] },
  { x: [0.06, 0.3], y: [0.42, 0.66] },
  { x: [0.3, 0.7], y: [0.18, 0.5] },
  { x: [0.78, 0.96], y: [0.5, 0.74] },
];

function hummingbirdRoute(): { start: Pt; legs: Leg[] } {
  const fromLeft = Math.random() < 0.5;
  const start = { x: fromLeft ? -0.08 : 1.08, y: rand(0.12, 0.5) };
  const legs: Leg[] = [];
  let at = start;
  const dartTo = (to: Pt, extra = 0) => {
    const dist = Math.hypot(to.x - at.x, to.y - at.y);
    legs.push({ to, move: "dart", dur: clamp(0.35 + dist * 1.1, 0.3, 1.5) + extra, arc: rand(-0.05, 0.05) });
    at = to;
  };

  for (let i = randInt(2, 4); i > 0; i--) {
    const zone = FLOWERS[randInt(0, FLOWERS.length - 1)];
    dartTo({ x: rand(zone.x[0], zone.x[1]), y: rand(zone.y[0], zone.y[1]) });
    legs.push({ to: at, move: "hover", dur: rand(1.1, 2.8) });
    // often it works along the same bush: a few short hops, a pause at each
    for (let hop = randInt(0, 2); hop > 0; hop--) {
      dartTo({ x: clamp(at.x + rand(-0.05, 0.05), 0.03, 0.97), y: clamp(at.y + rand(-0.05, 0.04), 0.06, 0.8) });
      legs.push({ to: at, move: "hover", dur: rand(0.6, 1.6) });
    }
  }

  // and away, up and out of either side
  dartTo({ x: Math.random() < 0.5 ? -0.12 : 1.12, y: rand(0.02, 0.35) }, 0.2);
  return { start, legs };
}

function dragonflyRoute(): { start: Pt; legs: Leg[] } {
  const edge = randInt(0, 2); // left, right, or down from the top
  const start =
    edge === 0 ? { x: -0.08, y: rand(0.15, 0.7) } : edge === 1 ? { x: 1.08, y: rand(0.15, 0.7) } : { x: rand(0.2, 0.8), y: -0.1 };
  const legs: Leg[] = [];
  let at = start;
  const dashTo = (to: Pt) => {
    const dist = Math.hypot(to.x - at.x, to.y - at.y);
    legs.push({ to, move: "dash", dur: clamp(0.18 + dist * 0.9, 0.22, 0.75) });
    at = to;
  };

  dashTo({ x: rand(0.15, 0.85), y: rand(0.15, 0.7) });
  for (let i = randInt(4, 7); i > 0; i--) {
    legs.push({ to: at, move: "hover", dur: rand(0.25, 1.7) });
    const angle = rand(0, Math.PI * 2);
    const len = rand(0.1, 0.32);
    dashTo({ x: clamp(at.x + Math.cos(angle) * len, 0.05, 0.95), y: clamp(at.y + Math.sin(angle) * len, 0.08, 0.82) });
  }
  legs.push({ to: at, move: "hover", dur: rand(0.3, 1) });
  dashTo({ x: Math.random() < 0.5 ? -0.15 : 1.15, y: rand(0.05, 0.6) });
  return { start, legs };
}

const easeDart = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeDash = (t: number) => 1 - Math.pow(1 - t, 3);

/** turn the shorter way round */
const turnToward = (from: number, to: number, k: number) => {
  const d = ((to - from + 540) % 360) - 180;
  return from + d * k;
};

function Flight({ kind, onDone }: { kind: Kind; onDone: () => void }) {
  const outer = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outer.current;
    const inner = body.current;
    const stage = el?.parentElement;
    if (!el || !inner || !stage) return;

    const { start, legs } = kind === "hummingbird" ? hummingbirdRoute() : dragonflyRoute();
    const seed = rand(0, 100);
    let leg = 0;
    let legT = 0;
    let from = start;
    let clock = 0;
    let last = performance.now();
    let prev: Pt | null = null;
    let facing = start.x < 0.5 ? 1 : -1;
    let pitch = 0;
    let heading = kind === "dragonfly" ? (Math.atan2(legs[0].to.y - start.y, legs[0].to.x - start.x) * 180) / Math.PI : 0;
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      legT += dt;

      while (leg < legs.length && legT >= legs[leg].dur) {
        legT -= legs[leg].dur;
        from = legs[leg].to;
        leg++;
      }
      if (leg >= legs.length) {
        onDone();
        return;
      }

      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const L = legs[leg];
      const t = legT / L.dur;
      let x: number;
      let y: number;

      if (L.move === "hover") {
        x = from.x * W;
        y = from.y * H;
      } else {
        const e = L.move === "dart" ? easeDart(t) : easeDash(t);
        const dx = (L.to.x - from.x) * W;
        const dy = (L.to.y - from.y) * H;
        x = from.x * W + dx * e;
        y = from.y * H + dy * e;
        if (L.arc) {
          const len = Math.hypot(dx, dy) || 1;
          const bow = Math.sin(Math.PI * e) * L.arc * H;
          x += (-dy / len) * bow;
          y += (dx / len) * bow;
        }
      }

      // never quite still: a hummingbird hangs on a shaky thread of air, a
      // dragonfly barely drifts
      const size = inner.offsetWidth || 60;
      const c = clock + seed;
      if (kind === "hummingbird") {
        x += (Math.sin(c * 6.3) * 0.05 + Math.sin(c * 2.1) * 0.07) * size;
        y += (Math.sin(c * 8.7) * 0.04 + Math.sin(c * 1.6) * 0.09) * size;
      } else {
        x += Math.sin(c * 1.3) * 0.03 * size;
        y += Math.sin(c * 1.9) * 0.04 * size;
      }

      const vx = prev ? (x - prev.x) / Math.max(dt, 0.001) : 0;
      const vy = prev ? (y - prev.y) / Math.max(dt, 0.001) : 0;
      const speed = Math.hypot(vx, vy);
      prev = { x, y };

      // a little bigger nearer the floor, as if nearer to us
      const depth = 0.78 + 0.42 * clamp(y / (H || 1), 0, 1);
      const k = 1 - Math.exp(-dt * (kind === "hummingbird" ? 7 : 16));

      if (kind === "hummingbird") {
        if (Math.abs(vx) > size * 1.2) facing = vx > 0 ? 1 : -1;
        const going = clamp(speed / (size * 10), 0, 1);
        const climb = speed > size ? clamp((Math.atan2(vy, Math.abs(vx)) * 180) / Math.PI, -35, 35) : 0;
        pitch = turnToward(pitch, going * (14 + climb * 0.6), k);
        inner.style.transform = `translate(-50%, -50%) scale(${(depth * facing).toFixed(3)}, ${depth.toFixed(3)}) rotate(${pitch.toFixed(2)}deg)`;
      } else {
        if (L.move === "dash" && speed > size * 1.5) heading = turnToward(heading, (Math.atan2(vy, vx) * 180) / Math.PI, k);
        inner.style.transform = `translate(-50%, -50%) rotate(${heading.toFixed(2)}deg) scale(${depth.toFixed(3)})`;
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // onDone is stable for the life of a flight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return (
    <div ref={outer} className={`palais-flyer palais-flyer--${kind}`} style={{ transform: "translate3d(-200px, -200px, 0)" }}>
      <div ref={body} className="palais-flyer-body">
        {kind === "hummingbird" ? <Hummingbird /> : <Dragonfly />}
      </div>
    </div>
  );
}

/* seconds: when each first shows up after the room has arrived, and the wait
   between visits after that */
const TIMING: Record<Kind, { first: [number, number]; gap: [number, number] }> = {
  hummingbird: { first: [3, 7], gap: [14, 32] },
  dragonfly: { first: [11, 18], gap: [10, 26] },
};

export function Flyers() {
  const [flying, setFlying] = useState<Record<Kind, number>>({ hummingbird: 0, dragonfly: 0 });
  const timers = useRef<Partial<Record<Kind, ReturnType<typeof setTimeout>>>>({});
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      return;
    }
    const all = timers.current;
    (Object.keys(TIMING) as Kind[]).forEach((kind) => {
      const [a, b] = TIMING[kind].first;
      all[kind] = setTimeout(() => setFlying((f) => ({ ...f, [kind]: f[kind] + 1 })), (INTRO_EMPTY + ARRIVAL + rand(a, b)) * 1000);
    });
    return () => (Object.keys(all) as Kind[]).forEach((kind) => clearTimeout(all[kind]));
  }, []);

  const land = (kind: Kind) => {
    setFlying((f) => ({ ...f, [kind]: -Math.abs(f[kind]) }));
    const [a, b] = TIMING[kind].gap;
    timers.current[kind] = setTimeout(() => setFlying((f) => ({ ...f, [kind]: Math.abs(f[kind]) + 1 })), rand(a, b) * 1000);
  };

  if (still) return null;

  // a positive count is a flight in the air; its number keys a fresh route
  return (
    <div className="palais-flyers" aria-hidden>
      {(Object.keys(flying) as Kind[]).map((kind) =>
        flying[kind] > 0 ? <Flight key={`${kind}-${flying[kind]}`} kind={kind} onDone={() => land(kind)} /> : null,
      )}
    </div>
  );
}
