import { writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';

// Media is served from R2 by the worker at /m/. In `astro dev` there is no
// worker, so /m/ is proxied to a deployed one.
const MEDIA_ORIGIN = process.env.MEDIA_ORIGIN ?? 'https://fragments.iamnbutler.workers.dev';

/** Long-lived caching for Astro's content-hashed bundles. */
const headers = {
  name: 'cache-headers',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await writeFile(new URL('_headers', dir), '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n');
    },
  },
};

export default defineConfig({
  output: 'static',
  site: 'https://nate.rip',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [headers],
  vite: {
    server: { proxy: { '/m/': { target: MEDIA_ORIGIN, changeOrigin: true } } },
  },
});
