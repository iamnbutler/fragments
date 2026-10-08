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
  section?: SectionKey;
}

export type PostLayout = 'tower' | 'banner' | 'toner';
export type ShotLayout = 'bleed' | 'plate' | 'contact' | 'toner' | 'diptych';
export type ListLayout = 'index' | 'ledger';
export type ClipLayout = 'solo' | 'pair' | 'trio' | 'blowup' | 'wall';

export type SectionKey = 'features' | 'plates' | 'dispatches' | 'library';

/**
 * The issue's departments, in reading order. Long writing leads and gets room;
 * pictures follow; short things cluster together; reference lists close.
 */
export const SECTIONS: Record<SectionKey, { no: string; title: string; dek: string; kinds: string }> = {
  features: {
    no: 'I',
    title: 'Features',
    dek: 'Long writing about design, tools and building software. The longer pieces jump to the following pages.',
    kinds: 'Essays',
  },
  plates: {
    no: 'II',
    title: 'Plates',
    dek: 'The work: interfaces, identities, experiments and renders, printed as large as the page allows.',
    kinds: 'Shots',
  },
  dispatches: {
    no: 'III',
    title: 'Dispatches',
    dek: 'Short notes, links worth your time, and posts by other people that Nate passed along.',
    kinds: 'Notes, links and clippings',
  },
  library: {
    no: 'IV',
    title: 'Library',
    dek: 'Lists and indexes Nate keeps adding to.',
    kinds: 'Lists',
  },
};

export interface Ref {
  n: number;
  url: string;
  label: string;
}

export interface SectionEntry {
  page: number;
  title: string;
  kind: string;
}

export type Spread =
  | (SpreadBase & { kind: 'cover' })
  | (SpreadBase & { kind: 'contents' })
  | (SpreadBase & { kind: 'section'; key: SectionKey; entries: SectionEntry[] })
  | (SpreadBase & { kind: 'post'; layout: PostLayout; item: FragmentItem; blocks: Block[]; jump?: number; archive: boolean })
  | (SpreadBase & { kind: 'jump'; item: FragmentItem; blocks: Block[]; refs: Ref[]; from: number; jump?: number; part: number; last: boolean })
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

// --- imposition --------------------------------------------------------------

const isLoneShot = (i: StreamItem) =>
  i.kind === 'shot' && i.media.length === 1 && !i.text.trim();

/** Essays this short read as notes; they cluster with the dispatches. */
export const SHORT_WORDS = 170;
const words = (md: string) => md.split(/\s+/).filter(Boolean).length;

/** How much set text each opener holds, and each jump spread after it. */
const OPENER_CHARS: Record<PostLayout, number> = { tower: 1900, banner: 2900, toner: 1050 };
const JUMP_CHARS = 4400;
const MAX_JUMPS = 3;
/** Less than this left over isn't worth a jump; pick a roomier opener. */
const MIN_JUMP = 1000;

const ARCHIVE_MS = 3 * 365 * 24 * 3600 * 1000;

