import type { StreamItem, FragmentItem, NoteItem, ReshareItem } from './stream';

/**
 * PRESS RUN: the stream, imposed as a printed zine.
 *
 * Items are grouped into spreads (two facing pages) and every spread gets a
 * layout, an ink pair and a paper chosen by a generator seeded from the
 * content itself, so the same content always prints the same way but no two
 * neighbouring spreads share a composition.
 */

export type Ink = 'pink' | 'orange' | 'blue' | 'black';
export type Paper = 'newsprint' | 'blush' | 'bone' | 'toner';

interface SpreadBase {
  n: number; // spread index in the issue
  page: number; // left-hand page number
  seed: number;
  inks: [Ink, Ink]; // [light plate, key plate]
  paper: Paper;
}

export type PostLayout = 'tower' | 'banner' | 'toner';
export type ShotLayout = 'bleed' | 'plate' | 'contact' | 'toner' | 'diptych';
export type ListLayout = 'index' | 'ledger';
export type ClipLayout = 'solo' | 'pair' | 'trio' | 'blowup' | 'wall';

export type Spread =
  | (SpreadBase & { kind: 'cover' })
  | (SpreadBase & { kind: 'contents' })
  | (SpreadBase & { kind: 'post'; layout: PostLayout; item: FragmentItem })
  | (SpreadBase & { kind: 'shot'; layout: ShotLayout; items: FragmentItem[] })
  | (SpreadBase & { kind: 'list'; layout: ListLayout; item: FragmentItem })
  | (SpreadBase & { kind: 'bulletin'; items: (NoteItem | FragmentItem)[] })
  | (SpreadBase & { kind: 'clippings'; layout: ClipLayout; items: ReshareItem[] });

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

const INK_PAIRS: [Ink, Ink][] = [
  ['pink', 'black'],
  ['orange', 'black'],
  ['pink', 'blue'],
  ['orange', 'blue'],
  ['pink', 'orange'],
];

// --- grouping ----------------------------------------------------------------

const isFrag = (i: StreamItem): i is FragmentItem => i.kind !== 'note' && i.kind !== 'reshare';
const isLoneShot = (i: StreamItem) =>
  i.kind === 'shot' && i.media.length === 1 && !i.text.trim();

