import { useEffect, useRef } from "react";

/**
 * Snow in winter, falling leaves in autumn, cottonwood fluff in summer, and in
 * a couple of rooms blossom instead of fluff: purple jacaranda petals in the
 * Jacaranda Quarter, and teeny pink cherry petals at the Lakehouse, through
 * spring and summer. In the Hollow of Small Stars the fluff glows blue, like
 * the glowworms, and drifts through spring and summer. On the Palais terrace
 * pink petals fall instead of cottonwood. The Rainwood never gets snow or
 * fluff: green leaves come down all year, turning to autumn colours in autumn.
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
type Kind = "snow" | "leaf" | "fluff" | "petal";

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
  /** petals: which room's blossom it is */
  bloom?: string;
  /** fluff: the room whose colour it glows, if not plain white */
  tint?: string;
  /** leaves: green (the Rainwood's) or autumn */
  green?: boolean;
  sprite: HTMLCanvasElement;
}

const LAYERS: Record<Layer, { snow: number; leaves: number; fluff: number; petals: number; scale: [number, number]; blur: number }> = {
  back: { snow: 260, leaves: 55, fluff: 140, petals: 150, scale: [0.6, 1.3], blur: 0 },
  front: { snow: 40, leaves: 10, fluff: 16, petals: 18, scale: [1.8, 3], blur: 1.5 },
};

/** rooms where the cottonwood glows a colour, and drifts through spring as well
    as summer (red, green, blue) */
const TINTS: Record<string, string> = {
  // glowworm blue
  caves: "150,215,255",
};

/** rooms where blossom falls in spring and summer instead of cottonwood */
const BLOOMS: Record<string, { colours: string[]; size: [number, number]; count: number }> = {
  // jacaranda: soft lavender-purple trumpets
  jacaranda: { colours: ["#9d7ae0", "#b596ee", "#8a64cf", "#c7aef4", "#a484e6"], size: [4, 7.5], count: 1 },
  // the terrace: soft pink petals, a little bigger than the lakehouse's
  palace: { colours: ["#f6b6cc", "#fac7d8", "#f09ab8", "#fde0ea", "#f3a6c2"], size: [3.4, 6], count: 1.1 },
  // cherry blossom: teeny pale-pink petals
  lakehouse: { colours: ["#f4b3c9", "#f8c9d9", "#ee9fbc", "#fbd6e3", "#f2a9c3"], size: [2.8, 4.8], count: 1.5 },
};

