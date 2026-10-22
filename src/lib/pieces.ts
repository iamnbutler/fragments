/**
 * Pieces: everything the issue prints, one kind of post. Each lives in
 * `content/<slug>.md`, prints on its own art-directed spreads, and gets a
 * reading page at `/<slug>/`.
 *
 * Images live in R2 like everything else. Figures and pictures the design
 * places are listed in frontmatter by media name; pictures in the running
 * text are written `![alt](media:<name>)`. An unknown name or a hotlinked
 * image fails the build, so nothing can point at an asset we don't host.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { media, hasMedia } from './media';

export interface PieceImage {
  /** media name, e.g. figs/desktop-tools/fig-1-boundary */
  name: string;
  src: string;
  alt: string;
  caption?: string;
  /** width / height */
  aspect?: number;
  /** a drawing (an SVG) rather than a photograph or screenshot */
  figure: boolean;
  /** a looping version of the figure, in media as `<name>-motion` */
  motion?: string;
}

/** A run of text; `url` makes it a link. */
export interface TextPart { text: string; url?: string; }

/** Split `[text](url)` links out of a one-line string. */
export function textParts(src: string): TextPart[] {
  const out: TextPart[] = [];
  let at = 0;
  for (const m of src.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    if (m.index! > at) out.push({ text: src.slice(at, m.index) });
    out.push({ text: m[1], url: m[2] });
    at = m.index! + m[0].length;
  }
  if (at < src.length) out.push({ text: src.slice(at) });
  return out;
}

export interface Piece {
  key: string;
  slug: string;
  title: string;
  date: string;
  /** plain text, for meta descriptions */
  dek: string;
  /** the dek with its [inline](links), as printed */
  dekParts: TextPart[];
  /** a department line over the title, if any */
  kicker?: string;
  repo?: string;
  links: { label: string; url: string }[];
  facts: { label: string; value: string }[];
  images: PieceImage[];
  /** markdown body, with media: names resolved to /m/ URLs */
  text: string;
  href: string;
}

const DIR = path.join(process.cwd(), 'content');

const str = (v: unknown) => (v == null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

/** Resolve `media:` image names; refuse images hosted anywhere else. */
export function resolveMedia(md: string, where: string): string {
  return md
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => {
      if (i % 2) return part;
      if (/!\[[^\]]*\]\((?!media:)[^)]*\)|<(?:img|video|source|audio|iframe)\b/i.test(part)) {
        throw new Error(`${where}: images must be media: names in R2, not URLs or HTML`);
      }
      return part.replace(/(!\[[^\]]*\]\()media:([^)\s]+)\)/g, (_m, head: string, name: string) => `${head}${media(name).url})`);
    })
    .join('');
}

function image(im: any): PieceImage {
  const name = str(im.src);
  const m = media(name);
  return {
    name,
    src: m.url,
    alt: str(im.alt),
    caption: im.caption ? str(im.caption) : undefined,
    aspect: m.width && m.height ? m.width / m.height : undefined,
    figure: m.type === 'image/svg+xml',
    motion: hasMedia(`${name}-motion`) ? media(`${name}-motion`).url : undefined,
  };
}

let cache: Piece[] | null = null;

/** Every piece on disk, newest first. */
export function loadPieces(): Piece[] {
  if (cache) return cache;
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
  const out = files.map((f): Piece => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, f), 'utf8'));
    const slug = str(data.slug) || f.replace(/\.md$/, '');
    return {
      key: `piece-${slug}`,
      slug,
      title: str(data.title) || slug,
      date: str(data.date),
      dek: textParts(str(data.dek)).map((t) => t.text).join(''),
      dekParts: textParts(str(data.dek)),
      kicker: str(data.kicker) || undefined,
      repo: data.repo ? str(data.repo) : undefined,
      links: (data.links ?? []).map((l: any) => ({ label: str(l.label), url: str(l.url) })),
      facts: (data.facts ?? []).map((l: any) => ({ label: str(l.label), value: str(l.value) })),
      images: (data.images ?? []).map(image),
      text: resolveMedia(content.trim(), `content/${f}`),
      href: `/${slug}/`,
    };
  });
  out.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return (cache = out);
}

/** An image of a piece by its short name (the part after the last slash). */
export function img(p: Piece, name: string): PieceImage | undefined {
  return p.images.find((i) => i.name.endsWith(`/${name}`));
}
