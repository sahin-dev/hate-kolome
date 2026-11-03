/**
 * A small software renderer for biological surfaces. A flat shape is "inflated" into a
 * height field, then lit pixel by pixel. All artwork is generated here, so none of it is
 * traced or copied from another source, and nothing needs downloading on a slow connection.
 */
export type RGB = [number, number, number];

export interface Skin {
  color: RGB;
  /** Colour in the creases and near the edge. */
  deep: RGB;
  /** Second colour mixed in by noise, for natural mottling. */
  mottle?: RGB;
  mottleAmount?: number;
  /** How far in from the edge the surface keeps rising. */
  round: number;
  /** Fine surface bumps: tiny pores and grain. */
  grain?: number;
  /** Large soft lumps, as on a gland. */
  lumps?: number;
  lumpScale?: number;
  /** Wet highlight strength, 0 to 1. */
  gloss?: number;
  /** Extra relief in surface units, for folds or ridges. */
  relief?: (x: number, y: number) => number;
  seed?: number;
}

function hash(x: number, y: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth value noise in the range 0 to 1. */
export function noise(x: number, y: number, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, seed = 0, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * f, y * f, seed + i * 13);
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / (1 - 0.5 ** octaves);
}

export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const smooth = (e0: number, e1: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
};

export function layer(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Light comes from the upper left, as in most anatomical plates. */
const LIGHT = (() => {
  const v = [-0.46, -0.58, 0.67];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((a) => a / n);
})();
const HALF = (() => {
  const v = [LIGHT[0], LIGHT[1], LIGHT[2] + 1];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((a) => a / n);
})();

/** Distance from each inside pixel to the nearest edge, by a two-pass chamfer. */
function distanceField(alpha: Uint8ClampedArray, w: number, h: number) {
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = alpha[i * 4 + 3] > 127 ? 1e6 : 0;
  const A = 1;
  const B = Math.SQRT2;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (d[i] > 0) d[i] = Math.min(d[i], d[i - 1] + A, d[i - w] + A, d[i - w - 1] + B, d[i - w + 1] + B);
    }
  }
  for (let y = h - 2; y > 0; y--) {
    for (let x = w - 2; x > 0; x--) {
      const i = y * w + x;
      if (d[i] > 0) d[i] = Math.min(d[i], d[i + 1] + A, d[i + w] + A, d[i + w + 1] + B, d[i + w - 1] + B);
    }
  }
  return d;
}

/** Separable box blur, in place. */
function blur(a: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(a.length);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += a[y * w + Math.max(0, Math.min(w - 1, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / n;
      sum += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
    for (let y = 0; y < h; y++) {
      a[y * w + x] = sum / n;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
}

/**
 * Paints `draw` (any solid shape) as a rounded, lit organic surface.
 * Returns a transparent canvas the size of the stage, so it can be redrawn alone later.
 */
export function inflate(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, skin: Skin) {
  const out = layer(w, h);
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(ctx);

  const full = ctx.getImageData(0, 0, w, h).data;
  let x0 = w;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (full[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0) return out;
  x0 = Math.max(0, x0 - 2);
  y0 = Math.max(0, y0 - 2);
  const bw = Math.min(w, x1 + 3) - x0;
  const bh = Math.min(h, y1 + 3) - y0;

  const img = ctx.getImageData(x0, y0, bw, bh);
  const px = img.data;
  const dist = distanceField(px, bw, bh);
  const seed = skin.seed ?? 1;
  const round = skin.round;
  const grain = skin.grain ?? 0.4;
  const lumps = skin.lumps ?? 0;
  const lumpScale = skin.lumpScale ?? 26;
  const heights = new Float32Array(bw * bh);

  for (let j = 0; j < bh; j++) {
    for (let i = 0; i < bw; i++) {
      const at = j * bw + i;
      const d = dist[at];
      if (d <= 0) continue;
      const x = i + x0;
      const y = j + y0;
      const k = 1 - Math.min(d, round) / round;
      let z = round * Math.sqrt(1 - k * k);
      if (lumps) z += lumps * fbm(x / lumpScale, y / lumpScale, seed, 3);
      if (grain) z += grain * noise(x / 1.7, y / 1.7, seed + 5);
      if (skin.relief) z += skin.relief(x, y);
      heights[at] = z;
    }
  }

  // The distance field has sharp ridges along its middle; smoothing removes the faceted look.
  blur(heights, bw, bh, Math.max(2, Math.round(round / 7)));
  blur(heights, bw, bh, Math.max(1, Math.round(round / 12)));

  const gloss = skin.gloss ?? 0.45;
  const [r0, g0, b0] = skin.color;
  const [r1, g1, b1] = skin.deep;
  const m = skin.mottle ?? skin.color;
  const mAmt = skin.mottleAmount ?? 0;

  for (let j = 1; j < bh - 1; j++) {
    for (let i = 1; i < bw - 1; i++) {
      const at = j * bw + i;
      if (dist[at] <= 0) continue;
      const nx = (heights[at - 1] - heights[at + 1]) * 0.5;
      const ny = (heights[at - bw] - heights[at + bw]) * 0.5;
      const len = Math.hypot(nx, ny, 1);
      const a = nx / len;
      const b = ny / len;
      const c = 1 / len;
      const diff = Math.max(0, a * LIGHT[0] + b * LIGHT[1] + c * LIGHT[2]);
      const spec = Math.max(0, a * HALF[0] + b * HALF[1] + c * HALF[2]) ** 42;

      // Crevices keep the deep colour; light scatters inside the tissue near the edges.
      const edge = 1 - Math.min(dist[at], round) / round;
      const crease = smooth(0.55, 1, edge) * 0.75;
      const blotch = mAmt ? smooth(0.42, 0.68, fbm((i + x0) / 34, (j + y0) / 34, seed + 9, 3)) * mAmt : 0;
      const lit = 0.44 + diff * 0.82;
      const q = at * 4;
      const base = (u: number, v: number, t2: number) => mix(mix(u, t2, blotch), v, crease);
      px[q] = Math.min(255, base(r0, r1, m[0]) * lit + spec * 255 * gloss);
      px[q + 1] = Math.min(255, base(g0, g1, m[1]) * lit + spec * 255 * gloss);
      px[q + 2] = Math.min(255, base(b0, b1, m[2]) * lit + spec * 255 * gloss);
    }
  }
  ctx.putImageData(img, x0, y0);
  return out;
}

export type Pt = [number, number];

/** A smooth curve through the points (Catmull-Rom), sampled about every `step` pixels. */
export function curve(points: Pt[], step = 3): Pt[] {
  const out: Pt[] = [];
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Draws a tube along a line. `width` can vary with distance, for the pouches of the colon. */
export function tube(c: CanvasRenderingContext2D, line: Pt[], width: (s: number, i: number) => number) {
  let s = 0;
  line.forEach(([x, y], i) => {
    if (i) s += Math.hypot(x - line[i - 1][0], y - line[i - 1][1]);
    c.beginPath();
    c.arc(x, y, width(s, i) / 2, 0, Math.PI * 2);
    c.fill();
  });
}

export function shape(c: CanvasRenderingContext2D, points: Pt[]) {
  const line = curve([...points, points[0]], 2);
  c.beginPath();
  line.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}

/** Point a given fraction of the way along a sampled line. */
export function along(line: Pt[], k: number): Pt {
  const i = Math.max(0, Math.min(line.length - 1, k * (line.length - 1)));
  const a = Math.floor(i);
  const b = Math.min(line.length - 1, a + 1);
  const t = i - a;
  return [mix(line[a][0], line[b][0], t), mix(line[a][1], line[b][1], t)];
}
