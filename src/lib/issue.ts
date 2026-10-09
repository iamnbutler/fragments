/**
 * The issue now on the press. Set by hand when a new issue goes out; not
 * derived from the stream, which grows between issues.
 */
export const ISSUE = {
  number: 1,
  season: 'Fall 2026',
  /** the render on the cover, as its place in COVER_WORKS (1-based) */
  cover: 3,
} as const;
