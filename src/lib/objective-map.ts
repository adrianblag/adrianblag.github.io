/* =========================================================================
   OBJECTIVE MAP — the contour figure in the homepage hero.

   Computed at build time, so the page ships plain SVG and no JavaScript.
   A landscape J(x, y) is built from a few Gaussian hills; its contour lines
   come from marching squares, and four gradient-ascent paths climb from the
   edges to the optimum. The dotted paths are the observed behaviour, the
   contours the objective recovered from it, and J* its maximum.

   Everything is deterministic, so every build draws the same figure. To
   reshape it, edit HILLS; to move the paths, edit STARTS (points in the
   480 × 560 box; the bottom-left quarter sits under the portrait, and a
   start only counts if its path reaches the highest hill).
   ========================================================================= */

const W = 480;
const H = 560;
const STEP = 4; // grid resolution for the contours, in box units
const LEVELS = 13;

type Hill = { x: number; y: number; a: number; sx: number; sy: number; r: number };

/** Centre, height (a), spread (sx, sy) and rotation (r, radians). */
const HILLS: Hill[] = [
  { x: 352, y: 150, a: 1.0, sx: 150, sy: 112, r: -0.55 }, // the optimum
  { x: 104, y: 92, a: 0.4, sx: 82, sy: 66, r: 0.35 },
  { x: 430, y: 452, a: 0.3, sx: 92, sy: 78, r: 0.1 },
  { x: 214, y: 364, a: -0.24, sx: 118, sy: 88, r: 0.8 },
];

/** Candidate starting points, in order of preference; the first four whose
 *  paths reach the optimum are drawn. */
const STARTS: [number, number][] = [
  [474, 318], [470, 30], [20, 14], [8, 190], [262, 10], [300, 260],
];

type Point = [number, number];

export type ObjectiveMap = {
  width: number;
  height: number;
  contours: { d: string; hi: boolean; delay: string }[];
  trails: { start: Dot; dots: Dot[] }[];
  optimum: { x: number; y: number };
  label: { x: number; y: number };
};
type Dot = { x: number; y: number; delay: string };

const round1 = (n: number) => Math.round(n * 10) / 10;

function f(x: number, y: number): number {
  let v = 0;
  for (const h of HILLS) {
    const c = Math.cos(h.r), s = Math.sin(h.r);
    const dx = x - h.x, dy = y - h.y;
    const u = (c * dx + s * dy) / h.sx, w = (-s * dx + c * dy) / h.sy;
    v += h.a * Math.exp(-0.5 * (u * u + w * w));
  }
  // A faint ripple so the contours look drawn rather than computed.
  return v + 0.035 * Math.sin(x / 41 + 1.3) * Math.cos(y / 57 - 0.4);
}

function grad(x: number, y: number): Point {
  const e = 0.5;
  return [(f(x + e, y) - f(x - e, y)) / (2 * e), (f(x, y + e) - f(x, y - e)) / (2 * e)];
}

/** Marching squares at one level, joined into polylines. Crossing points are
 *  keyed by the grid edge they lie on, so neighbouring cells share them
 *  exactly and the joins need no floating-point matching. */
function contourLines(grid: number[][], level: number): { poly: Point[]; closed: boolean }[] {
  const ny = grid.length, nx = grid[0].length;
  const points = new Map<string, Point>();
  const segments: [string, string][] = [];
  const cross = (key: string, x0: number, y0: number, v0: number, x1: number, y1: number, v1: number) => {
    if (!points.has(key)) {
      const t = (level - v0) / (v1 - v0);
      points.set(key, [x0 + t * (x1 - x0), y0 + t * (y1 - y0)]);
    }
    return key;
  };

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const tl = grid[j][i], tr = grid[j][i + 1], br = grid[j + 1][i + 1], bl = grid[j + 1][i];
      const kind = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
      if (kind === 0 || kind === 15) continue;
      const x0 = i * STEP, y0 = j * STEP, x1 = x0 + STEP, y1 = y0 + STEP;
      const top = () => cross(`h${i},${j}`, x0, y0, tl, x1, y0, tr);
      const bottom = () => cross(`h${i},${j + 1}`, x0, y1, bl, x1, y1, br);
      const left = () => cross(`v${i},${j}`, x0, y0, tl, x0, y1, bl);
      const right = () => cross(`v${i + 1},${j}`, x1, y0, tr, x1, y1, br);
      const centreHigh = (tl + tr + br + bl) / 4 >= level;
      switch (kind) {
        case 1: case 14: segments.push([left(), bottom()]); break;
        case 2: case 13: segments.push([bottom(), right()]); break;
        case 3: case 12: segments.push([left(), right()]); break;
        case 4: case 11: segments.push([top(), right()]); break;
        case 6: case 9: segments.push([top(), bottom()]); break;
        case 7: case 8: segments.push([left(), top()]); break;
        case 5: // saddles: the centre value decides which corners connect
          if (centreHigh) segments.push([left(), top()], [bottom(), right()]);
          else segments.push([top(), right()], [left(), bottom()]);
          break;
        case 10:
          if (centreHigh) segments.push([top(), right()], [left(), bottom()]);
          else segments.push([left(), top()], [bottom(), right()]);
          break;
      }
    }
  }

  const byKey = new Map<string, number[]>();
  segments.forEach((seg, idx) => {
    for (const key of seg) byKey.set(key, [...(byKey.get(key) ?? []), idx]);
  });
  const used = new Array<boolean>(segments.length).fill(false);
  const lines: { poly: Point[]; closed: boolean }[] = [];
  for (let s = 0; s < segments.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    const chain = [...segments[s]];
    const extend = (atEnd: boolean) => {
      for (;;) {
        const key = atEnd ? chain[chain.length - 1] : chain[0];
        const next = (byKey.get(key) ?? []).find((id) => !used[id]);
        if (next === undefined) return;
        used[next] = true;
        const [a, b] = segments[next];
        const other = a === key ? b : a;
        if (atEnd) chain.push(other);
        else chain.unshift(other);
      }
    };
    extend(true);
    extend(false);
    const closed = chain.length > 2 && chain[0] === chain[chain.length - 1];
    const poly = chain.map((key) => points.get(key)!);
    if (closed) poly.pop();
    lines.push({ poly, closed });
  }
  return lines;
}

