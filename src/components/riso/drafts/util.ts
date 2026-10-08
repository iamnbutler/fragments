import type { Block } from '../../../lib/zine';
import type { Media } from '../../../lib/stream';
import type { DraftImage } from '../../../lib/drafts';
import { markTone } from '../../../lib/tone';

const size = (b: Block) => (b.t === 'code' ? b.text.split('\n').length * 40 : b.text.length);

/** Split a run of blocks so roughly `ratio` of the text lands in the first part. */
export function split(bs: Block[], ratio: number): [Block[], Block[]] {
  const total = bs.reduce((n, b) => n + size(b), 0);
  let acc = 0;
  let i = 0;
  while (i < bs.length && acc + size(bs[i]) / 2 < total * ratio) acc += size(bs[i++]);
  return [bs.slice(0, i), bs.slice(i)];
}

/**
 * A draft screenshot as plate media. `tone` is its average lightness (0–1),
 * judged by eye: it picks the separation the way the build's tone check does
 * for CDN images.
 */
export function media(im: DraftImage | undefined, tone: number): Media | undefined {
  if (!im) return undefined;
  markTone(im.src, tone);
  return { src: im.src, alt: im.alt, aspect: im.aspect };
}
