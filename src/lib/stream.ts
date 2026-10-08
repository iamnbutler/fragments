import type { Fragment, BskyPost } from './types';
import { fetchAllFragments, fetchBskyPosts, fetchBskyFeed, parseBskyUrl, blobUrl, DID } from './atproto';

/**
 * One normalized timeline for every kind of thing the site shows.
 * Visual directions render from this instead of re-deriving shapes per tile.
 */

export interface Media {
  src: string;
  thumb?: string;
  alt: string;
  aspect?: number; // width / height, when known
  video?: string; // HLS playlist, when the media is a video
}

export interface Author {
  handle: string;
  displayName: string;
  avatar?: string;
  href: string;
}

interface Base {
  key: string;
  date: string;
  href: string;
  external: boolean;
}

/** Nate's own site fragments. */
export interface FragmentItem extends Base {
  kind: 'post' | 'shot' | 'list' | 'link';
  id: number;
  title: string;
  text: string; // markdown
  media: Media[];
  url?: string;
  fragment: Fragment;
}

/** Nate's own pinned bluesky posts. */
export interface NoteItem extends Base {
  kind: 'note';
  text: string;
  media: Media[];
  link?: { uri: string; title: string; description: string; thumb?: string };
  post: BskyPost;
}

/**
 * Someone else's post that Nate passed along. `original` always carries the
 * original author; `comment` is Nate's own words when he quoted it.
 */
export interface ReshareItem extends Base {
  kind: 'reshare';
  via: 'repost' | 'quote';
  comment?: string;
  original: {
    author: Author;
    text: string;
    media: Media[];
    link?: { uri: string; title: string; description: string; thumb?: string };
    date: string;
    href: string;
  };
  post: BskyPost;
}

export type StreamItem = FragmentItem | NoteItem | ReshareItem;

export const PINNED_BSKY_URLS = [
  'https://bsky.app/profile/nate.rip/post/3mcs53dio3c2s',
  'https://bsky.app/profile/nate.rip/post/3malzuto3x22s',
  'https://bsky.app/profile/nate.rip/post/3lxqjbta66k2k',
  'https://bsky.app/profile/nate.rip/post/3ltkowbdsuk2g',
  'https://bsky.app/profile/nate.rip/post/3ljqadka7qk2r',
  'https://bsky.app/profile/nate.rip/post/3ljixbqlta22z',
  'https://bsky.app/profile/nate.rip/post/3li2ujkthr22x',
  'https://bsky.app/profile/nate.rip/post/3lggjq25c6k2w',
  'https://bsky.app/profile/nate.rip/post/3lbulbyvexk2v',
  'https://bsky.app/profile/nate.rip/post/3ju4vkv7esa2p',
];

function postHref(p: BskyPost): string {
  return `https://bsky.app/profile/${p.author.handle}/post/${p.rkey}`;
}

function bskyMedia(p: BskyPost): Media[] {
  if (p.video) {
    const ar = p.video.aspectRatio;
    return [{ src: p.video.thumbnail, alt: '', video: p.video.playlist, aspect: ar ? ar.width / ar.height : undefined }];
  }
  return (p.images ?? []).map((img) => ({
    src: img.fullsize,
    thumb: img.thumb,
    alt: img.alt,
    aspect: img.aspectRatio ? img.aspectRatio.width / img.aspectRatio.height : undefined,
  }));
}

function author(p: BskyPost): Author {
  return { ...p.author, href: `https://bsky.app/profile/${p.author.handle}` };
}

export function fragmentItem(f: Fragment): FragmentItem {
  return {
    kind: f.type,
    key: `f-${f.id}`,
    id: f.id,
    date: f.createdAt,
    href: `/f/${f.id}`,
    external: false,
    title: f.title,
    text: f.content ?? '',
    url: f.url,
    media: (f.images ?? []).map((img) => ({
      src: blobUrl(DID, img.cid),
      alt: img.alt ?? '',
      video: img.mimeType.startsWith('video/') ? blobUrl(DID, img.cid) : undefined,
    })),
    fragment: f,
  };
}

function noteItem(p: BskyPost): NoteItem {
  return {
    kind: 'note',
    key: `n-${p.rkey}`,
    date: p.createdAt,
    href: postHref(p),
    external: true,
    text: p.text,
    media: bskyMedia(p),
    link: p.externalEmbed,
    post: p,
  };
}

function reshareItem(p: BskyPost): ReshareItem | null {
  const original = p.isRepost ? p : p.quoted;
  if (!original || original.author.handle === 'nate.rip') return null;
  return {
    kind: 'reshare',
    via: p.isRepost ? 'repost' : 'quote',
    key: `r-${p.rkey}`,
    date: p.repostedAt ?? p.createdAt,
    href: postHref(p.isRepost ? original : p),
    external: true,
    comment: p.isRepost ? undefined : p.text,
    original: {
      author: author(original),
      text: original.text,
      media: bskyMedia(original),
      link: original.externalEmbed,
      date: original.createdAt,
      href: postHref(original),
    },
    post: p,
  };
}

/**
 * Everything, newest first. The bsky author feed is only mined for reshares
 * (reposts and quote posts of other people); Nate's own feed chatter is dropped.
 */
export async function loadStream(): Promise<StreamItem[]> {
  const pinned = PINNED_BSKY_URLS.map(parseBskyUrl).filter((r): r is string => !!r);
  const [fragments, pinnedPosts, feed] = await Promise.all([
    fetchAllFragments(),
    fetchBskyPosts(pinned),
    fetchBskyFeed(100, new Set(pinned)),
  ]);
  const items: StreamItem[] = [
    ...fragments.map(fragmentItem),
    ...pinnedPosts.map((p) => (p.quoted ? reshareItem(p) ?? noteItem(p) : noteItem(p))),
    ...feed.map(reshareItem).filter((r): r is ReshareItem => !!r),
  ];
  return items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
