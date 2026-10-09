/**
 * Media files: everything that isn't code lives in R2 and is served by the
 * worker at /m/<key>. Keys are content-hashed, so a URL never changes what it
 * points at. Add or replace files with `npm run media -- put <file> <name>`.
 */
import manifest from '../media.json';

export const MEDIA_PATH = '/m/';

export interface MediaFile {
  url: string;
  type: string;
  bytes: number;
  width?: number;
  height?: number;
}

const files = manifest as Record<string, Omit<MediaFile, 'url'> & { key: string }>;

/** A media file by name, e.g. `covers/062817`. Unknown names fail the build. */
export function media(name: string): MediaFile {
  const m = files[name];
  if (!m) throw new Error(`No media named "${name}". Add it with: npm run media -- put <file> ${name}`);
  const { key, ...rest } = m;
  return { url: MEDIA_PATH + key, ...rest };
}

export const hasMedia = (name: string) => name in files;
