/**
 * The parts every design is drawn from: figures, frames of running text, and
 * the line that says where the text goes next.
 */
import { html, raw, attr, cls, type Html } from '../html';
import { blocks } from '../riso';
import type { PieceImage } from '../../lib/pieces';
import type { Block, PlateMedia, Spread } from '../../lib/zine';

export type PieceSpread = Extract<Spread, { kind: 'piece' }>;

const size = (b: Block) => (b.t === 'code' ? b.text.split('\n').length * 40 : b.text.length);

/** Split a run of blocks so roughly `ratio` of the text lands in the first part. */
export function split(bs: Block[], ratio: number): [Block[], Block[]] {
  const total = bs.reduce((n, b) => n + size(b), 0);
  let acc = 0;
  let i = 0;
  while (i < bs.length && acc + size(bs[i]) / 2 < total * ratio) acc += size(bs[i++]);
  // A heading goes with the text under it.
  while (i > 1 && i < bs.length && bs[i - 1].t === 'h') i--;
  return [bs.slice(0, i), bs.slice(i)];
}

/** A picture of a piece as plate media. */
export function plateOf(im: PieceImage | undefined): PlateMedia | undefined {
  return im && { src: im.src, alt: im.alt, aspect: im.aspect };
}

/**
 * A line drawing printed as an ink plate. The figures are black strokes on
 * transparent, so the file becomes a mask and the ink is whatever colour the
 * page asks for. An optional ghost plate in a second ink sits out of register.
 * A figure with a looping version plays it while it's in view.
 */
export function inkFig(image: PieceImage | undefined, p: { ink?: string; ghost?: string; class?: string; style?: string; caption?: boolean | string; fit?: 'contain' | 'cover' } = {}): Html {
  if (!image) return raw('');
  const { ink = 'dk', ghost, style = '', caption = true, fit = 'contain' } = p;
  const ar = image.aspect ?? 1.4;
  const cap = typeof caption === 'string' ? caption : caption ? image.caption : undefined;
  return html`<figure${attr('class', cls('inkfig', `fit-${fit}`, image.motion && 'has-motion', p.class))}${attr('data-motion', image.motion)}${attr('style', `--ar:${ar.toFixed(4)};--fig:url("${image.src}");${image.motion ? `--fig-motion:url("${image.motion}");` : ''}--ink:var(--${ink});${ghost ? `--ghost:var(--${ghost});` : ''}${style}`)}>
    <div class="inkfig-plates" role="img"${attr('aria-label', image.alt)}>
      ${ghost && html`<span class="inkfig-ghost" aria-hidden="true"></span>`}
      <span class="inkfig-key" aria-hidden="true"></span>
    </div>
    ${cap && html`<figcaption class="cap">${cap}</figcaption>`}
  </figure>`;
}

/**
 * A frame of a piece's running text. All of a piece's frames, across its
 * designed spreads and any jumps after them, are one chain for copyfitting.
 */
export function prose(flow: string, bs: Block[], p: { cols?: 1 | 2 | 3; class?: string; end?: boolean; dropcap?: boolean } = {}): Html {
  const { cols = 2, end = false, dropcap = false } = p;
  return html`<div${attr('class', cls('prose-cols', 'dr-prose', cols > 1 && `cols-${cols}`, dropcap && 'dropcap', p.class))}${attr('data-flow', flow)}>
    ${blocks(bs, { end })}
  </div>`;
}

/** Where a piece's text goes next: the next page with text, or its own page. */
export function cont(spread: PieceSpread, c?: string): Html {
  return spread.jump
    ? html`<a${attr('class', cls('cont', c))}${attr('href', `#p-${spread.jump}`)}>Continued on page ${spread.jump}</a>`
    : spread.blocks.length > 0 ? html`<a${attr('class', cls('cont', 'cont-single', c))}${attr('href', spread.piece.href)}>Read on its own page</a>` : raw('');
}
