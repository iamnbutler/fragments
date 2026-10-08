/**
 * Build-time tone check for plates. Dark images (most of Nate's UI work is
 * dark mode) would print as solid slabs of ink, so the press separates them
 * as negatives instead: light lines take the ink, like a patent drawing.
 */
import jpeg from 'jpeg-js';
import { plateSrc } from './zine';

const cache = new Map<string, Promise<number | null>>();
const known = new Map<string, number>();

async function measure(src: string): Promise<number | null> {
  const url = plateSrc(src, 'feed_thumbnail');
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
    const img = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 256 });
    const { data, width, height } = img;
    let sum = 0, n = 0;
    const step = Math.max(1, Math.floor((width * height) / 6000));
    for (let p = 0; p < width * height; p += step) {
      const i = p * 4;
      sum += (0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]) / 255;
      n++;
    }
    return n ? sum / n : null;
  } catch {
    return null;
  }
}

/** Measure many images, a few at a time. */
export async function measureAll(srcs: string[], concurrency = 16): Promise<void> {
  const todo = [...new Set(srcs)].filter((s) => !known.has(s));
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const src = todo[i++];
      if (!cache.has(src)) cache.set(src, measure(src));
      const v = await cache.get(src)!;
      if (v !== null) known.set(src, v);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

/** True when an image is mostly dark and should print as a negative. */
export function isDark(src: string): boolean {
  const v = known.get(src);
  return v !== undefined && v < 0.36;
}

/** True when an image is nearly all paper (fine line art, light UI); it
 * gets a steeper curve so thin strokes still take ink. */
export function isPale(src: string): boolean {
  const v = known.get(src);
  return v !== undefined && v > 0.86;
}

/** True when an image is nearly all black (fine light lines on a dark
 * ground); its negative gets a steep curve so the lines survive the screen. */
export function isInky(src: string): boolean {
  const v = known.get(src);
  return v !== undefined && v < 0.14;
}

/** Record a tone measured some other way (local draft assets aren't JPEGs on the CDN). */
export function markTone(src: string, v: number): void {
  known.set(src, v);
}
