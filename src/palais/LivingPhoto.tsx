import { useEffect, useRef } from "react";
import { usePlace, type Place } from "./place";

/**
 * Makes the clouds drift and the water ripple in a room's photographs.
 *
 * It sits on top of the room's stack of season photographs (the `<img>`s just
 * before it in the same box) and redraws only the sky and the water, a little
 * displaced, on a WebGL canvas. Everything else is transparent, so the
 * photographs underneath show through untouched.
 *
 * Where the sky and water are comes from a small mask per photograph
 * (public/palais/masks/<name>.webp: red is sky, green is water), made by
 * running a scene-segmentation model over each picture.
 *
 * - The clouds drift sideways with a "flow map": the sky is sampled a little
 *   further along twice, half a cycle apart, and the two are crossfaded, so the
 *   drift never runs out or jumps. A slow warp on top makes them billow.
 * - The water ripples: small wavy offsets and a faint shimmer.
 * - A waterfall (blue in the mask, painted by hand: Snoqualmie Falls in the
 *   closet window) pours: the same flow trick, fast and straight down, with
 *   streaks of foam running through it.
 *
 * It reads each photograph's opacity every frame and mixes them the same way
 * the page does, so it stays in step while the seasons crossfade. It only runs
 * in the room you're in, drops its GPU context when you leave, and does
 * nothing for people who ask for reduced motion.
 */

const VERT = `
attribute vec2 p;
varying vec2 v;
void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
varying vec2 v;
uniform sampler2D i0, i1, i2, i3, m0, m1, m2, m3;
uniform float w1, w2, w3;
uniform vec2 res, img, focus;
uniform float t;

float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

vec4 mask(vec2 uv) {
  vec4 m = texture2D(m0, uv);
  if (w1 > 0.0) m = mix(m, texture2D(m1, uv), w1);
  if (w2 > 0.0) m = mix(m, texture2D(m2, uv), w2);
  if (w3 > 0.0) m = mix(m, texture2D(m3, uv), w3);
  return m;
}
vec3 photo(vec2 uv) {
  vec3 c = texture2D(i0, uv).rgb;
  if (w1 > 0.0) c = mix(c, texture2D(i1, uv).rgb, w1);
  if (w2 > 0.0) c = mix(c, texture2D(i2, uv).rgb, w2);
  if (w3 > 0.0) c = mix(c, texture2D(i3, uv).rgb, w3);
  return c;
}

void main() {
  // object-fit: cover, at object-position: focus
  vec2 frag = vec2(v.x, 1.0 - v.y) * res;
  float s = max(res.x / img.x, res.y / img.y);
  vec2 shown = img * s;
  vec2 uv = (frag - (res - shown) * focus) / shown;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard;

  vec4 m = mask(uv);
  // only move what's clearly sky or water, so edges (towers, mullions, leaves) hold still
  float sky = smoothstep(0.45, 0.9, m.r), water = smoothstep(0.45, 0.9, m.g), fall = smoothstep(0.2, 0.7, m.b);
  float a = max(max(sky, water), fall);
  if (a < 0.02) discard;

  vec3 col = photo(uv);

  if (sky > 0.02) {
    // two samples drifting along, half a cycle apart, crossfaded
    float T = 26.0;
    float p0 = fract(t / T), p1 = fract(t / T + 0.5);
    float blend = abs(p0 - 0.5) * 2.0;
    vec2 flow = vec2(0.045, 0.0);
    vec2 warp = (vec2(noise(uv * 6.0 + t * 0.05), noise(uv * 6.0 - t * 0.04 + 9.0)) - 0.5) * 0.012;
    vec2 u0 = uv - flow * p0 + warp;
    vec2 u1 = uv - flow * p1 + warp;
    // never borrow from outside the sky (the arches, the trees)
    vec3 c0 = mask(u0).r > 0.85 ? photo(u0) : col;
    vec3 c1 = mask(u1).r > 0.85 ? photo(u1) : col;
    col = mix(col, mix(c0, c1, blend), sky);
  }

  if (water > 0.02) {
    vec2 d = vec2(
      sin(uv.y * 260.0 + t * 2.1) * 0.0011 + sin(uv.x * 70.0 + uv.y * 40.0 + t * 1.2) * 0.0007,
      sin(uv.x * 190.0 - t * 1.7) * 0.0016 + (noise(uv * vec2(40.0, 120.0) + t * 0.6) - 0.5) * 0.002
    );
    vec2 uw = uv + d;
    vec3 cw = mask(uw).g > 0.8 ? photo(uw) : col;
    // a faint glint moving over the surface
    float glint = noise(uv * vec2(60.0, 200.0) + vec2(t * 0.8, -t * 0.3));
    cw *= 1.0 + (glint - 0.5) * 0.09;
    col = mix(col, cw, water);
  }

  if (fall > 0.02) {
    // the water pouring down: sampled from a little higher, two phases crossfaded
    float T = 0.9;
    float p0 = fract(t / T), p1 = fract(t / T + 0.5);
    float blend = abs(p0 - 0.5) * 2.0;
    vec2 flow = vec2(0.0, 0.02);
    vec2 u0 = uv - flow * p0, u1 = uv - flow * p1;
    vec3 c0 = mask(u0).b > 0.4 ? photo(u0) : col;
    vec3 c1 = mask(u1).b > 0.4 ? photo(u1) : col;
    vec3 cf = mix(c0, c1, blend);
    // foam streaks racing down
    float streak = noise(vec2(uv.x * 900.0, uv.y * 60.0 - t * 9.0));
    cf += (streak - 0.45) * 0.22;
    col = mix(col, cf, fall);
  }

  gl_FragColor = vec4(col * a, a);
}
`;

