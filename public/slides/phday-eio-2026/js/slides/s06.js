/* S6 — L2 · Infer: what is the cell optimising?  (schematic bilevel IOC)
   step 0  inner OC problem in the green "brick" box
   step 1  kernel strips weighted by w (dot on the 2-simplex), summed
   step 2  outer weighted-least-squares box wraps the inner one; schematic data with
           error bars ∝ 1/√ω; a few outer iterations: w hops on the simplex, each hop =
           one inner solve (box flashes), model response morphs towards the data, misfit shrinks
   step 3  u*(w,θ) circled in red + link to the inner box; badge + gap (ill-posed chip lights, @3)
   Everything here is ILLUSTRATIVE (made-up shapes), labelled "schematic" on the slide. */
(function () {
  'use strict';

  // ---------- illustrative model (not results) ----------
  const KER = [                       // candidate kernels L_m(t), t in [0,1], max 1
    () => 1,                                                        // L1 "time"
    t => 0.28 + 0.72 * Math.exp(-Math.pow((t - 0.45) / 0.2, 2)),    // L2 "enzyme cost"
    t => 0.12 + 0.88 * Math.exp(-2.6 * t),                          // L3 "..."
  ];
  const sig = z => 1 / (1 + Math.exp(-z));
  const sigm = (A, k, t0) => { const a = sig(-k * t0), b = sig(k * (1 - t0)); return t => A * (sig(k * (t - t0)) - a) / (b - a); };
  const RESP = [sigm(0.95, 12, 0.26), sigm(0.8, 10, 0.64), sigm(0.5, 5, 0.5)];   // response if only kernel m
  const yw = (w, t) => w[0] * RESP[0](t) + w[1] * RESP[1](t) + w[2] * RESP[2](t);
  const W_C = [1 / 3, 1 / 3, 1 / 3];          // centroid
  const W_1 = [0.72, 0.1, 0.18];              // initial guess (step 1)
  const W_S = [0.32, 0.6, 0.08];              // best fit (the schematic data are generated here)
  const TD = [0.07, 0.17, 0.28, 0.39, 0.5, 0.61, 0.72, 0.83, 0.94];
  const SD = [0.035, 0.05, 0.085, 0.045, 0.1, 0.05, 0.04, 0.085, 0.05];   // sigma_i = 1/sqrt(omega_i)
  const NZ = [0.5, -0.6, 0.7, -0.3, 0.5, 0.25, -0.5, -0.45, 0.35];       // fixed "noise" in units of sigma
  const DATA = TD.map((t, i) => ({ t, y: yw(W_S, t) + NZ[i] * SD[i], s: SD[i] }));
  const misfit = w => DATA.reduce((a, d) => a + Math.pow((d.y - yw(w, d.t)) / d.s, 2), 0);
  const MIS0 = misfit(W_1);
  // outer iterates from W_1 to W_S (gently curved path)
  const HOPS = 5;
  const PATH = [];
  for (let k = 1; k <= HOPS; k++) {
    const s = k / HOPS, e = 1 - Math.pow(1 - s, 1.7), b = Math.sin(Math.PI * s) * 0.09;
    PATH.push(W_1.map((v, m) => v + (W_S[m] - v) * e + [-0.5, -0.5, 1][m] * b));
  }

  // ---------- geometry ----------
  const VTX = [[62, 256], [328, 256], [195, 26]];              // simplex vertices L1, L2, L3
  const bary = w => [w[0] * VTX[0][0] + w[1] * VTX[1][0] + w[2] * VTX[2][0], w[0] * VTX[0][1] + w[1] * VTX[1][1] + w[2] * VTX[2][1]];
  const KCLS = ['s06-k1', 's06-k2', 's06-k3'];
  const ROWY = [0, 56, 112], ROWH = 44, SX0 = 316, SX1 = 636, SUMY = 186, SUMH = 62;
  const TRK0 = 236, TRKW = 60;
  const PX = t => 56 + t * 410, PY = v => 352 - v * 300;            // data panel

  const INNER_TOP = 186, INNER_DX = 270, INNER_DY = -80;   // inner box: final top; offset while alone (step 1)
  const INNER_H = 467, INNER_H0 = 172, INNER_DY0 = 64;    // step 0: compact box (equation only), centred
  let tl = null;
  const S = {};                                                     // svg handles
  const cur = { w: W_1.slice() };

  function samples(n) { const a = []; for (let i = 0; i <= n; i++) a.push(i / n); return a; }
  const TS = samples(60);

  function areaPath(f, y0, h) {           // filled area of f(t) in [0,1] -> strip coords
    let d = `M${SX0},${y0 + h}`;
    TS.forEach(t => { d += `L${(SX0 + t * (SX1 - SX0)).toFixed(1)},${(y0 + h - f(t) * h).toFixed(1)}`; });
    return d + `L${SX1},${y0 + h}Z`;
  }
  function bandPath(lo, hi, y0, h) {     // stacked band between lo(t) and hi(t)
    let d = '';
    TS.forEach((t, i) => { d += (i ? 'L' : 'M') + (SX0 + t * (SX1 - SX0)).toFixed(1) + ',' + (y0 + h - hi(t) * h).toFixed(1); });
    for (let i = TS.length - 1; i >= 0; i--) { const t = TS[i]; d += 'L' + (SX0 + t * (SX1 - SX0)).toFixed(1) + ',' + (y0 + h - lo(t) * h).toFixed(1); }
    return d + 'Z';
  }
  function curvePath(w) {
    let d = '';
    samples(80).forEach((t, i) => { d += (i ? 'L' : 'M') + PX(t).toFixed(1) + ',' + PY(yw(w, t)).toFixed(1); });
    return d;
  }

  // render everything that depends on w
  function drawW(w) {
    cur.w = w.slice();
    const [x, y] = bary(w);
    S.dot.setAttribute('cx', x); S.dot.setAttribute('cy', y);
    S.wlab.setAttribute('x', x + 22); S.wlab.setAttribute('y', y - 16);
    for (let m = 0; m < 3; m++) {
      S.fill[m].setAttribute('d', areaPath(t => w[m] * KER[m](t), ROWY[m], ROWH));
      S.wbar[m].setAttribute('width', Math.max(2, TRKW * w[m]).toFixed(1));
    }
    const c0 = t => 0, c1 = t => w[0] * KER[0](t), c2 = t => c1(t) + w[1] * KER[1](t), c3 = t => c2(t) + w[2] * KER[2](t);
    const cum = [c0, c1, c2, c3];
    for (let m = 0; m < 3; m++) S.band[m].setAttribute('d', bandPath(cum[m], cum[m + 1], SUMY, SUMH));
    S.curve.setAttribute('d', curvePath(w));
    S.mbar.setAttribute('width', Math.max(4, 300 * Math.min(1, misfit(w) / MIS0)).toFixed(1));
  }

  function build(sec) {
    const svg = Deck.svg;
    // ---- boxes ----
    const bx = sec.querySelector('.s06-boxes');
    S.outbox = svg('rect', { x: 1.5, y: 8, width: 1697, height: 658, rx: 28, class: 's06-outbox' }, bx);
    const ib = sec.querySelector('.s06-inbg');
    S.inbox = svg('rect', { x: 1.5, y: 1.5, width: 1097, height: 467, rx: 22, class: 's06-inbox' }, ib);
    S.flash = svg('rect', { x: 1.5, y: 1.5, width: 1097, height: 467, rx: 22, class: 's06-flash' }, ib);
    S.inner = sec.querySelector('.s06-inner');
    S.brick = sec.querySelector('.s06-brick');

    // ---- kernel strips ----
    const kg = sec.querySelector('.s06-kern');
    S.kern = kg;
    const capt = ['time', 'enzyme cost', '…'];
    S.fill = []; S.wbar = []; S.band = [];
    for (let m = 0; m < 3; m++) {
      const y0 = ROWY[m];
      const g = svg('g', { class: 's06-krow' }, kg);
      const t1 = svg('text', { x: 0, y: y0 + 31, class: 'lab' }, g); t1.textContent = 'L' + '₁₂₃'[m];
      const t2 = svg('text', { x: 44, y: y0 + 31, class: 'cap' }, g); t2.textContent = capt[m];
      const t3 = svg('text', { x: TRK0 - 34, y: y0 + 31, class: 'cap' }, g); t3.textContent = 'w' + '₁₂₃'[m];
      t3.style.fill = 'var(--c-inv)'; t3.style.fontStyle = 'italic';
      svg('rect', { x: TRK0, y: y0 + 17, width: TRKW, height: 10, rx: 5, class: 'track' }, g);
      S.wbar.push(svg('rect', { x: TRK0, y: y0 + 17, width: 20, height: 10, rx: 5, class: KCLS[m] }, g));
      svg('path', { d: areaPath(KER[m], y0, ROWH), class: 'ghost ' + KCLS[m] }, g);
      S.fill.push(svg('path', { d: '', class: KCLS[m] }, g));
    }
    const sg = svg('g', { class: 's06-ksum' }, kg);
    svg('line', { x1: 0, y1: SUMY - 12, x2: SX1, y2: SUMY - 12, class: 'rule' }, sg);
    const ts = svg('text', { x: 0, y: SUMY + 42, class: 'sum-lab' }, sg); ts.textContent = 'Σ wₘLₘ';
    const ts2 = svg('text', { x: 118, y: SUMY + 42, class: 'cap' }, sg); ts2.textContent = 'integrand';
    for (let m = 0; m < 3; m++) S.band.push(svg('path', { d: '', class: KCLS[m] }, sg));
    S.ksum = sg;

    // ---- simplex ----
    const sx = sec.querySelector('.s06-simplex');
    S.simplex = sx;
    svg('polygon', { points: VTX.map(p => p.join(',')).join(' '), class: 'tri' }, sx);
    for (let i = 1; i < 4; i++) {        // iso-weight grid lines
      const f = i / 4;
      [[0, 1, 2], [1, 2, 0], [2, 0, 1]].forEach(([a, b, c]) => {
        const p = VTX[a], q = VTX[b], r = VTX[c];
        const P1 = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
        const P2 = [p[0] + (r[0] - p[0]) * f, p[1] + (r[1] - p[1]) * f];
        svg('line', { x1: P1[0], y1: P1[1], x2: P2[0], y2: P2[1], class: 'gl' }, sx);
      });
    }
    VTX.forEach((p, m) => { svg('circle', { cx: p[0], cy: p[1], r: 9, class: 'vtx ' + KCLS[m] }, sx); });
    const vl = [[40, 265, 'end'], [350, 265, 'start'], [219, 36, 'start']];   // beside the vertices (clear of the box border)
    vl.forEach((v, m) => { const t = svg('text', { x: v[0], y: v[1], class: 'vlab', 'text-anchor': v[2] }, sx); t.textContent = 'L' + '₁₂₃'[m]; });
    const dl = svg('text', { x: 286, y: 152, class: 'delta' }, sx); dl.textContent = 'Δ';
    S.trail = svg('polyline', { points: '', class: 'trail' }, sx);
    S.crumbs = [bary(W_1)].concat(PATH.slice(0, -1).map(bary)).map(p => svg('circle', { cx: p[0], cy: p[1], r: 6, class: 'crumb' }, sx));
    const pS = bary(W_S);
    S.ring = svg('circle', { cx: pS[0], cy: pS[1], r: 20, class: 'ring' }, sx);
    S.dot = svg('circle', { cx: 0, cy: 0, r: 11, class: 'wdot' }, sx);
    S.wlab = svg('text', { x: 0, y: 0, class: 'wlab' }, sx); S.wlab.textContent = 'w';

    // ---- data panel ----
    const dp = sec.querySelector('.s06-data');
    S.data = dp;
    svg('path', { d: `M56,24 V352 H478`, class: 'ax' }, dp);
    svg('path', { d: `M50,34 L56,22 L62,34 M466,346 L478,352 L466,358`, class: 'ax' }, dp);
    const at = svg('text', { x: 486, y: 360, class: 'axlab' }, dp); at.textContent = 't';
    S.pts = DATA.map(d => {
      const g = svg('g', { class: 's06-pt' }, dp);
      const x = PX(d.t);
      svg('line', { x1: x, y1: PY(d.y - d.s), x2: x, y2: PY(d.y + d.s), class: 'eb' }, g);
      svg('line', { x1: x - 7, y1: PY(d.y - d.s), x2: x + 7, y2: PY(d.y - d.s), class: 'eb' }, g);
      svg('line', { x1: x - 7, y1: PY(d.y + d.s), x2: x + 7, y2: PY(d.y + d.s), class: 'eb' }, g);
      svg('circle', { cx: x, cy: PY(d.y), r: 7.5, class: 'pt' }, g);
      return g;
    });
    const l1 = svg('text', { x: 76, y: 52, class: 'lab lab-y' }, dp); l1.textContent = 'data ỹ, error bar ∝ 1/√ω';
    S.curve = svg('path', { d: '', class: 'curve' }, dp);
    const l2 = svg('text', { x: 474, y: 326, class: 'lab', 'text-anchor': 'end' }, dp); l2.textContent = 'model y(t; u*(w,θ), θ)';
    l2.style.fill = 'var(--c-y)';
    S.dlabs = [l1, l2];
    const mg = svg('g', { class: 's06-mis' }, dp);
    const ml = svg('text', { x: 56, y: 446, class: 'mlab' }, mg); ml.textContent = 'misfit';
    svg('rect', { x: 150, y: 429, width: 300, height: 18, rx: 9, class: 'mtrack' }, mg);
    S.mbar = svg('rect', { x: 150, y: 429, width: 300, height: 18, rx: 9, class: 'mbar' }, mg);
    S.mis = mg;

    // ---- overlay (step 3) ----
    const ov = sec.querySelector('.s06-over');
    S.circ = svg('rect', { x: 0, y: 0, width: 10, height: 10, rx: 5, class: 'circ' }, ov);     // stadium around u*(w,θ)
    S.circ2 = svg('rect', { x: 0, y: 0, width: 10, height: 10, rx: 5, class: 'circ2' }, ov);
    S.link = svg('path', { d: 'M0,0', class: 'link' }, ov);
    S.head = svg('path', { d: 'M0,0', class: 'head' }, ov);
  }

  // position the red circles from the rendered KaTeX (slide px -> stage units)
  function placeOverlay(sec) {
    const st = sec.querySelector('.s06-stage');
    const R = st.getBoundingClientRect();
    const eo = sec.querySelector('.s06-uo'), ei = sec.querySelector('.s06-ui');
    if (!R.width || !eo || !ei) return false;
    const k = 1700 / R.width;
    // the outer formula may still be rising (data-step "rise" transition, up to 16 px) when step 3 is pressed quickly:
    // measure its resting place by removing the current translate of the revealed ancestor (layout px -> stage px)
    const rest = el => {
      const a = el.closest('[data-step]');
      if (!a || !st.contains(a)) return { dx: 0, dy: 0 };
      const t = getComputedStyle(a).transform;
      if (!t || t === 'none') return { dx: 0, dy: 0 };
      const m = new DOMMatrixReadOnly(t), f = 1700 / (st.offsetWidth || 1700);
      return { dx: m.m41 * f, dy: m.m42 * f };
    };
    const box = el => {
      const r = el.getBoundingClientRect(), o = rest(el);
      return { x: (r.left - R.left) * k - o.dx, y: (r.top - R.top) * k - o.dy, w: r.width * k, h: r.height * k };
    };
    const o = box(eo), i = box(ei);
    if (!o.w || !i.w) return false;
    const c1 = { x: o.x + o.w / 2, y: o.y + o.h / 2, rx: o.w / 2 + 4, ry: o.h / 2 + 5 };
    const c2 = { x: i.x + i.w / 2, y: i.y + i.h / 2, rx: i.w / 2 + 5, ry: i.h / 2 + 4 };
    const stadium = (el, c) => {
      el.setAttribute('x', (c.x - c.rx).toFixed(1)); el.setAttribute('y', (c.y - c.ry).toFixed(1));
      el.setAttribute('width', (2 * c.rx).toFixed(1)); el.setAttribute('height', (2 * c.ry).toFixed(1));
      el.setAttribute('rx', c.ry.toFixed(1));
    };
    stadium(S.circ, c1); stadium(S.circ2, c2);
    // arrow: straight down from the outer circle into the inner box (top border at y = INNER_TOP)
    const sx = c1.x, sy = c1.y + c1.ry + 4, ey = INNER_TOP - 4;
    S.link.setAttribute('d', `M${sx.toFixed(1)},${sy.toFixed(1)} V${(ey - 12).toFixed(1)}`);
    S.head.setAttribute('d', `M${(sx - 9).toFixed(1)},${(ey - 14).toFixed(1)} L${(sx + 9).toFixed(1)},${(ey - 14).toFixed(1)} L${sx.toFixed(1)},${ey.toFixed(1)} Z`);
    return true;
  }

  // ---------- states ----------
  function setState(sec, step) {
    const on = (els, v) => gsap.set(els, { opacity: v ? 1 : 0 });
    // kill every tween touching any target (gsap.killTweensOf(array) can leave delayed per-element tweens alive)
    Deck.kill([S.outbox, S.kern, S.ksum, S.simplex, S.dot, S.wlab, S.ring, S.trail, S.data, S.curve, S.mis, S.mbar, S.circ, S.circ2, S.link, S.head, S.flash].concat(S.crumbs, S.pts, S.dlabs, S.fill, S.band));
    Deck.kill(S.inner);
    Deck.kill([S.inbox, S.flash]);
    gsap.set(S.inner, step >= 2 ? { x: 0, y: 0 } : { x: INNER_DX, y: step === 1 ? INNER_DY : INNER_DY0 });
    gsap.set([S.inbox, S.flash], { attr: { height: step >= 1 ? INNER_H : INNER_H0 } });
    // step >= 1: kernels + simplex
    on([S.kern, S.simplex], step >= 1);
    gsap.set(S.kern.querySelectorAll('.s06-krow, .s06-ksum'), { opacity: 1, x: 0 });
    // step >= 2: outer box + data + iterations done
    on(S.outbox, step >= 2);
    gsap.set(S.outbox, { drawSVG: step >= 2 ? '100%' : '0%' });
    on(S.data, step >= 2);
    on(S.pts, 1); on(S.dlabs, 1); on(S.mis, 1);
    gsap.set(S.curve, { drawSVG: '100%' });
    on(S.crumbs, step >= 2); on(S.trail, step >= 2); on(S.ring, step >= 2); gsap.set(S.ring, { attr: { r: 20 } });
    gsap.set(S.crumbs, { scale: 1, transformOrigin: '50% 50%' });
    S.trail.setAttribute('points', step >= 2 ? [W_1].concat(PATH).map(w => bary(w).join(',')).join(' ') : '');
    on([S.dot, S.wlab], 1);
    gsap.set(S.flash, { opacity: 0 });
    S.brick.classList.remove('is-solving');
    drawW(step >= 2 ? W_S : W_1);
    // step >= 3: overlay
    const ok = step >= 3 && placeOverlay(sec);
    on([S.circ, S.circ2, S.link, S.head], ok);
    gsap.set([S.circ, S.link], { drawSVG: '100%' });
  }

  function animate(sec, step) {
    setState(sec, step - 1);
    tl = gsap.timeline();
    if (step === 1) {
      const rows = S.kern.querySelectorAll('.s06-krow');
      // the box opens downwards to make room for kernels + simplex
      tl.to(S.inner, { y: INNER_DY, duration: 0.7, ease: 'power3.inOut' }, 0)
        .to([S.inbox, S.flash], { attr: { height: INNER_H }, duration: 0.7, ease: 'power3.inOut' }, 0)
        .set(S.kern, { opacity: 1 }, 0.35)
        .fromTo(S.simplex, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.35)
        .fromTo(rows, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.12 }, 0.35)
        .fromTo(S.ksum, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.8);
      const p = { a: W_C[0], b: W_C[1], c: W_C[2] };
      drawW(W_C);
      tl.to(p, { a: W_1[0], b: W_1[1], c: W_1[2], duration: 1.6, ease: 'power2.inOut', onUpdate: () => drawW([p.a, p.b, p.c]) }, 1.0);
    } else if (step === 2) {
      drawW(W_1);
      tl.to(S.inner, { x: 0, y: 0, duration: 0.9, ease: 'power3.inOut' }, 0)
        .set(S.outbox, { opacity: 1, drawSVG: '0%' }, 0.25)
        .to(S.outbox, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' }, 0.25)
        .set(S.data, { opacity: 1 }, 0.2)
        .set([S.pts, S.dlabs, S.mis], { opacity: 0 }, 0.2)
        .set(S.curve, { drawSVG: '0%' }, 0.2)
        .to(S.pts, { opacity: 1, duration: 0.35, stagger: 0.06 }, 0.3)
        .to(S.dlabs[0], { opacity: 1, duration: 0.4 }, 0.6)
        .to(S.curve, { drawSVG: '100%', duration: 0.7, ease: 'power1.inOut' }, 0.8)
        .to([S.dlabs[1], S.mis], { opacity: 1, duration: 0.4 }, 1.2);
      // outer iterations: each hop = one inner OC solve
      const brick = S.brick;
      const pts = [W_1].concat(PATH);
      let t0 = 2.1;
      S.trail.setAttribute('points', bary(W_1).join(','));
      tl.set(S.trail, { opacity: 1 }, t0);
      for (let k = 1; k < pts.length; k++) {
        const from = pts[k - 1], to = pts[k];
        const p = { s: 0 };
        tl.set(S.crumbs[k - 1], { opacity: 1, scale: 0.4, transformOrigin: '50% 50%' }, t0)
          .to(S.crumbs[k - 1], { scale: 1, duration: 0.25 }, t0)
          .fromTo(S.flash, { opacity: 0.75 }, { opacity: 0, duration: 0.45, ease: 'power1.out' }, t0)
          .call(() => brick.classList.add('is-solving'), null, t0)
          .call(() => brick.classList.remove('is-solving'), null, t0 + 0.3)
          .to(p, {
            s: 1, duration: 0.42, ease: 'power2.inOut',
            onUpdate: () => drawW(from.map((v, m) => v + (to[m] - v) * p.s)),
            onComplete: () => { S.trail.setAttribute('points', pts.slice(0, k + 1).map(w => bary(w).join(',')).join(' ')); },
          }, t0 + 0.08);
        t0 += 0.56;
      }
      tl.fromTo(S.ring, { attr: { r: 40 }, opacity: 0 }, { attr: { r: 20 }, opacity: 1, duration: 0.5 }, t0);
    } else if (step === 3) {
      const ok = placeOverlay(sec);
      if (!ok) { setState(sec, 3); return; }
      tl.set([S.circ, S.link], { opacity: 1, drawSVG: '0%' })
        .to(S.circ, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' }, 0.15)
        .to(S.link, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, 0.8)
        .to(S.head, { opacity: 1, duration: 0.2 }, 1.3)
        .to(S.circ2, { opacity: 1, duration: 0.5 }, 1.3)
        .fromTo(S.flash, { opacity: 0 }, { opacity: 0.7, duration: 0.25, yoyo: true, repeat: 1 }, 1.45);
    }
  }

  Deck.register('s06', {
    steps: 3,
    init(sec) { build(sec); setState(sec, 0); },
    go(step, ctx) {
      if (tl) { tl.kill(); tl = null; }
      if (ctx.instant || ctx.prev !== step - 1 || step === 0) setState(ctx.sec, step);
      else animate(ctx.sec, step);
    },
    leave() { if (tl) { tl.kill(); tl = null; } },
  });
})();
