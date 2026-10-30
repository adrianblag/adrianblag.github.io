/* S4 — Thesis plan: four questions, four levels.
   Owns the staircase motif. window.S04Stair (builder + icons) is reused by S10 (s10.js loads after this file).
   Steps: 0 dichotomy bar · 1 green ground-floor slab · 2 steps L1–L4 (staggered) · 3 "difficulty compounds" + footer. */
(function () {
  'use strict';
  const S = (tag, attrs, parent) => Deck.svg(tag, attrs, parent);
  const cls = (el, c) => { el.setAttribute('class', c); return el; };
  // kill every tween on these targets (gsap.killTweensOf(array) does not kill delayed per-element fromTo tweens:
  // their startAt would re-apply the from-values later and leave elements hidden)
  const kill = els => gsap.getTweensOf(els).forEach(t => t.kill());

  const LEVELS = [
    { id: 'L1', name: 'Learn',    q: 'unknown feedback?',  m: 'OC ⇄ RL grey-box models',            icon: 'grey'  },
    { id: 'L2', name: 'Infer',    q: 'what is optimised?', m: 'inverse OC / inverse RL (bilevel)',  icon: 'cost'  },
    { id: 'L3', name: 'Explain',  q: 'which mechanism?',   m: 'sparse feedback laws',               icon: 'hill'  },
    { id: 'L4', name: 'Interact', q: 'several agents?',    m: 'differential games, multi-agent RL', icon: 'cells' },
  ];

  function text(parent, x, y, str, c, attrs) {
    const t = S('text', Object.assign({ x, y }, attrs || {}), parent);
    if (c) t.setAttribute('class', c);
    t.textContent = str;
    return t;
  }
  function arrowHead(parent, x, y, dir, size, c) {          // filled triangle, tip at (x,y), dir = angle (rad)
    const s = size || 12, w = s * 0.62;
    const bx = x - Math.cos(dir) * s, by = y - Math.sin(dir) * s;
    const nx = -Math.sin(dir) * w, ny = Math.cos(dir) * w;
    return cls(S('path', { d: `M${x},${y} L${bx + nx},${by + ny} L${bx - nx},${by - ny} Z` }, parent), c);
  }

  /* ---------- static icons (box ≈ 84 × 60, origin top-left) ---------- */
  function icon(kind, parent, x, y, s) {
    // outer wrapper carries no transform, so GSAP can animate it (x/y/opacity) without losing the placement
    const wrap = S('g', { class: 's04-icon s04-icon-' + kind }, parent);
    const g = S('g', { transform: `translate(${x},${y}) scale(${s || 1})` }, wrap);
    if (kind === 'grey') {                                  // L1: grey box over the middle of a 4-node pathway
      cls(S('line', { x1: 16, y1: 30, x2: 122, y2: 30 }, g), 's04-ic-edge');
      arrowHead(g, 130, 30, 0, 9, 's04-ic-head');
      [8, 50, 92, 138].forEach(cx => cls(S('circle', { cx, cy: 30, r: 7.5 }, g), 's04-ic-node'));
      cls(S('rect', { x: 30, y: 7, width: 82, height: 46, rx: 8 }, g), 's04-ic-box');
      text(g, 71, 39, '?', 's04-ic-boxq', { 'text-anchor': 'middle' });
    } else if (kind === 'cost') {                           // L2: "?" on the cost
      text(g, 2, 48, '∫', 's04-ic-serif s04-ic-int');
      text(g, 36, 45, '?', 's04-ic-q', { 'text-anchor': 'middle' });
      text(g, 54, 45, 'dt', 's04-ic-serif s04-ic-dt');
      cls(S('rect', { x: 22, y: 9, width: 28, height: 44, rx: 6 }, g), 's04-ic-qbox');
    } else if (kind === 'hill') {                           // L3: Hill curve
      cls(S('path', { d: 'M6,4 L6,56 L84,56' }, g), 's04-ic-axis');
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const xx = i / 40, h = Math.pow(xx, 4) / (Math.pow(0.45, 4) + Math.pow(xx, 4));
        pts.push([8 + xx * 74, 53 - h * 44]);
      }
      cls(S('path', { d: 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') }, g), 's04-ic-hill');
    } else if (kind === 'cells') {                          // L4: two cells sharing a substrate (colours as on S9)
      cls(S('circle', { cx: 17, cy: 30, r: 16 }, g), 's04-ic-cellA');
      cls(S('circle', { cx: 117, cy: 30, r: 16 }, g), 's04-ic-cellB');
      cls(S('ellipse', { cx: 67, cy: 30, rx: 17, ry: 20 }, g), 's04-ic-pool');
      [[67, 18], [59, 27], [75, 27], [62, 39], [72, 39]].forEach(([cx, cy]) => cls(S('circle', { cx, cy, r: 3.4 }, g), 's04-ic-sub'));
      cls(S('path', { d: 'M48,30 L40,30 M86,30 L94,30' }, g), 's04-ic-edge');
      arrowHead(g, 36, 30, Math.PI, 9, 's04-ic-head');
      arrowHead(g, 98, 30, 0, 9, 's04-ic-head');
    } else if (kind === 'gear') {                           // solver icon, centred on (0,0)
      const n = 8, R = 18, r = 13.5, pts = [];
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * 2 * Math.PI;
        const d = Math.PI / n;
        [[a0 - d * 0.55, r], [a0 - d * 0.35, R], [a0 + d * 0.35, R], [a0 + d * 0.55, r]].forEach(([a, rad]) => pts.push([Math.cos(a) * rad, Math.sin(a) * rad]));
      }
      cls(S('path', { d: 'M' + pts.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' L') + ' Z' }, g), 's04-gear');
      cls(S('circle', { cx: 0, cy: 0, r: 5.5 }, g), 's04-gear');
    } else if (kind === 'spring') {                         // stiff
      const p = ['M4,30 L14,30'];
      for (let i = 0; i < 8; i++) p.push(`L${18 + i * 7.5},${i % 2 ? 44 : 16}`);
      p.push('L80,30 L88,30');
      cls(S('path', { d: p.join(' ') }, g), 's04-dif');
      cls(S('path', { d: 'M4,14 L4,46 M88,14 L88,46' }, g), 's04-dif s04-dif-plate');
    } else if (kind === 'wall') {                           // path constraint
      cls(S('path', { d: 'M2,12 L90,12' }, g), 's04-dif s04-dif-wall');
      const h = [];
      for (let xx = 6; xx <= 90; xx += 10) h.push(`M${xx},12 L${xx - 7},2`);
      cls(S('path', { d: h.join(' ') }, g), 's04-dif-hatch');
      cls(S('path', { d: 'M4,56 C20,56 26,15 40,15 L64,15 C74,15 80,34 88,44' }, g), 's04-dif');
      cls(S('path', { d: 'M40,15 L64,15' }, g), 's04-dif s04-dif-act');
    } else if (kind === 'clock') {                          // free t_f: open clock
      const cx = 44, cy = 31, R = 25;
      const a0 = -Math.PI / 2 + 0.55, a1 = -Math.PI / 2 + 2 * Math.PI - 0.95;   // gap just right of 12 o'clock
      const P = a => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
      const [x0, y0] = P(a0), [x1, y1] = P(a1);
      cls(S('path', { d: `M${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 1 1 ${x1.toFixed(1)},${y1.toFixed(1)}` }, g), 's04-dif');
      arrowHead(g, x1 + 2, y1 - 3.5, a1 + Math.PI / 2 - 0.25, 9, 's04-dif-head');
      cls(S('path', { d: `M${cx},${cy} L${cx},${cy - 14} M${cx},${cy} L${cx + 11},${cy + 6}` }, g), 's04-dif');
    } else if (kind === 'bang') {                           // bang-bang: square wave
      cls(S('path', { d: 'M2,48 L20,48 L20,14 L46,14 L46,48 L62,48 L62,14 L88,14' }, g), 's04-dif');
    }
    return wrap;
  }

  /* ---------- staircase builder ----------
     geo = {x0, colW, gap, floor, top1, rise, labels:'full'|'head', gradId, iconScale, iconDy} */
  function build(parent, geo) {
    const defs = S('defs', {}, parent);
    const lg = S('linearGradient', { id: geo.gradId, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    cls(S('stop', { offset: '0' }, lg), 's04-gs0');
    cls(S('stop', { offset: '1' }, lg), 's04-gs1');
    const cols = LEVELS.map((lv, i) => {
      const x = geo.x0 + i * (geo.colW + geo.gap), top = geo.top1 - i * geo.rise, w = geo.colW, fl = geo.floor;
      const g = S('g', { class: 's04-col', 'data-level': lv.id }, parent);
      const face = cls(S('path', { d: `M${x},${fl} L${x},${top + 10} Q${x},${top} ${x + 10},${top} L${x + w - 10},${top} Q${x + w},${top} ${x + w},${top + 10} L${x + w},${fl} Z` }, g), 's04-face');
      face.style.fill = `url(#${geo.gradId})`;
      const tread = cls(S('line', { x1: x + 8, y1: top, x2: x + w - 8, y2: top }, g), 's04-tread');
      const ic = icon(lv.icon, g, x + 26, top + (geo.iconDy || 12), geo.iconScale || 1.25);
      const lab = S('g', { class: 's04-label' }, g);
      const hy = geo.labels === 'full' ? top - 100 : top - 18;
      const b = S('g', { class: 's04-badge' }, lab);
      S('rect', { x: x + 4, y: hy - 27, width: 52, height: 35, rx: 9 }, b);
      text(b, x + 30, hy - 1, lv.id);
      text(lab, x + 68, hy, lv.name, 's04-h');
      if (geo.labels === 'full') {
        text(lab, x + 4, top - 62, lv.q, 's04-q');
        text(lab, x + 4, top - 24, '→ ' + lv.m, 's04-m');
      }
      return { g, face, tread, icon: ic, label: lab, x, top, w };
    });
    return { cols, LEVELS };
  }

  window.S04Stair = { LEVELS, icon, build, text, arrowHead };

  /* ---------- reveal helpers (idempotent) ---------- */
  function fadeUnit(els, on, instant, delay) {
    els = [].concat(els);
    kill(els);
    if (instant) { gsap.set(els, { opacity: on ? 1 : 0, y: 0 }); return; }
    if (on) gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, delay: delay || 0, ease: 'power2.out' });
    else gsap.to(els, { opacity: 0, duration: 0.25 });
  }

  let R = null;   // references built in init

  Deck.register('s04', {
    steps: 3,
    init(sec) {
      const host = sec.querySelector('.s04-stage');
      const svg = S('svg', { viewBox: '0 0 1700 748', width: 1700, height: 748, class: 's04-svg', 'aria-label': 'Thesis plan staircase' }, host);
      R = { sec, on: {} };

      /* step 0 — dichotomy bar */
      const dich = S('g', { class: 's04-dich' }, svg);
      const mech = S('g', { class: 's04-pole' }, dich);
      cls(S('rect', { x: 0, y: 10, width: 420, height: 92, rx: 18 }, mech), 's04-pole-mech');
      const pm = S('g', { transform: 'translate(26,40)' }, mech);                // mini pathway glyph
      [[0, 0], [34, 0], [68, 0]].forEach(([dx]) => cls(S('circle', { cx: dx + 7, cy: 16, r: 7 }, pm), 's04-pole-node-mech'));
      cls(S('path', { d: 'M15,16 L33,16 M49,16 L67,16' }, pm), 's04-pole-link-mech');
      text(mech, 124, 50, 'Mechanistic', 's04-pole-t');
      text(mech, 124, 86, 'interpretable, fragile', 's04-pole-s');
      const lrn = S('g', { class: 's04-pole' }, dich);
      cls(S('rect', { x: 1280, y: 10, width: 420, height: 92, rx: 18 }, lrn), 's04-pole-learn');
      const nn = S('g', { transform: 'translate(1600,30)' }, lrn);             // mini neural-net glyph
      const L = [[0, [14, 38]], [36, [6, 26, 46]], [72, [26]]];
      for (let a = 0; a < L.length - 1; a++) L[a][1].forEach(y1 => L[a + 1][1].forEach(y2 => cls(S('line', { x1: L[a][0], y1, x2: L[a + 1][0], y2 }, nn), 's04-pole-link-learn')));
      L.forEach(([lx, ys]) => ys.forEach(y => cls(S('circle', { cx: lx, cy: y, r: 6 }, nn), 's04-pole-node-learn')));
      text(lrn, 1576, 50, 'Data-driven (RL)', 's04-pole-t', { 'text-anchor': 'end' });
      text(lrn, 1576, 86, 'flexible, black box', 's04-pole-s', { 'text-anchor': 'end' });
      const conn = S('g', { class: 's04-conn' }, dich);
      const la = cls(S('line', { x1: 432, y1: 76, x2: 834, y2: 76 }, conn), 's04-arr-mech');
      const ra = cls(S('line', { x1: 1268, y1: 76, x2: 866, y2: 76 }, conn), 's04-arr-learn');
      const lh = arrowHead(conn, 838, 76, 0, 15, 's04-head-mech');
      const rh = arrowHead(conn, 862, 76, Math.PI, 15, 's04-head-learn');
      const node = cls(S('circle', { cx: 850, cy: 76, r: 9 }, conn), 's04-node');
      const th = text(dich, 850, 46, '', 's04-thesis', { 'text-anchor': 'middle' });
      const tb = S('tspan', { class: 's04-thesis-b' }, th); tb.textContent = 'this thesis: ';
      const tr = S('tspan', {}, th); tr.textContent = 'one framework for direct & inverse inference';
      R.dich = { poles: [mech, lrn], lines: [la, ra], heads: [lh, rh], node, label: th };

      /* step 1 — ground floor slab */
      const slab = S('g', { class: 's04-slabg' }, svg);
      R.slabRect = cls(S('rect', { x: 0, y: 640, width: 1700, height: 66, rx: 14 }, slab), 's04-slab');
      const slabIn = S('g', {}, slab);
      icon('gear', slabIn, 44, 673, 1);
      const st = text(slabIn, 80, 683, 'Reliable forward OC', 's04-slab-t');
      const ss = S('tspan', { class: 's04-slab-s', dx: 12 }, st); ss.textContent = '(current work)';
      const now = S('g', { class: 's04-now' }, slabIn);
      S('rect', { x: 1584, y: 656, width: 98, height: 34, rx: 17 }, now);
      text(now, 1633, 680, 'NOW');
      R.slabIn = slabIn;

      /* step 2 — the four levels */
      R.stair = build(svg, { x0: 20, colW: 407.5, gap: 10, floor: 640, top1: 545, rise: 95, labels: 'full', gradId: 's04-grad' });   // 20 px inset on both sides of the 1700 slab

      /* step 3 — difficulty compounds + footer */
      const diff = S('g', { class: 's04-diff' }, svg);
      // inheritance guides: each lower tread continues (dashed) across every higher column
      const cs = R.stair.cols;
      R.inherit = cs.slice(0, 3).map((c, i) => cls(S('line', { x1: cs[i + 1].x + 8, y1: c.top, x2: cs[3].x + cs[3].w - 8, y2: c.top }, diff), 's04-inherit'));
      // "difficulty compounds": parallel to the nosing line of the four labels, 70 px above it; it ends above the
      // L2 header, well clear of the purple "this thesis" junction, so it reads as "up the staircase"
      const slope = (cs[1].top - cs[0].top) / (cs[1].x - cs[0].x);
      const x1 = 30, y1 = cs[0].top - 127 - 70 + slope * (x1 - cs[0].x - 4), x2 = 640, y2 = y1 + slope * (x2 - x1);
      const dg = S('linearGradient', { id: 's04-dgrad', gradientUnits: 'userSpaceOnUse', x1, y1, x2, y2 }, svg.querySelector('defs'));
      cls(S('stop', { offset: '0' }, dg), 's04-dg0');
      cls(S('stop', { offset: '1' }, dg), 's04-dg1');
      const a = Math.atan2(y2 - y1, x2 - x1);
      R.diffLine = cls(S('line', { x1, y1, x2: x2 - 12 * Math.cos(a), y2: y2 - 12 * Math.sin(a) }, diff), 's04-diff-line');
      R.diffLine.style.stroke = 'url(#s04-dgrad)';
      R.diffHead = arrowHead(diff, x2, y2, a, 20, 's04-diff-head');
      const tx = x1 + (x2 - x1) * 0.42, ty = y1 + (y2 - y1) * 0.42;
      const ox = Math.sin(a) * 27, oy = -Math.cos(a) * 27;               // perpendicular offset (above the line)
      R.diffText = text(diff, tx + ox, ty + oy, 'difficulty compounds', 's04-diff-t',
        { 'text-anchor': 'middle', transform: `rotate(${(a * 180 / Math.PI).toFixed(2)} ${(tx + ox).toFixed(1)} ${(ty + oy).toFixed(1)})` });
      R.foot = text(svg, 0, 742, '', 's04-foot');
      const f1 = S('tspan', {}, R.foot); f1.textContent = 'Each level inherits and compounds the previous difficulties';
      const f2 = S('tspan', { class: 's04-foot-sep', dx: 14 }, R.foot); f2.textContent = '·';
      const f3 = S('tspan', { dx: 14 }, R.foot); f3.textContent = '4 work packages';

      // entrance on arrival (step 0 is rendered instantly by the engine, so animate here)
      Reveal.on('slidechanged', e => {
        if (e.currentSlide !== sec || Deck.isStatic) return;
        setTimeout(() => { if (sec.querySelectorAll('.step-trigger.visible').length === 0) enter(); }, 30);
      });
    },

    go(step, ctx) {
      if (!R) return;
      const inst = ctx.instant;
      // step 0: dichotomy always on
      if (inst) {
        kill([...R.dich.poles, ...R.dich.lines, ...R.dich.heads, R.dich.node, R.dich.label]);
        gsap.set([...R.dich.poles, ...R.dich.heads, R.dich.node, R.dich.label], { opacity: 1, x: 0, y: 0 });
        gsap.set(R.dich.lines, { drawSVG: '0% 100%' });
      }
      // step 1: slab
      const slabOn = step >= 1;
      if (inst || R.on.slab !== slabOn) {
        kill([R.slabRect, R.slabIn]);
        if (inst) { gsap.set(R.slabRect, { opacity: slabOn ? 1 : 0, scaleX: 1 }); gsap.set(R.slabIn, { opacity: slabOn ? 1 : 0, y: 0 }); }
        else if (slabOn) {
          gsap.fromTo(R.slabRect, { opacity: 1, scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.8, ease: 'power3.inOut' });
          gsap.fromTo(R.slabIn, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.55 });
        } else gsap.to([R.slabRect, R.slabIn], { opacity: 0, duration: 0.25 });
        R.on.slab = slabOn;
      }
      // step 2: the four columns, one after the other
      const colsOn = step >= 2;
      if (inst || R.on.cols !== colsOn) {
        R.stair.cols.forEach((c, i) => {
          const parts = [c.face, c.tread, c.icon, c.label];
          kill(parts);
          if (inst) {
            gsap.set(c.face, { opacity: colsOn ? 1 : 0, scaleY: 1 });
            gsap.set(c.tread, { opacity: colsOn ? 1 : 0, drawSVG: '0% 100%' });
            gsap.set([c.icon, c.label], { opacity: colsOn ? 1 : 0, y: 0 });
          } else if (colsOn) {
            const d = i * 1.4;
            gsap.fromTo(c.face, { opacity: 1, scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.7, delay: d, ease: 'power3.out' });
            // hidden until its column rises (a zero-length round-capped dash would show as a stray dot)
            gsap.fromTo(c.tread, { opacity: 0, drawSVG: '50% 50%' }, { opacity: 1, drawSVG: '0% 100%', duration: 0.6, delay: d + 0.45 });
            gsap.fromTo(c.icon, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, delay: d + 0.6 });
            gsap.fromTo(c.label, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, delay: d + 0.5 });
          } else gsap.to(parts, { opacity: 0, duration: 0.25 });
        });
        R.on.cols = colsOn;
      }
      // step 3: difficulty compounds + footer
      const diffOn = step >= 3;
      if (inst || R.on.diff !== diffOn) {
        const els = [R.diffLine, R.diffHead, R.diffText, R.foot, ...R.inherit];
        kill(els);
        if (inst) {
          gsap.set(R.diffLine, { opacity: diffOn ? 1 : 0, drawSVG: '0% 100%' });
          gsap.set([R.diffHead, R.diffText, ...R.inherit], { opacity: diffOn ? 1 : 0 });
          gsap.set(R.foot, { opacity: diffOn ? 1 : 0, y: 0 });
        } else if (diffOn) {
          gsap.fromTo(R.diffLine, { opacity: 1, drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.9, ease: 'power2.inOut' });
          gsap.fromTo(R.diffHead, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.75 });
          gsap.fromTo(R.diffText, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.5 });
          gsap.fromTo(R.inherit, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.3, stagger: 0.25 });
          fadeUnit(R.foot, true, false, 0.9);
        } else gsap.to(els, { opacity: 0, duration: 0.25 });
        R.on.diff = diffOn;
      }
    },
  });

  function enter() {          // arrival: poles slide in, arrows meet under "this thesis"
    const d = R.dich;
    gsap.fromTo(d.poles[0], { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' });
    gsap.fromTo(d.poles[1], { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' });
    gsap.fromTo(d.lines, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.8, delay: 0.45, ease: 'power2.inOut' });
    gsap.fromTo(d.heads, { opacity: 0 }, { opacity: 1, duration: 0.25, delay: 1.1 });
    gsap.fromTo(d.node, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, delay: 1.2, ease: 'power3.out' });
    gsap.fromTo(d.label, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, delay: 1.3 });
  }
})();