export function impose(stream: StreamItem[]): Spread[] {
  const spreads: Spread[] = [];
  let lastPair = -1;
  let lastLayout = '';

  const push = (
    seedKey: string,
    make: (r: ReturnType<typeof rng>, base: SpreadBase) => Spread,
    opts: { paper?: Paper } = {},
  ) => {
    const seed = hash(seedKey);
    const r = rng(seed);
    let pi = Math.floor(r.next() * INK_PAIRS.length);
    if (pi === lastPair) pi = (pi + 1) % INK_PAIRS.length;
    lastPair = pi;
    const paper: Paper = opts.paper ?? r.pick(['newsprint', 'newsprint', 'bone', 'blush'] as const);
    const base: SpreadBase = { n: spreads.length, page: spreads.length * 2, seed, inks: INK_PAIRS[pi], paper };
    spreads.push(make(r, base));
  };

  /** Pick a layout, never the same as the previous spread's. */
  const choose = <T extends string>(r: ReturnType<typeof rng>, options: T[]): T => {
    const pool = options.filter((o) => o !== lastLayout);
    const out = r.pick(pool.length ? pool : options);
    lastLayout = out;
    return out;
  };

  push('cover', (_r, b) => ({ ...b, kind: 'cover', inks: ['pink', 'orange'], paper: 'newsprint' }));
  push('contents', (_r, b) => ({ ...b, kind: 'contents', inks: ['orange', 'black'], paper: 'bone' }));

  // Editorial imposition: Nate's work and other people's clippings each stay
  // newest first, and the two are interleaved at an even rate.
  const own = stream.filter((x) => x.kind !== 'reshare');
  const shares = stream.filter((x): x is ReshareItem => x.kind === 'reshare');
  let oi = 0;
  let si = 0;
  let clipRun = 0;
  let lastClip = '';

  const isTextOnly = (c: ReshareItem) => !c.original.media.length && !c.original.link;

  const takeClippings = () => {
    const first = shares[si];
    const r = rng(hash(first.key));
    let layout: ClipLayout;
    let n: number;
    let runText = 0;
    while (si + runText < shares.length && runText < 4 && isTextOnly(shares[si + runText]) && shares[si + runText].original.text.length < 300) runText++;
    const short = isTextOnly(first) && first.original.text.length >= 8 && first.original.text.length <= 170 && !/https?:|\w\.\w+\/|…|\.\.\./.test(first.original.text);
    const roll = r.next();
    if (runText >= 3 && lastClip !== 'wall' && roll < 0.6) { layout = 'wall'; n = runText; }
    else if (short && lastClip !== 'blowup' && roll < 0.75) { layout = 'blowup'; n = 1; }
    else {
      const want = r.pick([1, 2, 2, 3, 3]);
      n = Math.min(want, shares.length - si);
      layout = n === 1 ? 'solo' : n === 2 ? 'pair' : 'trio';
      if (layout === lastClip && n > 1) { n = n === 2 ? 3 : 2; n = Math.min(n, shares.length - si); layout = n === 1 ? 'solo' : n === 2 ? 'pair' : 'trio'; }
      const group = shares.slice(si, si + n);
      if (n === 3 && group.some((g) => g.original.media.length && g.original.text.length > 220)) { n = 2; layout = 'pair'; }
    }
    const items = shares.slice(si, si + n);
    si += n;
    lastClip = layout;
    lastLayout = 'clippings';
    push(first.key, (r2, b) => ({
      ...b,
      kind: 'clippings',
      layout,
      items,
      paper: layout === 'wall' ? r2.pick(['toner', 'blush'] as const) : r2.chance(0.18) ? 'toner' : b.paper,
    }));
  };

  const takeOwn = () => {
    const item = own[oi];
    if (item.kind === 'note' || item.kind === 'link') {
      const group: (NoteItem | FragmentItem)[] = [];
      while (oi < own.length && (own[oi].kind === 'note' || own[oi].kind === 'link') && group.length < 3) {
        group.push(own[oi] as NoteItem | FragmentItem);
        oi++;
      }
      lastLayout = 'bulletin';
      push(item.key, (_r, b) => ({ ...b, kind: 'bulletin', items: group }));
      return;
    }
    oi++;
    if (item.kind === 'shot') {
      const nxt = own[oi];
      if (isLoneShot(item) && nxt && isLoneShot(nxt)) {
        oi++;
        lastLayout = 'diptych';
        push(item.key, (_r, b) => ({ ...b, kind: 'shot', layout: 'diptych', items: [item, nxt as FragmentItem] }));
        return;
      }
      push(item.key, (r, b) => {
        const n = item.media.length;
        const options: ShotLayout[] = n >= 4 ? ['contact', 'plate', 'bleed'] : ['bleed', 'plate', 'toner'];
        const layout = choose(r, options);
        return { ...b, kind: 'shot', layout, items: [item], paper: layout === 'toner' ? 'toner' : b.paper };
      });
      return;
    }
    if (item.kind === 'post' && isFrag(item)) {
      push(item.key, (r, b) => {
        const layout = choose(r, ['tower', 'banner', 'toner'] as PostLayout[]);
        return { ...b, kind: 'post', layout, item, paper: layout === 'toner' ? 'toner' : b.paper };
      });
      return;
    }
    if (item.kind === 'list' && isFrag(item)) {
      push(item.key, (r, b) => ({ ...b, kind: 'list', layout: choose(r, ['index', 'ledger'] as ListLayout[]), item }));
    }
  };

  while (oi < own.length || si < shares.length) {
    const ownNext = own[oi];
    const shareNext = shares[si];
    // Keep progress through both queues in step, so clippings thread evenly
    // through the issue rather than crowding wherever Nate reposted most.
    const clipTurn = shareNext && (!ownNext || (clipRun < 2 && si / shares.length <= oi / own.length));
    if (clipTurn) {
      takeClippings();
      clipRun++;
    } else {
      takeOwn();
      clipRun = 0;
    }
  }
  return spreads;
}

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

