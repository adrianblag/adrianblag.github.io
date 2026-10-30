/* S2 — Cells switch enzymes on just in time.
   Hero motion graphic driven by the real LPN3B optimal solution (window.DATA.lpn3b).
   Steps: 0 grey pathway + empty gauge + empty axes (audience question)
          1 time cursor sweeps 0 -> tf (~12 s; instant end state otherwise) + "2002 predicted" card
          2 arrow + "2004 observed" card (citations fade in)
          3 big arrow "objective -> behaviour"
          4 flips to "behaviour -> objective?" (purple)                                        */
(function () {
  'use strict';
  const RUN_S = 12;                 // duration of the time sweep when stepping forward
  const X0 = 70, X1 = 830;          // plot x-range (px, in the 900x470 viewBox)
  const Y0 = 400, Y1 = 100;         // plot y-range (bottom, top)
  const LANES = [10, 34, 58], LANE_H = 18;
  const NODE = { 2: { cy: 190, r: 52 }, 3: { cy: 190, r: 52 }, 4: { cy: 190, r: 52 } };
  const GX = 16, GW = 544;          // gauge geometry

  function isStatic() { return Deck.isStatic || (window.Reveal && Reveal.isPrintView && Reveal.isPrintView()); }
  // kill every tween on these targets (gsap.killTweensOf(array) leaves per-element fromTo tweens alive)
  function kill(els) { gsap.getTweensOf(els).forEach(t => t.kill()); }

  function interp(ts, ys, t) {
    if (t <= ts[0]) return ys[0];
    const n = ts.length;
    if (t >= ts[n - 1]) return ys[n - 1];
    const i = d3.bisectRight(ts, t) - 1;
    const f = (t - ts[i]) / (ts[i + 1] - ts[i]);
    return ys[i] + f * (ys[i + 1] - ys[i]);
  }

  function build(sec, D) {
    const st = { sec, D, t: 0, tw: null, entry: null, played: false };
    const svg = d3.select(sec.querySelector('.s02-plot'));
    const tf = D.tf;
    const T = D.traj.t;
    const yMax = Math.ceil(Math.max(d3.max(D.traj.S2), d3.max(D.traj.S3), d3.max(D.traj.S4)) * 10) / 10 + 0.1;
    st.yMax = yMax;
    const x = d3.scaleLinear().domain([0, tf]).range([X0, X1]);
    const y = d3.scaleLinear().domain([0, yMax]).range([Y0, Y1]);
    st.x = x; st.y = y;

    // grid + axes
    const yt = [0, 1, 2].filter(v => v <= yMax);
    const g = svg.append('g').attr('class', 's02-grid');
    yt.forEach(v => g.append('line').attr('x1', X0).attr('x2', X1).attr('y1', y(v)).attr('y2', y(v)));
    const ax = svg.append('g').attr('class', 's02-axis');
    ax.append('line').attr('x1', X0).attr('x2', X1).attr('y1', Y0).attr('y2', Y0);
    ax.append('line').attr('x1', X0).attr('x2', X0).attr('y1', Y0).attr('y2', Y1 - 6);
    yt.forEach(v => svg.append('text').attr('class', 's02-tick').attr('x', X0 - 14).attr('y', y(v) + 7).attr('text-anchor', 'end').text(v));
    d3.range(0, Math.floor(tf) + 1).forEach(v => {
      ax.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', Y0).attr('y2', Y0 + 8);
      svg.append('text').attr('class', 's02-tick').attr('x', x(v)).attr('y', Y0 + 32).attr('text-anchor', 'middle').text(v);
    });
    svg.append('text').attr('class', 's02-axt').attr('x', 900).attr('y', Y0 + 32).attr('text-anchor', 'end').text('time');
    svg.append('text').attr('class', 's02-axt').attr('x', X0 + 12).attr('y', y(2) + 32).text('concentration');

    // enzyme lanes (e_i(t) from the exported piecewise-constant control)
    const tn = D.u_nodes.t;
    [1, 2, 3].forEach((e, i) => {
      svg.append('rect').attr('class', 's02-lane').attr('x', X0).attr('y', LANES[i]).attr('width', X1 - X0).attr('height', LANE_H).attr('rx', 5);
      svg.append('text').attr('class', 's02-lanelab').attr('x', X0 - 14).attr('y', LANES[i] + 16).text('e' + '₁₂₃'[i]);
    });

    // everything that is revealed by the sweeping cursor lives under one clip
    const defs = svg.append('defs');
    const clip = defs.append('clipPath').attr('id', 's02-sweep');
    st.clipRect = clip.append('rect').attr('x', X0 - 6).attr('y', 0).attr('width', 0).attr('height', 470).node();
    const swept = svg.append('g').attr('clip-path', 'url(#s02-sweep)');
    [1, 2, 3].forEach((e, i) => {
      const v = D.u_nodes['e' + e];
      let k = 0;
      while (k < v.length) {               // merge runs of equal values into one bar
        if (v[k] <= 1e-3) { k++; continue; }
        let j = k;
        while (j + 1 < v.length && Math.abs(v[j + 1] - v[k]) < 1e-6) j++;
        swept.append('rect').attr('class', 's02-bar').attr('data-e', e)
          .attr('x', x(tn[k])).attr('y', LANES[i]).attr('width', Math.max(1, x(tn[j + 1]) - x(tn[k]))).attr('height', LANE_H)
          .attr('rx', v[k] > 0.5 ? 5 : 1).style('opacity', Math.max(0.25, v[k]));
        k = j + 1;
      }
    });
    const line = d3.line().x((d, i) => x(T[i])).y(d => y(d));
    [1, 2, 3, 4].forEach(s => swept.append('path').attr('class', 's02-curve').attr('data-s', s).attr('d', line(D.traj['S' + s])));

    // target line S4 = 0.9 (terminal equality)
    st.target = svg.append('g').attr('class', 's02-fade').style('opacity', 0).node();
    d3.select(st.target).append('line').attr('class', 's02-target').attr('x1', X0).attr('x2', X1).attr('y1', y(D.target_S4)).attr('y2', y(D.target_S4));
    d3.select(st.target).append('text').attr('class', 's02-targetlab').attr('x', X0 + 10).attr('y', y(D.target_S4) + 24).text('target ' + D.target_S4);

    // switch ticks (dashed) at the exported switch times
    st.sw = D.switch_times.map(ts => {
      const n = svg.append('line').attr('class', 's02-swl s02-fade').attr('x1', x(ts)).attr('x2', x(ts)).attr('y1', 2).attr('y2', Y0).style('opacity', 0).node();
      return { t: ts, n };
    });

    // tf* : dashed line, ring where S4 hits 0.9, label under the axis
    st.tfg = svg.append('g').attr('class', 's02-fade').style('opacity', 0).node();
    const tg = d3.select(st.tfg);
    tg.append('line').attr('class', 's02-tfl').attr('x1', x(tf)).attr('x2', x(tf)).attr('y1', 2).attr('y2', Y0);
    const lab = tg.append('text').attr('class', 's02-tflab').attr('x', x(tf) + 6).attr('y', Y0 + 32);
    lab.append('tspan').text('t');
    lab.append('tspan').attr('baseline-shift', 'sub').attr('font-size', 19).text('f');
    lab.append('tspan').attr('baseline-shift', 'super').attr('font-size', 19).text('*');
    tg.append('circle').attr('class', 's02-hit').attr('cx', x(tf)).attr('cy', y(D.traj.S4[D.traj.S4.length - 1])).attr('r', 9);

    // end labels (direct labels, no legend), nudged apart if needed
    st.endlab = svg.append('g').attr('class', 's02-endlab s02-fade').style('opacity', 0).node();
    const ends = [2, 3, 4].map(s => ({ s, yv: y(D.traj['S' + s][D.traj['S' + s].length - 1]) }));
    ends.sort((a, b) => a.yv - b.yv);
    for (let i = 1; i < ends.length; i++) if (ends[i].yv - ends[i - 1].yv < 28) ends[i].yv = ends[i - 1].yv + 28;
    ends.forEach(o => {
      const gg = d3.select(st.endlab).append('g').attr('data-s', o.s);
      gg.append('line').attr('x1', X1 + 12).attr('x2', X1 + 26).attr('y1', o.yv).attr('y2', o.yv);
      gg.append('text').attr('x', X1 + 32).attr('y', o.yv + 8).text('S' + '₁₂₃₄'[o.s - 1]);
    });
    // nudge the S4 end label right of the hit ring
    d3.select(st.endlab).select('[data-s="4"] line').attr('x1', X1 + 16);
    // S1: flat constant pool, labelled at the left end (its right end is next to the 0.9 target)
    st.s1lab = svg.append('text').attr('class', 's02-s1lab s02-fade').attr('x', X0 + 12).attr('y', y(1) - 12).style('opacity', 0).node();
    d3.select(st.s1lab).append('tspan').text('S₁ ');
    d3.select(st.s1lab).append('tspan').attr('class', 'c').text('constant pool');

    // cursor + riding dots
    st.cursor = svg.append('g').attr('class', 's02-cursor').style('opacity', 0).node();
    d3.select(st.cursor).append('line').attr('x1', 0).attr('x2', 0).attr('y1', 2).attr('y2', Y0);
    st.dots = [1, 2, 3, 4].map(s => d3.select(st.cursor).append('circle').attr('class', 's02-dot').attr('data-s', s).attr('r', 8).attr('cx', 0).node());

    // caption numbers come from the data
    sec.querySelector('.s02-sw').textContent = D.switch_times.map(v => Deck.fmt(v, 2)).join(', ');
    sec.querySelector('.s02-tf').textContent = Deck.fmt(tf, 2);

    // pathway handles
    st.enz = [1, 2, 3].map(e => sec.querySelector('.s02-enz[data-e="' + e + '"]'));
    st.flow = [1, 2, 3].map(e => sec.querySelector('.s02-flow[data-e="' + e + '"]'));
    st.seg = [1, 2, 3].map(e => sec.querySelector('.s02-seg[data-e="' + e + '"]'));
    st.node = [2, 3, 4].map(s => ({ s, g: sec.querySelector('.s02-node[data-s="' + s + '"]'), liq: sec.querySelector('.s02-node[data-s="' + s + '"] .s02-liq') }));
    st.clock = sec.querySelector('.s02-clock');
    st.draws = Array.from(sec.querySelectorAll('.s02-path .s02-draw'));
    st.pathSvg = sec.querySelector('.s02-path');
    st.extras = [sec.querySelector('.s02-gauge'), sec.querySelector('.s02-cap')];   // not in the S1 drawing
    return st;
  }

  function enzymesAt(D, t) {
    const tn = D.u_nodes.t;
    let k = d3.bisectRight(tn, t) - 1;
    k = Math.max(0, Math.min(D.u_nodes.e1.length - 1, k));
    return [D.u_nodes.e1[k], D.u_nodes.e2[k], D.u_nodes.e3[k]];
  }

  // draw the system at time t (t < 0 = idle state of step 0)
  function render(st, t) {
    const { D, x, y } = st;
    const idle = t < 0;
    const tt = Math.max(0, Math.min(D.tf, t));
    st.clipRect.setAttribute('width', idle ? 0 : Math.max(0, x(tt) - X0 + 6));
    st.cursor.style.opacity = idle || tt >= D.tf ? 0 : 1;
    st.s1lab.style.opacity = idle ? 0 : 1;
    st.cursor.setAttribute('transform', 'translate(' + x(tt) + ',0)');
    [1, 2, 3, 4].forEach((s, i) => st.dots[i].setAttribute('cy', y(interp(D.traj.t, D.traj['S' + s], tt))));
    // pathway nodes fill with the concentration (same scale as the plot)
    st.node.forEach(o => {
      const v = idle ? 0 : interp(D.traj.t, D.traj['S' + o.s], tt);
      const f = Math.max(0, Math.min(1, v / st.yMax));
      const r = NODE[o.s].r, cy = NODE[o.s].cy;
      o.liq.setAttribute('y', cy + r - 2 * r * f);
      o.liq.setAttribute('height', 2 * r * f);
      o.g.classList.toggle('is-live', !idle && v > 0.004);
    });
    // enzymes, active reaction and budget gauge
    const e = idle ? [0, 0, 0] : enzymesAt(D, Math.min(tt, D.tf - 1e-9));
    let acc = 0;
    e.forEach((v, i) => {
      st.enz[i].classList.toggle('is-on', v > 0.02);
      st.flow[i].classList.toggle('is-on', v > 0.02 && tt < D.tf);
      st.seg[i].setAttribute('x', GX + GW * acc);
      st.seg[i].setAttribute('width', GW * v);
      acc += v;
    });
    st.sw.forEach(o => { o.n.style.opacity = !idle && tt >= o.t ? 1 : 0; });
    st.clock.textContent = 't = ' + (idle ? 0 : tt).toFixed(2);
    st.sec.classList.toggle('s02-live', !idle);
  }

  function setDone(st, on) {
    st.endlab.style.opacity = on ? 1 : 0;
    st.tfg.style.opacity = on ? 1 : 0;
    st.sec.classList.toggle('s02-done', on);
  }

  function killRun(st) {
    if (st.tw) { st.tw.kill(); st.tw = null; }
    st.sec.classList.remove('s02-running');
  }
  function killEntry(st) {
    if (st.entry) { st.entry.kill(); st.entry = null; }
    gsap.set(st.draws, { clearProps: 'strokeDasharray,strokeDashoffset,opacity' });
    gsap.set([st.pathSvg].concat(st.extras), { clearProps: 'transform,opacity' });
  }

  function runSweep(st) {
    killRun(st);
    const o = { t: 0 };
    render(st, 0);
    setDone(st, false);
    st.target.style.opacity = 1;
    st.sec.classList.add('s02-running');
    st.tw = gsap.to(o, {
      t: st.D.tf, duration: RUN_S, ease: 'none', delay: 0.5,
      onUpdate: () => render(st, o.t),
      onComplete: () => { render(st, st.D.tf); setDone(st, true); st.sec.classList.remove('s02-running'); st.tw = null; },
    });
  }

  // the flip "objective -> behaviour" / "behaviour -> objective?" (FLIP: measure, toggle, animate back)
  function setFlip(sec, flipped, animate) {
    const obj = sec.querySelector('.s02-w-obj'), beh = sec.querySelector('.s02-w-beh');
    kill([obj, beh]);
    if (!animate) { sec.classList.toggle('s02-flipped', flipped); gsap.set([obj, beh], { x: 0, y: 0 }); return; }
    gsap.set([obj, beh], { x: 0, y: 0 });
    const b0 = obj.getBoundingClientRect(), b1 = beh.getBoundingClientRect();
    sec.classList.toggle('s02-flipped', flipped);
    const a0 = obj.getBoundingClientRect(), a1 = beh.getBoundingClientRect();
    const sc = (window.Reveal && Reveal.getScale && Reveal.getScale()) || 1;
    const dur = 0.95;
    gsap.fromTo(obj, { x: (b0.left - a0.left) / sc }, { x: 0, duration: dur, ease: 'power3.inOut' });
    gsap.fromTo(beh, { x: (b1.left - a1.left) / sc }, { x: 0, duration: dur, ease: 'power3.inOut' });
    gsap.fromTo(obj, { y: 0 }, { y: -46, duration: dur / 2, ease: 'sine.out', yoyo: true, repeat: 1 });
    gsap.fromTo(beh, { y: 0 }, { y: 46, duration: dur / 2, ease: 'sine.out', yoyo: true, repeat: 1 });
  }

  function entryDraw(st) {
    killEntry(st);
    const tl = gsap.timeline();
    tl.fromTo(st.draws, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.07 });
    tl.add(() => gsap.set(st.draws, { clearProps: 'strokeDasharray,strokeDashoffset' }));
    st.entry = tl;
  }

  // arriving from S1: the pathway grows out of the faint S1 title drawing (same shapes, placed by s01.js)
  // and slides into its home position, so the opening reads as one movement
  function morphIn(st) {
    killEntry(st);
    const G = window.S01Geo, el = st.pathSvg;
    const sc = (window.Reveal && Reveal.getScale && Reveal.getScale()) || 1;
    const rs = st.sec.getBoundingClientRect(), rp = el.getBoundingClientRect();
    if (!G || !(sc > 0) || !rp.width) { entryDraw(st); return; }
    const lx = (rp.left - rs.left) / sc, ly = (rp.top - rs.top) / sc;
    // S1 draws viewBox point (x, y) at slide (X0 + K(x-16), Y0 + K(y-190)) -> viewBox origin at (X0 - 16K, Y0 - 190K)
    const tx = G.X0 - 16 * G.K - lx, ty = G.Y0 - 190 * G.K - ly;
    const tl = gsap.timeline({ onComplete: () => gsap.set([el].concat(st.extras), { clearProps: 'transform,opacity' }) });
    tl.fromTo(el, { x: tx, y: ty, scale: G.K, transformOrigin: '0 0', opacity: 0.5 },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power3.inOut' }, 0.1);
    tl.fromTo(st.extras, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.8);
    st.entry = tl;
  }

  Deck.register('s02', {
    steps: 4,
    init(sec) {
      const D = window.DATA && window.DATA.lpn3b;
      if (!D) {
        sec.querySelector('.s02-plotcol').insertAdjacentHTML('beforeend', '<p class="s02-err">DATA.lpn3b is missing (slides/data/lpn3b.js)</p>');
        return;
      }
      sec._s02 = build(sec, D);
      render(sec._s02, -1);
    },
    go(step, ctx) {
      const st = ctx.sec._s02;
      if (!st) return;
      const animate = !ctx.instant && !isStatic();
      // time sweep: step 0 idle, step >= 1 end state (animated only when stepping 0 -> 1)
      if (step === 0) {
        killRun(st);
        render(st, -1);
        setDone(st, false);
        st.target.style.opacity = 0;
        // entering the slide fresh: the pathway draws itself on (continuity with the S1 title drawing)
        const current = window.Reveal && Reveal.getCurrentSlide && Reveal.getCurrentSlide() === ctx.sec;
        if (current && !st.played && !isStatic()) {
          const prev = window.Reveal && Reveal.getPreviousSlide && Reveal.getPreviousSlide();
          if (prev && prev.dataset.module === 's01' && window.S01Geo) morphIn(st); else entryDraw(st);
        }
        if (current) st.played = true;
      } else {
        killEntry(st);
        if (step === 1 && animate && ctx.prev === 0) {
          runSweep(st);
        } else if (!(st.tw && step === 1)) {
          killRun(st);
          render(st, st.D.tf);
          st.target.style.opacity = 1;
          setDone(st, true);
        }
      }
      setFlip(ctx.sec, step >= 4, animate && step === 4 && ctx.prev === 3);
    },
    leave(sec) {
      const st = sec._s02;
      if (!st) return;
      killRun(st);
      killEntry(st);
      st.played = false;
    },
  });
})();
