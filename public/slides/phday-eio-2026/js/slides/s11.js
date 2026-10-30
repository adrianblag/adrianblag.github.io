/* S11 — Discretise, then optimise (schematic).
   step 0  a continuous control u(t)
   step 1  u(t) becomes N piecewise-constant steps (the curve itself morphs); PWL inset
   step 2  three transcriptions: CVP (one integrated arc from x0), multiple shooting
           (free node states + continuity gaps), full discretisation (greyed, "-> later")
   step 3  the three pipelines (CSS reveal in the HPC method colours) */
(function () {
  'use strict';
  const S = (t, a, p) => Deck.svg(t, a, p);
  const st = {};
  let tl = null;

  // ---------- illustrative shapes (schematic, not data) ----------
  const ufun = t => 0.14 + 0.74 * Math.exp(-Math.pow((t - 0.3) / 0.18, 2)) + 0.16 * t;   // control
  const xfun = t => 0.1 + 0.72 * (1 - Math.exp(-2.6 * t)) + 0.06 * Math.sin(7 * t);       // a state
  const N = 8, M = 12;                                   // PWC intervals, points per interval (for the morph)

  // ---------- left: u(t) -> PWC ----------
  function buildU(svg) {
    const L = 56, R = 470, T = 36, B = 280;
    const xs = d3.scaleLinear().domain([0, 1]).range([L, R]);
    const ys = d3.scaleLinear().domain([0, 1.05]).range([B, T]);
    st.uxs = xs; st.uys = ys;
    const g = S('g', {}, svg);
    // interval grid (step 1)
    st.ugrid = S('g', {}, g);
    for (let k = 1; k < N; k++) S('line', { class: 's11-grid k', x1: xs(k / N), x2: xs(k / N), y1: T - 6, y2: B }, st.ugrid);
    // axes
    S('path', { class: 's11-ax', d: `M${L},${T - 18} L${L},${B} L${R + 6},${B}` }, g);
    const tu = S('text', { class: 's11-axu', x: L + 10, y: T - 10 }, g); tu.textContent = 'u(t)';
    const t0 = S('text', { class: 's11-axt', x: L, y: B + 30, 'text-anchor': 'middle' }, g);
    t0.innerHTML = 't<tspan baseline-shift="sub" font-size="19">0</tspan>';
    const tf = S('text', { class: 's11-axt', x: R, y: B + 30, 'text-anchor': 'middle' }, g);
    tf.innerHTML = 't<tspan baseline-shift="sub" font-size="19">f</tspan>';
    // interval ticks on the time axis (step 1)
    for (let k = 1; k < N; k++) S('line', { class: 's11-ax', x1: xs(k / N), x2: xs(k / N), y1: B, y2: B + 8 }, st.ugrid);
    // ghost of the continuous curve (visible once it has become steps)
    const dense = d3.range(0, 1.0001, 0.005).map(t => [xs(t), ys(ufun(t))]);
    st.ughost = S('path', { class: 's11-ughost', d: d3.line()(dense) }, g);
    // the curve that morphs: N intervals x M points; boundary points duplicated so that the steps get vertical jumps
    st.upath = S('path', { class: 's11-ucurve' }, g);
    st.uMorph = { p: 0 };

    // PWL inset (step 1), top-right corner where the curve is low
    const ix = 296, iy = 26, iw = 176, ih = 116;
    st.inset = S('g', {}, g);
    S('rect', { class: 's11-inset-bg', x: ix, y: iy, width: iw, height: ih, rx: 12 }, st.inset);
    S('text', { class: 's11-inset-t', x: ix + 14, y: iy + 28 }, st.inset).textContent = 'PWL';
    const ixs = d3.scaleLinear().domain([0, 1]).range([ix + 16, ix + iw - 14]);
    const iys = d3.scaleLinear().domain([0, 1.05]).range([iy + ih - 12, iy + 36]);
    S('path', { class: 's11-inset-ghost', d: d3.line()(d3.range(0, 1.0001, 0.01).map(t => [ixs(t), iys(ufun(t))])) }, st.inset);
    const nodes = d3.range(N + 1).map(k => [ixs(k / N), iys(ufun(k / N))]);
    S('path', { class: 's11-inset-pwl', d: d3.line()(nodes) }, st.inset);
    nodes.forEach(p => S('circle', { class: 's11-inset-dot', cx: p[0], cy: p[1], r: 4 }, st.inset));
  }
  function uPathD(p) {
    const xs = st.uxs, ys = st.uys, h = 1 / N, pts = [];
    for (let k = 0; k < N; k++) {
      const v = ufun((k + 0.5) * h);
      for (let j = 0; j < M; j++) {
        const t = k * h + (j / (M - 1)) * h, c = ufun(t);
        pts.push([xs(t), ys(c + p * (v - c))]);
      }
    }
    return d3.line()(pts);
  }
  function setU(p) { st.uMorph.p = p; st.upath.setAttribute('d', uPathD(p)); }

  // ---------- right: mini panels ----------
  const P = { L: 34, R: 318, XT: 12, XB: 100, UT: 116, UB: 146, AX: 158, NI: 5 };
  const UV = [0.75, 0.35, 0.85, 0.5, 0.2];
  const pxs = d3.scaleLinear().domain([0, 1]).range([P.L, P.R]);
  const pyx = v => P.XB - v * (P.XB - P.XT);
  const pyu = v => P.UB - v * (P.UB - P.UT);
  function frame(g, opts) {
    for (let k = 1; k < P.NI; k++) S('line', { class: 's11-m-grid', x1: pxs(k / P.NI), x2: pxs(k / P.NI), y1: P.XT - 4, y2: P.AX }, g);
    S('line', { class: 's11-m-ax', x1: P.L, x2: P.R + 4, y1: P.AX, y2: P.AX }, g);
    S('text', { class: 's11-m-lab x', x: 6, y: P.XT + 26 }, g).textContent = 'x';
    S('text', { class: 's11-m-lab u', x: 6, y: P.UB - 2 }, g).textContent = 'u';
    const a = S('text', { class: 's11-m-t', x: P.L, y: 184, 'text-anchor': 'middle' }, g);
    a.innerHTML = 't<tspan baseline-shift="sub" font-size="19">0</tspan>';
    const b = S('text', { class: 's11-m-t', x: P.R, y: 184, 'text-anchor': 'middle' }, g);
    b.innerHTML = 't<tspan baseline-shift="sub" font-size="19">f</tspan>';
    // control steps (decision variables in every transcription)
    const up = [];
    UV.forEach((v, k) => { up.push([pxs(k / P.NI), pyu(v)], [pxs((k + 1) / P.NI), pyu(v)]); });
    S('path', { class: 's11-m-u', d: d3.line()(up) }, g);
  }
  const xLine = (t0, t1, f) => d3.line()(d3.range(0, 1.0001, 0.02).map(s => { const t = t0 + s * (t1 - t0); return [pxs(t), pyx(f(t))]; }));

  function buildCVP(svg) {
    const g = S('g', {}, svg); frame(g);
    // free final time: t_f is a decision variable too
    S('line', { class: 's11-m-tf', x1: P.R, x2: P.R, y1: P.XT - 4, y2: P.AX }, g);
    st.cvpArc = S('path', { class: 's11-m-x', d: xLine(0, 1, xfun) }, g);
    st.cvpX0 = S('circle', { class: 's11-m-x0', cx: pxs(0), cy: pyx(xfun(0)), r: 7 }, g);
    const l = S('text', { class: 's11-m-t', x: pxs(0) - 11, y: pyx(xfun(0)) + 7, 'text-anchor': 'end' }, g);
    l.innerHTML = 'x<tspan baseline-shift="sub" font-size="19">0</tspan>';
    st.cvpX0lab = l;
  }
  function buildMS(svg) {
    const g = S('g', {}, svg); frame(g);
    const off = [0, 0.2, -0.17, 0.17, -0.14], h = 1 / P.NI, decay = 2.5;
    const seg = k => t => xfun(t) + off[k] * Math.exp(-decay * (t - k * h));
    st.msGaps = []; st.msSegs = []; st.msNodes = [];
    for (let k = 0; k < P.NI - 1; k++) {
      const t1 = (k + 1) * h, e = seg(k)(t1), s = xfun(t1) + off[k + 1];
      st.msGaps.push(S('line', { class: 's11-m-gap', x1: pxs(t1), x2: pxs(t1), y1: pyx(e), y2: pyx(s) }, g));
    }
    for (let k = 0; k < P.NI; k++) st.msSegs.push(S('path', { class: 's11-m-x', d: xLine(k * h, (k + 1) * h, seg(k)) }, g));
    for (let k = 0; k < P.NI; k++) {
      const c = S('circle', { class: k === 0 ? 's11-m-x0' : 's11-m-node', cx: pxs(k * h), cy: pyx(xfun(k * h) + off[k]), r: k === 0 ? 7 : 6.5 }, g);
      st.msNodes.push(c);
    }
  }
  function buildFD(svg) {
    const g = S('g', {}, svg); frame(g);
    const ts = [];
    for (let k = 0; k < P.NI; k++) for (let j = 0; j < 3; j++) ts.push((k + j / 3) / P.NI);
    ts.push(1);
    S('path', { class: 's11-m-poly', d: d3.line()(ts.map(t => [pxs(t), pyx(xfun(t))])) }, g);
    st.fdDots = ts.map(t => S('circle', { class: 's11-m-cdot', cx: pxs(t), cy: pyx(xfun(t)), r: 4.5 }, g));
    ts.slice(0, -1).forEach(t => st.fdDots.push(S('circle', { class: 's11-m-udot', cx: pxs(t), cy: pyu(UV[Math.min(P.NI - 1, Math.floor(t * P.NI + 1e-9))]), r: 4 }, g)));
  }

  Deck.register('s11', {
    steps: 3,
    init(sec) {
      buildU(sec.querySelector('.s11-usvg'));
      buildCVP(sec.querySelector('.s11-mcvp'));
      buildMS(sec.querySelector('.s11-mms'));
      buildFD(sec.querySelector('.s11-mfd'));
    },
    go(step, ctx) {
      const I = ctx.instant;
      if (tl) { tl.kill(); tl = null; }
      const panelEls = [].concat([st.cvpArc, st.cvpX0, st.cvpX0lab], st.msGaps, st.msSegs, st.msNodes, st.fdDots);
      gsap.killTweensOf([st.uMorph, st.ughost, st.ugrid, st.inset].concat(panelEls));

      // ---- step 1: continuous -> PWC (+ PWL inset)
      const pwc = step >= 1;
      if (pwc && step === 1 && ctx.prev === 0 && !I) {
        setU(0);
        gsap.set([st.ughost, st.ugrid], { opacity: 0 });
        gsap.set(st.inset, { opacity: 0, scale: 0.9, transformOrigin: '100% 0%' });
        tl = gsap.timeline({ delay: 0.15 });
        tl.to(st.ugrid, { opacity: 1, duration: 0.5 })
          .to(st.ughost, { opacity: 0.55, duration: 0.4 }, '<')
          .to(st.uMorph, { p: 1, duration: 1.2, ease: 'power3.inOut', onUpdate: () => setU(st.uMorph.p) }, '-=0.1')
          .to(st.inset, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, '-=0.2');
      } else {
        setU(pwc ? 1 : 0);
        gsap.set(st.ughost, { opacity: pwc ? 0.55 : 0 });
        gsap.set(st.ugrid, { opacity: pwc ? 1 : 0 });
        gsap.set(st.inset, { opacity: pwc ? 1 : 0, scale: 1 });
      }

      // ---- step 2: the three transcriptions draw themselves
      if (step === 2 && ctx.prev === 1 && !I) {
        gsap.set([st.cvpArc].concat(st.msSegs), { drawSVG: '0%' });
        gsap.set([st.cvpX0, st.cvpX0lab].concat(st.msGaps, st.msNodes, st.fdDots), { opacity: 0 });
        tl = gsap.timeline({ delay: 0.35 });
        tl.to([st.cvpX0, st.cvpX0lab], { opacity: 1, duration: 0.3 })
          .to(st.cvpArc, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' })
          .to(st.msNodes, { opacity: 1, duration: 0.25, stagger: 0.08 }, 0.35)
          .to(st.msSegs, { drawSVG: '100%', duration: 0.4, stagger: 0.16, ease: 'power1.inOut' }, 0.6)
          .to(st.msGaps, { opacity: 1, duration: 0.3, stagger: 0.12 }, 1.2)
          .to(st.fdDots, { opacity: 1, duration: 0.25, stagger: 0.02 }, 1.0);
      } else {
        gsap.set([st.cvpArc].concat(st.msSegs), { drawSVG: '100%' });
        gsap.set([st.cvpX0, st.cvpX0lab].concat(st.msGaps, st.msNodes, st.fdDots), { opacity: 1 });
      }
      // step 3 (pipelines) is pure CSS: .s11-pipe.is-on
    },
    leave() { if (tl) { tl.kill(); tl = null; } },
  });
})();
