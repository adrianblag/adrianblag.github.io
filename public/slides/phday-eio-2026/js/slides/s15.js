/* S15 — Where do the starts end?
   Rain plot of the real per-start SC final objectives (CasADi CVP), from DATA.multistart:
     sc_sorted_J (final J of every successful start), configs (counts, best/worst J),
     best_known (best J per problem/param), rel_gaps (other four problems).
   x = final J = survival time t_f (maximised: higher is better).
   Steps: 0 inset: the four other problems are one tight spike each ("all successes agree")
          1 lane CVP · PWC: dots rain into a histogram; the single best start is ringed ("1 of 1000")
          2 lane CVP · PWL: dots rain into a bimodal histogram; zoom with the 1e-4 band
            ("about half within 1e-4", CVP / MS %), best-J lines with the relative gain */
(function () {
  'use strict';

  const W = 1700;
  const P = { x0: 236, x1: 1150 };                  // main J axis (stage px)
  const AX_Y = 656;                                  // main x axis
  const BIN = 0.02;                                  // histogram bin width (J units), main lanes
  const MINH = 3;                                    // min bar height so single starts stay visible
  const DROP_R = 3.6;
  const FALL = 0.55;                                 // s, fall time of one drop
  const T_LAND = [0.6, 2.3];                         // s, landing window of the drops
  const T_END = T_LAND[1] + 0.05;
  const RAIN0 = 0.45;                                // s, rain starts (after the inset has parked)
  const Z = { x: 1206, y: 160, w: 494, h: 440, px0: 1240, px1: 1656, base: 540, maxH: 196, bin: 0.001 };
  const REL_TOL = 1e-4;                              // "within 1e-4 of best" (relative)
  const OTHER = ['LPN3B', 'LPDN4', 'GBD', 'BSUB'];
  const INSET0 = { s: 1.45, x: (1700 - 820 * 1.45) / 2, y: 190 };   // step-0 placement of the inset card
  const AGREE_TOL = 1e-3;                            // script: successful starts agree on J (1e-3)

  const LANES = [
    { key: 'SC_CasADi_CVP_PWC', param: 'PWC', name: 'CVP · PWC', top: 244, base: 404, step: 1 },
    { key: 'SC_CasADi_CVP_PWL', param: 'PWL', name: 'CVP · PWL', top: 500, base: 622, step: 2 },
  ];

  // deterministic PRNG (same rain every time)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function build(sec) {
    const D = window.DATA && window.DATA.multistart;
    if (!D) throw new Error('DATA.multistart missing');
    const cfg = (prob, param, method) => D.configs.find(c => c.problem === prob && c.param === param && c.method === method);
    const svg = sec.querySelector('.s15-svg');
    const el = (tag, attrs, parent, cls) => { const e = Deck.svg(tag, attrs, parent); if (cls) e.setAttribute('class', cls); return e; };
    const S = { lanes: [] };

    // ---------------- inset: the other four problems (relative gap to best J of every successful start)
    {
      const sv = sec.querySelector('.s15-spikes');
      const w = 76, gap = 16, base = 76, top = 14, range = 0.01, nb = 20, bw = w / nb;   // 1 % wide, 0.05 % bins
      let maxGapAll = 0;
      OTHER.forEach((prob, i) => {
        const gaps = [];
        Object.keys(D.rel_gaps).forEach(k => { const g = D.rel_gaps[k]; if (g.problem === prob) gaps.push.apply(gaps, g.gap_sorted); });
        const counts = new Array(nb).fill(0);
        gaps.forEach(g => { counts[Math.min(nb - 1, Math.floor(Math.max(0, g) / (range / nb)))]++; maxGapAll = Math.max(maxGapAll, g); });
        const mx = Math.max.apply(null, counts);
        const ox = i * (w + gap);
        el('line', { x1: ox, x2: ox + w, y1: base, y2: base }, sv, 's15-mini-base');
        el('line', { x1: ox, x2: ox, y1: base, y2: base + 6 }, sv, 's15-mini-tick');
        el('line', { x1: ox + w, x2: ox + w, y1: base, y2: base + 6 }, sv, 's15-mini-tick');
        counts.forEach((c, b) => {               // gap 0 (= best) at the right end, like the main chart
          if (!c) return;
          const h = Math.max(MINH, (base - top) * c / mx);
          const x1 = ox + w - b * bw, x0 = x1 - Math.max(5, bw);
          el('rect', { x: x0, y: base - h, width: x1 - x0, height: h, rx: 1.5 }, sv, 's15-spike');
        });
        el('text', { x: ox + w / 2, y: base + 30 }, sv, 's15-mini-lab').textContent = prob;
      });
      if (maxGapAll > AGREE_TOL) console.warn('[s15] max relative gap of the other problems exceeds 1e-3:', maxGapAll);
    }

    // ---------------- lanes data
    const laneData = LANES.map(L => {
      const c = cfg('SC', L.param, 'CasADi CVP');
      const J = D.sc_sorted_J[L.key].J_desc.slice();
      return Object.assign({}, L, { c, J });
    });
    const allJ = [].concat.apply([], laneData.map(L => [L.c.worst_J, L.c.best_J]));
    const lo = Math.floor((Math.min.apply(null, allJ) - 0.03) * 10) / 10;
    const hi = Math.ceil((Math.max.apply(null, allJ) + 0.01) * 10) / 10;
    const xs = d3.scaleLinear().domain([lo, hi]).range([P.x0, P.x1]);
    S.xs = xs;

    // ---------------- layers
    const gAxis = el('g', {}, svg, 's15-axis');
    S.scaffold = [gAxis];
    S.inset = sec.querySelector('.s15-inset');
    const gLanes = el('g', {}, svg);
    const gBest = el('g', {}, svg);
    const gZoom = el('g', {}, svg);
    const gDrops = el('g', {}, svg);

    // ---------------- main axis
    const t0 = Math.ceil(lo * 5 - 1e-9) / 5;
    for (let v = t0; v <= hi + 1e-9; v += 0.2) {
      const x = xs(v);
      el('line', { x1: x, x2: x, y1: LANES[0].top - 14, y2: AX_Y }, gAxis, 's15-vgrid');
      el('line', { x1: x, x2: x, y1: AX_Y, y2: AX_Y + 8 }, gAxis, 's15-tick');
      el('text', { x, y: AX_Y + 32 }, gAxis).textContent = v.toFixed(1);
    }
    el('line', { x1: P.x0, x2: P.x1, y1: AX_Y, y2: AX_Y }, gAxis, 's15-axline');
    const axt = el('text', { x: (P.x0 + P.x1) / 2, y: AX_Y + 72 }, gAxis, 's15-axt');
    axt.innerHTML = 'final <tspan class="s15-em" font-style="italic">J</tspan> = survival time ' +
      '<tspan font-style="italic">t</tspan><tspan class="s15-sub" dy="6">f</tspan><tspan dy="-6"> · </tspan>' +
      '<tspan class="s15-em">higher is better →</tspan>';

    // ---------------- lanes
    laneData.forEach((L, li) => {
      const g = el('g', {}, gLanes);
      const maxH = L.base - L.top;
      el('line', { x1: P.x0, x2: P.x1, y1: L.base, y2: L.base }, g, 's15-lanebase');
      L.nameEl = el('text', { x: 212, y: L.base - 68 }, g, 's15-lane-name');   // revealed with the lane's data
      L.nameEl.textContent = L.name;
      const sub = el('text', { x: 212, y: L.base - 38 }, g, 's15-lane-sub');
      const nT = el('tspan', {}, sub, 's15-n'); nT.textContent = String(L.c.n_success);
      el('tspan', {}, sub).textContent = ' of ' + L.c.n_starts;
      const sub2 = el('text', { x: 212, y: L.base - 12 }, g, 's15-lane-sub');
      sub2.textContent = 'acceptable';
      L.subG = [sub, sub2]; L.nT = nT;

      // bins
      const nbin = Math.round((hi - lo) / BIN);
      const bins = [];
      L.J.forEach(v => {
        const b = Math.max(0, Math.min(nbin - 1, Math.floor((v - lo) / BIN + 1e-9)));
        (bins[b] = bins[b] || { b, n: 0, land: [] }).n++;
      });
      const live = bins.filter(Boolean);
      const mx = Math.max.apply(null, live.map(q => q.n));
      L.k = maxH / mx;
      const gBars = el('g', {}, g);
      live.forEach(q => {
        q.x0 = xs(lo + q.b * BIN) + 0.8; q.x1 = xs(lo + (q.b + 1) * BIN) - 0.8;
        q.rect = el('rect', { x: q.x0, y: L.base, width: q.x1 - q.x0, height: 0, rx: 1.5 }, gBars, 's15-bar');
        q.hFinal = Math.max(MINH, q.n * L.k);
      });
      L.bins = live;

      // rug (every successful start)
      L.rug = el('g', {}, g);
      L.J.forEach(v => { const x = xs(v); el('line', { x1: x, x2: x, y1: L.base + 6, y2: L.base + 18 }, L.rug, 's15-rug'); });

      // drops: one per successful start, landing on top of its growing bar
      const R = rng(1009 + li * 7919);
      const drops = L.J.map(v => {
        const b = Math.max(0, Math.min(nbin - 1, Math.floor((v - lo) / BIN + 1e-9)));
        return { v, b, t: T_LAND[0] + (T_LAND[1] - T_LAND[0]) * R(), jit: (R() - 0.5), y0: L.top - 40 - R() * 50 };
      });
      const byBin = {};
      drops.forEach(d => { (byBin[d.b] = byBin[d.b] || []).push(d); });
      L.bins.forEach(q => {
        const ds = byBin[q.b].sort((a, b) => a.t - b.t);
        q.land = ds.map(d => d.t);
        ds.forEach((d, r) => {
          const hAt = Math.max(MINH, (r + 1) * L.k);
          d.x = (q.x0 + q.x1) / 2 + d.jit * Math.max(0, (q.x1 - q.x0) - 4);
          d.y1 = L.base - hAt - DROP_R * 0.4;
        });
      });
      drops.forEach(d => {
        d.el = el('circle', { cx: d.x, cy: d.y0, r: DROP_R }, gDrops, 's15-drop');
        d.el.style.opacity = 0; d.vis = false;
      });
      L.drops = drops;
      L.proxy = { t: 0 };
      L.g = g;
      S.scaffold.push(g);
      S.lanes.push(L);
    });

    const A = S.lanes[0], B = S.lanes[1];
    const nWithin = (J, best) => J.filter(v => (best - v) / Math.abs(best) <= REL_TOL).length;   // maximisation

    // ---------------- lane A: best start ringed ("1 of 1000"), spread bracket
    {
      const best = A.c.best_J, x = xs(best), cy = A.base - MINH - 9;
      const g = S.ringG = el('g', {}, gLanes);
      el('circle', { cx: x, cy, r: 6 }, g, 's15-best-dot');
      S.ring = el('circle', { cx: x, cy, r: 17, transform: `rotate(-90 ${x} ${cy})` }, g, 's15-ring');
      S.ringLab = el('g', {}, g);
      el('path', { d: `M${x + 13},${cy - 12}L${x + 38},${cy - 40}H${x + 50}` }, S.ringLab, 's15-ring-ln');
      const nb = nWithin(A.J, best);
      el('text', { x: x + 58, y: cy - 31 }, S.ringLab, 's15-ring-t1').textContent = nb + ' of ' + A.c.n_starts;
      el('text', { x: x + 58, y: cy - 4 }, S.ringLab, 's15-ring-t2').textContent = 'at the best value';

      const x1 = xs(A.c.worst_J), x2 = x, y = A.base + 30;
      S.brG = el('g', {}, gLanes);
      S.br = el('path', { d: `M${x1},${y - 8}V${y}H${x2}V${y - 8}` }, S.brG, 's15-br');
      const t = el('text', { x: (x1 + x2) / 2, y: y + 30 }, S.brG, 's15-br-t');
      t.innerHTML = '<tspan font-style="italic">J</tspan> from <tspan class="s15-v">' + A.c.worst_J.toFixed(3) +
        '</tspan> to <tspan class="s15-v">' + best.toFixed(3) + '</tspan>';
    }

    // ---------------- best-J lines + relative gain (PWC best -> PWL best)
    {
      const bA = A.c.best_J, bB = B.c.best_J;
      const xa = xs(bA), xb = xs(bB), yTop = 190, yA = 204;
      S.bestLn = [
        el('path', { d: `M${xa},${A.base}V${yTop}` }, gBest, 's15-bestln'),
        el('path', { d: `M${xb},${B.base}V${yTop}` }, gBest, 's15-bestln'),
      ];
      S.bestV = [
        el('text', { x: xa, y: yTop - 12 }, gBest, 's15-bestv'),
        el('text', { x: xb, y: yTop - 12 }, gBest, 's15-bestv'),
      ];
      S.bestV[0].textContent = bA.toFixed(3);
      S.bestV[1].textContent = bB.toFixed(3);
      S.gain = el('path', { d: `M${xa + 10},${yA}H${xb - 16}` }, gBest, 's15-gain');
      S.gainH = el('path', { d: `M${xb - 22},${yA - 10}L${xb - 6},${yA}L${xb - 22},${yA + 10}Z` }, gBest, 's15-gain-h');
      const pct = (bB / bA - 1) * 100;
      S.pill = el('g', {}, gBest, 's15-gain-pill');
      const mid = (xa + xb) / 2;
      el('rect', { x: mid - 72, y: yA - 22, width: 144, height: 44, rx: 22 }, S.pill);
      el('text', { x: mid, y: yA + 9 }, S.pill).textContent = '+' + pct.toFixed(2) + ' %';
    }

    // ---------------- lens + zoom panel on the PWL modes
    {
      const J = B.J, best = B.c.best_J;
      const sorted = J.slice().sort((a, b) => a - b);
      const q03 = d3.quantileSorted(sorted, 0.03);
      const zlo = Math.floor(q03 * 200) / 200, zhi = Math.ceil((best + 0.001) * 200) / 200;
      const zx = d3.scaleLinear().domain([zlo, zhi]).range([Z.px0, Z.px1]);
      S.zoomFactor = (Z.px1 - Z.px0) / (zhi - zlo) / ((P.x1 - P.x0) / (hi - lo));

      // lens around the PWL spike in the overview lane
      const lx0 = xs(zlo) - 6, lx1 = xs(zhi) + 6, ly0 = B.top - 16, ly1 = B.base + 24;
      S.lens = el('rect', { x: lx0, y: ly0, width: lx1 - lx0, height: ly1 - ly0, rx: 6 }, gZoom, 's15-lens');
      S.lensLn = [
        el('path', { d: `M${lx1},${ly0}L${Z.x},${Z.y + 14}` }, gZoom, 's15-lens-ln'),
        el('path', { d: `M${lx1},${ly1}L${Z.x},${Z.y + Z.h - 14}` }, gZoom, 's15-lens-ln'),
      ];
      const gP = S.zp = el('g', {}, gZoom);
      el('rect', { x: Z.x, y: Z.y, width: Z.w, height: Z.h, rx: 18 }, gP, 's15-zpanel');
      const tt = el('text', { x: Z.x + 26, y: Z.y + 38 }, gP, 's15-z-title');
      tt.innerHTML = '<tspan class="s15-em">' + B.name + '</tspan>  ·  zoom ×' + Math.round(S.zoomFactor);

      // band: within 1e-4 (relative) of the best J
      const bLo = best * (1 - REL_TOL);
      const bx0 = zx(Math.max(zlo, bLo)), bx1 = zx(best);
      S.band = el('g', {}, gP);
      el('rect', { x: bx0, y: Z.base - Z.maxH - 22, width: bx1 - bx0, height: Z.maxH + 22, rx: 4 }, S.band, 's15-band');

      // annotation (right-aligned above the band)
      const pCVP = nWithin(B.J, D.best_known.SC_PWL.J) / B.c.n_starts * 100;
      const msC = cfg('SC', 'PWL', 'CasADi MS');
      const pMS = nWithin(D.sc_sorted_J.SC_CasADi_MS_PWL.J_desc, D.best_known.SC_PWL.J) / msC.n_starts * 100;
      S.ann = el('g', {}, gP);
      const a1 = el('text', { x: Z.x + Z.w - 24, y: Z.y + 86, 'text-anchor': 'end' }, S.ann, 's15-z-ann1');
      a1.innerHTML = '≈ half within 10<tspan dy="-11" font-size="19">−4</tspan><tspan dy="11"> of best</tspan>';
      const a2 = el('text', { x: Z.x + Z.w - 24, y: Z.y + 120, 'text-anchor': 'end' }, S.ann, 's15-z-ann2');
      a2.innerHTML = '(CVP <tspan class="s15-v">' + pCVP.toFixed(1) + ' %</tspan>, MS <tspan class="s15-v">' + pMS.toFixed(1) + ' %</tspan>)';
      el('path', { d: `M${(bx0 + bx1) / 2},${Z.y + 130}V${Z.base - Z.maxH - 22}` }, S.ann, 's15-band-ln');

      // zoom histogram (CVP PWL, 0.001 bins)
      const nzb = Math.round((zhi - zlo) / Z.bin);
      const zc = new Array(nzb).fill(0);
      J.forEach(v => { if (v < zlo || v > zhi) return; zc[Math.min(nzb - 1, Math.floor((v - zlo) / Z.bin + 1e-9))]++; });
      const zmx = Math.max.apply(null, zc);
      S.zbars = [];
      zc.forEach((c, b) => {
        if (!c) return;
        const x0 = zx(zlo + b * Z.bin) + 1, x1 = zx(zlo + (b + 1) * Z.bin) - 1;
        const h = Math.max(MINH, Z.maxH * c / zmx);
        const r = el('rect', { x: x0, y: Z.base - h, width: x1 - x0, height: h, rx: 1.5 }, gP, 's15-zbar');
        S.zbars.push({ r, h });
      });
      el('line', { x1: Z.px0 - 6, x2: Z.px1 + 6, y1: Z.base, y2: Z.base }, gP, 's15-zbase');
      const gzA = el('g', {}, gP, 's15-axis');
      for (let v = Math.ceil(zlo * 100 - 1e-9) / 100; v <= zhi + 1e-9; v += 0.01) {
        const x = zx(v);
        el('line', { x1: x, x2: x, y1: Z.base, y2: Z.base + 8 }, gzA, 's15-tick');
        el('text', { x, y: Z.base + 32 }, gzA).textContent = v.toFixed(2);
      }
      S.zx = zx;
    }
    return S;
  }

  // drops + bars of one lane at time t (s since the rain started); t<0: empty, t=Infinity: final
  function renderRain(L, t) {
    for (let i = 0; i < L.drops.length; i++) {
      const d = L.drops[i];
      const s = (t - (d.t - FALL)) / FALL;
      if (!(s > 0 && s < 1)) {
        if (d.vis) { d.el.style.opacity = 0; d.vis = false; }
        continue;
      }
      d.el.setAttribute('cy', (d.y0 + (d.y1 - d.y0) * s * s).toFixed(1));
      d.el.style.opacity = Math.min(1, s * 3.5);
      d.vis = true;
    }
    L.bins.forEach(q => {
      let n = 0;
      if (t === Infinity) n = q.n;
      else if (t >= 0) while (n < q.land.length && q.land[n] <= t) n++;
      const h = n ? (n === q.n ? q.hFinal : Math.max(MINH, n * L.k)) : 0;
      q.rect.setAttribute('y', L.base - h);
      q.rect.setAttribute('height', h);
    });
  }

  Deck.register('s15', {
    steps: 2,
    init(sec) { this.S = build(sec); },
    go(step, ctx) {
      const S = this.S;
      if (!S) return;
      if (S.tl) { S.tl.progress(1, false); S.tl.kill(); S.tl = null; }
      const tl = S.tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.45 } });
      const A = S.lanes[0], B = S.lanes[1];
      const fwd = k => step === k && !ctx.instant && ctx.prev === k - 1;   // animate the entrance of step k
      const r0 = L => (L.step === 1 ? RAIN0 : 0.1);                        // rain start within the step

      // ---- step 0: the inset is the whole story, large and centred; from step 1 it parks top-left
      if (step === 0) tl.to(S.inset, { x: INSET0.x, y: INSET0.y, scale: INSET0.s, transformOrigin: '0 0', duration: 0.6, ease: 'power3.inOut' }, 0);
      else tl.to(S.inset, { x: 0, y: 0, scale: 1, transformOrigin: '0 0', duration: 0.8, ease: 'power3.inOut' }, 0);
      tl.to(S.scaffold, { opacity: step >= 1 ? 1 : 0, duration: 0.5 }, fwd(1) ? 0.35 : 0);

      // ---- lanes: rain or final state
      S.lanes.forEach(L => {
        const on = step >= L.step;
        if (!on) { renderRain(L, -1); }
        else if (fwd(L.step)) {
          L.proxy.t = 0; renderRain(L, 0);
          tl.fromTo(L.proxy, { t: 0 }, { t: T_END, duration: T_END, ease: 'none', onUpdate: () => renderRain(L, L.proxy.t) }, r0(L));
        } else { renderRain(L, Infinity); }
        const anim = fwd(L.step);
        // count-up of the successful starts
        if (anim) {
          const o = { v: 0 }; L.nT.textContent = '0';
          tl.to(o, { v: L.c.n_success, duration: T_END - 0.5, ease: 'power1.inOut', onUpdate: () => { L.nT.textContent = String(Math.round(o.v)); } }, r0(L) + 0.5);
        } else { L.nT.textContent = String(L.c.n_success); }
        tl.to(L.nameEl, { opacity: on ? 1 : 0, duration: 0.4 }, anim ? r0(L) : 0);
        tl.to(L.subG, { opacity: on ? 1 : 0, duration: 0.4 }, anim ? r0(L) + 0.3 : 0);
        tl.to(L.rug, { opacity: on ? 1 : 0, duration: 0.5 }, anim ? r0(L) + T_END - 0.1 : 0);
      });

      // ---- lane A extras: ring "1 of 1000", spread bracket
      const onA = step >= 1, animA = fwd(1);
      const tA = r0(A) + T_END;                                  // after the PWC rain
      tl.to(S.ringG, { opacity: onA ? 1 : 0, duration: 0.35 }, animA ? tA + 0.1 : 0);
      if (animA) tl.fromTo(S.ring, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, tA + 0.2);
      else tl.set(S.ring, { drawSVG: '100%' }, 0);
      if (animA) tl.fromTo(S.ringLab, { opacity: 0 }, { opacity: 1, duration: 0.4 }, tA + 0.6);
      else tl.to(S.ringLab, { opacity: onA ? 1 : 0, duration: 0.3 }, 0);
      tl.to(S.brG, { opacity: onA ? 1 : 0, duration: 0.4 }, animA ? tA + 0.9 : 0);
      if (animA) tl.fromTo(S.br, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.6, ease: 'power2.inOut' }, tA + 0.9);
      else tl.set(S.br, { drawSVG: '0% 100%' }, 0);

      // ---- step 2: lens, zoom panel, band + annotation, best-J lines and gain
      const on2 = step >= 2, an2 = fwd(2);
      const tz = r0(B) + T_END + 0.05;                          // after the PWL rain
      tl.to(S.lens, { opacity: on2 ? 1 : 0, duration: 0.35 }, an2 ? tz : 0);
      S.lensLn.forEach(l => {
        if (an2) tl.fromTo(l, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power2.inOut' }, tz + 0.15);
        else tl.to(l, { opacity: on2 ? 1 : 0, drawSVG: '100%', duration: 0.3 }, 0);
      });
      if (an2) tl.fromTo(S.zp, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5 }, tz + 0.4);
      else tl.to(S.zp, { opacity: on2 ? 1 : 0, x: 0, duration: 0.3 }, 0);
      S.zbars.forEach((z, i) => {
        if (an2) tl.fromTo(z.r, { attr: { y: Z.base, height: 0 } }, { attr: { y: Z.base - z.h, height: z.h }, duration: 0.45 }, tz + 0.65 + i * 0.012);
        else tl.set(z.r, { attr: { y: Z.base - z.h, height: z.h } }, 0);
      });
      tl.to(S.band, { opacity: on2 ? 1 : 0, duration: 0.45 }, an2 ? tz + 1.3 : 0);
      tl.to(S.ann, { opacity: on2 ? 1 : 0, duration: 0.45 }, an2 ? tz + 1.5 : 0);
      S.bestLn.forEach((l, i) => {
        if (an2) tl.fromTo(l, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, tz + 1.9 + i * 0.12);
        else tl.to(l, { opacity: on2 ? 1 : 0, drawSVG: '100%', duration: 0.3 }, 0);
      });
      tl.to(S.bestV, { opacity: on2 ? 1 : 0, duration: 0.4, stagger: an2 ? 0.12 : 0 }, an2 ? tz + 2.2 : 0);
      if (an2) {
        tl.fromTo(S.gain, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, tz + 2.4);
        tl.fromTo(S.gainH, { opacity: 0 }, { opacity: 1, duration: 0.2 }, tz + 2.9);
        tl.fromTo(S.pill, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' }, tz + 2.8);
      } else {
        tl.to([S.gain, S.gainH], { opacity: on2 ? 1 : 0, duration: 0.3 }, 0);
        tl.set(S.gain, { drawSVG: '100%' }, 0);
        tl.to(S.pill, { opacity: on2 ? 1 : 0, scale: 1, duration: 0.3 }, 0);
      }

      if (ctx.instant) { tl.progress(1, false); tl.kill(); S.tl = null; }
    },
    leave() { const S = this.S; if (S && S.tl) { S.tl.progress(1, false); S.tl.kill(); S.tl = null; } },
  });
})();
