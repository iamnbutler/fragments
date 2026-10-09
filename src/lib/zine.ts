import type { Draft } from './drafts';
import { SPOT, PAPERS } from './spectrum';

/**
 * PRESS RUN: the issue, imposed as a printed zine.
 *
 * The cover and the bio open every issue; each feature follows as its own
 * art-directed spreads, then plain jump spreads for any text the design has
 * no room for. Every spread gets an ink pair, a paper and a seed for its
 * misregistration, so the same content always prints the same way.
 */

export type Ink = 'yellow' | 'blue' | 'teal' | 'black';
export type Paper = 'newsprint' | 'bone';

interface SpreadBase {
  n: number; // spread index in the issue
  page: number; // left-hand page number
  seed: number;
  inks: [Ink, Ink]; // [light plate, key plate]
  paper: Paper;
  /** the feature a spread belongs to; flats group by it */
  group?: { key: string; title: string };
}

/** A picture to print as plates. */
export interface PlateMedia {
  src: string;
  alt?: string;
  /** width / height */
  aspect?: number;
}

export interface Ref {
  n: number;
  url: string;
  label: string;
}

/** What a jump spread needs from the piece it continues. */
export interface JumpItem {
  key: string;
  title: string;
  text: string;
  href: string;
}

/**
 * Art direction for each feature: how many designed spreads it gets,
 * roughly how much running text each one holds, and its inks and paper.
 */
export interface DraftDesign {
  caps: number[];
  inks: [Ink, Ink][];
  paper: Paper[];
}
export const DRAFT_DESIGNS: Record<string, DraftDesign> = {
  'desktop-tools': {
    caps: [1500, 2300],
    inks: [['blue', 'teal'], ['blue', 'teal']],
    paper: ['newsprint', 'bone'],
  },
  'jev-demos': {
    caps: [1300, 1700],
    inks: [['yellow', 'black'], ['yellow', 'teal']],
    paper: ['newsprint', 'newsprint'],
  },
};
const GENERIC_DRAFT: DraftDesign = { caps: [2600], inks: [['yellow', 'black']], paper: ['newsprint'] };
export const draftDesign = (slug: string) => DRAFT_DESIGNS[slug] ?? GENERIC_DRAFT;

export type Spread =
  | (SpreadBase & { kind: 'cover' })
  | (SpreadBase & { kind: 'bio' })
  | (SpreadBase & { kind: 'jump'; item: JumpItem; blocks: Block[]; refs: Ref[]; from: number; jump?: number; part: number; last: boolean })
  | (SpreadBase & {
      kind: 'draft';
      draft: Draft;
      part: number;
      parts: number;
      blocks: Block[];
      jump?: number;
      first: number;
    });

// --- seeded randomness --------------------------------------------------------

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo: number, hi: number) => lo + (hi - lo) * next(),
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)],
    chance: (p: number) => next() < p,
  };
}

export const INK_PAIRS: [Ink, Ink][] = [
  ['yellow', 'black'],
  ['yellow', 'blue'],
  ['blue', 'black'],
  ['yellow', 'teal'],
];

// --- imposition --------------------------------------------------------------

const JUMP_CHARS = 4400;
const MAX_JUMPS = 4;

export function impose(drafts: Draft[] = []): Spread[] {
  const spreads: Spread[] = [];
  const base = (seedKey: string, inks: [Ink, Ink], paper: Paper, group?: SpreadBase['group']): SpreadBase => ({
    n: spreads.length,
    page: spreads.length * 2,
    seed: hash(seedKey),
    inks,
    paper,
    group,
  });

  spreads.push({ ...base('cover', ['yellow', 'teal'], 'newsprint'), kind: 'cover' });
  spreads.push({ ...base('bio', ['yellow', 'blue'], 'bone'), kind: 'bio' });

  for (const d of drafts) {
    const design = draftDesign(d.slug);
    const group = { key: d.slug, title: d.title };
    const bs = blocks(d.text, d.title, { refs: true });
    let next = 0;
    let prev: { jump?: number } | null = null;
    let from = 0;
    let first = -1;
    const parts = design.caps.length;
    for (let part = 0; part < parts; part++) {
      const cut = design.caps[part] ? takeBlocks(bs, design.caps[part], next) : { blocks: [], next };
      next = cut.next;
      const b = base(`${d.key}-${part}`, design.inks[part] ?? design.inks[0], design.paper[part] ?? design.paper[0], group);
      const s: Extract<Spread, { kind: 'draft' }> = {
        ...b,
        kind: 'draft',
        draft: d,
        part,
        parts,
        blocks: cut.blocks,
        first: first < 0 ? b.page : first,
      };
      spreads.push(s);
      if (first < 0) first = s.page;
      if (prev && cut.blocks.length) prev.jump = s.page;
      if (cut.blocks.length) { prev = s; from = s.page; }
    }
    for (let part = 1; part <= MAX_JUMPS && next < bs.length; part++) {
      const cut = takeBlocks(bs, JUMP_CHARS, next);
      next = cut.next;
      const j: Extract<Spread, { kind: 'jump' }> = {
        ...base(`${d.key}-jump-${part}`, design.inks[design.inks.length - 1], 'newsprint', group),
        kind: 'jump',
        item: d,
        blocks: cut.blocks,
        refs: collectRefs(cut.blocks, d.text),
        from,
        part,
        last: next >= bs.length,
      };
      spreads.push(j);
      if (prev) prev.jump = j.page;
      prev = j;
      from = j.page;
    }
  }
  return spreads;
}

