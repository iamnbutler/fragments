/**
 * Cover art: Nate's own 3D renders from 2017, printed on the cover as
 * stepped gradient-map proofs. Files are media (R2) named covers/<MMDDYY>,
 * the date each was rendered, as the originals are; -800 is the same still
 * 800px wide for phones, and loops add -loop.
 */
import { media } from './media';

interface CoverSpec {
  /** render date, MMDDYY */
  id: string;
  /** when it was rendered, as the caption gives it */
  date: string;
  /** a looping render; the still is its first frame */
  video?: boolean;
  /** where the crop centres, 0–1 */
  focus: [number, number];
  /** black and white points for the source's luminance */
  levels: [number, number];
  /** which map prints it */
  map: CoverMap;
}

export interface CoverWork extends Omit<CoverSpec, 'video'> {
  still: string;
  /** the still at 800px wide */
  small: string;
  loop?: string;
  /** width / height of the still */
  aspect: number;
}

/** Gradient maps, dark to light, through the spot inks to bone. */
export const COVER_MAPS = {
  spectrum: ['#242627', '#1F6AB8', '#FF2925', '#FBDF2F', '#FAF8F4'],
  night: ['#242627', '#1F6AB8', '#FAF8F4'],
  heat: ['#242627', '#FF2925', '#FBDF2F', '#FAF8F4'],
  sea: ['#242627', '#1F6AB8', '#FBDF2F', '#FAF8F4'],
} as const;
export type CoverMap = keyof typeof COVER_MAPS;

const SPECS: CoverSpec[] = [
  { id: '060317', date: 'June 2017', focus: [0.5, 0.48], levels: [0.08, 0.92], map: 'spectrum' },
  { id: '063017', date: 'June 2017', video: true, focus: [0.5, 0.42], levels: [0.05, 0.95], map: 'night' },
  { id: '062817', date: 'June 2017', focus: [0.5, 0.5], levels: [0.02, 0.85], map: 'heat' },
  { id: '071317', date: 'July 2017', focus: [0.5, 0.5], levels: [0.05, 0.8], map: 'sea' },
  { id: '092417', date: 'September 2017', video: true, focus: [0.5, 0.5], levels: [0.05, 0.95], map: 'spectrum' },
  { id: '061617', date: 'June 2017', focus: [0.5, 0.45], levels: [0.02, 0.9], map: 'heat' },
  { id: '092917', date: 'September 2017', focus: [0.5, 0.5], levels: [0.1, 0.95], map: 'sea' },
];

export const COVER_WORKS: CoverWork[] = SPECS.map(({ video, ...w }) => {
  const still = media(`covers/${w.id}`);
  return {
    ...w,
    still: still.url,
    small: media(`covers/${w.id}-800`).url,
    loop: video ? media(`covers/${w.id}-loop`).url : undefined,
    aspect: still.width! / still.height!,
  };
});

/**
 * The cover as printed: the central reactor of 062817 redrawn in the zine's
 * plates (a perspective drawing generated from a 3D model, then baked to the
 * spot inks), rasterized because the drawing is megabytes of paths.
 */
export const COVER_ART = (() => {
  const still = media('covers/reactor');
  return {
    after: '062817',
    date: 'June 2017',
    still: still.url,
    small: media('covers/reactor-1600').url,
    aspect: still.width! / still.height!,
    alt: 'The central reactor: a machined core towering over a field of lit blocks, struts radiating from it, glowing red at its foot',
  };
})();
