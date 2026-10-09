/**
 * Agentation, for leaving notes on spreads during development: click an
 * element, write a note, copy it as markdown for an agent. Dev only; the
 * production build drops this branch and never bundles React.
 */
if (import.meta.env.DEV) {
  import('./annotate-mount').then((m) => m.mount());
}