const maskFor = (src: string) => src.replace(/\/palais\/([^/]+)\.webp$/, "/palais/masks/$1.webp");

/** photographs with nothing to animate (no sky or water in the picture) */
const STILL = /\/palais\/(rainwood|kitchen-\w+|bathroom(?:-\w+)?|garden-\w+|madeleine(?:-portrait)?)\.webp$/;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

function loadTexture(gl: WebGLRenderingContext, unit: number, src: string, onReady: () => void) {
  const tex = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  const im = new Image();
  im.decoding = "async";
  im.onload = () => {
    if (gl.isContextLost()) return;
    // back to this texture's own unit: others may have been bound since
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    onReady();
  };
  im.src = src;
  return tex;
}

export function LivingPhoto({ room }: { room: Place }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const { place } = usePlace();
  const active = place === room;

  useEffect(() => {
    const box = anchor.current?.parentElement;
    if (!box || !active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const imgs = Array.from(box.querySelectorAll<HTMLImageElement>(":scope > img")).slice(0, 4);
    if (!imgs.length || imgs.every((im) => STILL.test(im.getAttribute("src") ?? ""))) return;

    // a brand-new canvas every time: a canvas whose context has been given back
    // can never draw again (and would show as a blank sheet over the photograph)
    const cv = document.createElement("canvas");
    cv.className = "palais-living";
    cv.setAttribute("aria-hidden", "true");
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    anchor.current!.after(cv);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    let ready = 0;
    const need = imgs.length * 2;
    const done = () => ready++;
    const u = (n: string) => gl.getUniformLocation(prog, n);
    imgs.forEach((im, i) => {
      const src = im.getAttribute("src") ?? "";
      loadTexture(gl, i, src, done);
      gl.uniform1i(u(`i${i}`), i);
      loadTexture(gl, 4 + i, maskFor(src), done);
      gl.uniform1i(u(`m${i}`), 4 + i);
    });
    // unused slots point at the first photograph
    for (let i = imgs.length; i < 4; i++) {
      gl.uniform1i(u(`i${i}`), 0);
      gl.uniform1i(u(`m${i}`), 4);
    }

    const focus = () => {
      const pos = getComputedStyle(imgs[0]).objectPosition.split(" ");
      const pct = (s: string | undefined, fallback: number) => (s && s.endsWith("%") ? parseFloat(s) / 100 : fallback);
      return [pct(pos[0], 0.5), pct(pos[1], 0.5)];
    };

    let frame = 0;
    let last = 0;
    const start = performance.now();
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      // thirty frames a second is plenty for clouds and water
      if (now - last < 33 || document.hidden || ready < need) return;
      last = now;
      // the palace keeps a tall and a wide set; only the one in view draws
      if (getComputedStyle(box).opacity === "0") return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      if (!w || !h) return;
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      gl.viewport(0, 0, w, h);
      const [fx, fy] = focus();
      gl.uniform2f(u("res"), w, h);
      gl.uniform2f(u("img"), imgs[0].naturalWidth || 1672, imgs[0].naturalHeight || 941);
      gl.uniform2f(u("focus"), fx, fy);
      gl.uniform1f(u("t"), (now - start) / 1000);
      const op = (i: number) => (imgs[i] ? Number(getComputedStyle(imgs[i]).opacity) || 0 : 0);
      gl.uniform1f(u("w1"), op(1));
      gl.uniform1f(u("w2"), op(2));
      gl.uniform1f(u("w3"), op(3));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      // give the GPU context back: rooms you've left don't hold one
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      cv.remove();
    };
  }, [active]);

  // the canvas is made and removed by the effect; this just marks where it goes
  return <span ref={anchor} hidden />;
}