/** Ramer–Douglas–Peucker simplification. */
function simplify(points: Point[], eps: number): Point[] {
  if (points.length < 3) return points;
  const [ax, ay] = points[0], [bx, by] = points[points.length - 1];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  let max = 0, at = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (d > max) { max = d; at = i; }
  }
  if (max <= eps) return [points[0], points[points.length - 1]];
  return simplify(points.slice(0, at + 1), eps).slice(0, -1).concat(simplify(points.slice(at), eps));
}

/** A smooth path through the points (Catmull-Rom, written as cubic Béziers). */
function smoothPath(points: Point[], closed: boolean): string {
  const n = points.length;
  const at = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${round1(points[0][0])} ${round1(points[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${round1(c1[0])} ${round1(c1[1])} ${round1(c2[0])} ${round1(c2[1])} ${round1(p2[0])} ${round1(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

export function objectiveMap(): ObjectiveMap {
  // Sample the landscape.
  const grid: number[][] = [];
  let min = Infinity, max = -Infinity;
  let peak: Point = [0, 0];
  for (let j = 0; j <= H / STEP; j++) {
    const row: number[] = [];
    for (let i = 0; i <= W / STEP; i++) {
      const v = f(i * STEP, j * STEP);
      row.push(v);
      if (v < min) min = v;
      if (v > max) { max = v; peak = [i * STEP, j * STEP]; }
    }
    grid.push(row);
  }

  // Contours, innermost first, so the draw-in grows outward from J*.
  const contours: ObjectiveMap['contours'] = [];
  for (let k = LEVELS; k >= 1; k--) {
    const order = LEVELS - k;
    const level = min + (k / (LEVELS + 1)) * (max - min);
    for (const { poly, closed } of contourLines(grid, level)) {
      if (poly.length < 6) continue;
      const simple = simplify(closed ? [...poly, poly[0]] : poly, 0.7);
      const pts = closed ? simple.slice(0, -1) : simple;
      if (pts.length < 3) continue;
      contours.push({ d: smoothPath(pts, closed), hi: order < 3, delay: (1.05 + order * 0.09).toFixed(2) });
    }
  }

  // Refine the optimum, then climb to it from each start.
  let [ox, oy] = peak;
  for (let k = 0; k < 400; k++) {
    const [gx, gy] = grad(ox, oy);
    ox += gx * 400;
    oy += gy * 400;
  }
  const climb = ([x, y]: Point): Point[] => {
    const path: Point[] = [[x, y]];
    for (let k = 0; k < 4000; k++) {
      const [gx, gy] = grad(x, y);
      const g = Math.hypot(gx, gy);
      if (g < 1e-7) break;
      x += (gx / g) * 1.2;
      y += (gy / g) * 1.2;
      path.push([x, y]);
      if (Math.hypot(x - ox, y - oy) < 3) break;
    }
    return path;
  };
  const paths = STARTS.map(climb)
    .filter((p) => Math.hypot(p[p.length - 1][0] - ox, p[p.length - 1][1] - oy) < 8)
    .slice(0, 4);

  // Each path becomes a row of "observations" every 15 units, stopping
  // short of the optimum so the dots do not pile up on it.
  const trails = paths.map((p, ti) => {
    const dots: Dot[] = [];
    let run = 15;
    for (let i = 1; i < p.length; i++) {
      run += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (run < 15) continue;
      if (Math.hypot(p[i][0] - ox, p[i][1] - oy) < 16) break;
      dots.push({ x: round1(p[i][0]), y: round1(p[i][1]), delay: (0.25 + ti * 0.05 + dots.length * 0.055).toFixed(2) });
      run = 0;
    }
    return {
      start: { x: round1(p[0][0]), y: round1(p[0][1]), delay: (0.15 + ti * 0.05).toFixed(2) },
      dots,
    };
  });

  // Put the J* label in the widest gap between the directions the paths
  // arrive from, so no line of dots runs through it.
  const arrivals = paths
    .flat()
    .filter(([x, y]) => { const d = Math.hypot(x - ox, y - oy); return d > 8 && d < 64; })
    .map(([x, y]) => Math.atan2(y - oy, x - ox))
    .sort((a, b) => a - b);
  let gap = { size: -1, mid: -Math.PI / 2 };
  arrivals.forEach((a, i) => {
    const b = i + 1 < arrivals.length ? arrivals[i + 1] : arrivals[0] + 2 * Math.PI;
    if (b - a > gap.size) gap = { size: b - a, mid: (a + b) / 2 };
  });

  return {
    width: W,
    height: H,
    contours,
    trails,
    optimum: { x: round1(ox), y: round1(oy) },
    label: { x: round1(Math.cos(gap.mid) * 30), y: round1(Math.sin(gap.mid) * 30) },
  };
}
