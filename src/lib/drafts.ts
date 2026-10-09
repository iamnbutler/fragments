/**
 * Drafts: long-form pieces that live in `content/drafts/<slug>.md`, with
 * their images in media as `drafts/<slug>/<name>`. They print in the issue
 * as features, each with its own art-directed spreads, and get a reading
 * page at `/d/<slug>`.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { media } from './media';

export interface DraftImage {
  /** media name, e.g. drafts/desktop-tools/fig-1-boundary */
  name: string;
  src: string;
  alt: string;
  caption?: string;
  /** width / height */
  aspect?: number;
  /** line art (an SVG figure) rather than a photograph or screenshot */
  figure: boolean;
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

export interface Draft {
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
  images: DraftImage[];
  /** markdown body */
  text: string;
  href: string;
}

const DIR = path.join(process.cwd(), 'content/drafts');

const str = (v: unknown) => (v == null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

let cache: Draft[] | null = null;

/** Every draft on disk, newest first. Missing folder means no drafts. */
export function loadDrafts(): Draft[] {
  if (cache) return cache;
  let files: string[] = [];
  try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return (cache = []);
  }
  const out: Draft[] = [];
  for (const f of files) {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, f), 'utf8'));
    if (data.draft === false) continue;
    const slug = str(data.slug) || f.replace(/\.md$/, '');
    out.push({
      key: `draft-${slug}`,
      slug,
      title: str(data.title) || slug,
      date: str(data.date) || new Date().toISOString().slice(0, 10),
      dek: textParts(str(data.dek)).map((t) => t.text).join(''),
      dekParts: textParts(str(data.dek)),
      kicker: str(data.kicker) || undefined,
      repo: data.repo ? str(data.repo) : undefined,
      links: (data.links ?? []).map((l: any) => ({ label: str(l.label), url: str(l.url) })),
      facts: (data.facts ?? []).map((l: any) => ({ label: str(l.label), value: str(l.value) })),
      images: (data.images ?? []).map((im: any) => {
        const name = str(im.src);
        const m = media(name);
        return {
          name,
          src: m.url,
          alt: str(im.alt),
          caption: im.caption ? str(im.caption) : undefined,
          aspect: m.width && m.height ? m.width / m.height : undefined,
          figure: m.type === 'image/svg+xml',
        };
      }),
      text: content.trim(),
      href: `/d/${slug}/`,
    });
  }
  out.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return (cache = out);
}

/** An image of a draft by its short name (the part after the last slash). */
export function img(d: Draft, name: string): DraftImage | undefined {
  return d.images.find((i) => i.name.endsWith(`/${name}`));
}
