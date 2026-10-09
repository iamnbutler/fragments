/**
 * The colourway: PRESS RUN printed in the Printmaking Challenge spectrum.
 * One ramp runs cream → yellow → orange → red → pink → lilac → blue → teal →
 * deep green → black; the four spot inks and the papers are cut from it.
 * The zine's inks (`INK_HEX`), the halftone filters and the styleguide all
 * read their values from here.
 */

/** The full ramp, 39 steps, light to dark (swatch sheet, bottom row). */
export const RAMP = [
  '#F1E9DD', '#F3E0BA', '#F5DA9F', '#F6D485', '#F9CB61', '#FAC547', '#FDBC23', '#FEB609', '#FFAB00',
  '#FF8600', '#FF6000', '#FF3B00', '#FF3C11', '#FF4F34', '#FF6257', '#FF757A', '#FF889D', '#FF9BBF',
  '#ED9CC9', '#C192CD', '#9587D0', '#6A7DD4', '#3E72D7', '#1268DB', '#0063D3', '#0060B8', '#005EA6',
  '#005B8B', '#005979', '#00565E', '#005343', '#005131', '#005028', '#004623', '#003C1E', '#003219',
  '#002814', '#00140A', '#000000',
] as const;

/** The swatch sheet's middle row: every other step. */
export const MID = [
  '#F2E5CB', '#F6D68E', '#F9C958', '#FDBA1B', '#FF9800', '#FF4E00', '#FF4523', '#FF6B68', '#FF92AE',
  '#D396CB', '#7B81D2', '#236CD9', '#0062CA', '#005D9D', '#005767', '#00523A', '#004623', '#001E0F',
] as const;

/** The main row: the nine named swatches of the sheet. */
export const MAIN = ['#F3DEB1', '#FCC135', '#FF5846', '#FFA0C8', '#4F77D6', '#005FAF', '#005555', '#003C1E', '#000000'] as const;

/**
 * The four spot inks, all from the main row: yellow is the light plate,
 * blue sits between, teal and black key. Teal is also the accent for
 * stamps and marks. They replace pink and red from the earlier printing.
 */
export const SPOT = {
  yellow: '#FCC135',
  blue: '#4F77D6',
  teal: '#005555',
  black: '#000000',
} as const;

export const PAPERS = {
  newsprint: '#ECE9E3',
  bone: '#F1E9DD',
  cream: '#F2E5CB',
  toner: '#1A1A1A',
} as const;

/** Relative luminance of a hex colour (WCAG). */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
