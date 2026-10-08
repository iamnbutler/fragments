/**
 * The cover's dashed solid (after the OUT FORM poster): a slightly irregular
 * icosahedron drawn in dashed key-plate lines, turning slowly and leaning
 * toward the pointer.
 */
export function spinSolid(cover: HTMLElement) {
  const svg = cover.querySelector<SVGSVGElement>('svg.solid');
  if (!svg) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const p = (1 + Math.sqrt(5)) / 2;
  let seed = 7;
  const jitter = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.22;
  const raw: [number, number, number][] = [
    [-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0],
    [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p],
    [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1],
  ];
  const verts = raw.map(([x, y, z]) => {
    const s = 1 / Math.hypot(x, y, z);
    return [x * s + jitter(), y * s * 1.08 + jitter(), z * s + jitter()] as [number, number, number];
  });
  const edges: [number, number][] = [];
  for (let i = 0; i < 12; i++)
    for (let j = i + 1; j < 12; j++) {
      const d = Math.hypot(raw[i][0] - raw[j][0], raw[i][1] - raw[j][1], raw[i][2] - raw[j][2]);
      if (d < 2.1) edges.push([i, j]);
    }

  const front = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const back = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  back.setAttribute('opacity', '0.28');
  svg.append(back, front);

  let ax = -0.4, ay = 0.6, px = 0, py = 0, tpx = 0, tpy = 0, visible = true;
  const draw = () => {
    const cx = Math.cos(ax + py * 0.5), sx = Math.sin(ax + py * 0.5);
    const cy = Math.cos(ay + px * 0.7), sy = Math.sin(ay + px * 0.7);
    const pts = verts.map(([x, y, z]) => {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return [x1, y1, z2];
    });
    let f = '', b = '';
    for (const [i, j] of edges) {
      const [x1, y1, z1] = pts[i];
      const [x2, y2, z2] = pts[j];
      const seg = `M${x1.toFixed(3)} ${y1.toFixed(3)}L${x2.toFixed(3)} ${y2.toFixed(3)}`;
      if (z1 + z2 > -0.35) f += seg; else b += seg;
    }
    front.setAttribute('d', f);
    back.setAttribute('d', b);
  };
  draw();
  if (reduced) return;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cover);
  cover.addEventListener('pointermove', (e) => {
    const r = cover.getBoundingClientRect();
    tpx = (e.clientX - r.left) / r.width - 0.5;
    tpy = (e.clientY - r.top) / r.height - 0.5;
  });
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(50, now - last);
    last = now;
    if (visible) {
      ay += dt * 0.00018;
      ax += dt * 0.00007;
      px += (tpx - px) * 0.06;
      py += (tpy - py) * 0.06;
      draw();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
