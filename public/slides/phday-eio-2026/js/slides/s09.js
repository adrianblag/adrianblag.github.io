/* S9 — L4 · Interact (schematic).
   step 0  two cells (players) share one substrate pool; each has its own cost gauge J_i; "players 3 … N"
   step 1  game equation          step 2  Nash inequality
   step 3  best-response diagram: BR curves, best-response zig-zag -> Nash, MARL point nearby, "deviation -> biology?"
   step 4  arrows reverse in purple: observed trajectories -> inferred L1, L2; inverse bullets + gap note */
(function () {
  'use strict';
  const S = (t, a, p) => Deck.svg(t, a, p);
  const st = {};
  let tl = null;

  // gauge geometry (math angles, degrees; y axis up)
  const A0 = 210, A1 = -30;
  const pt = (cx, cy, r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
  function arc(cx, cy, r, a0, a1) {
    const p0 = pt(cx, cy, r, a0), p1 = pt(cx, cy, r, a1);
    const large = Math.abs(a0 - a1) > 180 ? 1 : 0;
    return `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${r},${r} 0 ${large} 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
  }
  function arrowHead(parent, cls, x, y, dir) {   // dir: 'down' | 'up' | 'left' | 'right'
    const s = 9, d = { down: [[-s, -14], [s, -14]], up: [[-s, 14], [s, 14]], left: [[14, -s], [14, s]], right: [[-14, -s], [-14, s]] }[dir];
    return S('path', { class: cls, d: `M${x + d[0][0]},${y + d[0][1]} L${x},${y} L${x + d[1][0]},${y + d[1][1]} Z` }, parent);
  }

  function buildCells(svg) {
    const g = S('g', {}, svg);
    const C1 = [140, 300], C2 = [540, 300], P = [340, 300];
    const RX = 98, RY = 90, PR = 60;

    // ghost players (N-player hint)
    const gg = S('g', {}, g);
    [296, 340, 384].forEach(x => S('circle', { class: 's09-ghost', cx: x, cy: 468, r: 16 }, gg));
    S('text', { class: 's09-ghost-t', x: 340, y: 520 }, gg).textContent = 'players 3 … N';

    // shared substrate pool (= shared state x)
    S('circle', { class: 's09-pool', cx: P[0], cy: P[1], r: PR }, g);
    const sub = [[-28, -22], [4, -34], [30, -14], [-12, 4], [20, 18], [-34, 20], [2, 34], [36, 40 - 26], [-4, -8]];
    sub.forEach(d => S('circle', { class: 's09-sub', cx: P[0] + d[0], cy: P[1] + d[1], r: 6 }, g));
    const pt1 = S('text', { class: 's09-pool-t', x: P[0], y: P[1] + PR + 36 }, g);
    pt1.innerHTML = 'shared substrate <tspan class="x">x</tspan>';

    st.fwd = S('g', {}, g);
    [[C1, 's09-p1', '1', 0.62], [C2, 's09-p2', '2', 0.42]].forEach(([c, cls, i, val]) => {
      const pg = S('g', { class: cls }, g);
      // uptake arrow from the pool into the cell
      const dir = c[0] < P[0] ? -1 : 1;
      const xa = P[0] + dir * (PR + 6), xb = c[0] - dir * (RX + 6);
      S('path', { class: 's09-up', d: `M${xa},${P[1]} L${xb - dir * 10},${P[1]}` }, pg);
      arrowHead(pg, 's09-uph', xb, P[1], dir < 0 ? 'left' : 'right');
      const ut = S('text', { class: 's09-up-t', x: (xa + xb) / 2, y: P[1] - 26 }, pg);
      ut.innerHTML = `u<tspan baseline-shift="sub" font-size="19">${i}</tspan>`;
      // cell
      S('ellipse', { class: 's09-cell', cx: c[0], cy: c[1], rx: RX, ry: RY }, pg);
      S('circle', { class: 's09-nuc', cx: c[0] + dir * 26, cy: c[1] + 24, r: 18 }, pg);
      S('text', { class: 's09-cell-t', x: c[0], y: c[1] - 12 }, pg).textContent = 'cell ' + i;
      // cost gauge J_i
      const gx = c[0], gy = 120, gr = 52;
      S('path', { class: 's09-g-bg', d: arc(gx, gy, gr, A0, A1) }, pg);
      const av = A0 - val * (A0 - A1);
      S('path', { class: 's09-g-val', d: arc(gx, gy, gr, A0, av) }, pg);
      for (let k = 0; k <= 6; k++) { const a = A0 - k * (A0 - A1) / 6, p0 = pt(gx, gy, gr - 14, a), p1 = pt(gx, gy, gr - 22, a); S('line', { class: 's09-g-tick', x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1] }, pg); }
      const pn = pt(gx, gy, gr - 12, av);
      S('line', { class: 's09-g-needle', x1: gx, y1: gy, x2: pn[0], y2: pn[1] }, pg);
      S('circle', { class: 's09-g-pivot', cx: gx, cy: gy, r: 5 }, pg);
      const jt = S('text', { class: 's09-g-t', x: gx, y: gy + 42 }, pg);
      jt.innerHTML = `J<tspan baseline-shift="sub" font-size="19">${i}</tspan>`;
      // forward arrow: objective -> behaviour
      S('path', { class: 's09-fwd', d: `M${gx},${gy + 54} L${gx},${c[1] - RY - 14}` }, st.fwd);
      arrowHead(st.fwd, 's09-fwdh', gx, c[1] - RY - 4, 'down');
    });

    // inverse layer (step 4)
    st.rev = []; st.revH = []; st.spark = []; st.invT = [];
    const inv = S('g', {}, g);
    [[C1, 's09-p1', '1', 0], [C2, 's09-p2', '2', 1]].forEach(([c, cls, i, k]) => {
      const pg = S('g', { class: cls }, inv);
      // observed trajectory (illustrative sparkline) under the cell
      const sg = S('g', {}, pg);
      const bx = c[0] - 80, by = 424, bw = 160, bh = 84;
      S('rect', { class: 's09-spark-bg', x: bx, y: by, width: bw, height: bh, rx: 10 }, sg);
      S('line', { class: 's09-spark-ax', x1: bx + 12, x2: bx + bw - 12, y1: by + bh - 14, y2: by + bh - 14 }, sg);
      const f = k === 0 ? (t => 0.15 + 0.7 / (1 + Math.exp(-9 * (t - 0.35)))) : (t => 0.2 + 0.6 * Math.exp(-3 * t) + 0.35 * t * t);
      const pts = d3.range(0, 1.0001, 0.02).map(t => [bx + 14 + t * (bw - 28), by + bh - 18 - f(t) * (bh - 34)]);
      S('path', { class: 's09-spark', d: d3.line()(pts) }, sg);
      [0.1, 0.3, 0.5, 0.7, 0.9].forEach((t, j) => { const y = f(t) + (j % 2 ? 0.05 : -0.04); S('circle', { class: 's09-spark-d', cx: bx + 14 + t * (bw - 28), cy: by + bh - 18 - y * (bh - 34), r: 4.5 }, sg); });
      st.spark.push(sg);
      // purple arrows: data -> cell -> objective (reversed direction)
      const p1 = S('path', { class: 's09-rev', d: `M${c[0]},${by - 6} L${c[0]},${c[1] + RY + 16}` }, inv);
      const h1 = arrowHead(inv, 's09-revh', c[0], c[1] + RY + 4, 'up');
      const p2 = S('path', { class: 's09-rev', d: `M${c[0]},${c[1] - RY - 6} L${c[0]},${120 + 66}` }, inv);
      const h2 = arrowHead(inv, 's09-revh', c[0], 120 + 56, 'up');
      st.rev.push(p1, p2); st.revH.push(h1, h2);
      const it = S('text', { class: 's09-inv-t', x: c[0], y: 40 }, inv);
      it.innerHTML = `inferred L<tspan baseline-shift="sub" font-size="19">${i}</tspan>`;
      st.invT.push(it);
    });
    st.cap = S('text', { class: 's09-inv-cap', x: 340, y: 580 }, inv);
    st.cap.innerHTML = 'observed trajectories → inferred L<tspan baseline-shift="sub" font-size="19">1</tspan><tspan dx="6">, L</tspan><tspan baseline-shift="sub" font-size="19">2</tspan>';
  }

  function buildBR(svg) {
    const g = S('g', {}, svg);
    const xs = d3.scaleLinear().domain([0, 1]).range([62, 380]);
    const ys = d3.scaleLinear().domain([0, 1]).range([292, 20]);
    S('path', { class: 's09-ax', d: `M${xs(0)},${ys(1.04)} L${xs(0)},${ys(0)} L${xs(1.04)},${ys(0)}` }, g);
    const t1 = S('text', { class: 's09-axt', x: xs(1.04), y: ys(0) + 32, 'text-anchor': 'end' }, g);
    t1.innerHTML = 'u<tspan baseline-shift="sub" font-size="19">1</tspan>';
    const t2 = S('text', { class: 's09-axt', x: xs(0) - 14, y: ys(1) + 8, 'text-anchor': 'end' }, g);
    t2.innerHTML = 'u<tspan baseline-shift="sub" font-size="19">2</tspan>';
    // illustrative best responses of the two players
    const BR1 = u2 => 0.8 - 0.5 * u2 - 0.1 * u2 * u2;     // player 1's best reply to u2
    const BR2 = u1 => 0.9 - 0.65 * u1 - 0.1 * u1 * u1;    // player 2's best reply to u1
    let n1 = 0.5, n2 = 0.5;
    for (let k = 0; k < 60; k++) { n2 = BR2(n1); n1 = BR1(n2); }
    const grid = d3.range(0, 1.0001, 0.02);
    const c1 = S('path', { class: 's09-brc s09-p1', d: d3.line()(grid.map(u2 => [xs(BR1(u2)), ys(u2)])) }, g);
    const c2 = S('path', { class: 's09-brc s09-p2', d: d3.line()(grid.map(u1 => [xs(u1), ys(BR2(u1))])) }, g);
    st.brC = [c1, c2];
    st.brT = [];
    const l1 = S('text', { class: 's09-brt', x: xs(BR1(1)) + 12, y: ys(1) + 6 }, g); l1.innerHTML = 'BR<tspan baseline-shift="sub" font-size="19">1</tspan>';
    const l2 = S('text', { class: 's09-brt', x: xs(1) + 8, y: ys(BR2(1)) + 6 }, g); l2.innerHTML = 'BR<tspan baseline-shift="sub" font-size="19">2</tspan>';
    st.brT.push(l1, l2);
    // best-response zig-zag converging to Nash
    // (starts on BR2 so that no long vertical segment reads as a second axis)
    let a = 0.06, b = BR2(a);
    const zz = [[xs(a), ys(b)]];
    for (let k = 0; k < 6; k++) { a = BR1(b); zz.push([xs(a), ys(b)]); b = BR2(a); zz.push([xs(a), ys(b)]); }
    st.zz = S('path', { class: 's09-zz', d: d3.line()(zz) }, g);
    st.zz0 = S('circle', { class: 's09-zz0', cx: zz[0][0], cy: zz[0][1], r: 6 }, g);
    // MARL: learning iterates settle near, but not at, Nash
    const m = [n1 + 0.15, n2 + 0.13];
    const start = [0.93, 0.3];
    st.trail = d3.range(7).map(k => {
      const w = Math.pow(0.62, k + 1), wig = (k % 2 ? 1 : -1) * 0.03 * w * 4;
      const u = m[0] + (start[0] - m[0]) * w + wig, v = m[1] + (start[1] - m[1]) * w - wig;
      const c = S('circle', { class: 's09-trail', cx: xs(u), cy: ys(v), r: 6 }, g);
      c.style.opacity = (0.25 + 0.09 * k).toFixed(2);
      return c;
    });
    st.dev = S('path', { class: 's09-dev', d: `M${xs(n1)},${ys(n2)} L${xs(m[0])},${ys(m[1])}` }, g);
    st.marl = S('g', {}, g);
    const mx = xs(m[0]), my = ys(m[1]);
    S('path', { class: 's09-marl', d: `M${mx},${my - 11} L${mx + 11},${my} L${mx},${my + 11} L${mx - 11},${my} Z` }, st.marl);
    S('text', { class: 's09-nasht', x: mx + 20, y: my + 7 }, st.marl).textContent = 'MARL';
    st.nash = S('g', {}, g);
    S('circle', { class: 's09-nashp', cx: xs(n1), cy: ys(n2), r: 9 }, st.nash);
    S('text', { class: 's09-nasht', x: xs(n1) - 18, y: ys(n2) + 36, 'text-anchor': 'end' }, st.nash).textContent = 'Nash';
    st.devT = S('g', {}, g);
    S('path', { class: 's09-dev', d: `M${mx + 6},${my - 14} L${xs(0.82)},${ys(0.92) + 8}`, style: 'stroke-dasharray:none;stroke-width:1.6' }, st.devT);
    S('text', { class: 's09-devt', x: xs(0.76), y: ys(0.97) - 18 }, st.devT).textContent = 'deviation';
    S('text', { class: 's09-devt', x: xs(0.76), y: ys(0.97) + 8 }, st.devT).textContent = '→ biology?';
  }

  Deck.register('s09', {
    steps: 4,
    init(sec) {
      buildCells(sec.querySelector('.s09-cells'));
      buildBR(sec.querySelector('.s09-br'));
    },
    go(step, ctx) {
      const I = ctx.instant;
      if (tl) { tl.kill(); tl = null; }
      const brAll = [].concat(st.brC, st.brT, st.trail, [st.zz, st.zz0, st.dev, st.marl, st.nash, st.devT]);
      const invAll = [].concat(st.rev, st.revH, st.spark, st.invT, [st.cap, st.fwd]);
      gsap.killTweensOf(brAll.concat(invAll));

      // ---- step 3: best-response diagram
      const br = step >= 3;
      if (br && step === 3 && ctx.prev === 2 && !I) {
        gsap.set(st.brC, { drawSVG: '0%' }); gsap.set([].concat(st.brT, st.trail, [st.zz0, st.marl, st.nash, st.devT]), { opacity: 0 });
        gsap.set([st.zz, st.dev], { drawSVG: '0%' });
        tl = gsap.timeline({ delay: 0.25 });
        tl.to(st.brC, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.15 })
          .to(st.brT, { opacity: 1, duration: 0.4 }, '-=0.3')
          .to(st.zz0, { opacity: 1, duration: 0.25 })
          .to(st.zz, { drawSVG: '100%', duration: 1.1, ease: 'power1.inOut' })
          .fromTo(st.nash, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' })
          .to(st.trail, { opacity: (i) => 0.25 + 0.09 * i, duration: 0.25, stagger: 0.09 }, '+=0.1')
          .to(st.marl, { opacity: 1, duration: 0.4 })
          .to(st.dev, { drawSVG: '100%', duration: 0.5 })
          .to(st.devT, { opacity: 1, duration: 0.5 });
      } else {
        gsap.set([].concat(st.brC, [st.zz, st.dev]), { drawSVG: br ? '100%' : '0%' });
        gsap.set([].concat(st.brT, [st.zz0, st.marl, st.devT]), { opacity: br ? 1 : 0 });
        gsap.set(st.nash, { opacity: br ? 1 : 0, scale: 1 });
        st.trail.forEach((c, i) => gsap.set(c, { opacity: br ? 0.25 + 0.09 * i : 0 }));
      }

      // ---- step 4: the arrows reverse (purple): observed trajectories -> inferred L_i
      const inv = step >= 4;
      if (inv && step === 4 && ctx.prev === 3 && !I) {
        gsap.set(st.rev, { drawSVG: '0%' }); gsap.set([].concat(st.revH, st.spark, st.invT, [st.cap]), { opacity: 0 });
        tl = gsap.timeline({ delay: 0.2 });
        tl.to(st.fwd, { opacity: 0.12, duration: 0.5 })
          .to(st.spark, { opacity: 1, duration: 0.5, stagger: 0.1 }, '<')
          .to([st.rev[0], st.rev[2]], { drawSVG: '100%', duration: 0.5, ease: 'power2.in' })
          .to([st.revH[0], st.revH[2]], { opacity: 1, duration: 0.2 })
          .to([st.rev[1], st.rev[3]], { drawSVG: '100%', duration: 0.6, ease: 'power2.out' })
          .to([st.revH[1], st.revH[3]], { opacity: 1, duration: 0.2 })
          .to(st.invT, { opacity: 1, duration: 0.5 })
          .to(st.cap, { opacity: 1, duration: 0.5 }, '<');
      } else {
        gsap.set(st.rev, { drawSVG: inv ? '100%' : '0%' });
        gsap.set([].concat(st.revH, st.spark, st.invT, [st.cap]), { opacity: inv ? 1 : 0 });
        gsap.set(st.fwd, { opacity: inv ? 0.12 : 1 });
      }
    },
  });
})();
