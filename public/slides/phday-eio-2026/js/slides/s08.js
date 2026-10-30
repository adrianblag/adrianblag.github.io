/* S8 — L3 · Explain (schematic, illustrative data).
   step 0  black-box policy + scatter of samples (x_k, u*_k) (on arrival the samples stream out of the box)
   step 1  library Θ(X) + dense least-squares coefficients ξ
   step 2  sequential thresholded least squares (animated rounds) -> one Hill term survives
   step 3  surviving Hill law: card + curve overlaid on the scatter
   step 4  closed-loop phase portrait "stability?" + gap note */
(function () {
  'use strict';
  const S = (t, a, p) => Deck.svg(t, a, p);
  // kill every tween touching any target: gsap.killTweensOf(array) can leave the delayed per-element fromTo tweens
  // alive, and their startAt would re-hide elements (e.g. the Hill label) after fast stepping
  const kill = els => gsap.getTweensOf(els).forEach(t => t.kill());

  // deterministic pseudo-random numbers (illustrative samples must not change between renders)
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const hill = (x, K, n) => Math.pow(x, n) / (Math.pow(K, n) + Math.pow(x, n));
  const K0 = 0.55, N0 = 4;          // the "true" switch used to generate the illustrative samples

  // library columns: 1, x, x^2, four Hill terms on a (K, n) grid, "..."
  const COLS = [
    { lab: '1', f: x => 1 },
    { lab: 'x', f: x => x },
    { lab: 'x²', f: x => x * x },
    { K: 0.3, n: 2 }, { K: 0.55, n: 4 }, { K: 0.9, n: 4 }, { K: 0.9, n: 8 },
    { lab: '…' },
  ];
  const WIN = 4;                                  // index of the surviving column
  // illustrative coefficient values: dense LS fit, then rounds of thresholding + refit
  const ROUNDS = [
    [0.22, -0.38, 0.30, -0.12, 0.70, 0.27, -0.17],
    [0.13, -0.26, 0.22, 0, 0.86, 0.15, 0],
    [0, -0.12, 0.09, 0, 0.95, 0, 0],
    [0, 0, 0, 0, 1.0, 0, 0],
  ];
  const TAU = 0.2;

  let tl = null;
  const st = {};

  function buildScatter(svg) {
    const g = S('g', {}, svg);
    // black box (an opaque policy: table / neural network)
    const bx = 100, by = 6, bw = 300, bh = 112;
    const box = S('g', { class: 's08-box-glow' }, g);
    S('rect', { class: 's08-box', x: bx, y: by, width: bw, height: bh, rx: 18 }, box);
    const nn = S('g', { class: 's08-nn' }, box);
    const layers = [[3, 128], [4, 160], [2, 192]];
    const pos = layers.map(([n, x]) => Array.from({ length: n }, (_, i) => [x, by + bh / 2 + (i - (n - 1) / 2) * 22]));
    for (let l = 0; l < pos.length - 1; l++) pos[l].forEach(a => pos[l + 1].forEach(b => S('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, nn)));
    pos.flat().forEach(p => S('circle', { cx: p[0], cy: p[1], r: 6 }, nn));
    S('text', { class: 's08-box-t1', x: 222, y: by + 50 }, box).textContent = 'black box';
    S('text', { class: 's08-box-t2', x: 222, y: by + 82 }, box).textContent = 'OC / RL policy';

    // arrow from the box into the plot
    S('path', { class: 's08-arrow', d: `M250,${by + bh + 6} L250,${by + bh + 50}` }, g);
    S('path', { class: 's08-arrowhead', d: `M241,${by + bh + 46} L250,${by + bh + 62} L259,${by + bh + 46} Z` }, g);

    // axes
    const L = 62, R = 486, T = 200, B = 500;
    const xs = d3.scaleLinear().domain([0, 1.25]).range([L, R]);
    const ys = d3.scaleLinear().domain([0, 1.12]).range([B, T]);
    S('path', { class: 's08-axis', d: `M${L},${T - 10} L${L},${B} L${R},${B}` }, g);
    S('text', { class: 's08-axlab x', x: R - 4, y: B + 34, 'text-anchor': 'end' }, g).textContent = 'x';
    S('text', { class: 's08-axlab u', x: L - 14, y: T - 2, 'text-anchor': 'end' }, g).textContent = 'u*';
    // "illustrative" label
    S('rect', { class: 's08-illus-box', x: R - 150, y: B - 48, width: 146, height: 32, rx: 16 }, g);
    S('text', { class: 's08-illus', x: R - 77, y: B - 25, 'text-anchor': 'middle' }, g).textContent = 'illustrative';

    // samples from a switch-like policy
    const r = rng(7);
    const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / Math.sqrt(0.5); };
    const pts = [];
    for (let i = 0; i < 54; i++) {
      const x = 0.04 + 1.17 * (i + r()) / 54;
      const u = Math.min(1.08, Math.max(0.0, hill(x, K0, N0) + 0.045 * gauss()));
      pts.push([xs(x), ys(u)]);
    }
    const dg = S('g', {}, g);
    st.dots = pts.map(p => S('circle', { class: 's08-dot', cx: p[0], cy: p[1], r: 7 }, dg));
    st.dotHome = pts;
    st.dotSrc = [250, by + bh - 10];

    // the surviving Hill law, overlaid
    const line = d3.line().curve(d3.curveMonotoneX);
    const xsamp = d3.range(0, 1.2201, 0.01);
    st.hill = S('path', { class: 's08-hill', d: line(xsamp.map(x => [xs(x), ys(hill(x, K0, N0))])) }, g);
    st.hillLab = S('text', { class: 's08-hill-lab', x: xs(1.2), y: ys(hill(1.2, K0, N0)) + 56, 'text-anchor': 'end' }, g);
    st.hillLab.textContent = 'û(x)';
  }

  function buildLibrary(svg) {
    const g = S('g', {}, svg);
    const x0 = 116, dx = 76, sw = 44;               // column centres x0 + j*dx
    const yH = 36, hH = 44;                          // header glyphs
    const yS = 92, nC = 16, cH = 8;                  // strip cells
    const yZ = 352, sc = 108;                        // zero line of the coefficient bars, px per unit
    st.libGeom = { x0, dx, yZ, sc };
    // left labels
    S('text', { class: 'lab-big', x: 4, y: yS + nC * cH / 2 + 8 }, g).textContent = 'Θ(X)';
    S('text', { class: 'lab-big', x: 26, y: yZ + 8 }, g).textContent = 'ξ';
    // bracket over the Hill columns
    const hx1 = x0 + 3 * dx - sw / 2, hx2 = x0 + 6 * dx + sw / 2;
    S('path', { class: 's08-bracket', d: `M${hx1},${yH - 4} L${hx1},${yH - 12} L${hx2},${yH - 12} L${hx2},${yH - 4}` }, g);
    S('text', { class: 'lab-grid', x: (hx1 + hx2) / 2, y: yH - 20 }, g).textContent = 'Hill terms, (K, n) on a grid';
    // threshold band
    st.thr = S('g', {}, g);
    const xa = x0 - sw / 2 - 8, xb = x0 + 6 * dx + sw / 2 + 8;
    S('line', { class: 's08-zero', x1: xa, x2: xb, y1: yZ, y2: yZ }, g);
    S('line', { class: 's08-thr', x1: xa, x2: xb, y1: yZ - TAU * sc, y2: yZ - TAU * sc }, st.thr);
    S('line', { class: 's08-thr', x1: xa, x2: xb, y1: yZ + TAU * sc, y2: yZ + TAU * sc }, st.thr);
    S('text', { class: 's08-thr-lab', x: xb + 10, y: yZ - TAU * sc + 7 }, st.thr).textContent = '±τ';

    const xsamp = d3.range(nC).map(i => 0.04 + 1.17 * (i + 0.5) / nC);
    st.cols = []; st.bars = []; st.zdots = [];
    COLS.forEach((c, j) => {
      const cx = x0 + j * dx;
      const cg = S('g', { class: 's08-col' + (j === WIN ? ' win' : '') }, g);
      st.cols.push(cg);
      if (c.lab === '…') {
        S('text', { class: 'lab-poly', x: cx, y: yS + nC * cH / 2 + 8 }, cg).textContent = '…';
        return;
      }
      // header
      if (c.lab) {
        S('text', { class: 'lab-poly', x: cx, y: yH + 32 }, cg).textContent = c.lab;
      } else {
        S('rect', { class: 's08-glyph-bg', x: cx - sw / 2, y: yH, width: sw, height: hH, rx: 6 }, cg);
        const gl = d3.range(0, 1.2001, 0.04).map(x => [cx - sw / 2 + 4 + (sw - 8) * x / 1.2, yH + hH - 6 - (hH - 12) * hill(x, c.K, c.n)]);
        S('path', { class: 's08-glyph', d: d3.line()(gl) }, cg);
        c.f = x => hill(x, c.K, c.n);
      }
      // strip: column of Θ(X), one cell per (sorted) sample
      const vals = xsamp.map(c.f), vmax = Math.max(...vals.map(Math.abs)) || 1;
      vals.forEach((v, i) => {
        const cell = S('rect', { class: 's08-cell', x: cx - sw / 2, y: yS + i * cH, width: sw, height: cH - 0.8 }, cg);
        cell.style.fillOpacity = (0.07 + 0.83 * Math.abs(v) / vmax).toFixed(3);
      });
      S('rect', { class: 's08-strip-frame', x: cx - sw / 2, y: yS, width: sw, height: nC * cH, rx: 3 }, cg);
      // coefficient bar
      const bar = S('rect', { class: 's08-bar' + (j === WIN ? ' win' : ''), x: cx - 15, width: 30, y: yZ, height: 0, rx: 3 }, g);
      st.bars.push(bar);
      st.zdots.push(S('circle', { class: 's08-zero-dot', cx: cx, cy: yZ, r: 4 }, g));
    });
  }

  function barAttrs(v) {
    const { yZ, sc } = st.libGeom;
    const h = Math.abs(v) * sc;
    return { attr: { y: v >= 0 ? yZ - h : yZ, height: h } };
  }

  function buildPhase(svg) {
    const g = S('g', {}, svg);
    const H = 250, L = 34, R = 262, T = 12, B = 238;
    S('rect', { class: 's08-pp-frame', x: 0, y: 0, width: R + 8, height: H, rx: 14 }, g);
    const xs = d3.scaleLinear().domain([0, 2]).range([L, R - 10]);
    const ys = d3.scaleLinear().domain([0, 2]).range([B - 14, T + 10]);
    S('line', { class: 's08-pp-ax', x1: L, x2: R - 6, y1: ys(0), y2: ys(0) }, g);
    S('line', { class: 's08-pp-ax', x1: L, x2: L, y1: ys(0), y2: T + 4 }, g);
    // illustrative closed loop: stable spiral around (1, 1)
    const fv = (x, y) => [-0.45 * (x - 1) - 1.0 * (y - 1), 1.0 * (x - 1) - 0.45 * (y - 1)];
    for (let i = 0; i <= 6; i++) for (let k = 0; k <= 4; k++) {
      const x = 0.15 + i * 0.285, y = 0.2 + k * 0.4, v = fv(x, y), n = Math.hypot(v[0], v[1]) || 1;
      const ux = v[0] / n * 0.09, uy = v[1] / n * 0.09;
      S('line', { class: 's08-pp-vec', x1: xs(x - ux), y1: ys(y - uy), x2: xs(x + ux), y2: ys(y + uy) }, g);
    }
    const starts = [[0.12, 1.85], [1.9, 1.7], [1.85, 0.15], [0.25, 0.3]];
    st.traj = starts.map(p => {
      let [x, y] = p; const pts = [[xs(x), ys(y)]];
      for (let s = 0; s < 240; s++) {
        const h = 0.05, k1 = fv(x, y), k2 = fv(x + h / 2 * k1[0], y + h / 2 * k1[1]), k3 = fv(x + h / 2 * k2[0], y + h / 2 * k2[1]), k4 = fv(x + h * k3[0], y + h * k3[1]);
        x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        pts.push([xs(x), ys(y)]);
      }
      return S('path', { class: 's08-pp-traj', d: d3.line().curve(d3.curveBasis)(pts) }, g);
    });
    S('circle', { class: 's08-pp-eq', cx: xs(1), cy: ys(1), r: 9 }, g);
    S('text', { class: 's08-pp-q', x: R + 26, y: ys(1) - 6 }, g).textContent = 'stability?';
    S('path', { class: 's08-arrow', d: `M${R + 22},${ys(1) - 14} L${xs(1) + 18},${ys(1) - 4}`, style: 'stroke-width:2' }, g);
    S('text', { class: 's08-pp-lab', x: R + 26, y: ys(1) + 30 }, g).textContent = 'closed loop';
    S('text', { class: 's08-pp-lab', x: R + 26, y: ys(1) + 58 }, g).textContent = '(illustrative)';
  }

  // arrival at step 0: the samples stream out of the black box into the scatter (go() always renders them at home)
  function enterDots() {
    kill(st.dots);
    st.dots.forEach((d, i) => {
      gsap.fromTo(d, { attr: { cx: st.dotSrc[0], cy: st.dotSrc[1] }, opacity: 0 },
        { attr: { cx: st.dotHome[i][0], cy: st.dotHome[i][1] }, opacity: 1, duration: 0.75, delay: 0.35 + i * 0.022, ease: 'power3.out' });
    });
  }

  Deck.register('s08', {
    steps: 4,
    init(sec) {
      buildScatter(sec.querySelector('.s08-scatter'));
      st.libSvg = sec.querySelector('.s08-lib');
      buildLibrary(st.libSvg);
      buildPhase(sec.querySelector('.s08-phase'));
      // the engine renders step 0 instantly on arrival, so the sample stream is played from here
      Reveal.on('slidechanged', e => {
        if (e.currentSlide !== sec || Deck.isStatic) return;
        setTimeout(() => { if (Reveal.getCurrentSlide() === sec && sec.querySelectorAll('.step-trigger.visible').length === 0) enterDots(); }, 30);
      });
    },
    go(step, ctx) {
      const I = ctx.instant;
      if (tl) { tl.kill(); tl = null; }
      const all = [].concat(st.dots, st.bars, st.zdots, st.cols, st.traj, [st.hill, st.hillLab, st.thr]);
      kill(all);

      // step 0: the samples are always in the scatter
      st.dots.forEach((d, i) => gsap.set(d, { attr: { cx: st.dotHome[i][0], cy: st.dotHome[i][1] }, opacity: 1 }));

      // steps 1-2: coefficient bars (dense, then thresholding rounds)
      const final = step >= 2 ? ROUNDS[ROUNDS.length - 1] : ROUNDS[0];
      const setBars = vals => st.bars.forEach((b, j) => { gsap.set(b, barAttrs(vals[j])); gsap.set(st.zdots[j], { opacity: vals[j] === 0 ? 1 : 0 }); });
      if (step === 2 && !I && ctx.prev === 1) {
        setBars(ROUNDS[0]);
        tl = gsap.timeline();
        tl.to(st.thr, { opacity: 1, duration: 0.3 }, 0);
        for (let r = 1; r < ROUNDS.length; r++) {
          const at = 0.35 + (r - 1) * 0.85;
          st.bars.forEach((b, j) => {
            tl.to(b, Object.assign(barAttrs(ROUNDS[r][j]), { duration: 0.55, ease: 'power2.inOut' }), at);
            if (ROUNDS[r][j] === 0 && ROUNDS[r - 1][j] !== 0) tl.to(st.zdots[j], { opacity: 1, duration: 0.3 }, at + 0.35);
          });
        }
        tl.to(st.cols.filter((_, j) => j !== WIN), { opacity: 0.32, duration: 0.5 }, '>-0.1');
      } else if (step === 1 && !I && ctx.prev < 1) {
        setBars(ROUNDS[0].map(() => 0));
        st.bars.forEach((b, j) => gsap.to(b, Object.assign(barAttrs(ROUNDS[0][j]), { duration: 0.7, delay: 0.35 + j * 0.06, ease: 'power3.out' })));
        st.zdots.forEach(z => gsap.set(z, { opacity: 0 }));
        gsap.set(st.cols, { opacity: 1 });
      } else {
        setBars(final);
        gsap.set(st.cols, { opacity: (j) => (step >= 2 && j !== WIN ? 0.32 : 1) });
      }
      gsap.set(st.thr, { opacity: step >= 1 ? 1 : 0 });
      st.libSvg.classList.toggle('won', step >= 2);

      // step 3: the Hill law overlaid on the scatter
      const showHill = step >= 3;
      if (showHill && !I && ctx.prev < 3) {
        gsap.fromTo(st.hill, { drawSVG: '0%', opacity: 1 }, { drawSVG: '100%', duration: 1.2, ease: 'power2.inOut', delay: 0.2 });
        gsap.fromTo(st.hillLab, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 1.1 });
      } else {
        gsap.set(st.hill, { drawSVG: showHill ? '100%' : '0%', opacity: showHill ? 1 : 0 });
        gsap.set(st.hillLab, { opacity: showHill ? 1 : 0 });
      }

      // step 4: closed-loop trajectories draw on
      const showCl = step >= 4;
      if (showCl && !I && ctx.prev < 4) {
        st.traj.forEach((p, i) => gsap.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, delay: 0.25 + i * 0.12, ease: 'power2.out' }));
      } else {
        gsap.set(st.traj, { drawSVG: showCl ? '100%' : '0%' });
      }
    },
  });
})();
