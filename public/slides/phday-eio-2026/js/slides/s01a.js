/* S1a — Why do bees build hexagons?
   Steps: 0 bees fly in and build a honeycomb cell by cell (~6.5 s), honey fills, caps close; then they crawl/hover
            gently on the comb (idle loop). Caption "most honey · least wax?".
          1 comb slides left; shape race: equal-area triangle / square / hexagon, each wall unrolls into a bar
            (wall length per unit area, computed here: 4.56 / 4.00 / 3.72); hexagon wins.
          2 timeline Varro -> Darwin -> Hales.
          3 punchline (hypothesis of the thesis).
   The idle loop runs only while the slide is current and never in ?static / print (frozen pose instead). */
(function () {
  'use strict';
  const R = 40;                          // cell circumradius (comb-local px), pointy-top hexagons
  const CW = Math.sqrt(3) * R, RH = 1.5 * R;
  const RX = 390, RY = 226;              // comb blob semi-axes
  const RHO_MAX = 1.16;                  // rim (cells under construction) up to this normalised radius
  const POSE = [{ x: 960, y: 560, s: 1.12 }, { x: 562, y: 520, s: 0.98 }];   // where the comb's bbox centre goes
  const B0 = 1.0, BT = 3.3;              // build front: starts at B0, sweeps the comb in BT s
  const LAND = 1.1;                      // landing flight duration
  const BEE_S = 0.92;
  const CRAWL_V = 34;                    // px/s (comb-local)

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const f2 = v => v.toFixed(2);
  const DEG = 180 / Math.PI;

  function isStatic() { return Deck.isStatic || !!(window.Reveal && Reveal.isPrintView && Reveal.isPrintView()); }
  function isCurrent(sec) { return !!(window.Reveal && Reveal.getCurrentSlide && Reveal.getCurrentSlide() === sec); }
  function kill(els) { gsap.getTweensOf(els).forEach(t => t.kill()); }
  function mulberry(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- comb geometry ----------
  function wob(th) { return 1 + 0.05 * Math.sin(3 * th + 2.2) + 0.03 * Math.sin(5 * th + 0.4); }
  function rhoOf(x, y) { const u = x / RX, v = y / RY; return Math.hypot(u, v) / wob(Math.atan2(v, u)); }
  function polar(th, rho) { const f = wob(th) * rho; return [RX * f * Math.cos(th), RY * f * Math.sin(th)]; }
  function hexPts(r, rot) {
    const p = [];
    for (let j = 0; j < 6; j++) { const a = (rot + 60 * j) / DEG; p.push([r * Math.cos(a), r * Math.sin(a)]); }
    return p;
  }
  function roundPoly(pts, rc) {
    const n = pts.length; let d = '';
    for (let j = 0; j < n; j++) {
      const p = pts[j], a = pts[(j + n - 1) % n], b = pts[(j + 1) % n];
      const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const p1 = [p[0] + (a[0] - p[0]) * rc / la, p[1] + (a[1] - p[1]) * rc / la];
      const p2 = [p[0] + (b[0] - p[0]) * rc / lb, p[1] + (b[1] - p[1]) * rc / lb];
      d += (j ? 'L' : 'M') + f2(p1[0]) + ',' + f2(p1[1]) + 'Q' + f2(p[0]) + ',' + f2(p[1]) + ' ' + f2(p2[0]) + ',' + f2(p2[1]);
    }
    return d + 'Z';
  }
  const WAX_D = roundPoly(hexPts(R + 0.8, -90), 1.5);
  const PIT_D = roundPoly(hexPts(R - 4.6, -90), 6);
  const HONEY_D = roundPoly(hexPts(R - 9, -90), 7);
  const CAP_D = roundPoly(hexPts(R - 6.4, -90), 6.5);

  function buildComb(st) {
    const rnd = mulberry(11);
    const host = st.sec.querySelector('.s01a-cells');
    const cells = [];
    for (let r = -6; r <= 6; r++) {
      for (let c = -8; c <= 8; c++) {
        const x = c * CW + (Math.abs(r) % 2 ? CW / 2 : 0), y = r * RH;
        const rho = rhoOf(x, y), jit = rnd(), q = rnd(), q2 = rnd();
        if (rho <= 1) cells.push({ x, y, rho, full: true, jit, q, q2 });
        else if (rho <= RHO_MAX && q < 0.66) cells.push({ x, y, rho, full: false, jit, q, q2 });
      }
    }
    cells.forEach(c => {
      c.t = B0 + BT * Math.min(c.rho, RHO_MAX) / RHO_MAX + 0.22 * c.jit;
      const g = Deck.svg('g', { transform: 'translate(' + f2(c.x) + ' ' + f2(c.y) + ')' }, host);
      if (c.full) {
        // honey in the upper part (capped near the top), open honey below it, empty cells at the bottom
        const band = c.y + 26 * Math.sin(c.x / 85 + 0.6);
        c.honey = band < -RY * 0.08 ? c.q < 0.86 : c.q < 0.14;
        c.cap = c.honey && (band < -RY * 0.5 ? c.q2 < 0.9 : c.q2 < 0.08);
        c.wax = Deck.svg('path', { class: 's01a-wax', d: WAX_D }, g);
        c.pit = Deck.svg('path', { class: 's01a-pit', d: PIT_D }, g);
        if (c.honey) {
          c.hon = Deck.svg('g', {}, g);
          Deck.svg('path', { class: 's01a-honey', d: HONEY_D }, c.hon);
          Deck.svg('ellipse', { class: 's01a-gloss', cx: -8, cy: -13, rx: 9, ry: 4.5, transform: 'rotate(-30 -8 -13)' }, c.hon);
        }
        if (c.cap) c.capEl = Deck.svg('path', { class: 's01a-cap', d: CAP_D }, g);
      } else {
        // a cell under construction: a 3-4-wall cup on the side that faces the comb
        const v = hexPts(R - 4.6, -90);
        const phi = Math.atan2(-c.y, -c.x) * DEG;
        let best = 0, bd = 1e9;
        for (let e = 0; e < 6; e++) {
          const mid = -60 + 60 * e;
          const dd = Math.abs(((phi - mid + 540) % 360) - 180);
          if (dd < bd) { bd = dd; best = e; }
        }
        const k = 3 + Math.floor(c.jit * 2);
        const s0 = (best - Math.floor((k - 1) / 2) + 6) % 6;
        let d = 'M' + f2(v[s0][0]) + ',' + f2(v[s0][1]);
        for (let i = 1; i <= k; i++) { const p = v[(s0 + i) % 6]; d += 'L' + f2(p[0]) + ',' + f2(p[1]); }
        c.pit = Deck.svg('path', { class: 's01a-rim', d }, g);
      }
    });
    st.cells = cells;
    const xs = cells.map(c => c.x), ys = cells.map(c => c.y);
    st.bbc = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    st.waxes = cells.filter(c => c.full).map(c => c.wax);
    st.pits = cells.map(c => c.pit);
    st.hons = cells.filter(c => c.hon).map(c => c.hon);
    st.caps = cells.filter(c => c.capEl).map(c => c.capEl);
  }

  function combFinal(st) {
    kill(st.waxes.concat(st.pits, st.hons, st.caps));
    gsap.set(st.waxes, { opacity: 1, scale: 1, svgOrigin: '0 0' });
    gsap.set(st.pits, { clearProps: 'strokeDasharray,strokeDashoffset,fillOpacity,opacity' });
    gsap.set(st.hons.concat(st.caps), { opacity: 1, scale: 1, svgOrigin: '0 0' });
  }

  // ---------- bees ----------
  // fly-in sources (slide px), build-orbit start angle (deg), arrival time
  const BEES = [
    { from: [-170, 420], th0: 180, arr: 1.1 },
    { from: [2090, 300], th0: -36, arr: 1.4 },
    { from: [560, 1250], th0: 108, arr: 1.75 },
    { from: [700, -170], th0: -108, arr: 2.1 },
    { from: [2090, 880], th0: 36, arr: 2.45 },
  ];
  const OM = 0.4;                                 // orbit angular speed while building (rad/s)
  const WINGS = [                                 // upper side; lower side mirrored
    { bx: 3, by: -6, rx: 19, ry: 7.5, fold: -171, spread: -126, hind: true },
    { bx: 9, by: -7, rx: 28, ry: 10.5, fold: -163, spread: -98, hind: false },
  ];

  function buildBee(host, shHost, i) {
    const b = { i, x: 0, y: 0, a: 0, fly: 0, walk: false, ph0: i * 1.7 };
    b.sh = Deck.svg('ellipse', { class: 's01a-shadow', cx: -6, cy: 0, rx: 50, ry: 19 }, shHost);
    const g = b.g = Deck.svg('g', { class: 's01a-bee' }, host);
    // legs (3 pairs from the thorax)
    [[12, 8, 22, 21], [5, 10, 5, 25], [-1, 9, -15, 24]].forEach(l => {
      Deck.svg('path', { class: 's01a-leg', d: 'M' + l[0] + ',' + l[1] + ' L' + l[2] + ',' + l[3] }, g);
      Deck.svg('path', { class: 's01a-leg', d: 'M' + l[0] + ',' + (-l[1]) + ' L' + l[2] + ',' + (-l[3]) }, g);
    });
    Deck.svg('path', { class: 's01a-sting', d: 'M-53,-4 L-63,0 L-53,4 Z' }, g);
    Deck.svg('ellipse', { class: 's01a-abd', cx: -24, cy: 0, rx: 31, ry: 19.5 }, g);
    const sg = Deck.svg('g', { 'clip-path': 'url(#s01a-clip-abd)' }, g);
    [-45, -33, -21].forEach(x => Deck.svg('rect', { class: 's01a-stripe', x, y: -22, width: 7.5, height: 44 }, sg));
    Deck.svg('rect', { class: 's01a-stripe', x: -58, y: -22, width: 6, height: 44 }, sg);
    Deck.svg('circle', { class: 's01a-thx', cx: 6, cy: 0, r: 14.5 }, g);
    b.ant = Deck.svg('g', {}, g);
    Deck.svg('path', { class: 's01a-ant', d: 'M31,-4 Q42,-7 49,-17' }, b.ant);
    Deck.svg('path', { class: 's01a-ant', d: 'M31,4 Q42,7 49,17' }, b.ant);
    Deck.svg('circle', { class: 's01a-ant-tip', cx: 49.5, cy: -17.5, r: 2.4 }, b.ant);
    Deck.svg('circle', { class: 's01a-ant-tip', cx: 49.5, cy: 17.5, r: 2.4 }, b.ant);
    Deck.svg('circle', { class: 's01a-head', cx: 26, cy: 0, r: 10.5 }, g);
    Deck.svg('ellipse', { class: 's01a-eye', cx: 27, cy: -6.5, rx: 5, ry: 3.4 }, g);
    Deck.svg('ellipse', { class: 's01a-eye', cx: 27, cy: 6.5, rx: 5, ry: 3.4 }, g);
    Deck.svg('circle', { class: 's01a-eye-hi', cx: 29, cy: -7.5, r: 1.5 }, g);
    Deck.svg('circle', { class: 's01a-eye-hi', cx: 29, cy: 5.5, r: 1.5 }, g);
    b.wings = [];
    WINGS.forEach(w => [-1, 1].forEach(side => {
      const wg = Deck.svg('g', {}, g);
      Deck.svg('ellipse', { class: 's01a-wing', cx: w.rx, cy: 0, rx: w.rx, ry: w.ry }, wg);
      Deck.svg('path', { class: 's01a-vein', d: 'M2,0 Q' + f2(w.rx) + ',' + f2(-w.ry * 0.25) + ' ' + f2(w.rx * 1.7) + ',' + f2(w.ry * 0.2) }, wg);
      b.wings.push({ el: wg, w, side });
    }));
    return b;
  }

  function renderBee(b, now) {
    const s = BEE_S * (1 + 0.14 * b.fly);
    const wig = b.walk ? 3.5 * Math.sin(now * 13 + b.ph0) : 0;
    b.g.setAttribute('transform', 'translate(' + f2(b.x) + ' ' + f2(b.y) + ') rotate(' + f2(b.a + wig) + ') scale(' + s.toFixed(3) + ')');
    const off = 4 + 20 * b.fly;
    b.sh.setAttribute('transform', 'translate(' + f2(b.x + off) + ' ' + f2(b.y + off * 1.3) + ') rotate(' + f2(b.a) + ') scale(' + (s * (1 + 0.12 * b.fly)).toFixed(3) + ')');
    b.sh.style.opacity = (1 - 0.62 * b.fly).toFixed(3);
    const ph = now * Math.PI * 2 * 10.5 + b.ph0;
    b.wings.forEach(o => {
      const flap = 24 * b.fly * Math.sin(ph + (o.w.hind ? 0.7 : 0));
      const ang = lerp(o.w.fold, o.w.spread, b.fly) + flap;
      o.el.setAttribute('transform', 'translate(' + o.w.bx + ' ' + (o.side * -o.w.by) + ') rotate(' + f2(o.side < 0 ? ang : -ang) + ')');
      o.el.style.opacity = (1 - 0.25 * b.fly).toFixed(3);
    });
    b.ant.setAttribute('transform', 'rotate(' + f2(5 * Math.sin(now * 2.3 + b.ph0)) + ' 30 0)');
  }

  // comb transform for pose k: the bbox centre of the comb lands on POSE[k]
  function poseT(st, k) { const P = POSE[k]; return { x: P.x - P.s * st.bbc[0], y: P.y - P.s * st.bbc[1], s: P.s }; }
  function toLocal(st, p) { const P = poseT(st, 0); return [(p[0] - P.x) / P.s, (p[1] - P.y) / P.s]; }
  function bez(p0, p1, p2, p3, u) {
    const v = 1 - u;
    return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
      v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
  }
  function norm(v) { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }

  // orbit along the build front while building
  function orbit(b, t) {
    const th = b.th0 + OM * (t - b.arr);
    const front = clamp((t - B0) / BT, 0, 1) * RHO_MAX;
    const rho = clamp(front - 0.05, 0.45, 0.92);
    const p = polar(th, rho);
    return [p[0] + 7 * Math.sin(6.1 * t + b.ph0), p[1] + 6 * Math.cos(4.3 * t + b.ph0)];
  }
  function planBuild(st) {
    st.bees.forEach((b, i) => {
      const c = BEES[i];
      b.arr = c.arr; b.th0 = c.th0 / DEG; b.flyDur = Math.min(1.5, c.arr);
      b.S = toLocal(st, c.from);
      b.Q = orbit(b, b.arr);
      const tq = norm([orbit(b, b.arr + 0.05)[0] - b.Q[0], orbit(b, b.arr + 0.05)[1] - b.Q[1]]);
      const d = [b.Q[0] - b.S[0], b.Q[1] - b.S[1]], L = Math.hypot(d[0], d[1]);
      const sg = i % 2 ? 1 : -1;
      b.C1 = [b.S[0] + 0.45 * d[0] - sg * 0.22 * d[1], b.S[1] + 0.45 * d[1] + sg * 0.22 * d[0]];
      b.C2 = [b.Q[0] - tq[0] * Math.min(160, 0.3 * L), b.Q[1] - tq[1] * Math.min(160, 0.3 * L)];
      b.tLand = 4.5 + 0.28 * i;
      b.P = orbit(b, b.tLand);
      const tp = norm([orbit(b, b.tLand + 0.05)[0] - b.P[0], orbit(b, b.tLand + 0.05)[1] - b.P[1]]);
      const thL = b.th0 + OM * (b.tLand - b.arr) + 0.32;
      b.home = polar(thL, 0.58);
      b.L1 = [b.P[0] + tp[0] * 120, b.P[1] + tp[1] * 120];
      b.L2 = [lerp(b.home[0], b.L1[0], 0.35), lerp(b.home[1], b.L1[1], 0.35)];
      const hd = [b.home[0] - b.L2[0], b.home[1] - b.L2[1]];
      b.homeA = Math.atan2(hd[1], hd[0]) * DEG;
    });
  }
  function buildPos(b, t) {
    if (t <= b.arr) {
      const s = clamp((t - (b.arr - b.flyDur)) / b.flyDur, 0, 1);
      return { p: bez(b.S, b.C1, b.C2, b.Q, 1 - Math.pow(1 - s, 2)), fly: 1 };
    }
    if (t <= b.tLand) return { p: orbit(b, t), fly: 1 };
    if (t <= b.tLand + LAND) {
      const s = (t - b.tLand) / LAND;
      return { p: bez(b.P, b.L1, b.L2, b.home, smooth(0, 1, s)), fly: 1 - smooth(0.55, 1, s) };
    }
    return { p: b.home, fly: 0, done: true };
  }
  function placeBuild(st, t) {
    st.bees.forEach(b => {
      const o = buildPos(b, t);
      b.x = o.p[0]; b.y = o.p[1]; b.fly = o.fly; b.walk = false;
      if (o.done) { b.a = b.homeA; return; }
      const o2 = buildPos(b, t + 0.03);
      const dx = o2.p[0] - o.p[0], dy = o2.p[1] - o.p[1];
      if (Math.hypot(dx, dy) > 0.05) b.a = Math.atan2(dy, dx) * DEG;
    });
  }
  function restPose(st) {
    st.bees.forEach((b, i) => {
      b.x = b.home[0]; b.y = b.home[1]; b.a = b.homeA; b.walk = false;
      b.fly = i === 1 ? 1 : 0;         // frozen pose: one bee hovering, the others resting on the comb
      b.mode = 'pause'; b.timer = 0.3 + 0.5 * i;
      b.tx = b.x; b.ty = b.y; b.base = b.home; b.n = 0;
    });
  }

  // ---------- idle: gentle crawling, now and then a short hop ----------
  function segDist(p, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy || 1;
    const t = clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2, 0, 1);
    return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy);
  }
  function clearOf(st, b, a, q, gap) {
    return st.bees.every(o => o === b || (segDist([o.x, o.y], a, q) > gap && segDist([o.tx, o.ty], a, q) > gap));
  }
  function plan(st, b) {
    const rnd = st.rnd;
    b.n = (b.n || 0) + 1;
    const p0 = [b.x, b.y];
    if (!st.flyer && !st.calm && b.n > 1 && rnd() < 0.18) {
      // a short hop to the free-est spot of the comb (keeps the bees spread out); it becomes the bee's new home
      let best = null, bestGap = 190;
      for (let k = 0; k < 18; k++) {
        const q = polar(rnd() * 2 * Math.PI, 0.25 + 0.5 * rnd());
        const L = Math.hypot(q[0] - p0[0], q[1] - p0[1]);
        if (L < 170 || L > 360) continue;
        const gap = Math.min(...st.bees.filter(o => o !== b).map(o => Math.min(Math.hypot(o.x - q[0], o.y - q[1]), Math.hypot(o.tx - q[0], o.ty - q[1]))));
        if (gap > bestGap) { bestGap = gap; best = { q, L }; }
      }
      if (best) {
        const q = best.q, L = best.L;
        const h = [Math.cos(b.a / DEG), Math.sin(b.a / DEG)], d = [q[0] - p0[0], q[1] - p0[1]];
        const sg = rnd() < 0.5 ? 1 : -1;
        b.fp = [p0, [p0[0] + h[0] * 0.45 * L, p0[1] + h[1] * 0.45 * L],
          [q[0] - 0.3 * d[0] + sg * 0.35 * d[1], q[1] - 0.3 * d[1] - sg * 0.35 * d[0]], q];
        b.mode = 'fly'; b.k = 0; b.dur = 1.6 + L / 260; b.tx = q[0]; b.ty = q[1];
        b.base = q;
        st.flyer = b;
        return;
      }
    }
    // crawl a little, staying within reach of the bee's own patch of comb
    for (let k = 0; k < 20; k++) {
      const ang = b.a / DEG + (rnd() - 0.5) * (k < 10 ? 2.6 : 6.2);
      const L = 45 + 85 * rnd();
      const q = [p0[0] + L * Math.cos(ang), p0[1] + L * Math.sin(ang)];
      if (rhoOf(q[0], q[1]) > 0.78) continue;
      if (Math.hypot(q[0] - b.base[0], q[1] - b.base[1]) > 150) continue;
      if (!clearOf(st, b, p0, q, 135)) continue;
      const tgt = Math.atan2(q[1] - p0[1], q[0] - p0[0]) * DEG;
      b.a0 = b.a; b.da = ((tgt - b.a + 540) % 360) - 180;
      b.mode = 'turn'; b.k = 0; b.dur = 0.25 + Math.abs(b.da) / 220;
      b.p0 = p0; b.p1 = q; b.tx = q[0]; b.ty = q[1]; b.L = L;
      return;
    }
    // boxed in: look around a little
    b.a0 = b.a; b.da = (rnd() - 0.5) * 90; b.mode = 'turn'; b.k = 0; b.dur = 0.6; b.p0 = b.p1 = p0; b.L = 0;
  }
  function idleStep(st, dt) {
    st.bees.forEach(b => {
      if (b.mode === 'pause') {
        b.fly = Math.max(0, b.fly - dt * 3);
        b.timer -= dt;
        if (b.timer <= 0) plan(st, b);
      } else if (b.mode === 'turn') {
        b.k = Math.min(1, b.k + dt / b.dur);
        b.fly = Math.max(0, b.fly - dt * 3);
        b.a = b.a0 + b.da * smooth(0, 1, b.k);
        if (b.k >= 1) {
          if (b.L > 0) { b.mode = 'crawl'; b.k = 0; b.dur = b.L / CRAWL_V; b.walk = true; }
          else { b.mode = 'pause'; b.timer = (0.8 + 1.6 * st.rnd()) * (st.calm ? 3 : 1); }
        }
      } else if (b.mode === 'crawl') {
        b.k = Math.min(1, b.k + dt / b.dur);
        const u = 0.5 - 0.5 * Math.cos(Math.PI * b.k);
        b.x = lerp(b.p0[0], b.p1[0], u); b.y = lerp(b.p0[1], b.p1[1], u);
        if (b.k >= 1) { b.walk = false; b.mode = 'pause'; b.timer = (0.9 + 2.4 * st.rnd()) * (st.calm ? 3 : 1); }
      } else if (b.mode === 'fly') {
        b.k = Math.min(1, b.k + dt / b.dur);
        const u = smooth(0, 1, b.k);
        const p = bez(b.fp[0], b.fp[1], b.fp[2], b.fp[3], u);
        const p2 = bez(b.fp[0], b.fp[1], b.fp[2], b.fp[3], Math.min(1, u + 0.01));
        if (b.k < 0.995 && Math.hypot(p2[0] - p[0], p2[1] - p[1]) > 0.01) b.a = Math.atan2(p2[1] - p[1], p2[0] - p[0]) * DEG;
        b.x = p[0]; b.y = p[1];
        b.fly = smooth(0, 0.16, b.k) * (1 - smooth(0.84, 1, b.k));
        if (b.k >= 1) { b.mode = 'pause'; b.timer = 1.2 + 2 * st.rnd(); st.flyer = null; }
      }
    });
  }

  // ---------- one ticker while the slide is live ----------
  function startTicker(st) {
    if (st.tick) return;
    st.last = gsap.ticker.time;
    st.tick = () => {
      const now = gsap.ticker.time, dt = clamp(now - st.last, 0, 0.05);
      st.last = now;
      if (st.mode === 'build' && st.buildTl) placeBuild(st, st.buildTl.time());
      else if (st.mode === 'idle') idleStep(st, dt);
      st.bees.forEach(b => renderBee(b, now));
    };
    gsap.ticker.add(st.tick);
  }
  function stopTicker(st) { if (st.tick) { gsap.ticker.remove(st.tick); st.tick = null; } }

  // ---------- build (step 0 entrance) ----------
  function playBuild(st) {
    killBuild(st);
    const tl = gsap.timeline({ onComplete: () => { st.buildTl = null; combFinal(st); restPose(st); st.bees.forEach(b => { b.fly = 0; }); st.mode = 'idle'; } });
    gsap.set(st.waxes, { opacity: 0, scale: 0.55, svgOrigin: '0 0' });
    gsap.set(st.pits, { drawSVG: '0%', fillOpacity: 0 });
    gsap.set(st.hons, { opacity: 0, scale: 0.2, svgOrigin: '0 0' });
    gsap.set(st.caps, { opacity: 0, scale: 0.8, svgOrigin: '0 0' });
    gsap.set(st.caption, { opacity: 0 });
    st.cells.forEach(c => {
      if (c.full) {
        tl.to(c.wax, { opacity: 1, scale: 1, svgOrigin: '0 0', duration: 0.45, ease: 'power2.out' }, c.t);
        tl.to(c.pit, { drawSVG: '100%', duration: 0.55, ease: 'power2.inOut' }, c.t + 0.04);
        tl.to(c.pit, { fillOpacity: 1, duration: 0.35, ease: 'none' }, c.t + 0.3);
        if (c.hon) tl.to(c.hon, { opacity: 1, scale: 1, svgOrigin: '0 0', duration: 0.8, ease: 'power2.out' }, c.t + 0.75 + 0.55 * c.q2);
        if (c.capEl) tl.to(c.capEl, { opacity: 1, scale: 1, svgOrigin: '0 0', duration: 0.5, ease: 'power2.out' }, Math.max(c.t + 1.7, 4.3) + 0.9 * c.jit);
      } else {
        tl.to(c.pit, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, c.t);
      }
    });
    tl.add(() => {}, 4.5 + 0.28 * (BEES.length - 1) + LAND + 0.1);   // timeline lasts until the last bee has landed
    st.buildTl = tl;
    st.mode = 'build';
    gsap.to(st.caption, { opacity: 1, duration: 0.8, ease: 'power1.out', delay: 5.6 });
    placeBuild(st, 0);
  }
  function killBuild(st) {
    if (st.buildTl) { st.buildTl.kill(); st.buildTl = null; }
  }

  // ---------- shape race (step 1) ----------
  const RACE = { K: 72, X0: 168, CX: 72, ROWS: [56, 160, 264] };
  function buildRace(st) {
    const svg = st.sec.querySelector('.s01a-race-svg');
    st.race = [{ n: 3, name: 'triangle' }, { n: 4, name: 'square' }, { n: 6, name: 'hexagon' }].map((o, i) => {
      const L = RACE.K * Math.sqrt(4 * Math.tan(Math.PI / o.n) / o.n);   // side of a regular n-gon of area K^2
      o.L = L; o.P = o.n * L / RACE.K;                                       // wall length for unit area
      const pts = [[0, 0]];
      for (let j = 0; j < o.n; j++) { const a = -j * 2 * Math.PI / o.n - (o.n === 6 ? Math.PI / 6 : 0), p = pts[pts.length - 1]; pts.push([p[0] + L * Math.cos(a), p[1] + L * Math.sin(a)]); }
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const ox = RACE.CX - (Math.min(...xs) + Math.max(...xs)) / 2, oy = RACE.ROWS[i] - (Math.min(...ys) + Math.max(...ys)) / 2;
      o.y = RACE.ROWS[i];
      // samples along the wall (every vertex + 14 per edge): arc fraction f -> point on the polygon
      o.smp = [];
      for (let j = 0; j < o.n; j++) {
        for (let k = 0; k < 14; k++) {
          const t = k / 14;
          o.smp.push({ f: (j + t) / o.n, x: lerp(pts[j][0], pts[j + 1][0], t) + ox, y: lerp(pts[j][1], pts[j + 1][1], t) + oy });
        }
      }
      o.smp.push({ f: 1, x: pts[o.n][0] + ox, y: pts[o.n][1] + oy });
      o.shape = Deck.svg('path', { class: 's01a-shape', 'data-i': i, d: pts.slice(0, -1).map((p, j) => (j ? 'L' : 'M') + f2(p[0] + ox) + ',' + f2(p[1] + oy)).join('') + 'Z' }, svg);
      o.chain = Deck.svg('path', { class: 's01a-chain', 'data-i': i }, svg);
      o.nameEl = Deck.svg('text', { class: 's01a-name', x: RACE.X0, y: o.y - 20 }, svg);
      o.nameEl.textContent = o.name;
      o.val = Deck.svg('text', { class: 's01a-val', 'data-i': i, x: f2(RACE.X0 + o.P * RACE.K + 14), y: o.y + 10 }, svg);
      return o;
    });
    const tri = st.race[0], sq = st.race[1], hex = st.race[2];
    st.save = Deck.svg('text', { class: 's01a-save', x: RACE.X0, y: 326 }, svg);
    st.save.textContent = '−' + Math.round((1 - hex.P / sq.P) * 100) + '% vs square · −' + Math.round((1 - hex.P / tri.P) * 100) + '% vs triangle';
    st.raceBox = st.sec.querySelector('.s01a-race');
    st.raceText = [st.sec.querySelector('.s01a-race-h'), st.sec.querySelector('.s01a-race-sub')];
  }
  // the wall of the cell peels off and straightens into its bar: each point of the outline slides to its arc length
  // on the bar, the start of the wall first (stays inside the row: straight moves between shape and bar)
  function setChain(o, p) {
    let d = '';
    o.smp.forEach((q, j) => {
      const u = clamp((p - 0.4 * q.f) / 0.6, 0, 1), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      d += (j ? 'L' : 'M') + f2(lerp(q.x, RACE.X0 + q.f * o.P * RACE.K, e)) + ',' + f2(lerp(q.y, o.y, e));
    });
    o.chain.setAttribute('d', d);
    o.chain.style.strokeWidth = f2(3 + 13 * smooth(0.8, 1, p));
    o.chain.style.opacity = p > 0 ? 1 : 0;
  }
  function raceState(st, on) {
    const els = st.race.map(o => [o.shape, o.nameEl, o.val]).flat().concat(st.save, st.raceText);
    kill(els); if (st.raceTl) { st.raceTl.kill(); st.raceTl = null; }
    st.race.forEach(o => {
      gsap.set(o.shape, { clearProps: 'strokeDasharray,strokeDashoffset', opacity: on ? 1 : 0 });
      setChain(o, on ? 1 : 0);
      o.val.textContent = on ? o.P.toFixed(2) : '';
    });
    gsap.set([st.save].concat(st.race.map(o => o.nameEl), st.race.map(o => o.val), st.raceText), { opacity: on ? 1 : 0, y: 0 });
    st.raceBox.classList.toggle('is-won', on);
  }
  function raceAnim(st) {
    raceState(st, false);
    const tl = gsap.timeline({ delay: 0.35, onComplete: () => { st.raceTl = null; } });
    tl.fromTo(st.raceText, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' }, 0);
    st.race.forEach((o, i) => tl.fromTo(o.shape, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut' }, 0.3 + 0.12 * i));
    st.race.forEach((o, i) => {
      const t0 = 0.95 + 0.3 * i, pr = { p: 0 };
      // the value counts up with the unrolling wall (number and bar never contradict each other)
      tl.to(pr, { p: 1, duration: 1.15, ease: 'none', onUpdate: () => { setChain(o, pr.p); o.val.textContent = (o.P * smooth(0.4, 1, pr.p)).toFixed(2); } }, t0);
      tl.to([o.nameEl, o.val], { opacity: 1, duration: 0.35 }, t0 + 0.35);
    });
    tl.add(() => st.raceBox.classList.add('is-won'), 2.95);
    tl.to(st.save, { opacity: 1, duration: 0.5 }, 3.0);
    st.raceTl = tl;
  }

  // ---------- timeline (step 2) ----------
  function tlState(st, on) {
    const els = [st.tlLine, st.tlArrow].concat(st.tlNodes);
    kill(els); if (st.tlTl) { st.tlTl.kill(); st.tlTl = null; }
    gsap.set(st.tlLine, { clearProps: 'strokeDasharray,strokeDashoffset' });
    gsap.set(els, { opacity: on ? 1 : 0 });
    gsap.set(st.tlNodes, { y: 0 });
  }
  function tlAnim(st) {
    tlState(st, false);
    const tl = gsap.timeline({ onComplete: () => { st.tlTl = null; } });
    tl.fromTo(st.tlLine, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 1.3, ease: 'power2.inOut' }, 0.1);
    tl.to(st.tlArrow, { opacity: 1, duration: 0.3 }, 1.3);
    st.tlNodes.forEach((n, i) => tl.fromTo(n, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.2 + 0.45 * i));
    st.tlTl = tl;
  }

  // ---------- comb placement ----------
  function applyPose(st) { st.comb.setAttribute('transform', 'translate(' + f2(st.pose.x) + ' ' + f2(st.pose.y) + ') scale(' + st.pose.s.toFixed(4) + ')'); }
  function setPose(st, k, animate) {
    kill(st.pose);
    const P = poseT(st, k);
    if (!animate) { st.pose.x = P.x; st.pose.y = P.y; st.pose.s = P.s; applyPose(st); return; }
    gsap.to(st.pose, { x: P.x, y: P.y, s: P.s, duration: 1.1, ease: 'power3.inOut', onUpdate: () => applyPose(st) });
  }

  Deck.register('s01a', {
    steps: 3,
    init(sec) {
      const st = sec._s01a = { sec, mode: 'rest', rnd: mulberry(5), pose: { x: 0, y: 0, s: 1 } };
      st.comb = sec.querySelector('.s01a-comb');
      st.caption = sec.querySelector('.s01a-caption');
      buildComb(st);
      const bh = sec.querySelector('.s01a-bees'), sh = sec.querySelector('.s01a-shadows');
      st.bees = BEES.map((c, i) => buildBee(bh, sh, i));
      planBuild(st);
      buildRace(st);
      st.tlLine = sec.querySelector('.s01a-tl-line');
      st.tlArrow = sec.querySelector('.s01a-tl-arrow');
      st.tlNodes = Array.from(sec.querySelectorAll('.s01a-tl-node'));
      combFinal(st); restPose(st);
      st.bees.forEach(b => renderBee(b, 0));
      setPose(st, 0, false);
    },
    go(step, ctx) {
      const st = ctx.sec._s01a;
      if (!st) return;
      const live = !isStatic() && isCurrent(ctx.sec);
      const animate = live && !ctx.instant;
      st.calm = step >= 1;                             // after the pause: rarer crawls, no hops (bees stay in the periphery)
      ctx.sec.classList.toggle('s01a-focus', step >= 3);
      // comb + bees
      if (live && step > 0) st.played = true;          // entered backwards: no rebuild when stepping back to 0
      if (step === 0 && live && !st.played) {
        st.played = true;
        playBuild(st);
      } else if (st.buildTl && live && (step === 0 || animate)) {
        st.buildTl.timeScale(step > 0 ? 4 : 1);       // stepped on during the build: finish it quickly, bees still fly home
      } else {
        if (st.buildTl || st.mode !== 'idle' || !live) {
          killBuild(st);
          combFinal(st); restPose(st);
          if (live) st.bees.forEach(b => { b.fly = 0; });
        }
        st.mode = live ? 'idle' : 'rest';
      }
      // caption: after the build on step 0, gone from step 1 on
      if (step === 0) {
        kill(st.caption);
        if (!st.buildTl) gsap.set(st.caption, { opacity: 1 });
        else if (live) gsap.to(st.caption, { opacity: 1, duration: 0.8, ease: 'power1.out', delay: Math.max(0, 5.6 - st.buildTl.time()) });
      } else {
        kill(st.caption);
        if (animate && ctx.prev === 0) gsap.to(st.caption, { opacity: 0, duration: 0.3 }); else gsap.set(st.caption, { opacity: 0 });
      }
      setPose(st, step > 0 ? 1 : 0, animate && step === 1 && ctx.prev === 0);
      if (live) startTicker(st);
      else { stopTicker(st); st.bees.forEach(b => renderBee(b, 0)); }
      // step content
      if (animate && step === 1 && ctx.prev === 0) raceAnim(st);
      else if (!(st.raceTl && step >= 1)) raceState(st, step >= 1);
      if (animate && step === 2 && ctx.prev === 1) tlAnim(st);
      else if (!(st.tlTl && step >= 2)) tlState(st, step >= 2);
    },
    leave(sec) {
      const st = sec._s01a;
      if (!st) return;
      // no reset here: the slide is still fading out (go() resets the comb and bees on re-entry)
      stopTicker(st);
      killBuild(st);
      kill(st.caption);
      st.mode = 'rest';
      st.played = false;
    },
  });
})();
