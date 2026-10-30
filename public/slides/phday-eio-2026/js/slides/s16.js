/* S16 — What comes next: fast, verified inner solvers.
   D3 dumbbell on a log E[T] axis, benchmark mesh only (DATA.methodsearch.benchmark_mesh):
   fastest tied baseline (hollow grey) -> new direct transcription (magenta), one problem at a time.
   Steps: 0 protocol header + baselines · 1 new method slides left + bracket · 2 "Next" line. */
(function () {
  'use strict';
  const X0 = 170, X1 = 1000;          // plot range in px (log axis)
  const ROW0 = 46, ROWH = 80;         // first row centre, row pitch
  const AXY = 336;                    // x-axis line
  const STAGGER = 0.55, SLIDE = 1.1;  // seconds
  // one rule for every time label: 1 decimal from 2 s up, 2 decimals below
  const fmtT = v => (v >= 2 ? v.toFixed(1) : v.toFixed(2)) + ' s';
  // integer ratios: consistent with the rounded endpoints and with the '≈ 5–20×' bracket
  const fmtR = r => Math.round(r) + '×';
  const variant = lbl => (/RK4/.test(lbl) ? 'RK4' : (/Radau/.test(lbl) ? 'Radau' : lbl));
  let S = null;

  function svgEl(tag, attrs, parent, cls) {
    const e = Deck.svg(tag, attrs, parent);
    if (cls) e.setAttribute('class', cls);
    return e;
  }

  function setRatio(R, px) {
    const val = S.x.invert(px);
    const r = R.bv / val;
    R.rt.textContent = fmtR(r);
    R.rt.setAttribute('x', (px + R.bx) / 2);   // pixel midpoint = geometric mean on the log axis
    R.rt.style.opacity = r > 1.25 ? 1 : 0;
  }

  function setSlid(on) {
    S.rows.forEach(R => {
      gsap.killTweensOf([R.nd, R.conn, R.wn, R.nl, R.rt, R.p]);
      R.nd.setAttribute('cx', on ? R.nx : R.bx);
      R.conn.setAttribute('x1', on ? R.nx : R.bx);
      gsap.set(R.nd, { opacity: on ? 1 : 0 });
      gsap.set(R.conn, { opacity: on ? 1 : 0 });
      gsap.set([R.wn, R.nl], { opacity: on ? 1 : 0 });
      if (on) { setRatio(R, R.nx); R.rt.textContent = fmtR(R.sp); R.rt.style.opacity = 1; }
      else { R.rt.style.opacity = 0; }
    });
    gsap.killTweensOf(S.brace);
    gsap.set(S.brace, { drawSVG: on ? '0% 100%' : '50% 50%', opacity: on ? 1 : 0 });
  }

  function playSlide() {
    setSlid(false);
    const tl = gsap.timeline();
    S.rows.forEach((R, i) => {
      const t0 = i * STAGGER;
      R.p = { v: R.bx };
      tl.to(R.nd, { opacity: 1, duration: 0.25 }, t0)
        .set(R.conn, { opacity: 1 }, t0)
        .to(R.p, {
          v: R.nx, duration: SLIDE, ease: 'power3.inOut',
          onUpdate: () => { R.nd.setAttribute('cx', R.p.v); R.conn.setAttribute('x1', R.p.v); setRatio(R, R.p.v); },
          onComplete: () => { R.rt.textContent = fmtR(R.sp); },
        }, t0 + 0.12)
        .to([R.wn, R.nl], { opacity: 1, duration: 0.4 }, t0 + SLIDE);
    });
    const tb = (S.rows.length - 1) * STAGGER + SLIDE + 0.2;
    tl.set(S.brace, { opacity: 1 }, tb)
      .fromTo(S.brace, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.8, ease: 'power2.inOut' }, tb);
    return tl;
  }

  Deck.register('s16', {
    steps: 2,

    init(sec) {
      const D = window.DATA && window.DATA.methodsearch;
      if (!D || !window.d3) return;
      const rows = D.benchmark_mesh;

      // numbers in the text come from the data file
      const put = (k, v) => sec.querySelectorAll('[data-s16="' + k + '"]').forEach(e => { e.textContent = String(v); });
      put('nstarts', rows[0].new.n_starts);
      put('nfronts', Object.keys(D.all_test).filter(p =>
        D.all_test[p].methods.some(m => m.family === 'SXTranscription' && m.on_front)).length);
      const sp = D.lpdn4_spurious;
      put('ratio', sp.ratio_to_J_star.toFixed(2));
      put('nsp', sp.n_spurious);
      put('nst', sp.n_test_starts);

      const svg = sec.querySelector('.s16-svg');
      const x = d3.scaleLog().domain([0.15, 60]).range([X0, X1]);
      S = { sec, x, rows: [] };
      const defs = svgEl('defs', null, svg);

      // grid + axis
      const yTop = ROW0 - 38, yBot = ROW0 + (rows.length - 1) * ROWH + 38;
      const gGrid = svgEl('g', null, svg, 's16-grid');
      const major = [0.3, 1, 3, 10, 30];
      x.ticks().forEach(t => {
        const isMaj = major.some(m => Math.abs(m - t) < 1e-9);
        svgEl('line', { x1: x(t), x2: x(t), y1: yTop, y2: AXY }, gGrid, isMaj ? 'maj' : null);
      });
      const gAx = svgEl('g', null, svg, 's16-axis');
      svgEl('line', { x1: X0 - 10, x2: X1 + 10, y1: AXY, y2: AXY }, gAx);
      major.forEach(t => {
        svgEl('line', { x1: x(t), x2: x(t), y1: AXY, y2: AXY + 7 }, gAx);
        const tx = svgEl('text', { x: x(t), y: AXY + 30 }, gAx);
        tx.textContent = String(t);
      });

      // rows
      rows.forEach((r, i) => {
        const y = ROW0 + i * ROWH;
        const g = svgEl('g', null, svg, 's16-row');
        const R = { y, g, prob: r.problem, p: { v: 0 } };
        R.bv = r.baseline.ET_s_full; R.nv = r.new.ET_s_full; R.sp = r.speedup;
        R.bx = x(r.baseline.ET_s); R.nx = x(r.new.ET_s);

        R.band = svgEl('rect', { x: -14, y: y - 38, width: 1104, height: 76, rx: 14 }, g, 's16-band');

        const pl = svgEl('text', { x: 0, y: y + 1 }, g, 's16-pl'); pl.textContent = r.problem;
        const pn = svgEl('text', { x: 0, y: y + 27 }, g, 's16-pn'); pn.textContent = 'N = ' + r.benchmark_N;

        // connector with a fixed user-space gradient: magenta at the new method, grey at the baseline
        const gr = svgEl('linearGradient', { id: 's16-g' + i, gradientUnits: 'userSpaceOnUse', x1: R.nx, y1: 0, x2: R.bx, y2: 0 }, defs);
        const s0 = svgEl('stop', { offset: '0%' }, gr); s0.style.stopColor = 'var(--m-new)';
        const s1 = svgEl('stop', { offset: '100%' }, gr); s1.style.stopColor = 'var(--m-base)'; s1.style.stopOpacity = '0.75';
        R.conn = svgEl('line', { x1: R.bx, x2: R.bx, y1: y, y2: y }, g, 's16-conn');
        R.conn.style.stroke = 'url(#s16-g' + i + ')';

        // bootstrap 95% CI whiskers (where available)
        const whisk = (ci, cls) => {
          const w = svgEl('g', null, g, cls);
          if (ci && ci[0] != null && ci[1] != null) {
            const a = x(ci[0]), b = x(ci[1]);
            svgEl('line', { x1: a, x2: b, y1: y, y2: y }, w);
            svgEl('line', { x1: a, x2: a, y1: y - 8, y2: y + 8 }, w);
            svgEl('line', { x1: b, x2: b, y1: y - 8, y2: y + 8 }, w);
          }
          return w;
        };
        R.wb = whisk(r.baseline.ET_ci, 's16-wb');
        R.wn = whisk(r.new.ET_ci, 's16-wn');

        R.bm = svgEl('circle', { cx: R.bx, cy: y, r: 10 }, g, 's16-bm');
        R.nd = svgEl('circle', { cx: R.bx, cy: y, r: 10 }, g, 's16-nm');

        // labels: baseline value + name (right), new value (left), speed-up above the connector
        const bl = svgEl('text', { x: R.bx + 20, y: y + 7 }, g, 's16-lab');
        const bv = svgEl('tspan', null, bl, 'v'); bv.textContent = fmtT(r.baseline.ET_s);
        const bn = svgEl('tspan', { dx: 10 }, bl, 'mn');
        bn.textContent = r.baseline.label + (r.baseline.param !== r.new.param ? ' · ' + r.baseline.param : '');
        R.nl = svgEl('text', { x: R.nx - 20, y: y + 7, 'text-anchor': 'end' }, g, 's16-lab');
        const nvar = svgEl('tspan', null, R.nl, 'mn'); nvar.textContent = variant(r.new.label) + ' · ';
        const nval = svgEl('tspan', null, R.nl, 'vn'); nval.textContent = fmtT(r.new.ET_s);
        R.rt = svgEl('text', { x: (R.nx + R.bx) / 2, y: y - 17 }, g, 's16-ratio');

        S.rows.push(R);
      });

      // bracket "≈ 5–20×" (label in the side column, to the right)
      const bx0 = 1098, bxm = 1112, bxt = 1128, mid = (yTop + 8 + yBot - 8) / 2;
      const y0 = yTop + 8, y1 = yBot - 8;
      S.brace = svgEl('path', {
        d: `M${bx0},${y0} Q${bxm},${y0} ${bxm},${y0 + 14} L${bxm},${mid - 14} Q${bxm},${mid} ${bxt},${mid}` +
           ` Q${bxm},${mid} ${bxm},${mid + 14} L${bxm},${y1 - 14} Q${bxm},${y1} ${bx0},${y1}`,
      }, svg, 's16-brace');

      S.lp = S.rows.find(R => R.prob === 'LPDN4');
      S.bilDot = sec.querySelector('.s16-bd');
      S.bilIn = sec.querySelector('.s16-bi');
      setSlid(false);
    },

    go(step, ctx) {
      if (!S) return;
      if (S.tl) { S.tl.kill(); S.tl = null; }

      // step 1: new method slides left, row by row (only when stepping forward into it)
      if (step >= 1 && !ctx.instant && ctx.prev === 0) S.tl = playSlide();
      else setSlid(step >= 1);

      ctx.sec.classList.toggle('s16-instant', !!ctx.instant);
      if (S.lp) Deck.to(S.lp.band, { opacity: 0, duration: 0 }, true);   // verifier highlight removed (user request)

      // step 2: the new method drops into the inner box of the bilevel loop
      const n = step >= 2;
      if (S.bilDot) {
        gsap.killTweensOf(S.bilDot);
        if (n && !ctx.instant && ctx.prev < 2) {
          gsap.fromTo(S.bilDot, { attr: { cx: -16 }, opacity: 0 },
            { attr: { cx: 105 }, opacity: 1, duration: 1.0, delay: 0.35, ease: 'power3.out' });
        } else {
          gsap.set(S.bilDot, { attr: { cx: n ? 105 : -16 }, opacity: n ? 1 : 0 });
        }
        S.bilIn.classList.toggle('is-hot', n);
      }
    },

    leave() { if (S && S.tl) { S.tl.kill(); S.tl = null; } },
  });
})();
