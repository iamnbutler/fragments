import type { Block, PlateMedia } from '../../../lib/zine';
import type { DraftImage } from '../../../lib/drafts';

const size = (b: Block) => (b.t === 'code' ? b.text.split('\n').length * 40 : b.text.length);

/** Split a run of blocks so roughly `ratio` of the text lands in the first part. */
export function split(bs: Block[], ratio: number): [Block[], Block[]] {
  const total = bs.reduce((n, b) => n + size(b), 0);
  let acc = 0;
  let i = 0;
  while (i < bs.length && acc + size(bs[i]) / 2 < total * ratio) acc += size(bs[i++]);
  return [bs.slice(0, i), bs.slice(i)];
}

/** A draft screenshot as plate media. */
export function plateOf(im: DraftImage | undefined): PlateMedia | undefined {
  return im && { src: im.src, alt: im.alt, aspect: im.aspect };
}
