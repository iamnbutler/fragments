/**
 * The colourway: PRESS RUN printed in the inks of The Color Printer
 * (J. F. Earhart, 1892), a printer's manual of colour combinations: lemon,
 * printer's blue, vermilion and a near-black, on white stock. The zine's
 * inks (`INK_HEX`), the halftone filters, the covers and the styleguide all
 * read their values from here.
 */

/**
 * The four spot inks: yellow is the light plate, blue sits between, red and
 * black key. Red is also the accent for stamps and marks.
 */
export const SPOT = {
  yellow: '#FBDF2F',
  blue: '#1F6AB8',
  red: '#FF2925',
  black: '#242627',
} as const;

export const PAPERS = {
  newsprint: '#F0EDE6',
  bone: '#FAF8F4',
} as const;

/** Screens each ink is printed at, solid to lightest. */
export const TINTS = [1, 0.7, 0.4, 0.2] as const;

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
