/* S10 — One brick under every level: solving OC reliably.
   Reuses the S4 staircase (window.S04Stair from s04.js). On arrival the staircase grows out of the HUD
   mini-staircase, the green brick slides in under it and one labelled arrow per level drops into the brick.
   Steps: 0 staircase + brick + calls · 1 difficulty icons in the brick · 2 the current-work question. */
(function () {
  'use strict';
  const S = (tag, attrs, parent) => Deck.svg(tag, attrs, parent);
  const cls = (el, c) => { el.setAttribute('class', c); return el; };

  const CALLS = ['model-based reference', 'inner loop', 'optimal policies to distil', 'coupled OC problems (Nash)'];
  const DIFS = [
    { kind: 'spring', label: ['stiff'] },
    { kind: 'wall',   label: ['path constraints'] },
    { kind: 'clock',  label: ['free t', 'f'] },
    { kind: 'bang',   label: ['bang-bang & singular arcs'] },
  ];
  const GEO = { x0: 20, colW: 405, gap: 10, floor: 430, top1: 330, rise: 72, labels: 'head', gradId: 's10-grad', iconScale: 1.6, iconDy: 10 };
  // level-icon extents in icon units [x0, y0, x1, y1] (S04Stair.icon box), used to centre each icon in its step face
  const ICON_BOX = { grey: [0, 7, 146, 53], cost: [8, 6, 88, 58], hill: [6, 4, 84, 56], cells: [1, 10, 133, 50] };
  const BR = { x: 0, y: 530, w: 1700, h: 120 };

  let R = null;

  Deck.register('s10', {
    steps: 2,
    init(sec) {
      const St = window.S04Stair;
      if (!St) throw new Error('S04Stair missing (s04.js)');
      const host = sec.querySelector('.s10-stage');
      const svg = S('svg', { viewBox: '0 0 1700 748', width: 1700, height: 748, class: 's10-svg', 'aria-label': 'Every level of the thesis calls a forward OC solver' }, host);
      R = { sec, svg, on: {} };

      /* lead line */
      const lead = St.text(svg, 0, 34, '', 's10-lead');
      const l1 = S('tspan', {}, lead); l1.textContent = 'Every level calls a forward OC solver, ';
      const l2 = S('tspan', { class: 's10-lead-b' }, lead); l2.textContent = 'often thousands of times';
      R.lead = lead;

      /* the brick (drawn first so the arrow tips sit on top of its border) */
      const brick = S('g', { class: 's10-brickg' }, svg);
      const defs = S('defs', {}, svg);
      const clip = S('clipPath', { id: 's10-clip' }, defs);
      S('rect', { x: BR.x, y: BR.y, width: BR.w, height: BR.h, rx: 16 }, clip);
      R.brickRect = cls(S('rect', { x: BR.x, y: BR.y, width: BR.w, height: BR.h, rx: 16 }, brick), 's10-brick');
      const courses = S('g', { 'clip-path': 'url(#s10-clip)' }, brick);           // top-edge highlight (slab bevel)
      const mid = BR.y + BR.h / 2;
      cls(S('path', { d: `M${BR.x + 14},${BR.y + 7} L${BR.x + BR.w - 14},${BR.y + 7}` }, courses), 's10-course');
      R.courses = courses;
      const bIn = S('g', {}, brick);
      St.icon('gear', bIn, 46, mid, 1.3);
      St.text(bIn, 84, mid + 13, 'forward OC solve', 's10-brick-t');
      R.brickIn = bIn;
      R.glow = cls(S('rect', { x: BR.x, y: BR.y, width: BR.w, height: BR.h, rx: 16 }, svg), 's10-glow');

      /* the staircase (same motif and x-geometry as S4) */
      const stairG = S('g', { class: 's10-stair' }, svg);
      R.stairG = stairG;
      R.stair = St.build(stairG, GEO);
      // build() puts each level icon small at the top-left of its step: enlarge it and centre it in the step face
      R.stair.cols.forEach((c, i) => {
        const b = ICON_BOX[St.LEVELS[i].icon], s = GEO.iconScale;
        if (!b) return;
        const tx = c.x + c.w / 2 - s * (b[0] + b[2]) / 2, ty = (c.top + GEO.floor) / 2 - s * (b[1] + b[3]) / 2;
        c.icon.firstChild.setAttribute('transform', `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${s})`);
      });

      /* one labelled call per level, dropping into the brick */
      R.calls = R.stair.cols.map((c, i) => {
        const g = S('g', { class: 's10-callg' }, svg);
        const ax = c.x + 44, y0 = GEO.floor + 8, y1 = BR.y + 6;
        const line = cls(S('line', { x1: ax, y1: y0, x2: ax, y2: y1 - 12 }, g), 's10-call');
        const head = St.arrowHead(g, ax, y1 + 2, Math.PI / 2, 18, 's10-call-head');
        const t = St.text(g, ax + 28, (y0 + y1) / 2 + 9, CALLS[i], 's10-call-t');
        const pulse = cls(S('circle', { cx: ax, cy: y0, r: 6 }, g), 's10-pulse');
        return { g, line, head, t, pulse, y0, y1 };
      });

      /* step 1: difficulty icons inside the brick */
      const dif = S('g', { class: 's10-dif' }, svg);
      R.difSep = cls(S('line', { x1: 452, y1: BR.y + 22, x2: 452, y2: BR.y + BR.h - 22 }, dif), 's10-dif-sep');
      const cxs = [560, 780, 1000, 1236];
      R.difs = DIFS.map((df, i) => {
        const g = S('g', {}, dif);
        St.icon(df.kind, g, cxs[i] - 44, BR.y + 11, 0.95);
        const t = St.text(g, cxs[i], BR.y + BR.h - 18, df.label.length > 1 ? 'free ' : df.label[0], 's10-dif-t');
        if (df.label.length > 1) {                       // free t_f (italic t, subscript f)
          const ti = S('tspan', { 'font-style': 'italic', 'font-family': 'KaTeX_Math, serif' }, t); ti.textContent = 't';
          const s = S('tspan', { class: 'sub', 'baseline-shift': 'sub', 'font-style': 'italic', 'font-family': 'KaTeX_Math, serif' }, t); s.textContent = 'f';
        }
        return g;
      });
      const nlp = St.text(dif, 1392, mid + 11, '', 's10-nlp');
      const na = S('tspan', { class: 's10-nlp-a' }, nlp); na.textContent = '→ ';
      const nb = S('tspan', {}, nlp); nb.textContent = 'non-convex NLPs';
      R.nlp = nlp;

      /* step 2: the question */
      const q = S('g', { class: 's10-qg' }, svg);
      cls(S('rect', { x: 0, y: 690, width: 6, height: 52, rx: 3 }, q), 's10-q-bar');
      const qt = St.text(q, 28, 729, '', 's10-q');
      const q1 = S('tspan', { class: 's10-q-b' }, qt); q1.textContent = 'Current work: ';
      const q2 = S('tspan', {}, qt); q2.textContent = 'how reliable are direct OC methods w.r.t. initialisation?';
      R.q = q;

      Reveal.on('slidechanged', e => {
        if (e.currentSlide !== sec || Deck.isStatic) return;
        setTimeout(() => { if (sec.querySelectorAll('.step-trigger.visible').length === 0) enter(); }, 30);
      });
    },

    go(step, ctx) {
      if (!R) return;
      const inst = ctx.instant;
      if (inst) setBase();
      // step 1: difficulty icons
      const on1 = step >= 1, els1 = [R.difSep, ...R.difs, R.nlp];
      if (inst || R.on.dif !== on1) {
        gsap.killTweensOf(els1);
        if (inst) gsap.set(els1, { opacity: on1 ? 1 : 0, y: 0 });
        else if (on1) {
          gsap.fromTo(R.difSep, { opacity: 0 }, { opacity: 1, duration: 0.4 });
          gsap.fromTo(R.difs, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.45, ease: 'power2.out' });
          gsap.fromTo(R.nlp, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, delay: 2.0, ease: 'power2.out' });
        } else gsap.to(els1, { opacity: 0, duration: 0.25 });
        R.on.dif = on1;
      }
      // step 2: the question
      const on2 = step >= 2;
      if (inst || R.on.q !== on2) {
        gsap.killTweensOf(R.q);
        if (inst) gsap.set(R.q, { opacity: on2 ? 1 : 0, x: 0 });
        else if (on2) gsap.fromTo(R.q, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' });
        else gsap.to(R.q, { opacity: 0, duration: 0.25 });
        R.on.q = on2;
      }
    },
    leave() { if (R) setBase(); },
  });

  // final state of the step-0 content (staircase in place, brick, calls), no pulses
  function setBase() {
    if (R.tl) { R.tl.kill(); R.tl = null; }
    const all = allBase();
    gsap.killTweensOf(all);
    gsap.set(R.stairG, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 });
    gsap.set(R.stair.cols.map(c => c.label), { opacity: 1, y: 0 });
    gsap.set([R.lead, R.brickIn, R.courses], { opacity: 1, y: 0 });
    gsap.set(R.brickRect, { opacity: 1, scaleX: 1 });
    gsap.set(R.calls.map(c => c.line), { drawSVG: '0% 100%' });
    gsap.set(R.calls.flatMap(c => [c.head, c.t]), { opacity: 1, y: 0 });
    gsap.set(R.calls.map(c => c.pulse), { opacity: 0 });
    gsap.set(R.glow, { opacity: 0 });
  }
  function allBase() {
    return [R.stairG, R.lead, R.brickIn, R.courses, R.brickRect, R.glow, ...R.stair.cols.map(c => c.label),
      ...R.calls.flatMap(c => [c.line, c.head, c.t, c.pulse])];
  }

  function enter() {
    setBase();
    const svgR = R.svg.getBoundingClientRect(), k = svgR.width / 1700;
    const hud = R.sec.querySelector('.hud-stair');
    const tl = R.tl = gsap.timeline();
    // 1 · the mini-staircase grows back to the centre (columns only; labels fade in afterwards)
    const labels = R.stair.cols.map(c => c.label);
    gsap.set(labels, { opacity: 0 });
    if (hud && k > 0) {
      const h = hud.getBoundingClientRect();
      const hx = (h.left - svgR.left) / k, hy = (h.top - svgR.top) / k, hw = h.width / k, hh = h.height / k;
      const c0 = R.stair.cols[0], c3 = R.stair.cols[3];
      const bx = c0.x, by = c3.top, bw = c3.x + c3.w - c0.x, bh = GEO.floor - c3.top;
      const sx = hw * (89 / 92) / bw, sy = hh * (36 / 54) / bh;           // hud columns: x 0–89, y 8–44 of 92 × 54
      tl.fromTo(R.stairG, { x: hx - sx * bx, y: hy + hh * (8 / 54) - sy * by, scaleX: sx, scaleY: sy, svgOrigin: '0 0', opacity: 0.4 },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 1.1, ease: 'power3.inOut' }, 0);
    } else {
      tl.fromTo(R.stairG, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
    }
    tl.fromTo(labels, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 1.0);
    tl.fromTo(R.lead, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.5);
    // 2 · the brick slides in under the staircase
    tl.fromTo(R.brickRect, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.8, ease: 'power3.inOut' }, 0.9);
    tl.fromTo([R.courses, R.brickIn], { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.5);
    // 3 · one call per level drops into the brick
    R.calls.forEach((c, i) => {
      const t0 = 1.9 + i * 0.45;
      tl.fromTo(c.line, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.45, ease: 'power2.in' }, t0);
      tl.fromTo(c.head, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t0 + 0.38);
      tl.fromTo(c.t, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.45 }, t0 + 0.1);
    });
    // 4 · a few calls travel down each arrow ("often thousands of times"), then the brick glows once
    const p0 = 1.9 + 4 * 0.45 + 0.1;
    R.calls.forEach((c, i) => {
      for (let r = 0; r < 3; r++) {
        const t = p0 + i * 0.12 + r * 0.42;
        tl.fromTo(c.pulse, { attr: { cy: c.y0 }, opacity: 0 }, { attr: { cy: c.y1 - 8 }, opacity: 1, duration: 0.36, ease: 'power1.in' }, t);
        tl.to(c.pulse, { opacity: 0, duration: 0.08 }, t + 0.34);
      }
    });
    tl.fromTo(R.glow, { opacity: 0 }, { opacity: 0.9, duration: 0.3 }, p0 + 1.0);
    tl.to(R.glow, { opacity: 0, duration: 0.9, ease: 'power2.out' }, p0 + 1.35);
  }
})();
