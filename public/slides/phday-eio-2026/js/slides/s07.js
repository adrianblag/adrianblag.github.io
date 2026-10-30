/* S7 — L2 · Why the objective is hard to identify  (schematic; reuses the S6 simplex language)
   step 0  simplex with an ILLUSTRATIVE misfit heat-map (precomputed here, d3-contour): a flat valley.
           Scaling caption. Column centred on the slide.
   step 1  row slides left; two distant weight vectors w, w' on the valley (a dot travels along it);
           their optimal controls u*(t) overlay exactly (solid vs dashed)
   step 2  row slides to its final place; a control with an arc on the bound u_max, highlighted:
           "set by the constraint, not by w" (curves for other w differ off the arc, coincide on it)
   step 3  tools + Hamiltonian/costate line (generic data-step); the non-identifiable chip lights (@3)
   All shapes are made up for illustration (the slide is tagged "schematic", the map "illustrative"). */
(function () {
  'use strict';
  const svg = (t, a, p) => Deck.svg(t, a, p);
  const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  const txt = (p, x, y, s, c, a) => { const t = svg('text', Object.assign({ x, y }, a || {}), p); if (c) t.setAttribute('class', c); t.textContent = s; return t; };
  const tspan = (p, s, st) => { const t = svg('tspan', {}, p); t.textContent = s; if (st) Object.assign(t.style, st); return t; };
  const pathOf = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  const samples = n => { const a = []; for (let i = 0; i <= n; i++) a.push(i / n); return a; };

  // ---------- (a) simplex + illustrative misfit ----------
  const VTX = [[62, 415], [462, 415], [262, 68.6]];               // L1, L2, L3 (equilateral, side 400)
  const KCLS = ['s07-k1', 's07-k2', 's07-k3'];
  const P0 = lerp(VTX[0], VTX[2], 0.5), P2 = lerp(VTX[1], VTX[2], 0.36), PC = [262, 372];   // valley floor (quadratic Bézier)
  const bez = s => { const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; return [a * P0[0] + b * PC[0] + c * P2[0], a * P0[1] + b * PC[1] + c * P2[1]]; };
  const S_W = 0.16, S_W2 = 0.86;                                     // the two distant points
  const VAL = samples(240).map(bez);
  function misfit(x, y) {                                            // steep across the valley, almost flat along it
    let best = Infinity, bs = 0;
    for (let i = 0; i < VAL.length; i++) {
      const dx = x - VAL[i][0], dy = y - VAL[i][1], d = dx * dx + dy * dy;
      if (d < best) { best = d; bs = i / (VAL.length - 1); }
    }
    return best / (38 * 38) + 0.3 * (bs - 0.5) * (bs - 0.5);
  }
  const THR = [0.1, 0.4, 1.1, 2.2, 3.8, 6, 9, 13, 18];
  const bandFill = k => `color-mix(in srgb, var(--c-inv) ${k < 0 ? 0 : 10 + 9 * k}%, var(--surface))`;   // k = -1: valley floor

  // ---------- (b) identical optimal controls ----------
  const BX = t => 44 + t * 416, BY = u => 392 - u * 290;
  const uB = t => 0.08 + 0.78 * Math.exp(-Math.pow((t - 0.3) / 0.14, 2)) + 0.42 * Math.exp(-Math.pow((t - 0.68) / 0.12, 2));

  // ---------- (c) constraint-driven arc ----------
  const UMAX = 0.74;
  const bump = (a, b, c, s) => t => a + b * Math.exp(-Math.pow((t - c) / s, 2));
  const MAIN = bump(0.06, 1.1, 0.47, 0.22);                         // on the bound for t in ~[0.32, 0.62]
  const GHOSTS = [bump(0.22, 1.15, 0.46, 0.2), bump(0, 0.98, 0.485, 0.32)];   // other w: differ off the arc, same on it
  const sat = f => t => Math.min(UMAX, f(t));
  function arcOf(f) {                                                // [ta, tb] where f >= UMAX
    let ta = null, tb = null;
    samples(2000).forEach(t => { if (f(t) >= UMAX) { if (ta === null) ta = t; tb = t; } });
    return [ta, tb];
  }

  const ROWX = [530, 265, 0, 0];                                     // keep the visible columns centred
  const S = {};
  let tl = null;

  function build(sec) {
    S.row = sec.querySelector('.s07-row');

    // ======== (a) map ========
    const m = sec.querySelector('.s07-map');
    const defs = svg('defs', {}, m);
    const cp = svg('clipPath', { id: 's07-tri-clip' }, defs);
    svg('polygon', { points: VTX.map(p => p.join(',')).join(' ') }, cp);
    const t0 = txt(m, 0, 26, '', 'ptitle');
    tspan(t0, 'misfit on Δ');
    const sub = tspan(t0, '  · illustrative'); sub.setAttribute('class', 'sub');

    // heat-map: grid over the triangle's bounding box -> filled contour bands, clipped to Δ
    const CELL = 4, GX0 = 54, GY0 = 60, NX = 104, NY = 92;
    const vals = new Float64Array(NX * NY);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) vals[j * NX + i] = misfit(GX0 + (i + 0.5) * CELL, GY0 + (j + 0.5) * CELL);
    const gclip = svg('g', { 'clip-path': 'url(#s07-tri-clip)' }, m);
    const base = svg('polygon', { points: VTX.map(p => p.join(',')).join(' ') }, gclip);
    base.style.fill = bandFill(-1);
    const gb = svg('g', { transform: `translate(${GX0},${GY0}) scale(${CELL})` }, gclip);
    const geo = d3.geoPath();
    d3.contours().size([NX, NY]).thresholds(THR)(vals).forEach((c, k) => {
      const p = svg('path', { d: geo(c) }, gb);
      p.style.fill = bandFill(k);
    });
    // iso-weight grid + outline (same language as S6)
    for (let i = 1; i < 4; i++) {
      const f = i / 4;
      [[0, 1, 2], [1, 2, 0], [2, 0, 1]].forEach(([a, b, c]) => {
        const P1 = lerp(VTX[a], VTX[b], f), Q1 = lerp(VTX[a], VTX[c], f);
        svg('line', { x1: P1[0], y1: P1[1], x2: Q1[0], y2: Q1[1], class: 'gl' }, m);
      });
    }
    svg('polygon', { points: VTX.map(p => p.join(',')).join(' '), class: 'tri' }, m);
    VTX.forEach((p, k) => svg('circle', { cx: p[0], cy: p[1], r: 9, class: 'vtx ' + KCLS[k] }, m));
    [[40, 424, 'end'], [484, 424, 'start'], [284, 76, 'start']].forEach((v, k) => txt(m, v[0], v[1], 'L' + '₁₂₃'[k], 'vlab', { 'text-anchor': v[2] }));
    txt(m, 380, 238, 'Δ', 'delta');
    // legend (discrete swatches = the bands)
    const LX = 566, LY0 = 132, LH = 22;
    for (let k = THR.length - 1, r = 0; k >= -1; k--, r++) {
      const s = svg('rect', { x: LX, y: LY0 + r * LH, width: 24, height: LH, class: 'leg-r' }, m);
      s.style.fill = bandFill(k);
    }
    txt(m, LX + 34, LY0 + 17, 'high', 'leg-t');
    txt(m, LX + 34, LY0 + (THR.length + 1) * LH - 5, 'low', 'leg-t');

    // valley floor + label
    S.valley = svg('path', { d: pathOf(VAL), class: 'valley' }, m);
    const vm = bez(0.5);
    txt(m, vm[0] - 6, vm[1] + 46, 'flat valley', 'vlab2 halo', { 'text-anchor': 'middle' });
    // trace between the two points (step 1)
    S.trace = svg('path', { d: pathOf(samples(120).map(s => bez(S_W + (S_W2 - S_W) * s))), class: 'trace' }, m);
    S.trav = svg('circle', { cx: 0, cy: 0, r: 8, class: 'trav' }, m);
    const pw = bez(S_W), pw2 = bez(S_W2);
    S.wg = svg('g', {}, m);
    S.wpt = svg('circle', { cx: pw[0], cy: pw[1], r: 11, class: 'wpt' }, S.wg);
    S.wlab = txt(S.wg, pw[0], pw[1] - 24, 'w', 'wlab halo', { 'text-anchor': 'middle' });
    S.w2g = svg('g', {}, m);
    S.w2pt = svg('path', { d: `M${pw2[0]},${pw2[1] - 15} L${pw2[0] + 15},${pw2[1]} L${pw2[0]},${pw2[1] + 15} L${pw2[0] - 15},${pw2[1]} Z`, class: 'wpt' }, S.w2g);
    S.w2lab = txt(S.w2g, pw2[0] - 2, pw2[1] - 26, 'w′', 'wlab halo', { 'text-anchor': 'middle' });

    // ======== (b) identical optimal controls ========
    const b = sec.querySelector('.s07-same');
    const tb = txt(b, 0, 26, '', 'ptitle');
    tspan(tb, 'optimal control ');
    tspan(tb, 'u', { fill: 'var(--c-learn)', fontStyle: 'italic' });
    tspan(tb, '*(t)');
    svg('path', { d: 'M44,64 V392 H474', class: 'ax' }, b);
    svg('path', { d: 'M38,76 L44,64 L50,76 M462,386 L474,392 L462,398', class: 'ax' }, b);
    txt(b, 482, 400, 't', 'axlab');
    const curve = samples(140).map(t => [BX(t), BY(uB(t))]);
    S.uw = svg('path', { d: pathOf(curve), class: 'uw' }, b);
    S.uw2 = svg('path', { d: pathOf(curve), class: 'uw2', 'clip-path': 'url(#s07-wipe-b)' }, b);   // dashed: revealed by a wipe (drawSVG would eat the dashes)
    S.wipeB = wipe(b, 's07-wipe-b');
    // direct legend: marker shapes match the points on the simplex
    S.legw = svg('g', {}, b);
    svg('circle', { cx: 300, cy: 92, r: 8, class: 'mk' }, S.legw);
    svg('path', { d: 'M318,92 H372', class: 'uw' }, S.legw);
    txt(S.legw, 386, 100, 'w', 'legl');
    S.legw2 = svg('g', {}, b);
    svg('path', { d: 'M300,118 L310,128 L300,138 L290,128 Z', class: 'mk' }, S.legw2);
    svg('path', { d: 'M318,128 H372', class: 'uw2' }, S.legw2);
    txt(S.legw2, 386, 136, 'w′', 'legl');
    S.pill = svg('g', {}, b);
    svg('rect', { x: 284, y: 156, width: 150, height: 38, rx: 19, class: 'pill' }, S.pill);
    txt(S.pill, 359, 182, 'identical', 'pill-t', { 'text-anchor': 'middle' });

    // ======== (c) constraint-driven arc ========
    const c = sec.querySelector('.s07-arc');
    txt(c, 0, 26, 'control with an active bound', 'ptitle');
    const yB = BY(UMAX);
    const [ta, tb2] = arcOf(MAIN);
    const xa = BX(ta), xb = BX(tb2);
    S.band = svg('rect', { x: xa, y: yB - 14, width: xb - xa, height: 392 - yB + 14, class: 'band' }, c);
    svg('path', { d: 'M44,64 V392 H474', class: 'ax' }, c);
    svg('path', { d: 'M38,76 L44,64 L50,76 M462,386 L474,392 L462,398', class: 'ax' }, c);
    txt(c, 482, 400, 't', 'axlab');
    S.bound = svg('line', { x1: 44, y1: yB, x2: 470, y2: yB, class: 'bound', 'clip-path': 'url(#s07-wipe-c)' }, c);
    S.wipeC = wipe(c, 's07-wipe-c');
    S.blab = txt(c, 470, yB - 12, '', 'blab', { 'text-anchor': 'end' });
    tspan(S.blab, 'u');
    const sb = tspan(S.blab, 'max'); sb.setAttribute('dy', '6'); sb.style.fontSize = '19px'; sb.style.fontStyle = 'normal';
    S.ghosts = GHOSTS.map(f => svg('path', { d: pathOf(samples(200).map(t => [BX(t), BY(sat(f)(t))])), class: 'ghost' }, c));
    S.glab = txt(c, 472, 278, '', 'glab', { 'text-anchor': 'end' });
    tspan(S.glab, 'other ');
    tspan(S.glab, 'w', { fill: 'var(--c-inv)', fontStyle: 'italic' });
    S.main = svg('path', { d: pathOf(samples(240).map(t => [BX(t), BY(sat(MAIN)(t))])), class: 'main' }, c);
    S.hl = svg('path', { d: `M${xa.toFixed(1)},${yB} H${xb.toFixed(1)}`, class: 'hl' }, c);
    const yk = yB - 46;
    S.brk = svg('path', { d: `M${xa.toFixed(1)},${yk + 14} V${yk} H${xb.toFixed(1)} V${yk + 14}`, class: 'brk' }, c);
    const xm = Math.max(170, Math.min(320, (xa + xb) / 2));
    S.hlab = txt(c, xm, yk - 14, '', 'hlab', { 'text-anchor': 'middle' });
    tspan(S.hlab, 'set by the constraint, not by ');
    tspan(S.hlab, 'w', { fill: 'var(--c-inv)', fontStyle: 'italic', fontWeight: '600' });
  }

  function wipe(parent, id) {                                        // clip rect revealing left -> right
    const cp = svg('clipPath', { id }, svg('defs', {}, parent));
    return svg('rect', { x: 0, y: 0, width: 0, height: 440 }, cp);
  }

  function placeTrav(f) {
    const L = S.trace.getTotalLength();
    const p = S.trace.getPointAtLength(L * f);
    S.trav.setAttribute('cx', p.x); S.trav.setAttribute('cy', p.y);
  }

  // ---------- idempotent state ----------
  function setState(step) {
    const on = (els, v) => gsap.set(els, { opacity: v ? 1 : 0 });
    const all = [S.row, S.trace, S.trav, S.wg, S.wpt, S.wlab, S.w2g, S.w2pt, S.w2lab, S.uw, S.wipeB, S.legw, S.legw2, S.pill,
      S.band, S.wipeC, S.blab, S.main, S.glab, S.hl, S.brk, S.hlab].concat(S.ghosts);
    Deck.kill(all);   // every tween on any target (gsap.killTweensOf(array) can leave delayed per-element tweens alive)
    gsap.set(S.row, { x: ROWX[Math.min(step, 3)] });
    // (a)
    on([S.wg, S.w2g, S.trace, S.wlab, S.w2lab], step >= 1);
    gsap.set([S.wpt, S.w2pt], { scale: 1, opacity: 1, transformOrigin: '50% 50%' });
    gsap.set(S.trace, { drawSVG: step >= 1 ? '100%' : '0%' });
    on(S.trav, false);
    // (b)
    gsap.set(S.uw, { drawSVG: step >= 1 ? '100%' : '0%' });
    gsap.set(S.wipeB, { attr: { width: step >= 1 ? 490 : 0 } });
    on([S.legw, S.legw2, S.pill], step >= 1);
    // (c)
    gsap.set([S.main].concat(S.ghosts), { drawSVG: step >= 2 ? '100%' : '0%' });
    gsap.set(S.wipeC, { attr: { width: step >= 2 ? 490 : 0 } });
    gsap.set([S.hl, S.brk], { drawSVG: '0% 100%' });
    on([S.band, S.blab, S.glab, S.hl, S.brk, S.hlab], step >= 2);
  }

  function animate(step) {
    setState(step - 1);
    tl = gsap.timeline();
    if (step === 1) {
      const p = { f: 0 };
      tl.to(S.row, { x: ROWX[1], duration: 0.9, ease: 'power3.inOut' }, 0)
        .set(S.wg, { opacity: 1 }, 0.5)
        .fromTo(S.wpt, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.5)
        .to(S.wlab, { opacity: 1, duration: 0.4 }, 0.7)
        .fromTo(S.uw, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.0, ease: 'power1.inOut' }, 0.8)
        .to(S.legw, { opacity: 1, duration: 0.4 }, 1.4)
        // slide along the valley: the misfit barely changes
        .set([S.trav, S.trace], { opacity: 1 }, 1.9)
        .call(() => placeTrav(0), null, 1.9)
        .to(p, {
          f: 1, duration: 1.4, ease: 'power1.inOut',
          onUpdate: () => { gsap.set(S.trace, { drawSVG: '0% ' + (p.f * 100).toFixed(2) + '%' }); placeTrav(p.f); },
        }, 1.9)
        .set(S.trav, { opacity: 0 }, 3.3)
        .set(S.w2g, { opacity: 1 }, 3.3)
        .fromTo(S.w2pt, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out', transformOrigin: '50% 50%' }, 3.3)
        .to(S.w2lab, { opacity: 1, duration: 0.4 }, 3.45)
        .fromTo(S.wipeB, { attr: { width: 30 } }, { attr: { width: 490 }, duration: 1.0, ease: 'power1.inOut' }, 3.5)
        .to(S.legw2, { opacity: 1, duration: 0.4 }, 3.9)
        .to(S.pill, { opacity: 1, duration: 0.5 }, 4.5);
    } else if (step === 2) {
      tl.to(S.row, { x: ROWX[2], duration: 0.9, ease: 'power3.inOut' }, 0)
        .fromTo(S.wipeC, { attr: { width: 30 } }, { attr: { width: 490 }, duration: 0.6, ease: 'power1.inOut' }, 0.5)
        .to(S.blab, { opacity: 1, duration: 0.4 }, 0.9)
        .fromTo(S.ghosts, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.0, ease: 'power1.inOut', stagger: 0.15 }, 0.9)
        .fromTo(S.main, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power1.inOut' }, 1.0)
        .to(S.glab, { opacity: 1, duration: 0.4 }, 1.9)
        .to(S.band, { opacity: 1, duration: 0.5 }, 2.2)
        .set(S.hl, { opacity: 1 }, 2.2)
        .fromTo(S.hl, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.6, ease: 'power2.out' }, 2.2)
        .set(S.brk, { opacity: 1 }, 2.6)
        .fromTo(S.brk, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.5, ease: 'power2.out' }, 2.6)
        .to(S.hlab, { opacity: 1, duration: 0.5 }, 2.8);
    }
  }

  Deck.register('s07', {
    steps: 3,
    init(sec) { build(sec); setState(0); },
    go(step, ctx) {
      if (tl) { tl.kill(); tl = null; }
      if (ctx.instant || ctx.prev !== step - 1 || step === 0 || step > 2) setState(step);
      else animate(step);
    },
    leave() { if (tl) { tl.kill(); tl = null; } },
  });
})();
