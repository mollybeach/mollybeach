/**
 * The sticker maker's finishing, done in the browser (step 3 of
 * docs/sticker-maker-prompt.md): the same steps used for every sticker added
 * by hand.
 *
 * The image model is asked for a truly transparent PNG, but a model can't be
 * trusted to leave one, so this checks: the corners must be clear, and if
 * they aren't, the background it drew (white, black, grey or a checkerboard)
 * is cut away from the edges in. Then the edge is cleaned, loose specks are
 * dropped, and the sticker is trimmed, given a little margin, sized and saved
 * as a WebP.
 */

/** the longest side a finished sticker gets */
const LONGEST = 1000;
/** the margin around it, as a share of its size */
const MARGIN = 0.02;
/** the photo sent to be made: big enough to read, small enough to send */
const PHOTO_LONGEST = 1536;

const toB64 = (blob: Blob) =>
  new Promise<string>((done, fail) => {
    const r = new FileReader();
    r.onload = () => done(String(r.result).split(",")[1] ?? "");
    r.onerror = () => fail(r.error);
    r.readAsDataURL(blob);
  });

const canvasBlob = (c: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((done, fail) => c.toBlob((b) => (b ? done(b) : fail(new Error("couldn't save the picture"))), type, quality));

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((done, fail) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = () => fail(new Error("That picture couldn't be opened."));
    img.src = src;
  });
}

/** a photo from the person's device, made small enough to send, as a JPEG on white */
export async function shrinkPhoto(file: File): Promise<{ b64: string; type: string; preview: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const k = Math.min(1, PHOTO_LONGEST / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    const blob = await canvasBlob(c, "image/jpeg", 0.9);
    return { b64: await toB64(blob), type: "image/jpeg", preview: c.toDataURL("image/jpeg", 0.8) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface Finished {
  b64: string;
  type: "image/webp" | "image/png";
  /** to show it before it's filed */
  url: string;
  width: number;
  height: number;
}

/**
 * The model's PNG, made into a finished sticker, or an error saying why it
 * couldn't be (no clean cutout, or nothing left).
 */
export async function finishSticker(png: string, glass: boolean): Promise<Finished> {
  const img = await loadImage(`data:image/png;base64,${png}`);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, W, H);
  const px = data.data;
  const A = (i: number) => px[i * 4 + 3];

  /* 1. is it really transparent? If a corner isn't clear, the model drew a
        background: cut it away, from the edges in, through anything pale,
        dark or grey enough to be one (a checkerboard is both) */
  const corners = [0, W - 1, (H - 1) * W, H * W - 1];
  if (corners.some((i) => A(i) > 16)) {
    const plain = (i: number) => {
      const r = px[i * 4], gr = px[i * 4 + 1], b = px[i * 4 + 2];
      const hi = Math.max(r, gr, b), lo = Math.min(r, gr, b);
      return hi - lo < 22 && (lo > 200 || hi < 40 || (lo > 150 && hi < 215));
    };
    const seen = new Uint8Array(W * H);
    const stack: number[] = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    while (stack.length) {
      const i = stack.pop()!;
      if (seen[i]) continue;
      seen[i] = 1;
      if (A(i) > 16 && !plain(i)) continue;
      px[i * 4 + 3] = 0;
      const x = i % W;
      if (x > 0) stack.push(i - 1);
      if (x < W - 1) stack.push(i + 1);
      if (i >= W) stack.push(i - W);
      if (i < W * (H - 1)) stack.push(i + W);
    }
    if (corners.some((i) => A(i) > 16)) throw new Error("The machine couldn't cut that one out cleanly. Try a photo on a plainer background.");
  }

  /* 2. the edge: grow the clear area by a pixel to take off any halo left by
        the old background, then soften the edge a touch (glass keeps its
        partial clearness) */
  const clear = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) clear[i] = A(i) < 8 ? 1 : 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (clear[i]) continue;
      const nearClear = (x > 0 && clear[i - 1]) || (x < W - 1 && clear[i + 1]) || (y > 0 && clear[i - W]) || (y < H - 1 && clear[i + W]);
      if (nearClear) px[i * 4 + 3] = glass ? Math.round(A(i) * 0.5) : Math.round(A(i) * 0.35);
    }

  /* 3. one thing: keep the biggest shape and anything a fair size beside it,
        dropping loose specks */
  const label = new Int32Array(W * H);
  const sizes: number[] = [0];
  for (let i = 0; i < W * H; i++) {
    if (label[i] || A(i) < 24) continue;
    const id = sizes.length;
    let n = 0;
    const stack = [i];
    label[i] = id;
    while (stack.length) {
      const j = stack.pop()!;
      n++;
      const x = j % W;
      const next = [x > 0 ? j - 1 : -1, x < W - 1 ? j + 1 : -1, j - W, j + W];
      for (const k of next)
        if (k >= 0 && k < W * H && !label[k] && A(k) >= 24) {
          label[k] = id;
          stack.push(k);
        }
    }
    sizes.push(n);
  }
  const biggest = sizes.reduce((m, n) => (n > m ? n : m), 0);
  if (biggest < W * H * 0.01) throw new Error("There was nothing left to make a sticker of. Try a closer photo.");
  for (let i = 0; i < W * H; i++) {
    const id = label[i];
    if (A(i) > 0 && (!id || sizes[id] < biggest * 0.01)) px[i * 4 + 3] = 0;
  }

  /* 4. trim to what's there, with a little margin */
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (px[(y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  g.putImageData(data, 0, 0);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const pad = Math.round(Math.max(bw, bh) * MARGIN);

  /* 5. sized so the longest side is LONGEST, never scaled up */
  const k = Math.min(1, LONGEST / (Math.max(bw, bh) + pad * 2));
  const out = document.createElement("canvas");
  out.width = Math.round((bw + pad * 2) * k);
  out.height = Math.round((bh + pad * 2) * k);
  const o = out.getContext("2d")!;
  o.imageSmoothingQuality = "high";
  o.drawImage(c, x0, y0, bw, bh, Math.round(pad * k), Math.round(pad * k), Math.round(bw * k), Math.round(bh * k));

  /* 6. saved as a WebP, or a PNG where the browser can't write WebP (Safari) */
  let blob = await canvasBlob(out, "image/webp", 0.86);
  if (blob.type !== "image/webp") blob = await canvasBlob(out, "image/png");
  return {
    b64: await toB64(blob),
    type: blob.type === "image/webp" ? "image/webp" : "image/png",
    url: URL.createObjectURL(blob),
    width: out.width,
    height: out.height,
  };
}