/** Numbered references used in a run of blocks, in order. */
function collectRefs(bs: Block[], md: string): Ref[] {
  const all = linkRefs(md);
  const seen = new Set<number>();
  for (const b of bs) for (const m of b.text.matchAll(REF_MARK)) seen.add(Number(m[1]));
  return all.filter((r) => seen.has(r.n));
}

/** Every outbound link in an essay, numbered in reading order. */
export function linkRefs(md: string): Ref[] {
  return markRefs(md).refs;
}

/** Swap outbound links for numbered markers, outside code fences. */
function markRefs(md: string): { md: string; refs: Ref[] } {
  const refs: Ref[] = [];
  const out = md
    .split(/(```[\s\S]*?```)/g)
    .map((part) =>
      part.startsWith('```')
        ? part
        : part.replace(/(?<!!)\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, label: string, url: string) => {
            refs.push({ n: refs.length + 1, url, label: inline(label) });
            return `${label}\u0001${refs.length}\u0001`;
          }),
    )
    .join('');
  return { md: out, refs };
}

/** Marker left in block text where a numbered reference sits. */
export const REF_MARK = /\u0001(\d+)\u0001/g;

// --- text helpers ------------------------------------------------------------

/** Plain inline text from a line of markdown. */
export function inline(md: string): string {
  return md
    .replace(/u2013/g, '–')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function domain(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function printDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function readingMinutes(md: string): number {
  return Math.max(1, Math.round(md.split(/\s+/).length / 230));
}

/** Short title for a spread, used by flats and running heads. */
export function spreadTitle(s: Spread): string {
  switch (s.kind) {
    case 'cover':
      return 'Cover';
    case 'bio':
      return 'Hi friends';
    case 'jump':
      return `${s.item.title} (continued)`;
    case 'draft':
      return s.part === 0 ? s.draft.title : `${s.draft.title} (continued)`;
  }
}

export const INK_HEX: Record<Ink | 'paper', string> = { ...SPOT, paper: PAPERS.newsprint };

export interface Block {
  t: 'p' | 'h' | 'li' | 'code' | 'quote';
  text: string;
}

/** Essay body as typeset blocks: paragraphs, run-in heads, bullets, code. */
export function blocks(md: string, title = '', opts: { refs?: boolean } = {}): Block[] {
  if (opts.refs) md = markRefs(md).md;
  const out: Block[] = [];
  const parts = md.split(/(```[\s\S]*?```)/g);
  for (const part of parts) {
    if (part.startsWith('```')) {
      const code = part.replace(/^```[^\n]*\n?/, '').replace(/```$/, '').trimEnd();
      const lines = code.split('\n').slice(0, 7);
      if (lines.join('').trim()) out.push({ t: 'code', text: lines.join('\n') + (code.split('\n').length > 7 ? '\n…' : '') });
      continue;
    }
    for (const raw of part.split(/\n\s*\n/)) {
      const b = raw.trim();
      if (!b || /^!\[/.test(b) || /^\|/.test(b) || /^<\w/.test(b)) continue;
      const h = b.match(/^#{1,6}\s+(.*)/);
      if (h) {
        const t = inline(h[1]);
        if (t && t !== title) out.push({ t: 'h', text: t });
        continue;
      }
      if (/^>/.test(b)) {
        out.push({ t: 'quote', text: inline(b.replace(/^>\s?/gm, ' ')) });
        continue;
      }
      if (/^([-*+]|\d+\.)\s/.test(b)) {
        for (const li of b.split(/\n(?=\s*(?:[-*+]|\d+\.)\s)/)) {
          const t = inline(li.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').replace(/\n\s*/g, ' '));
          if (t) out.push({ t: 'li', text: t });
        }
        continue;
      }
      const t = inline(b.replace(/\n/g, ' '));
      if (t && t !== title) out.push({ t: 'p', text: t });
    }
  }
  return out;
}

/** Take blocks until roughly `chars` characters have been set. */
export function takeBlocks(bs: Block[], chars: number, from = 0): { blocks: Block[]; next: number } {
  const out: Block[] = [];
  let used = 0;
  let i = from;
  for (; i < bs.length && used < chars; i++) {
    out.push(bs[i]);
    used += bs[i].t === 'code' ? bs[i].text.split('\n').length * 40 : bs[i].text.length;
  }
  // A heading goes with the text under it, never at the foot of a frame.
  while (i < bs.length && out.length > 1 && out[out.length - 1].t === 'h') { out.pop(); i--; }
  return { blocks: out, next: i };
}
