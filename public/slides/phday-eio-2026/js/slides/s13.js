/* S13 — Five pathways, 1000 starts, one strict referee.
   step 0  five case-study cards on a rising ladder (bar = number of controls, from the script)
   step 1  funnel: dice -> solver -> classifier (converged / acceptable / failed) -> CVODES referee gate
           (ribbon widths proportional to the real class totals over all 26 configurations)
   step 2  counters (count up): solves · summed solver time · rejected
   All totals come from DATA.multistart. */
(function () {
  'use strict';
  const S = (t, a, p) => Deck.svg(t, a, p);
  const st = {};
  let tl = null;

  function totals() {
    const M = window.DATA && window.DATA.multistart;
    if (!M || !M.configs) return null;
    const sum = k => M.configs.reduce((s, c) => s + (c[k] || 0), 0);
    const per = Array.from(new Set(M.configs.map(c => c.n_starts)));
    return {
      starts: sum('n_starts'), conv: sum('n_converged'), acc: sum('n_acceptable'), fail: sum('n_failed'),
      rejected: sum('n_failed_verification'), hours: sum('total_time_s') / 3600,
      perConfig: per.length === 1 ? per[0] : null,
    };
  }

  function buildBars(sec) {
    sec.querySelectorAll('.s13-bar').forEach(b => {
      const n = parseInt(b.dataset.n, 10) || 0;
      for (let i = 0; i < n; i++) b.appendChild(document.createElement('i'));
      const s = document.createElement('span'); s.textContent = String(n); b.appendChild(s);
    });
  }

  function buildFloors(svg) {
    // SC: two path constraints (floors) with a schematic state hovering just above each
    // (viewBox 284 x 60 = the CSS size, so the labels render at their CSS font size)
    const x1 = 150;
    S('path', { class: 's13-fl-curve', d: d3.line()(d3.range(0, x1 + 0.1, 4).map(x => [x, 19 - 14 * Math.pow((x - 70) / 90, 2)])) }, svg);
    S('line', { class: 's13-fl-line', x1: 0, x2: x1, y1: 22, y2: 22 }, svg);
    S('path', { class: 's13-fl-curve', d: d3.line()(d3.range(0, x1 + 0.1, 4).map(x => [x, 49 - 12 * Math.pow((x - 110) / 110, 2)])) }, svg);
    S('line', { class: 's13-fl-line', x1: 0, x2: x1, y1: 52, y2: 52 }, svg);
    S('text', { class: 's13-fl-t', x: x1 + 10, y: 30 }, svg).textContent = 'ATP ≥ 0.7';
    S('text', { class: 's13-fl-t', x: x1 + 10, y: 60 }, svg).textContent = 'NADH ≥ 0.5';
  }

  // tiny pathway topologies, drawn from the stoichiometry in matlab/utils/ocp_problem_spec.m (schematic)
  const GLYPH = {
    lpn3b: { n: [[14, 29], [96, 29], [178, 29], [260, 29]], e: [[0, 1], [1, 2], [2, 3]], pool: [0] },
    lpdn4: { n: [[14, 29], [82, 29], [150, 29], [218, 29]], e: [[0, 1], [1, 2], [2, 3]], out: [3] },
    gbd:   { n: [[14, 29], [80, 29], [150, 9], [190, 47], [266, 47]], e: [[0, 1], [1, 2], [1, 3], [2, 3], [3, 4]], pool: [0] },
    // BSUB (bsub_rhs), reduced to its metabolite skeleton: glucose -> FBP -> PEP -> PYR (-> biomass),
    // PYR -> CIT -> MAL -> PEP cycle, malate uptake -> MAL (G, M = dashed substrate pools)
    bsub:  { n: [[14, 10], [70, 10], [126, 10], [182, 10], [98, 48], [154, 48], [210, 48]],
             e: [[0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 2], [4, 5]], pool: [0, 4], out: [3] },
  };
  function buildGlyph(svg) {
    const G = GLYPH[svg.dataset.g]; if (!G) return;
    const r = 8, gap = 5;
    const id = 's13-ah-' + svg.dataset.g;
    const defs = S('defs', {}, svg);
    const m = S('marker', { id, viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 8, markerHeight: 8, markerUnits: 'userSpaceOnUse', orient: 'auto' }, defs);
    S('path', { class: 's13-gl-ah', d: 'M0,0.8 L10,5 L0,9.2 Z' }, m);
    const edge = (a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      S('line', { class: 's13-gl-e', x1: a[0] + ux * (r + 2), y1: a[1] + uy * (r + 2), x2: b[0] - ux * (r + gap), y2: b[1] - uy * (r + gap), 'marker-end': `url(#${id})` }, svg);
    };
    G.e.forEach(([i, k]) => edge(G.n[i], G.n[k]));
    (G.out || []).forEach(i => edge(G.n[i], [G.n[i][0] + 62, G.n[i][1]].map((v, q) => q === 0 ? v + r + gap : v)));
    G.n.forEach((p, i) => S('circle', { class: 's13-gl-n' + ((G.pool || []).includes(i) ? ' pool' : ''), cx: p[0], cy: p[1], r }, svg));
  }

  function die(g, x, y, s, rot, cls) {
    const d = S('g', { class: 's13-die ' + (cls || ''), transform: `rotate(${rot},${x + s / 2},${y + s / 2})` }, g);
    S('rect', { x, y, width: s, height: s, rx: s * 0.2 }, d);
    const p = s * 0.26, r = s * 0.085;
    [[p, p], [s - p, p], [s / 2, s / 2], [p, s - p], [s - p, s - p]].forEach(q => S('circle', { cx: x + q[0], cy: y + q[1], r }, d));
    return d;
  }

  function buildFunnel(svg, T) {
    const Y = 110, W = 72;
    const g = S('g', {}, svg);
    // proportional class widths (fallback: equal thirds if data missing)
    const tot = T ? (T.conv + T.acc + T.fail) : 3;
    const wc = W * (T ? T.conv : 1) / tot, wa = W * (T ? T.acc : 1) / tot, wf = W * (T ? T.fail : 1) / tot;

    // dice
    st.dice = S('g', {}, g);
    die(st.dice, 26, 66, 52, 14, 'back');
    die(st.dice, 2, 84, 62, -8);
    // all starts -> solver
    st.band1 = S('path', { class: 's13-band', d: `M360,${Y} L540,${Y}`, 'stroke-width': W }, g);
    const r = (() => { let s = 5; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
    st.sdots = d3.range(9).map(i => S('circle', { class: 's13-sdot', cx: 378 + i * 18.5, cy: Y + (r() - 0.5) * W * 0.7, r: 4 }, g));
    st.box = S('rect', { class: 's13-box', x: 540, y: 30, width: 250, height: 160, rx: 18 }, g);
    st.band2 = S('path', { class: 's13-band', d: `M790,${Y} L880,${Y}`, 'stroke-width': W }, g);
    st.cls = S('rect', { class: 's13-cls', x: 880, y: 60, width: 18, height: 100, rx: 6 }, g);

    // classifier -> three ribbons
    const top = Y - W / 2;
    const yc0 = top + wc / 2, ya0 = top + wc + wa / 2, yf0 = top + wc + wa + wf / 2;
    const gTop = Y - (wc + wa) / 2, gc = gTop + wc / 2, ga = gTop + wc + wa / 2;
    st.ribConv = S('path', { class: 's13-rib conv', 'stroke-width': wc,
      d: `M898,${yc0} C950,${yc0} 950,70 1000,70 L1130,70 C1190,70 1190,${gc} 1242,${gc}` }, g);
    st.ribAcc = S('path', { class: 's13-rib acc', 'stroke-width': Math.max(wa, 3),
      d: `M898,${ya0} C950,${ya0} 950,136 1000,136 L1130,136 C1190,136 1190,${ga} 1242,${ga}` }, g);
    st.ribFail = S('path', { class: 's13-rib fail', 'stroke-width': wf,
      d: `M898,${yf0} C950,${yf0} 950,222 1000,222 L1012,222` }, g);
    st.stop = S('line', { class: 's13-stop', x1: 1018, x2: 1018, y1: 222 - wf / 2 - 6, y2: 222 + wf / 2 + 6 }, g);

    // CVODES referee gate
    st.gate = S('g', {}, g);
    S('rect', { class: 's13-gate', x: 1240, y: 36, width: 80, height: 148, rx: 16 }, st.gate);
    S('path', { class: 's13-gate-icon', d: 'M1280,80 L1301,88 L1301,108 C1301,124 1291,134 1280,139 C1269,134 1259,124 1259,108 L1259,88 Z' }, st.gate);
    S('path', { class: 's13-gate-icon', d: 'M1269,109 L1277,117 L1292,100' }, st.gate);
    // verified + rejected
    st.ribVer = S('path', { class: 's13-rib ver', 'stroke-width': wc + wa, d: `M1320,${Y} L1532,${Y}` }, g);
    const chkPos = S('g', { transform: `translate(1564,${Y})` }, g);   // position on the wrapper, GSAP scales the inner group
    st.chk = S('g', { class: 's13-chk' }, chkPos);
    S('circle', { cx: 0, cy: 0, r: 24 }, st.chk);
    S('path', { d: 'M-10,1 L-3,8 L11,-7' }, st.chk);
    st.rej = S('g', {}, g);
    S('path', { class: 's13-rej', d: 'M1322,160 C1380,160 1398,176 1440,176' }, st.rej);
    S('circle', { class: 's13-rej-dot', cx: 1447, cy: 176, r: 6 }, st.rej);
    // keep the gate on top of the ribbons that enter it
    g.appendChild(st.gate);
  }

  function setCounters(a, b) {
    st.n1.textContent = Deck.fmt(Math.round(a), 0);
    st.n2.textContent = '≈ ' + Deck.fmt(Math.round(b / 10) * 10, 0) + ' h';
  }

  Deck.register('s13', {
    steps: 2,
    init(sec) {
      const T = totals();
      st.T = T;
      buildBars(sec);
      buildFloors(sec.querySelector('.s13-floors'));
      sec.querySelectorAll('.s13-glyph').forEach(buildGlyph);
      buildFunnel(sec.querySelector('.s13-fsvg'), T);
      st.labels = Array.from(sec.querySelectorAll('.s13-fl'));
      st.n1 = sec.querySelector('.s13-n1'); st.n2 = sec.querySelector('.s13-n2'); st.n3 = sec.querySelector('.s13-n3');
      st.ok = sec.querySelector('.s13-ok');
      // targets: ≈ hours rounded to the nearest 100 (7,147 h -> ≈ 7,100 h)
      st.target = T ? { a: T.starts, b: Math.round(T.hours / 100) * 100 } : null;
      if (T) {
        if (T.perConfig) sec.querySelectorAll('.s13-nstarts').forEach(e => { e.textContent = String(T.perConfig); });
        st.n3.textContent = String(T.rejected);
        setCounters(st.target.a, st.target.b);
      } else {
        st.n1.textContent = st.n2.textContent = st.n3.textContent = '–';
      }
    },
    go(step, ctx) {
      const I = ctx.instant;
      if (tl) { tl.kill(); tl = null; }
      const shapes = [st.dice, st.band1, st.box, st.band2, st.cls, st.ribConv, st.ribAcc, st.ribFail, st.stop, st.gate, st.ribVer, st.chk, st.rej].concat(st.sdots);
      gsap.killTweensOf(shapes.concat(st.labels, [st.ok]));

      // ---- step 1: the funnel builds left -> right
      if (step === 1 && ctx.prev === 0 && !I) {
        const draw = [st.band1, st.band2, st.ribConv, st.ribAcc, st.ribFail, st.ribVer];
        gsap.set(draw, { drawSVG: '0%' });
        gsap.set([st.dice, st.box, st.cls, st.stop, st.gate, st.chk, st.rej].concat(st.sdots, st.labels), { opacity: 0 });
        tl = gsap.timeline({ delay: 0.15 });
        tl.fromTo(st.dice, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0)
          .to(st.band1, { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut' }, 0.3)
          .to(st.sdots, { opacity: 0.8, duration: 0.2, stagger: 0.04 }, 0.35)
          .fromTo(st.box, { opacity: 0, scale: 0.94, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.4 }, 0.7)
          .to(st.band2, { drawSVG: '100%', duration: 0.3, ease: 'none' }, 1.05)
          .to(st.cls, { opacity: 1, duration: 0.3 }, 1.3)
          .to([st.ribConv, st.ribAcc, st.ribFail], { drawSVG: '100%', duration: 0.8, ease: 'power2.inOut', stagger: 0.1 }, 1.5)
          .to(st.stop, { opacity: 1, duration: 0.25 }, 2.15)
          .fromTo(st.gate, { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' }, 2.3)
          .to(st.ribVer, { drawSVG: '100%', duration: 0.5, ease: 'power2.out' }, 2.9)
          .fromTo(st.chk, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, 3.3)
          .to(st.rej, { opacity: 1, duration: 0.4 }, 3.3);
        st.labels.forEach(l => tl.to(l, { opacity: 1, duration: 0.35 }, parseFloat(l.dataset.t || '0')));
      } else {
        gsap.set([st.band1, st.band2, st.ribConv, st.ribAcc, st.ribFail, st.ribVer], { drawSVG: '100%' });
        gsap.set([st.dice, st.box, st.cls, st.stop, st.gate, st.chk, st.rej].concat(st.labels), { opacity: 1, scale: 1, y: 0 });
        gsap.set(st.sdots, { opacity: 0.8 });
      }

      // ---- step 2: counters count up
      if (!st.target) return;
      if (step === 2 && ctx.prev === 1 && !I) {
        const o = { a: 0, b: 0 };
        setCounters(0, 0);
        gsap.set(st.ok, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });
        const t2 = gsap.timeline({ delay: 0.25 });
        t2.to(o, { a: st.target.a, b: st.target.b, duration: 1.4, ease: 'power2.out', onUpdate: () => setCounters(o.a, o.b) })
          .to(st.ok, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }, 1.1);
        tl = t2;
      } else {
        setCounters(st.target.a, st.target.b);
        gsap.set(st.ok, { opacity: 1, scale: 1 });
      }
    },
    leave() { if (tl) { tl.kill(); tl = null; } },
  });
})();
