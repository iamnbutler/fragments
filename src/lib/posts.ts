/**
 * Essays: finished pieces in `content/posts/<slug>.md`. They print in the
 * issue after the features, each on a stock opener (tower, banner or toner)
 * plus jump spreads, and get a reading page at `/e/<slug>`.
 *
 * Images live in R2 like everything else: the markdown names them as
 * `![alt](media:posts/<slug>/<n>)`, and an unknown name or a hotlinked
 * image fails the build, so nothing can point at an asset we don't host.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { media } from './media';

export interface Post {
  key: string;
  slug: string;
  title: string;
  date: string;
  /** markdown body, with media: names resolved to /m/ URLs */
  text: string;
  href: string;
}

const DIR = path.join(process.cwd(), 'content/posts');

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

let cache: Post[] | null = null;

/** Every essay on disk, newest first. */
export function loadPosts(): Post[] {
  if (cache) return cache;
  let files: string[] = [];
  try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return (cache = []);
  }
  const out = files.map((f): Post => {
    const { data, content } = matter(fs.readFileSync(path.join(DIR, f), 'utf8'));
    const slug = str(data.slug) || f.replace(/\.md$/, '');
    return {
      key: `post-${slug}`,
      slug,
      title: str(data.title) || slug,
      date: str(data.date),
      text: resolveMedia(content.trim(), `content/posts/${f}`),
      href: `/e/${slug}/`,
    };
  });
  out.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return (cache = out);
}
