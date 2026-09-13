import { useEffect, useRef } from "react";

/**
 * Snow in winter, falling leaves in autumn, cottonwood fluff in summer.
 *
 * The weather follows the photographs rather than a clock of its own: a few
 * times a second it reads how far each season's photograph has faded
 * in, so it thickens as a season arrives, thins as it leaves, and keeps up
 * when someone skips ahead with the season button.
 *
 * Two layers give it depth. The back one sits between the photograph and the
 * furniture — lots of small, slow flakes and leaves. The front one sits over
 * everything — a few big, soft ones drifting close past the camera.
 *
 * It is drawn on a canvas: a couple of hundred sprites is nothing for a canvas
 * and a great deal of work for the DOM.
 */

type Layer = "back" | "front";
type Kind = "snow" | "leaf" | "fluff";

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  size: number;
  vy: number;
  sway: number;
  swayRate: number;
  phase: number;
  spin: number;
  angle: number;
  flutter: number;
  alpha: number;
  born: number;
  /** fluff: its own slow sideways drift, px/s — the air carries it, it barely falls */
  vx: number;
  /** when it began fading out, once its season started to leave */
  dies: number;
  sprite: HTMLCanvasElement;
}

const LAYERS: Record<Layer, { snow: number; leaves: number; fluff: number; scale: [number, number]; blur: number }> = {
  back: { snow: 260, leaves: 55, fluff: 140, scale: [0.6, 1.3], blur: 0 },
  front: { snow: 40, leaves: 10, fluff: 16, scale: [1.8, 3], blur: 1.5 },
};

const LEAF_COLOURS = ["#b83a14", "#d2691e", "#e09a24", "#9c2a12", "#c8871b", "#8a4a1c", "#e3b23c"];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function snowSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.85)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}

/**
 * A tuft of cottonwood fluff: a tiny seed with a cloud of very fine white
 * hairs fanning out of it, most of them long and nearly invisible, so it
 * reads as a soft glowing wisp rather than a dot.
 */
function fluffSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d")!;
  g.translate(48, 48);
  const glow = g.createRadialGradient(0, 0, 0, 0, 0, 30);
  glow.addColorStop(0, "rgba(255,255,255,0.95)");
  glow.addColorStop(0.35, "rgba(255,255,255,0.45)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow;
  g.fillRect(-48, -48, 96, 96);
  g.lineCap = "round";
  for (let i = 0; i < 110; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(10, 42);
    const bend = rand(-0.5, 0.5);
    g.strokeStyle = `rgba(255,255,255,${rand(0.35, 0.85).toFixed(2)})`;
    g.lineWidth = rand(0.6, 1.3);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(Math.cos(a + bend) * r * 0.6, Math.sin(a + bend) * r * 0.6, Math.cos(a) * r, Math.sin(a) * r);
    g.stroke();
  }
  g.fillStyle = "rgba(150,130,100,0.9)";
  g.beginPath();
  g.ellipse(0, 0, 1.8, 1.2, 0.4, 0, Math.PI * 2);
  g.fill();
  return c;
}

/** a simple broad leaf, pointed at the tip, with a stem and a midrib */
function leafSprite(colour: string, maple: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.translate(32, 32);
  g.fillStyle = colour;
  g.beginPath();
  if (maple) {
    // five lobes
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? 26 : 12;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.95;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
  } else {
    g.moveTo(0, -27);
    g.bezierCurveTo(17, -14, 16, 12, 0, 25);
    g.bezierCurveTo(-16, 12, -17, -14, 0, -27);
  }
  g.closePath();
  g.fill();
  // a little light across one half, as if lit from the garden
  const sheen = g.createLinearGradient(-20, -20, 20, 20);
  sheen.addColorStop(0, "rgba(255,230,170,0.35)");
  sheen.addColorStop(0.6, "rgba(255,230,170,0)");
  sheen.addColorStop(1, "rgba(60,20,0,0.25)");
  g.fillStyle = sheen;
  g.fill();
  g.strokeStyle = "rgba(70,30,10,0.55)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0, -22);
  g.lineTo(0, 30);
  g.stroke();
  return c;
}

