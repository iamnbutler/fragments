/**
 * Every piece prints on its own art-directed spreads, drawn in this folder:
 * one file per piece, named for its slug, with its inks, paper and how much
 * text each spread holds in DESIGNS (src/lib/zine.ts), and its styles in
 * assets/styles/designs/<slug>.css. A piece without one prints on the
 * generic design.
 */
import { html, type Html } from '../html';
import { sheet, archiveMark } from '../riso';
import type { PieceSpread } from './kit';
import { generic } from './generic';
import { desktopTools } from './desktop-tools';
import { jevDemos } from './jev-demos';
import { openRemote } from './open-remote';
import { tasks } from './tasks';

const DESIGNS: Record<string, (s: PieceSpread) => Html> = {
  'desktop-tools': desktopTools,
  'jev-demos': jevDemos,
  'open-remote': openRemote,
  tasks,
};

/** One spread of a piece, on its own design. */
export function pieceSpread(spread: PieceSpread): Html {
  const { piece, part, parts } = spread;
  const design = DESIGNS[piece.slug] ?? generic;
  const label = part === 0 ? piece.title : `${piece.title}, part ${part + 1} of ${parts}`;
  const running = `${piece.kicker ?? piece.title}, ${part + 1} of ${parts}`;
  return sheet(spread, { label, layout: `dr dr-${piece.slug} dr-${piece.slug}-${part}`, running }, html`${spread.archive && archiveMark(piece.date)}${design(spread)}`);
}
