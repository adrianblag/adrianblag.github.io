/* B4 — Method search backup: SC Pareto front (J* vs log E[T], bootstrap CI whiskers) + inset J* vs mesh size N.
   Data: DATA.methodsearch.sc_pareto (held-out test) and .sc_scaling.test_points.
   Steps: 0 protocol + baselines (hollow grey) · 1 new methods (magenta), front, inset, SC readout + caveats. */
(function () {
  'use strict';
  // main chart geometry (viewBox 880 x 300)
  const M = { l: 78, r: 864, t: 34, b: 266 };
  // inset geometry (viewBox 400 x 170)
  const I = { l: 58, r: 388, t: 10, b: 138 };
  // thousands separator as on B2/S13 ("4,150 s"); non-breaking space before the unit
  const fmtT = v => (v >= 2 ? (v >= 100 ? d3.format(',')(Math.round(v)) : v.toFixed(1)) : v.toFixed(2)) + ' s';
  const short = n => { const m = /CasADi_(MS|CVP)_N\d+_(PWC|PWL)/.exec(n); return m ? m[1] + ' ' + m[2] : n.replace(/^Baseline_/, '').replace(/_N\d+.*$/, ''); };
  const hits = m => Math.round(m.hit_pct * m.n_starts / 100);
  let S = null;

  function el(tag, attrs, parent, cls, text) {
    const e = Deck.svg(tag, attrs, parent);
    if (cls) e.setAttribute('class', cls);
    if (text != null) e.textContent = text;
    return e;
  }

  function whisker(g, x, y, ci, cls, xmax) {
    const w = el('g', null, g, cls);
    if (!ci || ci[0] == null) return w;
    const a = x(ci[0]);
    const open = ci[1] == null;                 // upper bound infinite -> arrow to the plot edge
    const b = open ? xmax - 10 : x(ci[1]);
    if (!open && b - a < 24) return w;          // CI narrower than the marker: nothing to show
    el('line', { x1: a, x2: b, y1: y, y2: y }, w);
    el('line', { x1: a, x2: a, y1: y - 7, y2: y + 7 }, w);
    if (open) el('path', { d: `M${b},${y - 6} L${b + 10},${y} L${b},${y + 6} Z` }, w, 'b4-arrowhead');
    else el('line', { x1: b, x2: b, y1: y - 7, y2: y + 7 }, w);
    return w;
  }

  function setNew(on) {
    gsap.killTweensOf([S.nm, S.newBits, S.front, S.iLine, S.iPts, S.iBits].flat());
    S.nm.forEach(c => gsap.set(c, { attr: { r: on ? 9 : 0 } }));
    gsap.set(S.newBits, { opacity: on ? 1 : 0 });
    gsap.set(S.front, { drawSVG: on ? '0% 100%' : '0% 0%', opacity: on ? 1 : 0 });
    gsap.set(S.iLine, { drawSVG: on ? '0% 100%' : '0% 0%' });
    S.iPts.forEach(c => gsap.set(c, { attr: { r: on ? 6 : 0 } }));
    gsap.set(S.iBits, { opacity: on ? 1 : 0 });
  }

  function playNew() {
    setNew(false);
    const tl = gsap.timeline();
    tl.to(S.nm, { attr: { r: 9 }, duration: 0.45, stagger: 0.12, ease: 'power2.out' }, 0.1)
      .to(S.newBits, { opacity: 1, duration: 0.5, stagger: 0.05 }, 0.45)
      .set(S.front, { opacity: 1 }, 0.7)
      .fromTo(S.front, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.9, ease: 'power2.inOut' }, 0.7)
      .fromTo(S.iLine, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 1.0, ease: 'power2.inOut' }, 0.9)
      .to(S.iPts, { attr: { r: 6 }, duration: 0.35, stagger: 0.12 }, 0.9)
      .to(S.iBits, { opacity: 1, duration: 0.4 }, 1.3);
    return tl;
  }

  Deck.register('b4', {
    steps: 1,

    init(sec) {
      const D = window.DATA && window.DATA.methodsearch;
      if (!D || !window.d3) return;
      const P = D.sc_pareto.methods;
      const put = (k, v) => sec.querySelectorAll('[data-b4="' + k + '"]').forEach(e => { e.textContent = String(v); });

      // ---------- text from the data file ----------
      const coarse = p => D.all_test[p].methods.find(m => m.family === 'SXTranscription' && m.on_front);
      put('lpn3b_coarse', coarse('LPN3B').ET_s.toFixed(2));
      put('bsub_coarse', coarse('BSUB').ET_s.toFixed(2));
      put('nstarts', P[0].n_starts);
      const mr80 = P.find(m => m.family === 'SXMeshRefine' && m.N === 80);
      put('mr_J', mr80.J_star.toFixed(3));
      put('mr_hits', hits(mr80) + '/' + mr80.n_starts);
      put('mr_ET', fmtT(mr80.ET_s));
      const bases = P.filter(m => m.is_baseline);
      const best = bases.filter(m => m.ET_s != null).sort((a, b) => a.ET_s - b.ET_s)[0];
      put('bl_J', best.J_star.toFixed(3));
      put('bl_hit', best.hit_pct.toFixed(1) + '%');
      put('bl_ET', fmtT(best.ET_s));

      // ---------- main chart ----------
      const svg = sec.querySelector('.b4-svg');
      const x = d3.scaleLog().domain([4, 1.5e5]).range([M.l, M.r]);
      const y = d3.scaleLinear().domain([93.25, 96.0]).range([M.b, M.t]);
      S = { sec, nm: [], newBits: [], iPts: [], iBits: [] };

      const gGrid = el('g', null, svg, 'b4-grid');
      const xMaj = [10, 100, 1e3, 1e4, 1e5];
      const xLab = { 10: '10', 100: '100', 1000: '1k', 10000: '10k', 100000: '100k' };
      x.ticks().forEach(t => el('line', { x1: x(t), x2: x(t), y1: M.t, y2: M.b }, gGrid, xMaj.includes(t) ? 'maj' : null));
      const yT = [93.5, 94.0, 94.5, 95.0, 95.5];
      yT.forEach(t => el('line', { x1: M.l, x2: M.r, y1: y(t), y2: y(t) }, gGrid, 'maj'));

      const gAx = el('g', null, svg, 'b4-axis');
      el('line', { x1: M.l, x2: M.r, y1: M.b, y2: M.b }, gAx);
      el('line', { x1: M.l, x2: M.l, y1: M.t - 6, y2: M.b }, gAx);
      xMaj.forEach(t => {
        el('line', { x1: x(t), x2: x(t), y1: M.b, y2: M.b + 6 }, gAx);
        el('text', { x: x(t), y: M.b + 27, 'text-anchor': 'middle' }, gAx, null, xLab[t]);
      });
      yT.forEach(t => el('text', { x: M.l - 10, y: y(t) + 7, 'text-anchor': 'end' }, gAx, null, t.toFixed(1)));
      const yt = el('text', { x: M.l - 10, y: M.t - 12, 'text-anchor': 'end' }, gAx, 'b4-lab ink');
      el('tspan', { 'font-style': 'italic' }, yt, null, 'J');
      el('tspan', null, yt, null, '*');

      // reference lines: 1 min, 1 h
      const gRef = el('g', null, svg, 'b4-ref');
      [[60, '1 min'], [3600, '1 h']].forEach(([v, s]) => {
        el('line', { x1: x(v), x2: x(v), y1: M.t + 2, y2: M.b }, gRef);
        el('text', { x: x(v), y: M.t - 12 }, gRef, null, s);
      });

      // baselines (step 0): hollow grey, labelled with name + hit rate
      const gBase = el('g', null, svg);
      const placeB = {   // label placement per baseline (avoid overlaps): dx, dy of first line, anchor
        'MS PWL': [0, -36, 'middle'], 'CVP PWL': [0, -36, 'middle'],
        'CVP PWC': [-4, -38, 'middle'], 'MS PWC': [16, -24, 'start'],
      };
      // the two PWC baselines differ by only 0.04 in J* and have near-identical CIs: dodge them vertically
      // (order preserved) so each whisker can be read against its own marker
      const dodgeB = { 'CVP PWC': -10, 'MS PWC': 6 };
      bases.forEach(m => {
        if (m.ET_s == null || m.J_star == null) return;
        const nm = short(m.name), cx = x(m.ET_s), cy = y(m.J_star) + (dodgeB[nm] || 0);
        whisker(gBase, x, cy, m.ET_ci, 'b4-wb', M.r);
        el('circle', { cx, cy, r: 9 }, gBase, 'b4-bm');
        const [dx, dy, anc] = placeB[nm] || [0, -36, 'middle'];
        el('text', { x: cx + dx, y: cy + dy, 'text-anchor': anc }, gBase, 'b4-lab b4-halo', nm);
        el('text', { x: cx + dx, y: cy + dy + 20, 'text-anchor': anc }, gBase, 'b4-lab mut b4-halo', m.hit_pct.toFixed(1) + '% hit');
      });
      const noHit = bases.filter(m => m.ET_s == null);
      noHit.forEach((m, i) => el('text', { x: x(3600) + 14, y: M.t + 30 + i * 22 }, gBase, 'b4-lab mut b4-halo',   // right of the 1 h line
        short(m.name) + ': ' + hits(m) + '/' + m.n_starts + ' hits (no point)'));

      // new methods (step 1): magenta, Pareto front as a step line
      const news = P.filter(m => !m.is_baseline && m.ET_s != null);
      const gNew = el('g', null, svg);
      const front = news.filter(m => m.on_front).sort((a, b) => a.ET_s - b.ET_s);
      const fd = [];
      front.forEach((m, i) => {
        const px = x(m.ET_s), py = y(m.J_star);
        if (i === 0) fd.push(`M${px},${py}`); else fd.push(`H${px}`, `V${py}`);
      });
      S.front = el('path', { d: fd.join(' ') }, gNew, 'b4-front');
      news.forEach(m => S.newBits.push(whisker(gNew, x, y(m.J_star), m.ET_ci, 'b4-wn', M.r)));
      news.slice().sort((a, b) => a.ET_s - b.ET_s).forEach(m => {
        S.nm.push(el('circle', { cx: x(m.ET_s), cy: y(m.J_star), r: 0 }, gNew, 'b4-nm' + (m.on_front ? ' front' : ' off')));
      });
      // labels: benchmark-mesh point, finer-mesh cluster, front
      const n10 = news.find(m => m.N === 10);
      const fine = news.filter(m => m.N > 10);
      const fineN = fine.map(m => m.N);
      const fx = d3.max(fine, m => x(m.ET_s)), fy = d3.mean(fine, m => y(m.J_star));
      S.newBits.push(el('text', { x: x(n10.ET_s), y: y(n10.J_star) + 30, 'text-anchor': 'middle' }, gNew, 'b4-lab ink b4-halo', 'N = ' + n10.N));
      S.newBits.push(el('text', { x: fx + 20, y: fy + 7 }, gNew, 'b4-lab ink b4-halo',
        'finer mesh, N = ' + d3.min(fineN) + '–' + d3.max(fineN)));
      S.newBits.push(el('circle', { cx: x(mr80.ET_s), cy: y(mr80.J_star), r: 15 }, gNew, null));
      S.newBits[S.newBits.length - 1].style.cssText = 'fill:none;stroke:var(--ink-2);stroke-width:1.5';
      // two lines so the label stays clear of the 1 min reference line
      const pf = el('text', { x: x(front[0].ET_s) + 14, y: (y(front[0].J_star) + y(front[1].J_star)) / 2 - 3 }, gNew, 'b4-lab b4-halo');
      el('tspan', null, pf, null, 'Pareto');
      el('tspan', { x: x(front[0].ET_s) + 14, dy: 21 }, pf, null, 'front');
      S.newBits.push(pf);

      // ---------- inset: J* vs mesh size N (held-out test points) ----------
      const isvg = sec.querySelector('.b4-isvg');
      const TP = D.sc_scaling.test_points.filter(m => m.J_star != null);
      const ix = d3.scaleLog().domain([7.5, 650]).range([I.l, I.r]);
      const iy = d3.scaleLinear().domain([94.3, 95.95]).range([I.b, I.t]);
      const gi = el('g', null, isvg, 'b4-grid');
      const nT = [...new Set(TP.map(m => m.N))].sort((a, b) => a - b);
      [94.5, 95.0, 95.5].forEach(t => el('line', { x1: I.l, x2: I.r, y1: iy(t), y2: iy(t) }, gi, 'maj'));
      const gia = el('g', null, isvg, 'b4-axis');
      el('line', { x1: I.l, x2: I.r, y1: I.b, y2: I.b }, gia);
      nT.forEach(n => {
        el('line', { x1: ix(n), x2: ix(n), y1: I.b, y2: I.b + 5 }, gia);
        el('text', { x: ix(n), y: I.b + 25, 'text-anchor': 'middle' }, gia, null, String(n));
      });
      [94.5, 95.0, 95.5].forEach(t => el('text', { x: I.l - 8, y: iy(t) + 7, 'text-anchor': 'end' }, gia, null, t.toFixed(1)));
      el('text', { x: I.r, y: I.b + 25 + 0, 'text-anchor': 'start', dx: 8 }, gia, null, 'N');

      const tpNew = TP.filter(m => !m.is_baseline).sort((a, b) => a.N - b.N);
      const tpBase = TP.filter(m => m.is_baseline);
      const dodge = n => (tpBase.some(b => b.N === n) ? -6 : 0);   // side-by-side when a baseline shares the N
      S.iLine = el('path', { d: d3.line()(tpNew.map(m => [ix(m.N) + dodge(m.N), iy(m.J_star)])) }, isvg, 'b4-front');
      tpBase.forEach(m => {
        el('circle', { cx: ix(m.N) + 6, cy: iy(m.J_star), r: 6 }, isvg, 'b4-bm');
        el('text', { x: ix(m.N) + 18, y: iy(m.J_star) + 19 }, isvg, 'b4-lab mut b4-halo', short(m.name));
      });
      tpNew.forEach(m => S.iPts.push(el('circle', { cx: ix(m.N) + dodge(m.N), cy: iy(m.J_star), r: 0 }, isvg, 'b4-nm')));
      const r80 = el('circle', { cx: ix(80), cy: iy(mr80.J_star), r: 11 }, isvg, null);
      r80.style.cssText = 'fill:none;stroke:var(--ink-2);stroke-width:1.5';
      S.iBits.push(r80);

      setNew(false);
    },

    go(step, ctx) {
      if (!S) return;
      if (S.tl) { S.tl.kill(); S.tl = null; }
      if (step >= 1 && !ctx.instant && ctx.prev === 0) S.tl = playNew();
      else setNew(step >= 1);
    },

    leave() { if (S && S.tl) { S.tl.kill(); S.tl = null; } },
  });
})();
