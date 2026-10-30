/* S14 — No universal winner.
   Built from DATA.multistart (no hard-coded results).
   Steps: 0 heatmap with the small problems already filled (LPN3B, LPDN4, GBD)
          1 SC / BSUB rows fill, zeros pulse, ACADOS column spotlight + callout
          2 PWC -> PWL arrows in the SC rows (MS and CVP columns), labelled between the two arrows
          3 cells morph into markers: log-scale dot plot of mean time per start + FD / CVP ratios
   Internally go() works with the phase ph = step + 1 (phase 0 = empty scaffold, never shown; phase 1 = step 0). */
(function () {
  'use strict';

  const ROWS = [
    { prob: 'LPN3B', param: 'PWC', name: 'LPN3B', sub: '' },
    { prob: 'LPDN4', param: 'PWC', name: 'LPDN4', sub: '' },
    { prob: 'GBD',   param: 'PWC', name: 'GBD',   sub: '' },
    { prob: 'SC',    param: 'PWC', name: 'SC',    sub: 'PWC' },
    { prob: 'SC',    param: 'PWL', name: 'SC',    sub: 'PWL' },
    { prob: 'BSUB',  param: 'PWC', name: 'BSUB',  sub: 'PWC' },
    { prob: 'BSUB',  param: 'PWL', name: 'BSUB',  sub: 'PWL' },
  ];
  const METHODS = [
    { key: 'CasADi MS',      label: 'CasADi MS',      cls: 'ms',     shape: 'circle',   dy: -19 },
    { key: 'CasADi CVP',     label: 'CasADi CVP',     cls: 'cvp',    shape: 'square',   dy: 0 },
    { key: 'FiniteDiff CVP', label: 'FiniteDiff CVP', cls: 'fd',     shape: 'diamond',  dy: 0 },
    { key: 'ACADOS',         label: 'ACADOS',         cls: 'acados', shape: 'triangle', dy: 19 },
  ];
  // geometry in SVG user units (= CSS px, the svg is drawn 1:1 at 1700 x 748)
  const G = { lab: 178, x0: 196, cw: 210, gx: 8, y0: 94, ch: 72, gy: 10 };
  const PX = G.cw + G.gx, PY = G.ch + G.gy;
  const colX = m => G.x0 + m * PX;
  const rowY = r => G.y0 + r * PY;
  const rowC = r => rowY(r) + G.ch / 2;
  const BOTTOM = rowY(ROWS.length - 1) + G.ch;          // 658
  const TX = { lo: 1, hi: 20000, x0: 236, x1: 1000 };   // log time axis

  const fmtPct = v => (v === 100 || v === 0) ? String(v) : v.toFixed(1);
  const fmtCount = (v, target) => (target === 100 || target === 0) ? String(Math.round(v)) : v.toFixed(1);
  const seqPos = v => Math.max(0, Math.min(6, v / 100 * 6));

  function seqFill(el, v) {
    const p = seqPos(v), lo = Math.floor(p), hi = Math.min(6, lo + 1), f = p - lo;
    el.style.fill = 'var(--seq-' + Math.round(p) + ')';   // fallback if color-mix is unsupported
    if (f > 1e-6 && lo < 6) {
      el.style.fill = 'color-mix(in oklab, var(--seq-' + lo + ') ' + ((1 - f) * 100).toFixed(1) + '%, var(--seq-' + hi + '))';
    } else {
      el.style.fill = 'var(--seq-' + lo + ')';
    }
  }

  function markerPath(shape, s) {
    const r = s / 2;
    switch (shape) {
      case 'circle':   return `M${-r},0a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
      case 'square':   { const h = s * 0.44; return `M${-h},${-h}H${h}V${h}H${-h}Z`; }
      case 'diamond':  { const d = s * 0.6; return `M0,${-d}L${d},0L0,${d}L${-d},0Z`; }
      case 'triangle': { const t = s * 0.58; return `M0,${-t * 1.05}L${t * 1.08},${t * 0.8}L${-t * 1.08},${t * 0.8}Z`; }
    }
    return '';
  }

  function build(sec) {
    const D = window.DATA && window.DATA.multistart;
    if (!D) throw new Error('DATA.multistart missing');
    const cfg = (prob, param, method) => D.configs.find(c => c.problem === prob && c.param === param && c.method === method);
    const ratioOf = (prob, param) => D.fd_cvp_ratio.find(q => q.problem === prob && q.param === param && q.meaningful);
    const svg = sec.querySelector('.s14-svg');
    const S = { cells: [], brackets: [], subs: [] };
    const el = (tag, attrs, parent, cls) => { const e = Deck.svg(tag, attrs, parent); if (cls) e.setAttribute('class', cls); return e; };

    // ---- defs: hatch pattern for "not run" cells
    const defs = el('defs', {}, svg);
    const pat = el('pattern', { id: 's14-hatch', width: 12, height: 12, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 12, height: 12 }, pat, 's14-hatch-bg');
    el('line', { x1: 0, y1: 0, x2: 0, y2: 12 }, pat, 's14-hatch-ln');

    // ---- layers
    const gAxis = el('g', {}, svg, 's14-axis');
    const gHead = el('g', {}, svg);
    const gHeat = el('g', {}, svg);
    const gSpot = el('g', {}, svg);
    const gArr = el('g', {}, svg);
    const gCo = el('g', {}, svg);
    const gBr = el('g', {}, svg);
    const gDots = el('g', {}, svg);

    // ---- captions (swap at step 3)
    S.capA = el('text', { x: G.x0, y: 28 }, svg, 's14-cap');
    S.capA.innerHTML = '<tspan class="s14-b">Success %</tspan> · converged + acceptable, CVODES-verified';
    S.capB = el('text', { x: G.x0, y: 28 }, svg, 's14-cap');
    S.capB.innerHTML = '<tspan class="s14-b">Mean time per start</tspan> · s, log scale';
    S.capB.style.opacity = 0;

    // ---- column headers (they double as the marker legend of the dot plot)
    METHODS.forEach((m, j) => {
      const cx = colX(j) + G.cw / 2;
      const w = m.label.length * 12.6;                       // ~Inter 23px semibold
      const g = el('g', {}, gHead);
      el('path', { d: markerPath(m.shape, 17), transform: `translate(${cx - w / 2 - 6},66)` }, g, 's14-m-' + m.cls);
      el('text', { x: cx - w / 2 + 10, y: 74 }, g, 's14-colh').textContent = m.label;
    });

    // ---- row labels
    ROWS.forEach((row, r) => {
      const t = el('text', { x: G.lab, y: rowC(r) + 9 }, gHead, 's14-rowl');
      const a = el('tspan', {}, t); a.textContent = row.name;
      if (row.sub) {
        const b = el('tspan', { dx: 8 }, t, 's14-sub'); b.textContent = row.sub;
        if (row.prob === 'SC') S.subs.push(b);
      }
    });

    // ---- log time axis + grid (dot plot)
    const xs = d3.scaleLog().domain([TX.lo, TX.hi]).range([TX.x0, TX.x1]);
    S.xs = xs;
    ROWS.forEach((row, r) => el('line', { x1: G.x0, x2: colX(3) + G.cw, y1: rowC(r), y2: rowC(r) }, gAxis, 's14-hgrid'));
    [1, 10, 100, 1000, 10000].forEach(v => {
      const x = xs(v);
      el('line', { x1: x, x2: x, y1: G.y0 - 6, y2: BOTTOM + 8 }, gAxis, 's14-vgrid');
      el('line', { x1: x, x2: x, y1: BOTTOM + 8, y2: BOTTOM + 16 }, gAxis, 's14-tick');
      el('text', { x, y: BOTTOM + 42 }, gAxis).textContent = d3.format(',')(v) + ' s';
    });
    el('line', { x1: G.x0, x2: colX(3) + G.cw, y1: BOTTOM + 8, y2: BOTTOM + 8 }, gAxis, 's14-base');
    el('text', { x: colX(3) + G.cw, y: BOTTOM + 76 }, gAxis, 's14-axnote').textContent = 'configurations with 0 % success not plotted';
    gAxis.style.opacity = 0;
    S.gAxis = gAxis;

    // ---- cells + markers
    ROWS.forEach((row, r) => {
      METHODS.forEach((m, j) => {
        const c = cfg(row.prob, row.param, m.key);
        const x = colX(j), y = rowY(r), cx = x + G.cw / 2;
        const g = el('g', {}, gHeat, 's14-cell');
        const cell = { r, m: j, c, g, cx, geo: { x, y, width: G.cw, height: G.ch, rx: 10 } };
        cell.out = el('rect', { x: x + 1, y: y + 1, width: G.cw - 2, height: G.ch - 2, rx: 10 }, g, 's14-out');
        if (!c) {
          cell.hatch = el('g', {}, g);
          el('rect', { x, y, width: G.cw, height: G.ch, rx: 10 }, cell.hatch, 's14-hatchrect');
          el('rect', { x: cx - 52, y: y + G.ch / 2 - 17, width: 104, height: 34, rx: 8 }, cell.hatch, 's14-nrbg');
          el('text', { x: cx, y: y + G.ch / 2 + 7 }, cell.hatch, 's14-nr').textContent = 'not run';
          cell.hatch.style.opacity = 0;
        } else {
          const v = c.success_pct;
          cell.val = v;
          cell.fill = el('rect', cell.geo, g, 's14-fill');
          seqFill(cell.fill, v);
          cell.fill.style.opacity = 0;
          const p = seqPos(v);
          cell.num = el('text', { x: cx, y: y + G.ch / 2 + 11 }, g, 's14-num' + (p >= 3.5 ? ' s14-dk' : '') + (p >= 5.5 ? ' s14-lt' : ''));
          cell.num.textContent = fmtPct(v);
          cell.num.style.opacity = 0;
          if (v === 0) {
            cell.ring = el('rect', { x: x - 4, y: y - 4, width: G.cw + 8, height: G.ch + 8, rx: 13 }, g, 's14-ring');
            cell.ring.style.opacity = 0;
          }
          if (v > 0) {
            const mx = xs(c.mean_time_s), my = rowC(r) + m.dy;
            cell.mk = el('path', { d: markerPath(m.shape, 18), transform: `translate(${mx},${my})` }, gDots, 's14-m-' + m.cls);
            cell.mk.style.opacity = 0;
            const s = 18;
            cell.mgeo = { x: mx - s / 2, y: my - s / 2, width: s, height: s, rx: m.shape === 'circle' ? s / 2 : 3 };
            cell.mx = mx;
          }
        }
        S.cells.push(cell);
      });
    });

    // ---- FD vs CVP brackets (only where FD had successful starts: "meaningful" ratios)
    ROWS.forEach((row, r) => {
      const q = ratioOf(row.prob, row.param);
      if (!q) return;
      const cv = S.cells.find(k => k.r === r && k.m === 1), fd = S.cells.find(k => k.r === r && k.m === 2);
      if (!cv || !fd || !cv.mk || !fd.mk) return;
      const y = rowC(r);
      const line = el('path', { d: `M${cv.mx + 12},${y}H${fd.mx - 14}` }, gBr, 's14-br');
      const lab = el('text', { x: fd.mx + 18, y: y + 9 }, gBr, 's14-brt');
      lab.textContent = Math.round(q.ratio) + '×';
      line.style.opacity = 0; lab.style.opacity = 0;
      S.brackets.push({ line, lab, ratio: q.ratio });
    });

    // ---- ACADOS spotlight
    S.spot = el('rect', { x: colX(3) - 9, y: 40, width: G.cw + 18, height: BOTTOM + 9 - 40, rx: 16 }, gSpot, 's14-spot');
    S.spot.style.opacity = 0;

    // ---- callout: BSUB PWC / ACADOS ("999/1000 hit the 10,000-iteration limit": guion S14, checked in merged.mat)
    {
      const r = ROWS.findIndex(q => q.prob === 'BSUB' && q.param === 'PWC');
      const y = rowC(r), x0 = colX(3) + G.cw, bx = x0 + 44;
      S.co = gCo;
      S.coLine = el('path', { d: `M${x0 - 2},${y}H${bx}` }, gCo, 's14-co-ln');
      el('circle', { cx: x0 - 2, cy: y, r: 5 }, gCo, 's14-co-dot');
      el('rect', { x: bx, y: y - 46, width: 440, height: 92, rx: 12 }, gCo, 's14-co-box');
      el('text', { x: bx + 22, y: y - 8 }, gCo, 's14-co-t1').textContent = '999/1000';
      el('text', { x: bx + 22, y: y + 28 }, gCo, 's14-co-t2').textContent = 'hit the 10,000-iteration limit';
      gCo.style.opacity = 0;
    }

    // ---- PWC -> PWL arrows (SC rows, MS and CVP columns)
    //      layout of the two cells at phase 3:  [19.2]  ↓  (PWC → PWL)  ↓  [65.2]
    //      the label sits on the MS | CVP boundary, between the two arrows it names; the numbers move outwards
    {
      const r3 = ROWS.findIndex(q => q.prob === 'SC' && q.param === 'PWC'), r4 = r3 + 1;
      const mid = (colX(0) + G.cw + colX(1)) / 2, ARM = 102;
      S.arrows = [];
      [0, 1].forEach(j => {
        const ax = mid + (j ? ARM : -ARM);
        const y1 = rowC(r3) - 14, y2 = rowC(r4) + 6;
        const shaft = el('path', { d: `M${ax},${y1}V${y2}` }, gArr, 's14-arrow');
        const head = el('path', { d: `M${ax - 11},${y2 - 4}L${ax},${y2 + 12}L${ax + 11},${y2 - 4}Z` }, gArr, 's14-ah');
        shaft.style.opacity = 0; head.style.opacity = 0;
        S.arrows.push({ shaft, head });
      });
      S.shiftCells = S.cells.filter(k => (k.r === r3 || k.r === r4) && k.m < 2);
      S.shiftCells.forEach(k => { k.shift = k.m === 0 ? -55 : 55; });
      // label in the gap between the two SC rows, centred between the two arrows
      const pw = 154, ph = 36;
      const py = rowY(r4) - G.gy / 2, px = mid - pw / 2;
      S.pill = el('g', {}, gArr, 's14-pill');
      el('rect', { x: px, y: py - ph / 2, width: pw, height: ph, rx: ph / 2 }, S.pill);
      el('text', { x: px + pw / 2, y: py + 8 }, S.pill).textContent = 'PWC → PWL';
      S.pill.style.opacity = 0;
    }

    // ---- panel numbers (from data)
    const set = (k, txt) => { const e = sec.querySelector(`[data-s14="${k}"]`); if (e) e.textContent = txt; };
    const small = ROWS.slice(0, 3);
    const acFast = small.filter(row => {
      const t = METHODS.map(m => cfg(row.prob, row.param, m.key)).filter(c => c && c.success_pct > 0);
      const best = t.reduce((a, b) => (b.mean_time_s < a.mean_time_s ? b : a));
      return best.method === 'ACADOS';
    }).length;
    set('acFastN', String(acFast));
    set('acSC', fmtPct(cfg('SC', 'PWC', 'ACADOS').success_pct));
    set('acBSUB', fmtPct(cfg('BSUB', 'PWC', 'ACADOS').success_pct));
    const rs = S.brackets.map(b => Math.round(b.ratio));
    set('ratioRange', Math.min.apply(null, rs) + '–' + Math.max.apply(null, rs));
    return S;
  }

  Deck.register('s14', {
    steps: 3,
    init(sec) { this.S = build(sec); },
    go(step, ctx) {
      const S = this.S;
      if (!S) return;
      const ph = step + 1;                       // phase: 1 small rows · 2 SC/BSUB + ACADOS · 3 PWC->PWL · 4 dot plot
      if (S.tl) S.tl.kill();
      const tl = S.tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } });
      const at4 = ph >= 4;
      ctx.sec.classList.toggle('s14-t', at4);

      tl.to(S.capA, { opacity: at4 ? 0 : 1, duration: 0.35 }, 0);
      tl.to(S.capB, { opacity: at4 ? 1 : 0, duration: 0.45 }, at4 ? 0.35 : 0);

      S.cells.forEach(k => {
        const filled = !at4 && (k.r < 3 ? ph >= 1 : ph >= 2);
        const fillsNow = (ph === 1 && k.r < 3) || (ph === 2 && k.r >= 3);
        const tFill = !fillsNow ? 0 : (k.r < 3 ? 0.15 + k.r * 0.32 : 0.1 + (k.r - 3) * 0.28) + k.m * 0.07;
        const dim = ph === 2 && k.m !== 3;      // ACADOS spotlight: other columns recede but stay readable
        tl.to(k.g, { opacity: dim ? 0.55 : 1, duration: 0.5 }, ph === 2 ? 2.35 : 0);
        tl.to(k.out, { opacity: (at4 || filled) ? 0 : 1, duration: 0.3 }, tFill);
        if (k.hatch) tl.to(k.hatch, { opacity: filled ? 1 : 0, duration: 0.5 }, tFill);
        if (!k.fill) return;

        // fill rect: heatmap cell, or morphs into the dot-plot marker at phase 4
        if (at4 && k.mk) {
          const t0 = 0.15 + k.r * 0.05 + k.m * 0.03;
          tl.to(k.fill, { attr: k.mgeo, opacity: 1, duration: 0.85, ease: 'power3.inOut' }, t0);
          tl.to(k.fill, { opacity: 0, duration: 0.3 }, t0 + 0.72);
          tl.to(k.mk, { opacity: 1, duration: 0.35 }, t0 + 0.62);
        } else {
          tl.to(k.fill, { attr: k.geo, opacity: filled ? 1 : 0, duration: 0.55 }, tFill);
          if (k.mk) tl.to(k.mk, { opacity: 0, duration: 0.2 }, 0);
        }

        // number: counts up when its row fills, moves aside for the phase-3 arrows
        const shift = ph === 3 && k.shift ? k.shift : 0;
        tl.to(k.num, { attr: { x: k.cx + shift }, duration: 0.45 }, 0);
        if (filled && fillsNow && !k.shown) {
          const o = { v: 0 };
          k.num.textContent = fmtCount(0, k.val);
          tl.to(k.num, { opacity: 1, duration: 0.35 }, tFill);
          tl.to(o, { v: k.val, duration: 0.9, ease: 'power1.out', onUpdate: () => { k.num.textContent = fmtCount(o.v, k.val); } }, tFill);
        } else {
          k.num.textContent = fmtPct(k.val);
          tl.to(k.num, { opacity: filled ? 1 : 0, duration: at4 ? 0.25 : 0.4 }, 0);
        }
        k.shown = filled;

        // zero rings: pulse at phase 2, stay faint at phase 3
        if (k.ring) {
          if (ph === 2) {
            tl.fromTo(k.ring, { opacity: 0 }, { opacity: 1, duration: 0.22 }, 1.3)
              .to(k.ring, { opacity: 0.2, duration: 0.22 }, 1.52)
              .to(k.ring, { opacity: 1, duration: 0.22 }, 1.74)
              .to(k.ring, { opacity: 0.2, duration: 0.22 }, 1.96)
              .to(k.ring, { opacity: 1, duration: 0.25 }, 2.18);
          } else {
            tl.to(k.ring, { opacity: ph === 3 ? 0.45 : 0, duration: 0.3 }, 0);
          }
        }
      });

      // ACADOS spotlight + callout
      tl.to(S.spot, { opacity: ph === 2 ? 1 : 0, duration: 0.5 }, ph === 2 ? 2.35 : 0);
      if (ph === 2) {
        tl.fromTo(S.co, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 2.75);
        tl.fromTo(S.coLine, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4 }, 2.75);
      } else {
        tl.to(S.co, { opacity: 0, duration: 0.35 }, 0);
        tl.set(S.coLine, { drawSVG: '100%' }, 0);
      }

      // PWC -> PWL arrows
      S.subs.forEach(s => s.classList.toggle('s14-hl', ph === 3));
      S.arrows.forEach((a, i) => {
        if (ph === 3) {
          tl.fromTo(a.shaft, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 0.55, ease: 'power2.inOut' }, 0.3 + i * 0.15);
          tl.fromTo(a.head, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.8 + i * 0.15);
        } else {
          tl.to([a.shaft, a.head], { opacity: 0, duration: 0.3 }, 0);
        }
      });
      tl.to(S.pill, { opacity: ph === 3 ? 1 : 0, duration: 0.4 }, ph === 3 ? 1.0 : 0);

      // dot plot axis + FD / CVP brackets
      tl.to(S.gAxis, { opacity: at4 ? 1 : 0, duration: 0.5 }, at4 ? 0.7 : 0);
      S.brackets.forEach((b, i) => {
        if (at4) {
          tl.fromTo(b.line, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut' }, 1.45 + i * 0.1);
          tl.fromTo(b.lab, { opacity: 0 }, { opacity: 1, duration: 0.35 }, 1.75 + i * 0.1);
        } else {
          tl.to([b.line, b.lab], { opacity: 0, duration: 0.25 }, 0);
        }
      });

      if (ctx.instant) { tl.progress(1, false); tl.kill(); S.tl = null; }
    },
    leave() { if (this.S && this.S.tl) { this.S.tl.progress(1, false); this.S.tl.kill(); this.S.tl = null; } },
  });
})();
