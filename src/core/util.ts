const DIGITS = '০১২৩৪৫৬৭৮৯';

/** Formats a number with Bangla digits. */
export function bn(value: number | string, decimals?: number): string {
  const text = typeof value === 'number' && decimals !== undefined ? value.toFixed(decimals) : String(value);
  return text.replace(/\d/g, (d) => DIGITS[Number(d)]);
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function smooth(edge0: number, edge1: number, x: number): number {
  const k = clamp((x - edge0) / (edge1 - edge0));
  return k * k * (3 - 2 * k);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