export function Weather({ layer }: { layer: Layer }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const stage = cv?.closest(".palais-stage");
    if (!cv || !stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const cfg = LAYERS[layer];
    const flake = snowSprite();
    const tufts = Array.from({ length: 6 }, fluffSprite);
    const leaves = LEAF_COLOURS.flatMap((col) => [leafSprite(col, false), leafSprite(col, true)]);
    const particles: Particle[] = [];

    let W = 0;
    let H = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    // how much of each season is showing, read off the photographs
    let winter = 0;
    let autumn = 0;
    let summer = 0;
    const read = () => {
      const op = (s: string) => {
        const el = stage.querySelector<HTMLElement>(`.palais-season--${s}`);
        return el ? Number(getComputedStyle(el).opacity) || 0 : 0;
      };
      winter = op("winter");
      autumn = op("autumn") * (1 - winter);
      summer = op("summer") * (1 - op("autumn")) * (1 - winter);
    };
    read();
    const reader = setInterval(read, 250);

    let clock = 0;
    const spawn = (kind: Kind, anywhere: boolean): Particle => {
      const s = rand(cfg.scale[0], cfg.scale[1]);
      const snow = kind === "snow";
      if (kind === "fluff") {
        // real tufts are a centimetre or two: from here, a soft speck with a faint halo of hairs
        const size = rand(4.5, 8) * s;
        // it rides the breeze in from the left or right as often as it falls from above
        const side = Math.random() < 0.5;
        const vx = rand(6, 20) * s * (Math.random() < 0.6 ? 1 : -1);
        return {
          kind,
          x: anywhere ? rand(-0.05, 1.05) * W : side ? (vx > 0 ? -size * 2 : W + size * 2) : rand(0, 1) * W,
          y: anywhere ? rand(-0.05, 0.95) * H : side ? rand(0, 0.8) * H : -size * 2,
          size,
          vy: rand(3, 11) * s,
          vx,
          sway: rand(10, 26) * s,
          swayRate: rand(0.15, 0.45),
          phase: rand(0, Math.PI * 2),
          spin: rand(-0.4, 0.4),
          angle: rand(0, Math.PI * 2),
          flutter: rand(0.3, 0.8),
          alpha: rand(0.65, 1),
          born: clock,
          dies: Infinity,
          sprite: tufts[Math.floor(Math.random() * tufts.length)],
        };
      }
      const size = snow ? rand(2.5, 6) * s : rand(11, 20) * s;
      return {
        kind,
        vx: 0,
        x: rand(-0.05, 1.05) * W,
        y: anywhere ? rand(-0.1, 1) * H : -size * 2,
        size,
        // bigger means nearer, and nearer things cross the frame faster
        vy: snow ? rand(22, 42) * s : rand(34, 62) * s,
        sway: snow ? rand(8, 22) * s : rand(22, 50) * s,
        swayRate: snow ? rand(0.4, 1.1) : rand(0.6, 1.4),
        phase: rand(0, Math.PI * 2),
        spin: snow ? 0 : rand(-2.4, 2.4),
        angle: rand(0, Math.PI * 2),
        flutter: rand(1.5, 3.5),
        alpha: snow ? rand(0.55, 0.95) : rand(0.8, 1),
        // ones that appear mid-air fade in; ones that enter at the top don't need to
        born: anywhere ? clock : -Infinity,
        dies: Infinity,
        sprite: snow ? flake : leaves[Math.floor(Math.random() * leaves.length)],
      };
    };

    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;

      const want = {
        snow: Math.round(cfg.snow * winter),
        leaf: Math.round(cfg.leaves * autumn),
        fluff: Math.round(cfg.fluff * summer),
      };
      const have = { snow: 0, leaf: 0, fluff: 0 };
      for (const p of particles) if (p.dies === Infinity) have[p.kind]++;
      // a season on its way out: melt away the surplus where it is, rather
      // than leaving it to fall all the way to the floor
      for (const p of particles) {
        if (p.dies === Infinity && have[p.kind] > want[p.kind]) {
          p.dies = clock + rand(0, 0.8);
          have[p.kind]--;
        }
      }
      // top up a few at a time, scattered through the air and fading in, so the
      // weather thickens as the season does instead of arriving as a curtain
      for (const kind of ["snow", "leaf", "fluff"] as Kind[]) {
        const missing = Math.min(want[kind] - have[kind], 3);
        for (let i = 0; i < missing; i++) particles.push(spawn(kind, true));
        have[kind] += Math.max(missing, 0);
      }

      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        if (p.kind === "fluff") {
          p.x += p.vx * dt;
          // now and then a lift of warm air carries it back up
          p.y -= Math.max(0, Math.sin(clock * 0.21 + p.phase * 3)) * p.vy * 1.8 * dt;
        }
        const sx = Math.sin(clock * p.swayRate + p.phase) * p.sway;
        // leaves also wander slowly off their line as they fall
        const x = p.x + sx + (p.kind === "leaf" ? Math.sin(clock * 0.3 + p.phase) * 12 : 0);
        const gone =
          p.y > H + p.size * 2 || (p.kind === "fluff" && (x < -p.size * 3 || x > W + p.size * 3 || p.y < -p.size * 4));
        if (gone) {
          // gone below the floor: recycle it only if the season still wants it
          if (p.dies !== Infinity) particles.splice(i, 1);
          else Object.assign(p, spawn(p.kind, false));
          continue;
        }
        const fade = Math.min(1, (clock - p.born) / 1.2) * Math.max(0, Math.min(1, 1 - (clock - p.dies) / 1.5));
        if (fade <= 0 && p.dies !== Infinity) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.alpha * fade;
        if (p.kind === "fluff") {
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(p.angle);
          // a slow turn in the air, which makes the wisps seem to breathe
          const breathe = 0.85 + 0.15 * Math.cos(clock * p.flutter + p.phase);
          ctx.drawImage(p.sprite, -p.size * breathe, -p.size, p.size * 2 * breathe, p.size * 2);
          ctx.restore();
        } else if (p.kind === "snow") {
          ctx.drawImage(p.sprite, x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        } else {
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(p.angle);
          // tumbling: the leaf turns edge-on and back as it falls
          ctx.scale(Math.cos(clock * p.flutter + p.phase), 1);
          ctx.drawImage(p.sprite, -p.size, -p.size, p.size * 2, p.size * 2);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(reader);
      ro.disconnect();
    };
  }, [layer]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className={`palais-weather palais-weather--${layer}`}
      style={layer === "front" && LAYERS.front.blur ? { filter: `blur(${LAYERS.front.blur}px)` } : undefined}
    />
  );
}
