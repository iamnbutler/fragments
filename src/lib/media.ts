/**
 * Media files: everything that isn't code lives in R2 and is served by the
 * worker at /m/<key>. Keys are content-hashed, so a URL never changes what it
 * points at. Add or replace files with `npm run media -- put <file> <name>`.
 */
import manifest from '../media.json';

export const MEDIA_PATH = '/m/';

/**
 * Where media URLs point: the site itself, or under `bongo dev` (which has no
 * worker in front) a deployed one, from MEDIA_ORIGIN. Set by bongo.config.ts.
 */
const origin = () => process.env.FRAGMENTS_MEDIA_ORIGIN ?? '';

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
  return { url: origin() + MEDIA_PATH + key, ...rest };
}

export const hasMedia = (name: string) => name in files;