/** Body paragraphs of an essay, without headings, code, images or lists. */
export function paragraphs(md: string, title = ''): string[] {
  const blocks = md.replace(/```[\s\S]*?```/g, '').split(/\n\s*\n/);
  const out: string[] = [];
  for (const raw of blocks) {
    const b = raw.trim();
    if (!b || /^#{1,6}\s/.test(b) || /^!\[/.test(b) || /^[-*+]\s|^\d+\.\s|^>|^\|/.test(b)) continue;
    const t = inline(b.replace(/\n/g, ' '));
    if (t && t !== title && t.length > 2) out.push(t);
  }
  return out;
}

/** Trim paragraphs to roughly `chars` characters, ending on a sentence. */
export function excerpt(paras: string[], chars: number): { paras: string[]; more: boolean } {
  const out: string[] = [];
  let used = 0;
  for (const p of paras) {
    if (used + p.length <= chars) {
      out.push(p);
      used += p.length;
      continue;
    }
    const room = chars - used;
    if (room > 120) {
      const cut = p.slice(0, room);
      const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
      out.push(end > 60 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…');
    }
    return { paras: out, more: true };
  }
  return { paras: out, more: false };
}

/** A sentence worth pulling out large. */
export function pullQuote(paras: string[], seed: number): string | null {
  const sentences = paras
    .slice(1)
    .flatMap((p) => p.match(/[^.!?]+[.!?]/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 50 && s.length < 150 && !/https?:|\(|\)/.test(s));
  if (!sentences.length) return null;
  return sentences[seed % sentences.length];
}

export interface ListEntry {
  label: string;
  href?: string;
  note?: string;
  section?: string;
}

/** Entries of a list fragment: link bullets, or headed sections. */
export function listEntries(md: string): ListEntry[] {
  const out: ListEntry[] = [];
  let section: string | undefined;
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const h = line.match(/^#{2,3}\s+(.*)/);
    if (h) {
      section = inline(h[1]);
      continue;
    }
    const li = line.match(/^(?:[-*+]|\d+\.)\s+(.*)/);
    if (li) {
      const body = li[1];
      const link = body.match(/^\[([^\]]+)\]\(([^)]+)\)\s*(?:[-–—:]|u2013)?\s*(.*)$/);
      if (link) out.push({ label: inline(link[1]), href: link[2], note: inline(link[3]) || undefined, section });
      else out.push({ label: inline(body), section });
    }
  }
  if (out.length) return out;
  // Sectioned list (e.g. a CV): each heading is an entry, its first line the note.
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].trim().match(/^#{2,3}\s+(.*)/);
    if (!h) continue;
    const next = lines.slice(i + 1).find((l) => l.trim());
    out.push({ label: inline(h[1]), note: next && !/^#/.test(next.trim()) ? inline(next) : undefined });
  }
  return out;
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

/** Short title for a spread, used by the contents page and running heads. */
export function spreadTitle(s: Spread): string {
  switch (s.kind) {
    case 'cover':
      return 'Cover';
    case 'contents':
      return 'Contents';
    case 'post':
    case 'list':
      return s.item.title;
    case 'shot':
      return s.items.map((i) => i.title).join(' / ');
    case 'bulletin':
      return s.items.map((i) => (i.kind === 'note' ? 'Dispatch' : (i as FragmentItem).title)).join(' / ');
    case 'clippings':
      return s.items.map((i) => '@' + i.original.author.handle).join(', ');
  }
}

/** A resized JPEG from the Bluesky CDN for halftoning; the original blob stays the proof. */
export function plateSrc(src: string, size: 'feed_fullsize' | 'feed_thumbnail' = 'feed_fullsize'): string {
  const m = src.match(/getBlob\?did=([^&]+)&cid=([^&]+)/);
  return m ? `https://cdn.bsky.app/img/${size}/plain/${m[1]}/${m[2]}@jpeg` : src;
}

export const INK_HEX: Record<Ink | 'paper', string> = {
  pink: '#ff48b0',
  orange: '#ff6c2f',
  blue: '#0078bf',
  black: '#000000',
  paper: '#ecE9e1',
};

export interface Block {
  t: 'p' | 'h' | 'li' | 'code' | 'quote';
  text: string;
}

/** Essay body as typeset blocks: paragraphs, run-in heads, bullets, code. */
export function blocks(md: string, title = ''): Block[] {
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
  return { blocks: out, next: i };
}
