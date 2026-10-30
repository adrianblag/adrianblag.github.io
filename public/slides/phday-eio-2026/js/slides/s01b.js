/* S01b — Optimality principles at every scale (Banga & Sager 2025, Table 1).
   Steps: 0 the ladder builds bottom-up (Molecular -> Ecosystem, 0.16 s per rung) while a bee (the S2 drawing) climbs
            the empty right-hand column and lands at the top, facing the ladder;
          1 everything dims except the Pathway rung (honey band + highlighter + "next" tag); the bee flies down and
            lands right after the key example, facing it.
   The bee is one state object {x, y, a (heading, deg), fly (0 perched .. 1 flying), o} rendered by renderBee();
   flights follow smooth paths and the heading follows the direction of travel. Idle (perched: rare wing flutter,
   antenna twitch; CSS keyframes) only while the slide is live; never in ?static / print (frozen pose, wings folded). */
(function () {
  'use strict';
  const PITCH = 104, N = 7, H = PITCH * N;           // must match css/slides/s01b.css
  const rowY = k => H - (k + 0.5) * PITCH;            // rung k (0 = Molecular, bottom) centre, stage px
  const S = 0.8;                                      // bee scale (S2 bees ~1.03 on their comb): ~90 px long
  // perches (stage px, heading deg): right end of the Ecosystem rung at step 0; right after the first Pathway
  // example at step 1 (its first line ends at stage x 1488, centre y 557), both facing the ladder (180 = leftwards)
  const REST = [{ x: 1612, y: rowY(6) - 2, a: 180 }, { x: 1578, y: rowY(1) - 16, a: 180 }];
  const T0 = 0.15, DK = 0.16;                         // build start, stagger per rung
  const DEG = 180 / Math.PI;
  const f2 = v => v.toFixed(2);
  const wrap = d => ((d % 360) + 540) % 360 - 180;

  function isStatic() { return Deck.isStatic || !!(window.Reveal && Reveal.isPrintView && Reveal.isPrintView()); }
  function isCurrent(sec) { return !!(window.Reveal && Reveal.getCurrentSlide && Reveal.getCurrentSlide() === sec); }

  function build(sec) {
    const st = { sec, played: false, live: false, tl: null, fly: null };
    st.rungs = Array.from(sec.querySelectorAll('.s01b-rung')).map(li => {
      let rule = null;
      if ((parseInt(li.dataset.k, 10) || 0) >= 1) {      // hairline between this rung and the one below
        rule = document.createElement('span');
        rule.className = 's01b-rule';
        rule.setAttribute('aria-hidden', 'true');
        li.appendChild(rule);
      }
      const ico = Array.from(li.querySelectorAll('.s01b-ico > *'));
      return {
        li, rule,
        cell: li.querySelector('.s01b-cell'),
        draw: ico.filter(e => !e.classList.contains('s01b-lnk')),
        lnk: ico.filter(e => e.classList.contains('s01b-lnk')),
        name: li.querySelector('.s01b-name'),
        ex: Array.from(li.querySelectorAll('.s01b-ex > li')),
      };
    });
    st.axis = Array.from(sec.querySelectorAll('.s01b-axline'));
    st.axlab = sec.querySelector('.s01b-axlab');
    st.axhead = sec.querySelector('.s01b-arrhead');
    st.buildEls = [st.axlab, st.axhead].concat(st.axis);
    st.rungs.forEach(r => { st.buildEls.push(r.cell, r.name); st.buildEls.push.apply(st.buildEls, r.draw.concat(r.lnk, r.ex)); if (r.rule) st.buildEls.push(r.rule); });
    // bee
    st.bee = sec.querySelector('.s01b-bee');
    st.body = sec.querySelector('.s01b-bee-body');
    st.shadow = sec.querySelector('.s01b-shadow');
    st.wsp = Array.from(sec.querySelectorAll('.s01b-wsp')).map(g => ({ g, d: parseFloat(g.dataset.d) || 0 }));
    st.b = { x: REST[0].x, y: REST[0].y, a: REST[0].a, fly: 0, o: 1 };
    return st;
  }

  // ---------- ladder build ----------
  function clearBuild(st) {
    if (st.tl) { st.tl.kill(); st.tl = null; }
    Deck.kill(st.buildEls);
    gsap.set(st.buildEls, { clearProps: 'all' });
  }

  function entry(st) {
    clearBuild(st);
    const tl = gsap.timeline({ onComplete: () => { gsap.set(st.buildEls, { clearProps: 'all' }); st.tl = null; } });
    tl.fromTo(st.axis[0], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.55, ease: 'power1.in' }, T0);
    tl.fromTo(st.axlab, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' }, T0 + 0.4);
    tl.fromTo(st.axis[1], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.out' }, T0 + 0.55);
    tl.fromTo(st.axhead, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' }, T0 + 0.95);
    st.rungs.forEach((r, k) => {
      const t = T0 + k * DK;
      tl.fromTo(r.cell, { opacity: 0, scale: 0.55, svgOrigin: '0 0' }, { opacity: 1, scale: 1, svgOrigin: '0 0', duration: 0.5, ease: 'power3.out' }, t);
      tl.fromTo(r.draw, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, ease: 'power2.inOut', stagger: 0.03 }, t + 0.12);
      if (r.lnk.length) tl.fromTo(r.lnk, { opacity: 0 }, { opacity: 1, duration: 0.4 }, t + 0.45);
      tl.fromTo(r.name, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, t + 0.08);
      tl.fromTo(r.ex, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08 }, t + 0.22);
      if (r.rule) tl.fromTo(r.rule, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, t + 0.1);
    });
    st.tl = tl;
  }

  // ---------- the bee ----------
  function renderBee(st) {
    const b = st.b, s = S * (1 + 0.14 * b.fly);       // a flying bee is a little closer to the viewer (as in S2)
    st.bee.style.transform = 'translate(' + f2(b.x) + 'px,' + f2(b.y) + 'px)';
    st.bee.style.opacity = b.o.toFixed(3);
    st.body.setAttribute('transform', 'rotate(' + f2(b.a) + ') scale(' + s.toFixed(4) + ')');
    const off = S * (4 + 20 * b.fly);
    st.shadow.setAttribute('transform', 'translate(' + f2(off) + ' ' + f2(off * 1.3) + ') rotate(' + f2(b.a) + ') scale(' + (s * (1 + 0.12 * b.fly)).toFixed(4) + ')');
    st.shadow.style.opacity = (1 - 0.62 * b.fly).toFixed(3);
    st.wsp.forEach(w => w.g.setAttribute('transform', 'rotate(' + f2(w.d * b.fly) + ')'));
    st.bee.classList.toggle('is-live', st.live);
    st.bee.classList.toggle('is-fly', st.live && b.fly > 0.3);
    st.bee.classList.toggle('is-perch', st.live && b.fly === 0);
  }
  function killFly(st) {
    if (st.fly) { st.fly.kill(); st.fly = null; }
    Deck.kill([st.b]);
  }
  function placeBee(st, k) {
    killFly(st);
    const p = REST[k];
    Object.assign(st.b, { x: p.x, y: p.y, a: p.a, fly: 0, o: 1 });
    renderBee(st);
  }
  // fly along a smooth path through pts to REST[k]: take off (wings spread), heading follows the direction of travel
  // (lagging a little, like a real turn), land (wings fold) and settle on the perch heading.
  function flyTo(st, k, pts, o) {
    killFly(st);
    const b = st.b, end = REST[k], prev = { x: b.x, y: b.y };
    const tl = gsap.timeline({
      delay: o.delay || 0,
      onUpdate: () => renderBee(st),
      onComplete: () => { st.fly = null; Object.assign(b, { x: end.x, y: end.y, a: end.a, fly: 0, o: 1 }); renderBee(st); },
    });
    tl.to(b, { fly: 1, duration: 0.22, ease: 'power1.out' }, 0);
    tl.to(b, {
      motionPath: { path: pts.concat([{ x: end.x, y: end.y }]), curviness: o.curv || 1.2 },
      duration: o.dur, ease: o.ease || 'power2.inOut',
      onUpdate: () => {
        const dx = b.x - prev.x, dy = b.y - prev.y;
        if (dx * dx + dy * dy > 0.02) b.a += wrap(Math.atan2(dy, dx) * DEG - b.a) * 0.28;
        prev.x = b.x; prev.y = b.y;
      },
    }, 0);
    tl.to(b, { fly: 0, duration: 0.32, ease: 'power1.in' }, o.dur - 0.26);
    tl.to(b, { a: () => b.a + wrap(end.a - b.a), duration: 0.3, ease: 'power2.out' }, o.dur);
    if (o.fadeIn) tl.fromTo(b, { o: 0 }, { o: 1, duration: 0.3, ease: 'none' }, 0);
    st.fly = tl; st.flyK = k;
    renderBee(st);
  }
  // step 0 entry: from below the slide, up the empty right-hand column (x 1540-1700 is clear on every rung), a little
  // hook at the top, lands facing the ladder. Its height roughly tracks the rung being built.
  function flyIn(st) {
    Object.assign(st.b, { x: 1600, y: H + 50, a: -90, fly: 1, o: 0 });
    flyTo(st, 0, [{ x: 1572, y: rowY(1) }, { x: 1630, y: rowY(3) }, { x: 1590, y: rowY(5) }, { x: 1670, y: rowY(6) + 8 }],
      { dur: 1.9, ease: 'sine.inOut', delay: 0.05, curv: 1.1, fadeIn: true });
  }
  // step 0 -> 1: from wherever the bee is (perched at the top, or still climbing if the speaker clicked early)
  function flyDown(st) {
    const b = st.b, end = REST[1], app = { x: end.x + 92, y: end.y - 8 };   // final approach from the right
    const perched = !st.fly && Math.hypot(b.x - REST[0].x, b.y - REST[0].y) < 4;
    const pts = perched
      ? [{ x: REST[0].x - 50, y: REST[0].y + 40 }, { x: 1650, y: rowY(4) - 10 }, app]      // forward take-off, swing down the right column
      : [{ x: Math.max(b.x, 1620) + 30, y: (b.y + app.y) / 2 }, app];                        // direct hop in the right column
    flyTo(st, 1, pts, { dur: perched ? 1.6 : 1.1 });
  }
  // (going back is always instant in deck.js: the bee is simply placed on the step-0 perch)
  function flyingTo(st, k) { return st.live && st.fly && st.flyK === k; }

  Deck.register('s01b', {
    steps: 1,
    init(sec) { sec._s01b = build(sec); placeBee(sec._s01b, 0); },
    go(step, ctx) {
      const st = ctx.sec._s01b;
      if (!st) return;
      const live = isCurrent(ctx.sec) && !isStatic();
      const animate = live && !ctx.instant;
      st.live = live;
      ctx.sec.classList.toggle('s01b-focus', step >= 1);
      if (step === 0) {
        if (live && !st.played) { entry(st); flyIn(st); }       // fresh entry: build + bee climb
        else {
          if (!st.tl) clearBuild(st);
          if (flyingTo(st, 0)) renderBee(st); else placeBee(st, 0);   // a re-render during the climb keeps it going
        }
      } else {
        clearBuild(st);
        if (animate && ctx.prev === 0) flyDown(st);
        else if (flyingTo(st, 1)) renderBee(st); else placeBee(st, 1);
      }
      if (live) st.played = true;
    },
    leave(sec) {
      const st = sec._s01b;
      if (!st) return;
      clearBuild(st);
      killFly(st);
      st.live = false;
      st.played = false;
      placeBee(st, 0);                                    // frozen pose, idle loops off
    },
  });
})();
