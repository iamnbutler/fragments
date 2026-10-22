/**
 * Project sites. Before this site took over nate.rip, it was the custom domain
 * of the iamnbutler.github.io Pages site, and every project's Pages site lived
 * under it (nate.rip/telephone/ and so on). Those projects still publish to
 * GitHub Pages, and their READMEs and package pages link to nate.rip, so their
 * paths are passed through to iamnbutler.github.io. That only works while the
 * user site has no custom domain set; with one, GitHub redirects back here.
 */
const ORIGIN = 'https://iamnbutler.github.io';

// Repos with Pages on and no custom domain of their own. Not tasks: the
// zine's piece about it lives at /tasks/, and static pages win.
const PROJECTS = new Set([
  'crdt',
  'crdt-lab',
  'digital_locker',
  'gpuikit',
  'gpuikit-demo',
  'homebase',
  'jeih',
  'juice',
  'lb2',
  'litrpg-chart',
  'multibuffer',
  'music-stats',
  'resume-2013',
  'shelfgoblin',
  'telephone',
  'ysdn2016-styleguide',
]);

/** The project a path belongs to, if it's one of the Pages sites. */
export function project(pathname: string): string | undefined {
  const first = pathname.split('/')[1];
  return first && PROJECTS.has(first) ? first : undefined;
}

export async function proxyPages(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  const url = new URL(request.url);
  const upstream = await fetch(ORIGIN + url.pathname + url.search, { method: request.method, redirect: 'manual' });
  const headers = new Headers(upstream.headers);
  const location = headers.get('location');
  if (location) {
    const to = new URL(location, ORIGIN);
    // GitHub sending us back to nate.rip means the user site has a custom
    // domain again; following it would loop.
    if (to.origin !== ORIGIN) return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
    headers.set('location', url.origin + to.pathname + to.search + to.hash);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
