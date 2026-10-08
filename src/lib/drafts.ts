/**
 * Local drafts: long-form pieces that live in `src/content/drafts/<slug>.md`
 * (assets in `static/drafts/<slug>/`) and aren't published to the AT Protocol
 * repository yet. They print in the issue as PROOF features, each with its
 * own art-directed spreads, and get a reading page at `/d/<slug>`.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface DraftImage {
  src: string;
  alt: string;
  caption?: string;
  /** width / height, read from the file */
  aspect?: number;
  /** line art (an SVG figure) rather than a photograph or screenshot */
  figure: boolean;
}

export interface Draft {
  key: string;
  slug: string;
  title: string;
  date: string;
  dek: string;
  kicker: string;
  repo?: string;
  links: { label: string; url: string }[];
  facts: { label: string; value: string }[];
  pullquotes: string[];
  images: DraftImage[];
  art: string;
  /** markdown body */
  text: string;
  href: string;
}

const DIR = path.join(process.cwd(), 'src/content/drafts');
const STATIC = path.join(process.cwd(), 'static');

/** width / height of an SVG, PNG or JPEG, from its header. */
function aspectOf(file: string): number | undefined {
  try {
    const buf = fs.readFileSync(file);
    if (file.endsWith('.svg')) {
      const s = buf.toString('utf8', 0, 2000);
      const vb = s.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
      if (vb) return Number(vb[1]) / Number(vb[2]);
      const w = s.match(/width="([\d.]+)"/), h = s.match(/height="([\d.]+)"/);
      return w && h ? Number(w[1]) / Number(h[1]) : undefined;
    }
    if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return buf.readUInt32BE(16) / buf.readUInt32BE(20);
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return buf.readUInt16BE(i + 7) / buf.readUInt16BE(i + 5);
        }
        i += 2 + len;
      }
    }
  } catch {}
  return undefined;
}

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
      dek: str(data.dek),
      kicker: str(data.kicker) || 'Feature',
      repo: data.repo ? str(data.repo) : undefined,
      links: (data.links ?? []).map((l: any) => ({ label: str(l.label), url: str(l.url) })),
      facts: (data.facts ?? []).map((l: any) => ({ label: str(l.label), value: str(l.value) })),
      pullquotes: (data.pullquotes ?? []).map(str),
      images: (data.images ?? []).map((im: any) => {
        const src = str(im.src);
        return {
          src,
          alt: str(im.alt),
          caption: im.caption ? str(im.caption) : undefined,
          aspect: aspectOf(path.join(STATIC, src)),
          figure: src.endsWith('.svg'),
        };
      }),
      art: str(data.art),
      text: content.trim(),
      href: `/d/${slug}/`,
    });
  }
  out.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return (cache = out);
}

/** An image of a draft by file name (the part after the last slash). */
export function img(d: Draft, name: string): DraftImage | undefined {
  return d.images.find((i) => i.src.endsWith(`/${name}`));
}
