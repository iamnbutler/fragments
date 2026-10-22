/**
 * `bongo dev` has no worker in front of it to serve /m/, so under dev, media
 * URLs point at a deployed one (MEDIA_ORIGIN). Imported first by the config:
 * some media URLs are resolved as modules load.
 */
if (process.argv.includes('dev')) {
  process.env.FRAGMENTS_MEDIA_ORIGIN = process.env.MEDIA_ORIGIN ?? 'https://fragments.iamnbutler.workers.dev';
}