const LEAF_COLOURS = ["#b83a14", "#d2691e", "#e09a24", "#9c2a12", "#c8871b", "#8a4a1c", "#e3b23c"];
const GREEN_LEAF_COLOURS = ["#4f8a3a", "#6aa84f", "#3f7a36", "#86b85a", "#5d9442", "#2f6b34", "#9bc46a"];
/** rooms where green leaves fall all year and it never snows */
const EVERGREEN = new Set(["rainwood"]);

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
function fluffSprite(rgb = "255,255,255") {
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d")!;
  g.translate(48, 48);
  const glow = g.createRadialGradient(0, 0, 0, 0, 0, 30);
  glow.addColorStop(0, `rgba(${rgb},0.95)`);
  glow.addColorStop(0.35, `rgba(${rgb},0.45)`);
  glow.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = glow;
  g.fillRect(-48, -48, 96, 96);
  g.lineCap = "round";
  for (let i = 0; i < 110; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(10, 42);
    const bend = rand(-0.5, 0.5);
    g.strokeStyle = `rgba(${rgb},${rand(0.35, 0.85).toFixed(2)})`;
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

/** a single blossom petal: rounded, with a little notch at the tip and a
    lighter heart, so it catches the light as it tumbles */
function petalSprite(colour: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 48;
  const g = c.getContext("2d")!;
  g.translate(24, 24);
  g.fillStyle = colour;
  g.beginPath();
  g.moveTo(0, 20);
  g.bezierCurveTo(-16, 8, -15, -14, -4, -18);
  g.quadraticCurveTo(0, -13, 4, -18);
  g.bezierCurveTo(15, -14, 16, 8, 0, 20);
  g.closePath();
  g.fill();
  const light = g.createRadialGradient(-3, -4, 0, 0, 0, 20);
  light.addColorStop(0, "rgba(255,255,255,0.55)");
  light.addColorStop(0.6, "rgba(255,255,255,0.08)");
  light.addColorStop(1, "rgba(80,20,60,0.15)");
  g.fillStyle = light;
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
    const tufts = Array.from({ length: 6 }, () => fluffSprite());
    const tinted = Object.fromEntries(Object.entries(TINTS).map(([room, rgb]) => [room, Array.from({ length: 6 }, () => fluffSprite(rgb))]));
    const leaves = LEAF_COLOURS.flatMap((col) => [leafSprite(col, false), leafSprite(col, true)]);
    const greenLeaves = GREEN_LEAF_COLOURS.flatMap((col) => [leafSprite(col, false), leafSprite(col, false), leafSprite(col, true)]);
    const petals = Object.fromEntries(Object.entries(BLOOMS).map(([room, b]) => [room, b.colours.map(petalSprite)]));
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
    let spring = 1;
    // and which room you're in, for the rooms that have blossom
    let bloom: string | undefined;
    let tint: string | undefined;
    let evergreen = false;
    const read = () => {
      const place = stage.getAttribute("data-place") ?? "palace";
      evergreen = EVERGREEN.has(place);
      bloom = BLOOMS[place] ? place : undefined;
      tint = TINTS[place] ? place : undefined;
      const op = (s: string) => {
        const el = stage.querySelector<HTMLElement>(`.palais-season--${s}`);
        return el ? Number(getComputedStyle(el).opacity) || 0 : 0;
      };
      winter = op("winter");
      autumn = op("autumn") * (1 - winter);
      summer = op("summer") * (1 - op("autumn")) * (1 - winter);
      spring = Math.max(0, 1 - winter - autumn - summer);
    };
    read();
    const reader = setInterval(read, 250);

    let clock = 0;
    const spawn = (kind: Kind, anywhere: boolean): Particle => {
      const s = rand(cfg.scale[0], cfg.scale[1]);
      const snow = kind === "snow";
      if (kind === "petal") {
        const b = BLOOMS[bloom ?? "jacaranda"];
        const size = rand(b.size[0], b.size[1]) * s;
        const set = petals[bloom ?? "jacaranda"];
        return {
          kind,
          bloom,
          vx: rand(4, 14) * s,
          x: rand(-0.05, 1.05) * W,
          y: anywhere ? rand(-0.1, 1) * H : -size * 2,
          size,
          // petals are light: they drift down slower than leaves and sway wider
          vy: rand(14, 30) * s,
          sway: rand(18, 40) * s,
          swayRate: rand(0.5, 1.2),
          phase: rand(0, Math.PI * 2),
          spin: rand(-2, 2),
          angle: rand(0, Math.PI * 2),
          flutter: rand(1.8, 4),
          alpha: rand(0.75, 1),
          born: anywhere ? clock : -Infinity,
          dies: Infinity,
          sprite: set[Math.floor(Math.random() * set.length)],
        };
      }
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
          tint,
          sprite: (tint ? tinted[tint] : tufts)[Math.floor(Math.random() * 6)],
        };
      }
      const size = snow ? rand(2.5, 6) * s : rand(11, 20) * s;
      // in an evergreen room the leaves are green, except in autumn
      const green = !snow && evergreen && autumn < 0.5;
      return {
        kind,
        green,
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
        sprite: snow ? flake : (green ? greenLeaves : leaves)[Math.floor(Math.random() * (green ? greenLeaves : leaves).length)],
      };
    };

    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;

      const blossom = bloom ? BLOOMS[bloom].count : 0;
      const want = {
        snow: evergreen ? 0 : Math.round(cfg.snow * winter),
        // the Rainwood sheds green leaves all year; everywhere else, only in autumn
        leaf: Math.round(cfg.leaves * (evergreen ? 0.8 + autumn * 0.4 : autumn)),
        // blossom rooms get petals through spring and summer, and no fluff
        fluff: bloom || evergreen ? 0 : Math.round(cfg.fluff * (tint ? spring + summer : summer)),
        petal: Math.round(cfg.petals * blossom * (spring + summer)),
      };
      const have = { snow: 0, leaf: 0, fluff: 0, petal: 0 };
      for (const p of particles) {
        // petals from a room you've just left fade away
        if (p.kind === "petal" && p.bloom !== bloom && p.dies === Infinity) p.dies = clock + rand(0, 0.8);
        // and fluff of the wrong colour, and leaves of the wrong kind
        if (p.kind === "fluff" && p.tint !== tint && p.dies === Infinity) p.dies = clock + rand(0, 0.8);
        if (p.kind === "leaf" && p.dies === Infinity && !!p.green !== (evergreen && autumn < 0.5)) p.dies = clock + rand(0, 1.5);
        if (p.dies === Infinity) have[p.kind]++;
      }
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
      for (const kind of ["snow", "leaf", "fluff", "petal"] as Kind[]) {
        const missing = Math.min(want[kind] - have[kind], kind === "petal" ? 4 : 3);
        for (let i = 0; i < missing; i++) particles.push(spawn(kind, true));
        have[kind] += Math.max(missing, 0);
      }

      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        if (p.kind === "petal") p.x += p.vx * dt;
        if (p.kind === "fluff") {
          p.x += p.vx * dt;
          // now and then a lift of warm air carries it back up
          p.y -= Math.max(0, Math.sin(clock * 0.21 + p.phase * 3)) * p.vy * 1.8 * dt;
        }
        const sx = Math.sin(clock * p.swayRate + p.phase) * p.sway;
        // leaves also wander slowly off their line as they fall
        const x = p.x + sx + (p.kind === "leaf" ? Math.sin(clock * 0.3 + p.phase) * 12 : 0);
        const gone =
          p.y > H + p.size * 2 ||
          ((p.kind === "fluff" || p.kind === "petal") && (x < -p.size * 3 || x > W + p.size * 3 || p.y < -p.size * 4));
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
