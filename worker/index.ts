/**
 * The site's worker. Static pages come from the build (Workers static
 * assets); /m/<key> is media from R2. Media keys are content-hashed, so
 * every response is cacheable for a year. Range requests are honoured so
 * video can seek and Safari will play it.
 */
interface Env {
  ASSETS: Fetcher;
  MEDIA: R2Bucket;
}

const PREFIX = '/m/';
const YEAR = 'public, max-age=31536000, immutable';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIX)) return env.ASSETS.fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    }

    const key = decodeURIComponent(url.pathname.slice(PREFIX.length));
    const ranged = request.headers.has('range');
    const cache = caches.default;
    if (!ranged) {
      const hit = await cache.match(request);
      if (hit) return hit;
    }

    const object = await env.MEDIA.get(key, { range: request.headers, onlyIf: request.headers });
    if (!object) return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('accept-ranges', 'bytes');
    headers.set('cache-control', YEAR);
    headers.set('access-control-allow-origin', '*');

    // A failed precondition (If-None-Match matched) comes back without a body.
    if (!('body' in object)) return new Response(null, { status: 304, headers });

    let status = 200;
    const range = object.range as { offset?: number; length?: number; suffix?: number } | undefined;
    if (ranged && range) {
      const size = object.size;
      const start = range.suffix !== undefined ? size - range.suffix : (range.offset ?? 0);
      const end = range.suffix !== undefined ? size - 1 : start + (range.length ?? size - start) - 1;
      headers.set('content-range', `bytes ${start}-${end}/${size}`);
      headers.set('content-length', String(end - start + 1));
      status = 206;
    } else {
      headers.set('content-length', String(object.size));
    }

    const response = new Response(request.method === 'HEAD' ? null : object.body, { status, headers });
    if (status === 200 && request.method === 'GET') ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
};
