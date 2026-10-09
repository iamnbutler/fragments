/**
 * Cover art: Nate's own 3D renders from 2017, printed on the cover as
 * stepped gradient-map proofs. Files live in public/covers, named by the
 * date they were rendered (MMDDYY), as the originals are.
 */

export interface CoverWork {
  /** file stem in /covers */
  id: string;
  /** when it was rendered, as the pencil line gives it */
  date: string;
  /** a looping render; `id`.jpg is its first frame */
  video?: boolean;
  /** source aspect, width / height */
  aspect: number;
  /** where the crop centres, 0–1 */
  focus: [number, number];
  /** black and white points for the source's luminance */
  levels: [number, number];
  /** which map prints it */
  map: CoverMap;
}

/** Gradient maps, dark to light: each is a run of the spectrum. */
export const COVER_MAPS = {
  spectrum: ['#000000', '#003C1E', '#005555', '#4F77D6', '#FFA0C8', '#FF5846', '#FCC135', '#F1E9DD'],
  night: ['#000000', '#00140A', '#005FAF', '#9587D0', '#FFA0C8', '#F3DEB1'],
  heat: ['#000000', '#003C1E', '#FF3B00', '#FF8600', '#FCC135', '#F1E9DD'],
  sea: ['#000000', '#005131', '#005B8B', '#3E72D7', '#FF9BBF', '#F1E9DD'],
} as const;
export type CoverMap = keyof typeof COVER_MAPS;

export const COVER_WORKS: CoverWork[] = [
  { id: '060317', date: 'June 2017', aspect: 1, focus: [0.5, 0.48], levels: [0.08, 0.92], map: 'spectrum' },
  { id: '063017', date: 'June 2017', video: true, aspect: 1, focus: [0.5, 0.42], levels: [0.05, 0.95], map: 'night' },
  { id: '062817', date: 'June 2017', aspect: 1, focus: [0.5, 0.5], levels: [0.02, 0.85], map: 'heat' },
  { id: '071317', date: 'July 2017', aspect: 1, focus: [0.5, 0.5], levels: [0.05, 0.8], map: 'sea' },
  { id: '092417', date: 'September 2017', video: true, aspect: 16 / 9, focus: [0.5, 0.5], levels: [0.05, 0.95], map: 'spectrum' },
  { id: '061617', date: 'June 2017', aspect: 1, focus: [0.5, 0.45], levels: [0.02, 0.9], map: 'heat' },
  { id: '092917', date: 'September 2017', aspect: 1920 / 803, focus: [0.5, 0.5], levels: [0.1, 0.95], map: 'sea' },
];
