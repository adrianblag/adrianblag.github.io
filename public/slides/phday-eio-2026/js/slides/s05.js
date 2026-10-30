/* S5 — L1 · Learn: what if part of the cell is unknown?  (schematic)
   Steps: 0 V definition, then HJB with the model term highlighted (sequenced on arrival)
          1 OC panel (blue pathway, f and L visible) → one shared V ← RL panel (agent–environment loop, samples)
          2 grey-box loop: the OC panel flashes as the blue ODE block enters, then the RL panel as the policy block
            π_η enters, and the feedback loop closes (calm version of the script's "panels slide together" stretch)
          3 case chips + gap footer (plain data-step reveals). */
(function () {
  'use strict';
  const S = (tag, attrs, parent) => Deck.svg(tag, attrs, parent);
  const cls = (el, c) => { el.setAttribute('class', c); return el; };
  // kill EVERY tween on these targets. gsap.killTweensOf(array) does not kill the delayed per-element fromTo tweens
  // started by enter() and the step animations (their startAt re-applies the from-values when the delay elapses,
  // leaving content hidden after fast stepping); killing the tweens themselves and then gsap.set() is exact.
  const kill = els => gsap.getTweensOf(els).forEach(t => t.kill());
  function text(parent, x, y, str, c) { const t = cls(S('text', { x, y }, parent), c); t.textContent = str; return t; }
  function head(parent, x, y, dir, size, c) {            // filled triangle, tip at (x,y), dir in rad
    const s = size || 13, w = s * 0.6;
    const bx = x - Math.cos(dir) * s, by = y - Math.sin(dir) * s, nx = -Math.sin(dir) * w, ny = Math.cos(dir) * w;
    return cls(S('path', { d: `M${x},${y} L${bx + nx},${by + ny} L${bx - nx},${by - ny} Z` }, parent), c);
  }
  // card geometry (stage px; the SVG is 1:1 with the 1700 x 700 stage)
  const OC = { x: 0, y: 322, w: 340, h: 314 }, RL = { x: 625, y: 322, w: 465, h: 314 }, GB = { x: 1120, y: 0, w: 580, h: 636 };
  const VB = { x: 408, y: 411, w: 150, h: 136 };
  const ODE = { x: 1230, y: 166, w: 360, h: 66 }, PI = { x: 1300, y: 290, w: 220, h: 62 };

  let R = null;

  Deck.register('s05', {
    steps: 3,
    init(sec) {
      const svg = sec.querySelector('.s05-svg');
      R = { sec, timers: [] };
      const defs = S('defs', {}, svg);
      const vg = S('linearGradient', { id: 's05-vgrad', gradientUnits: 'userSpaceOnUse', x1: VB.x + 20, y1: 0, x2: VB.x + VB.w - 20, y2: 0 }, defs);
      cls(S('stop', { offset: '0' }, vg), 's05-gb0'); cls(S('stop', { offset: '1' }, vg), 's05-gb1');
      const gg = S('linearGradient', { id: 's05-gbgrad', gradientUnits: 'userSpaceOnUse', x1: GB.x, y1: 0, x2: GB.x + GB.w, y2: 0 }, defs);
      cls(S('stop', { offset: '0' }, gg), 's05-gb0'); cls(S('stop', { offset: '1' }, gg), 's05-gb1');

      /* ---------- step 1: OC panel ---------- */
      const oc = S('g', { 'data-step': 1 }, svg);
      cls(S('rect', { x: OC.x, y: OC.y, width: OC.w, height: OC.h, rx: 20 }, oc), 's05-card s05-card-oc');
      const cx = [50, 130, 210, 290], py = 444;
      for (let i = 0; i < 3; i++) {
        cls(S('line', { x1: cx[i] + 24, y1: py, x2: cx[i + 1] - 34, y2: py }, oc), 's05-edge-m');
        head(oc, cx[i + 1] - 25, py, 0, 12, 's05-head-m');
      }
      cx.forEach((x, i) => { cls(S('circle', { cx: x, cy: py, r: 23 }, oc), 's05-node'); text(oc, x, py + 8, 'S' + '₁₂₃₄'[i], 's05-node-t'); });

      /* ---------- step 1: RL panel ---------- */
      const rl = S('g', { 'data-step': 1 }, svg);
      cls(S('rect', { x: RL.x, y: RL.y, width: RL.w, height: RL.h, rx: 20 }, rl), 's05-card s05-card-rl');
      const ag = { x: 651, y: 410, w: 130, h: 62 }, en = { x: 891, y: 410, w: 130, h: 62 };
      cls(S('rect', { x: ag.x, y: ag.y, width: ag.w, height: ag.h, rx: 12 }, rl), 's05-agent');
      text(rl, ag.x + ag.w / 2, ag.y + 39, 'agent', 's05-box-t');
      cls(S('rect', { x: en.x, y: en.y, width: en.w, height: en.h, rx: 8 }, rl), 's05-env');   // f hidden behind a grey box
      const ft = text(rl, en.x + en.w / 2, en.y + 42, 'f, L', 's05-env-f');
      const fq = S('tspan', { class: 's05-env-q', dx: 10 }, ft); fq.textContent = '?';
      R.loopRL = [
        cls(S('path', { d: `M${ag.x + ag.w + 4},${ag.y + 16} L${en.x - 14},${en.y + 16}` }, rl), 's05-edge-l'),
        cls(S('path', { d: `M${en.x - 4},${en.y + 46} L${ag.x + ag.w + 14},${ag.y + 46}` }, rl), 's05-edge-l'),
      ];
      R.loopRLh = [head(rl, en.x - 3, en.y + 16, 0, 13, 's05-head-l'), head(rl, ag.x + ag.w + 3, ag.y + 46, Math.PI, 13, 's05-head-l')];
      text(rl, (ag.x + ag.w + en.x) / 2, ag.y + 4, 'u', 's05-edge-lab');
      text(rl, (ag.x + ag.w + en.x) / 2, ag.y + 92, 'x′, L', 's05-edge-lab');
      R.dots = [];
      for (let i = 0; i < 5; i++) {
        const d = cls(S('circle', { cx: 659 + i * 33, cy: 535, r: 7 }, rl), 's05-dot');
        d.style.opacity = (0.35 + 0.65 * i / 4).toFixed(2);
        R.dots.push(d);
      }

      /* ---------- step 1: one shared V ---------- */
      const v = S('g', { 'data-step': 1 }, svg);
      cls(S('rect', { x: VB.x, y: VB.y, width: VB.w, height: VB.h, rx: 18 }, v), 's05-vbox');
      cls(S('path', { d: `M${VB.x + 20},${VB.y + 14} L${VB.x + 20},${VB.y + VB.h - 18} L${VB.x + VB.w - 16},${VB.y + VB.h - 18}` }, v), 's05-vaxis');
      const pts = [];
      for (let i = 0; i <= 40; i++) {                     // a bowl-shaped V(x) (illustrative)
        const s = i / 40;
        pts.push([VB.x + 32 + s * (VB.w - 58), VB.y + 20 + 80 * (1 - Math.pow(2 * s - 1, 2))]);
      }
      R.vcurve = cls(S('path', { d: 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') }, v), 's05-vcurve');
      const ay = VB.y + VB.h / 2;
      R.arrOC = cls(S('line', { x1: OC.x + OC.w + 10, y1: ay, x2: VB.x - 20, y2: ay }, v), 's05-arr-oc');
      R.arrRL = cls(S('line', { x1: RL.x - 10, y1: ay, x2: VB.x + VB.w + 20, y2: ay }, v), 's05-arr-rl');
      R.arrH = [head(v, VB.x - 6, ay, 0, 16, 's05-head-m'), head(v, VB.x + VB.w + 6, ay, Math.PI, 16, 's05-head-l')];

      /* ---------- step 2: grey-box card + loop ---------- */
      const gb = S('g', { 'data-step': 2, 'data-anim': 'fade' }, svg);
      const card = cls(S('rect', { x: GB.x, y: GB.y, width: GB.w, height: GB.h, rx: 20 }, gb), 's05-card s05-card-gb');
      card.style.stroke = 'url(#s05-gbgrad)';
      const L = S('g', {}, gb);
      const yo = ODE.y + ODE.h / 2, yp = PI.y + PI.h / 2, xr = 1652, xl = 1168;
      R.loopX = cls(S('path', { d: `M${ODE.x + ODE.w},${yo} L${xr},${yo} L${xr},${yp} L${PI.x + PI.w + 14},${yp}` }, L), 's05-loop s05-loop-x');
      R.loopU = cls(S('path', { d: `M${PI.x},${yp} L${xl},${yp} L${xl},${yo} L${ODE.x - 14},${yo}` }, L), 's05-loop s05-loop-u');
      R.loopH = [head(L, PI.x + PI.w + 2, yp, Math.PI, 15, 's05-loop-hx'), head(L, ODE.x - 2, yo, 0, 15, 's05-loop-hu')];
      R.loopLab = [text(L, xr + 22, (yo + yp) / 2 + 9, 'x', 's05-edge-lab'), text(L, xl - 22, (yo + yp) / 2 + 9, 'u', 's05-edge-lab')];
      R.loopLab[0].style.fill = 'var(--c-mech)'; R.loopLab[1].style.fill = 'var(--c-learn)';
      // the two blocks (SVG box + KaTeX label) are driven by GSAP (staggered entrance in sync with the panel flashes)
      const bOde = cls(S('rect', { x: ODE.x, y: ODE.y, width: ODE.w, height: ODE.h, rx: 12 }, svg), 's05-blkbox-ode');
      const bPi = cls(S('rect', { x: PI.x, y: PI.y, width: PI.w, height: PI.h, rx: 30 }, svg), 's05-blkbox-pi');
      R.blkODE = [bOde, sec.querySelector('.s05-blk-ode')];
      R.blkPI = [bPi, sec.querySelector('.s05-blk-pi')];
      // flashes on the OC / RL panels when their part enters the grey box (step 2)
      R.flashOC = cls(S('rect', { x: OC.x, y: OC.y, width: OC.w, height: OC.h, rx: 20 }, oc), 's05-flash s05-flash-oc');
      R.flashRL = cls(S('rect', { x: RL.x, y: RL.y, width: RL.w, height: RL.h, rx: 20 }, rl), 's05-flash s05-flash-rl');

      // ghost of the S4 staircase (same geometry as s04.js), used for the S4 -> S5 "shrink into the corner" exit
      if (window.S04Stair) {
        const gsvg = S('svg', { class: 's05-ghost', viewBox: '0 0 1700 748', width: 1700, height: 748, 'aria-hidden': 'true' }, sec.querySelector('.s05-stage'));
        const gg = S('g', {}, gsvg);
        cls(S('rect', { x: 0, y: 640, width: 1700, height: 66, rx: 14 }, gg), 's04-slab');
        const st = window.S04Stair.build(gg, { x0: 20, colW: 407.5, gap: 10, floor: 640, top1: 545, rise: 95, labels: 'head', gradId: 's05-ggrad' });
        st.cols.forEach(c => { c.icon.remove(); c.label.remove(); });
        R.ghost = { svg: gsvg, g: gg };
        gsap.set(gsvg, { opacity: 0 });
      }

      // entrance on arrival at step 0: (from S4: the staircase shrinks into the HUD corner) V, then HJB, then the model term lights up
      Reveal.on('slidechanged', e => {
        if (e.currentSlide !== sec || Deck.isStatic) return;
        const fromS4 = !!(e.previousSlide && e.previousSlide.dataset.module === 's04');
        setTimeout(() => { if (sec.querySelectorAll('.step-trigger.visible').length === 0) enter(fromS4); }, 30);
      });
    },

    go(step, ctx) {
      if (!R) return;
      const inst = ctx.instant;
      // step 0 — equations always visible; highlight on
      if (inst) hideGhost();
      if (inst || step >= 1) {
        clearTimers();
        const eqs = R.sec.querySelectorAll('.s05-eq');
        kill(eqs);
        gsap.set(eqs, { opacity: 1, y: 0 });
        R.sec.classList.add('s05-hl-on');
      }
      // step 1 — draw-on arrows, V curve, sample dots (groups fade via data-step)
      const s1 = [R.arrOC, R.arrRL, R.vcurve, ...R.loopRL];
      kill([...s1, ...R.arrH, ...R.dots, ...R.loopRLh]);
      if (inst || step < 1 || ctx.prev >= 1) {
        gsap.set(s1, { drawSVG: '0% 100%' });
        gsap.set([...R.arrH, ...R.loopRLh], { opacity: 1 });
        gsap.set(R.dots, { scale: 1, transformOrigin: '50% 50%' });
      } else {
        gsap.fromTo(R.loopRL, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.5, delay: 0.3, stagger: 0.25, ease: 'power2.out' });
        gsap.fromTo(R.loopRLh, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.7, stagger: 0.25 });
        gsap.fromTo(R.dots, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, delay: 0.9, stagger: 0.08, ease: 'power2.out' });
        gsap.fromTo([R.arrOC, R.arrRL], { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.7, delay: 1.2, ease: 'power2.inOut' });
        gsap.fromTo(R.arrH, { opacity: 0 }, { opacity: 1, duration: 0.25, delay: 1.8 });
        gsap.fromTo(R.vcurve, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.9, delay: 1.9, ease: 'power2.out' });
      }
      // step 2 — the OC panel flashes and the ODE block enters; then the RL panel and the policy block; the loop closes
      const on2 = step >= 2;
      const loop = [R.loopX, R.loopU], blocks = [...R.blkODE, ...R.blkPI], fl = [R.flashOC, R.flashRL];
      kill([...blocks, ...loop, ...R.loopH, ...R.loopLab, ...fl]);
      if (inst || !on2 || ctx.prev >= 2) {
        gsap.set(fl, { opacity: 0 });
        gsap.set(blocks, { opacity: on2 ? 1 : 0, x: 0, y: 0, scale: 1 });
        gsap.set(loop, { drawSVG: '0% 100%' });
        gsap.set([...R.loopH, ...R.loopLab], { opacity: 1 });
      } else {
        const enterBlk = (flash, els, d) => {
          gsap.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: d, yoyo: true, repeat: 1, repeatDelay: 0.25, ease: 'power1.inOut' });
          gsap.fromTo(els, { opacity: 0, x: -90 }, { opacity: 1, x: 0, duration: 0.8, delay: d + 0.2, ease: 'power3.out' });
        };
        enterBlk(R.flashOC, R.blkODE, 0.3);
        enterBlk(R.flashRL, R.blkPI, 1.0);
        gsap.fromTo(loop, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.6, delay: 1.9, stagger: 0.3, ease: 'power2.inOut' });
        gsap.fromTo(R.loopH, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 2.4, stagger: 0.3 });
        gsap.fromTo(R.loopLab, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 2.2, stagger: 0.3 });
      }
    },
    leave() { clearTimers(); hideGhost(); },
  });

  function clearTimers() { if (R) { R.timers.forEach(t => t.kill()); R.timers = []; } }
  function hideGhost() { if (R && R.ghost) { kill([R.ghost.svg, R.ghost.g]); gsap.set(R.ghost.svg, { opacity: 0 }); } }

  // the S4 staircase (drawn here at S4's position) shrinks into the HUD mini-staircase
  function shrinkGhost() {
    const hud = R.sec.querySelector('.hud-stair'), G = R.ghost;
    if (!G || !hud) return 0;
    const r = G.svg.getBoundingClientRect(), k = r.width / 1700, h = hud.getBoundingClientRect();
    if (!(k > 0)) return 0;
    const hx = (h.left - r.left) / k, hy = (h.top - r.top) / k, hw = h.width / k, hh = h.height / k;
    const bx = 0, by = 260, bw = 1700, bh = 706 - 260;                     // staircase + slab bbox (S4 geometry)
    const sx = hw / bw, sy = hh * (50 / 54) / bh;
    gsap.set(G.svg, { opacity: 1 });
    gsap.fromTo(G.g, { x: 0, y: 0, scaleX: 1, scaleY: 1, svgOrigin: '0 0', opacity: 1 },
      { x: hx - sx * bx, y: hy + hh * (4 / 54) - sy * by, scaleX: sx, scaleY: sy, opacity: 0.35, duration: 1.0, ease: 'power3.inOut' });
    gsap.to(G.svg, { opacity: 0, duration: 0.25, delay: 0.95 });
    return 0.6;
  }

  function enter(fromS4) {
    clearTimers();
    hideGhost();
    const d0 = fromS4 ? shrinkGhost() : 0;
    const [eqV, eqH] = R.sec.querySelectorAll('.s05-eq');
    R.sec.classList.remove('s05-hl-on');
    gsap.fromTo(eqV, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, delay: d0, ease: 'power2.out' });
    gsap.fromTo(eqH, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, delay: d0 + 1.2, ease: 'power2.out' });
    R.timers.push(gsap.delayedCall(d0 + 2.6, () => R.sec.classList.add('s05-hl-on')));
  }
})();
