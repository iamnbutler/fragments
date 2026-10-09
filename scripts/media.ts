/**
 * Media lives in R2 (bucket `fragments-media`), never in the repo. This puts
 * a file there under a content-hashed key and records it in src/media.json,
 * which the build reads; the worker serves it at /m/<key>, cached for a year.
 *
 * Images are re-encoded to WebP and video to H.264 at a capped width first;
 * SVG, fonts and anything else go up as they are. Re-putting a name replaces
 * its manifest entry; the old object stays in the bucket.
 *
 *   npm run media -- put <file> <name> [--width 1600] [--quality 78] [--crf 28] [--dry-run]
 *   npm run media -- ls
 *
 * Needs ImageMagick (magick) and ffmpeg/ffprobe on PATH, and wrangler logged in.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BUCKET = 'fragments-media';
const MANIFEST = path.join(process.cwd(), 'src/media.json');

export interface MediaEntry {
  key: string;
  type: string;
  bytes: number;
  width?: number;
  height?: number;
}

const TYPES: Record<string, string> = {
  webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml',
  mp4: 'video/mp4', woff2: 'font/woff2',
};

function run(cmd: string, args: string[], quiet = true): string {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: quiet ? 'pipe' : 'inherit' });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr || r.error?.message || r.status}`);
  return r.stdout ?? '';
}

function readManifest(): Record<string, MediaEntry> {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}

function svgSize(file: string): [number, number] | undefined {
  const s = fs.readFileSync(file, 'utf8').slice(0, 2000);
  const vb = s.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (vb) return [Number(vb[1]), Number(vb[2])];
  const w = s.match(/width="([\d.]+)"/), h = s.match(/height="([\d.]+)"/);
  return w && h ? [Number(w[1]), Number(h[1])] : undefined;
}

/** Re-encode for the web; returns the file to upload and its size in pixels. */
function prepare(src: string, opts: { width: number; quality: number; crf: number }) {
  const ext = path.extname(src).slice(1).toLowerCase();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'media-'));
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    const out = path.join(tmp, 'out.webp');
    run('magick', [src, '-resize', `${opts.width}x>`, '-strip', '-quality', String(opts.quality), out]);
    const [w, h] = run('magick', ['identify', '-format', '%w %h', out]).split(' ').map(Number);
    return { file: out, ext: 'webp', width: w, height: h };
  }
  if (['mp4', 'mov', 'webm'].includes(ext)) {
    const out = path.join(tmp, 'out.mp4');
    run('ffmpeg', ['-y', '-i', src, '-an', '-vf', `scale='min(${opts.width},iw)':-2`, '-c:v', 'libx264', '-crf', String(opts.crf),
      '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
    const [w, h] = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', out])
      .trim().split(',').map(Number);
    return { file: out, ext: 'mp4', width: w, height: h };
  }
  const size = ext === 'svg' ? svgSize(src) : undefined;
  return { file: src, ext, width: size?.[0], height: size?.[1] };
}

function put(src: string, name: string, flags: Map<string, string>) {
  if (!fs.existsSync(src)) throw new Error(`No such file: ${src}`);
  if (!/^[a-z0-9][a-z0-9/_-]*$/.test(name)) throw new Error(`Names are lowercase paths without an extension, like covers/062817 (got "${name}")`);
  const opts = {
    width: Number(flags.get('width') ?? 1600),
    quality: Number(flags.get('quality') ?? 78),
    crf: Number(flags.get('crf') ?? 28),
  };
  const p = prepare(src, opts);
  const body = fs.readFileSync(p.file);
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 10);
  const key = `${name}.${hash}.${p.ext}`;
  const type = TYPES[p.ext] ?? 'application/octet-stream';
  const entry: MediaEntry = { key, type, bytes: body.length };
  if (p.width && p.height) Object.assign(entry, { width: p.width, height: p.height });

  if (flags.has('dry-run')) {
    console.log(`would put ${key} (${type}, ${(body.length / 1024).toFixed(0)} KB)`);
    return;
  }
  run('npx', ['wrangler', 'r2', 'object', 'put', `${BUCKET}/${key}`, '--file', p.file, '--content-type', type,
    '--cache-control', 'public, max-age=31536000, immutable', '--remote'], false);
  const manifest = readManifest();
  manifest[name] = entry;
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`${name} -> /m/${key} (${(body.length / 1024).toFixed(0)} KB)`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flags = new Map<string, string>();
const args: string[] = [];
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (!a.startsWith('--')) { args.push(a); continue; }
  const k = a.slice(2);
  if (k === 'dry-run') flags.set(k, '');
  else flags.set(k, rest[++i]);
}

if (cmd === 'put' && args.length === 2) {
  put(args[0], args[1], flags);
} else if (cmd === 'ls') {
  for (const [name, e] of Object.entries(readManifest())) {
    console.log(`${name.padEnd(40)} ${String(Math.round(e.bytes / 1024)).padStart(6)} KB  ${e.type.padEnd(14)} ${e.width ? `${e.width}x${e.height}` : ''}`);
  }
} else {
  console.error('usage: npm run media -- put <file> <name> [--width N] [--quality N] [--crf N] [--dry-run]\n       npm run media -- ls');
  process.exit(1);
}