export function impose(stream: StreamItem[]): Spread[] {
  const spreads: Spread[] = [];
  let lastPair = -1;
  const history: string[] = [];
  let section: SectionKey | undefined;
  const now = Date.now();

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
    const base: SpreadBase = { n: spreads.length, page: spreads.length * 2, seed, inks: INK_PAIRS[pi], paper, section };
    const s = make(r, base);
    spreads.push(s);
    return s;
  };

  /** Pick a layout that neither of the last two spreads used. */
  const choose = <T extends string>(r: ReturnType<typeof rng>, options: T[]): T => {
    const recent = history.slice(-2);
    let pool = options.filter((o) => !recent.includes(o));
    if (!pool.length) pool = options.filter((o) => o !== history[history.length - 1]);
    const out = r.pick(pool.length ? pool : options);
    history.push(out);
    return out;
  };
  const mark = (layout: string) => history.push(layout);

  push('cover', (_r, b) => ({ ...b, kind: 'cover', inks: ['pink', 'orange'], paper: 'newsprint' }));
  push('contents', (_r, b) => ({ ...b, kind: 'contents', inks: ['orange', 'black'], paper: 'bone' }));

  // --- sort the stream into departments, each newest first ---
  const features = stream.filter((x): x is FragmentItem => x.kind === 'post' && words(x.text) >= SHORT_WORDS);
  const plates = stream.filter((x): x is FragmentItem => x.kind === 'shot');
  const dispatches = stream.filter(
    (x): x is NoteItem | FragmentItem => x.kind === 'note' || x.kind === 'link' || (x.kind === 'post' && words(x.text) < SHORT_WORDS),
  );
  const library = stream.filter((x): x is FragmentItem => x.kind === 'list');
  const shares = stream.filter((x): x is ReshareItem => x.kind === 'reshare');

  // Clippings thread through the issue as breathers. Features get a few light
  // ones between long reads; plates a steady trickle; dispatches the rest,
  // where short things belong together.
  const quota = {
    features: Math.round(shares.length * 0.22),
    plates: Math.round(shares.length * 0.3),
  };
  let si = 0;
  let lastClip = '';
  const isTextOnly = (c: ReshareItem) => !c.original.media.length && !c.original.link;

  const takeClippings = (end: number, opts: { max: number; wall: boolean }) => {
    const first = shares[si];
    const r = rng(hash(first.key));
    let layout: ClipLayout;
    let n: number;
    let runText = 0;
    while (si + runText < end && runText < 4 && isTextOnly(shares[si + runText]) && shares[si + runText].original.text.length < 300) runText++;
    const short = isTextOnly(first) && first.original.text.length >= 8 && first.original.text.length <= 170 && !/https?:|\w\.\w+\/|…|\.\.\./.test(first.original.text);
    const roll = r.next();
    if (opts.wall && runText >= 3 && lastClip !== 'wall' && roll < 0.7) { layout = 'wall'; n = runText; }
    else if (short && lastClip !== 'blowup' && roll < 0.75) { layout = 'blowup'; n = 1; }
    else {
      const want = r.pick([1, 2, 2, 3, 3]);
      n = Math.max(1, Math.min(want, opts.max, end - si));
      layout = n === 1 ? 'solo' : n === 2 ? 'pair' : 'trio';
      if (layout === lastClip && n > 1) { n = n === 2 ? 3 : 2; n = Math.min(n, opts.max, end - si); layout = n === 1 ? 'solo' : n === 2 ? 'pair' : 'trio'; }
      const group = shares.slice(si, si + n);
      if (n === 3 && group.some((g) => g.original.media.length && g.original.text.length > 220)) { n = 2; layout = 'pair'; }
    }
    const items = shares.slice(si, si + n);
    si += n;
    lastClip = layout;
    mark('clippings');
    push(first.key, (r2, b) => ({
      ...b,
      kind: 'clippings',
      layout,
      items,
      paper: layout === 'wall' ? r2.pick(['toner', 'blush'] as const) : r2.chance(0.18) ? 'toner' : b.paper,
    }));
  };

  const feature = (item: FragmentItem) => {
    const bs = blocks(item.text, item.title, { refs: true });
    const archive = now - Date.parse(item.date) > ARCHIVE_MS;
    const total = bs.reduce((n, b) => n + (b.t === 'code' ? b.text.split('\n').length * 40 : b.text.length), 0);
    const opener = push(item.key, (r, b) => {
      const all = ['tower', 'banner', 'toner'] as PostLayout[];
      const fits = all.filter((l) => OPENER_CHARS[l] >= total || total - OPENER_CHARS[l] > MIN_JUMP);
      const layout = choose(r, fits.length ? fits : all);
      const cut = takeBlocks(bs, OPENER_CHARS[layout]);
      return { ...b, kind: 'post', layout, item, blocks: cut.blocks, archive, paper: layout === 'toner' ? 'toner' : b.paper };
    }) as Extract<Spread, { kind: 'post' }>;
    let next = opener.blocks.length;
    let prev: { jump?: number } = opener;
    let from = opener.page;
    for (let part = 1; part <= MAX_JUMPS && next < bs.length; part++) {
      const rest = bs.slice(next).reduce((n, b) => n + b.text.length, 0);
      if (rest < 120) break;
      const cut = takeBlocks(bs, JUMP_CHARS, next);
      next = cut.next;
      const refs = collectRefs(cut.blocks, item.text);
      const j = push(`${item.key}-jump-${part}`, (_r, b) => ({
        ...b,
        kind: 'jump',
        item,
        blocks: cut.blocks,
        refs,
        from,
        part,
        last: next >= bs.length,
        paper: b.paper === 'blush' ? 'newsprint' : b.paper,
      })) as Extract<Spread, { kind: 'jump' }>;
      mark('jump');
      prev.jump = j.page;
      prev = j;
      from = j.page;
    }
  };

  const shot = (queue: FragmentItem[], i: number): number => {
    const item = queue[i];
    const nxt = queue[i + 1];
    if (isLoneShot(item) && nxt && isLoneShot(nxt) && !history.slice(-2).includes('diptych')) {
      mark('diptych');
      push(item.key, (_r, b) => ({ ...b, kind: 'shot', layout: 'diptych', items: [item, nxt] }));
      return 2;
    }
    push(item.key, (r, b) => {
      const n = item.media.length;
      const options: ShotLayout[] = n >= 4 ? ['contact', 'plate', 'bleed', 'toner'] : ['bleed', 'plate', 'toner'];
      const layout = choose(r, options);
      return { ...b, kind: 'shot', layout, items: [item], paper: layout === 'toner' ? 'toner' : b.paper };
    });
    return 1;
  };

  const bulletin = (queue: (NoteItem | FragmentItem)[], i: number): number => {
    const group: (NoteItem | FragmentItem)[] = [];
    let weight = 0;
    while (i + group.length < queue.length && group.length < 3) {
      const it = queue[i + group.length];
      const w = it.kind === 'post' ? 2 : 1;
      if (group.length && weight + w > 3) break;
      group.push(it);
      weight += w;
    }
    mark('bulletin');
    push(group[0].key, (_r, b) => ({ ...b, kind: 'bulletin', items: group }));
    return group.length;
  };

  /**
   * Lay out one department: an opener, then its own spreads with clippings
   * threaded through at an even rate up to `shareEnd`.
   */
  const department = (
    key: SectionKey,
    count: number,
    take: (i: number) => number,
    shareEnd: number,
    clip: { max: number; wall: boolean; run: number },
  ) => {
    if (!count) return;
    section = key;
    const opener = push(`section-${key}`, (_r, b) => ({
      ...b,
      kind: 'section',
      key,
      entries: [],
      paper: key === 'plates' ? 'toner' : b.paper,
    })) as Extract<Spread, { kind: 'section' }>;
    mark('section');
    const start = spreads.length;
    const shareStart = si;
    const shareCount = Math.max(0, shareEnd - shareStart);
    let i = 0;
    let run = 0;
    while (i < count || si < shareEnd) {
      const clipTurn =
        si < shareEnd &&
        (i >= count || (run < clip.run && i > 0 && (si - shareStart) / Math.max(1, shareCount) <= i / count));
      if (clipTurn) {
        takeClippings(shareEnd, clip);
        run++;
      } else {
        i += take(i);
        run = 0;
      }
    }
    opener.entries = spreads.slice(start).flatMap((s) => entryFor(s));
  };

  department('features', features.length, (i) => (feature(features[i]), 1), si + quota.features, { max: 2, wall: false, run: 1 });
  department('plates', plates.length, (i) => shot(plates, i), si + quota.plates, { max: 3, wall: false, run: 1 });
  department('dispatches', dispatches.length, (i) => bulletin(dispatches, i), shares.length, { max: 3, wall: true, run: 2 });
  department('library', library.length, (i) => {
    const item = library[i];
    push(item.key, (r, b) => ({ ...b, kind: 'list', layout: choose(r, ['index', 'ledger'] as ListLayout[]), item }));
    return 1;
  }, si, { max: 0, wall: false, run: 0 });

  return spreads;
}

/** What a section opener lists for a spread: Nate's own work, not clippings. */
function entryFor(s: Spread): SectionEntry[] {
  switch (s.kind) {
    case 'post':
      return [{ page: s.page, title: s.item.title, kind: 'Essay' }];
    case 'shot':
      return s.items.map((i) => ({ page: s.page, title: i.title, kind: 'Plate' }));
    case 'list':
      return [{ page: s.page, title: s.item.title, kind: 'Index' }];
    case 'bulletin':
      return s.items.map((i) => ({
        page: s.page,
        title: i.kind === 'note' ? inline(i.text).slice(0, 48).replace(/\s+\S*$/, '') + '…' : (i as FragmentItem).title,
        kind: i.kind === 'note' ? 'Dispatch' : i.kind === 'link' ? 'Link' : 'Short',
      }));
    default:
      return [];
  }
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
    case 'section':
      return SECTIONS[s.key].title;
    case 'jump':
      return `${s.item.title} (continued)`;
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
  return { blocks: out, next: i };
}
