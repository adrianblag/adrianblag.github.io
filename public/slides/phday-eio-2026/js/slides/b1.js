/* B1 — Proposition 1: derivation and scope (backup).
   Steps (generic data-step reveals): 0 dynamics + factorisation · 1 propagation + schematic · 2 scope.
   This module only animates the schematic when step 1 is entered going forward: the constant-control line
   draws on, then the curved feasible set F_N, then the two feasible points, the chord and its off-set midpoint.
   Every other entry (jump, back, ?static, print) sets the final state directly. */
(function () {
  'use strict';
  let S = null;

  function parts(sec) {
    const q = s => sec.querySelector(s);
    return {
      diag: q('.b1-diag'), feas: q('.b1-feas'), chord: q('.b1-chord'), gap: q('.b1-gap'),
      ok: [...sec.querySelectorAll('.b1-ok')], bad: q('.b1-bad'),
      labs: [...sec.querySelectorAll('.b1-lab, .b1-cap')],
    };
  }

  function setFinal(on) {
    const all = [S.diag, S.feas, S.chord, S.gap, S.bad, ...S.ok, ...S.labs];
    gsap.killTweensOf(all);
    gsap.set([S.diag, S.feas, S.chord], { drawSVG: on ? '0% 100%' : '0% 0%' });
    gsap.set(S.gap, { opacity: on ? 1 : 0 });
    gsap.set([...S.ok, S.bad], { scale: on ? 1 : 0, transformOrigin: '50% 50%' });
    gsap.set(S.labs, { opacity: on ? 1 : 0 });
  }

  function play() {
    setFinal(false);
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(S.diag, { drawSVG: '0% 100%', duration: 0.7, ease: 'power2.inOut' }, 0.25)
      .to(S.labs[0], { opacity: 1, duration: 0.4 }, 0.75)                       // "constant controls"
      .to(S.feas, { drawSVG: '0% 100%', duration: 1.0, ease: 'power2.inOut' }, 0.8)
      .to(S.labs[1], { opacity: 1, duration: 0.4 }, 1.4)                        // F_N: S4(tf) = 0.9
      .to(S.ok, { scale: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(1.6)' }, 1.7)
      .to(S.chord, { drawSVG: '0% 100%', duration: 0.6, ease: 'power2.inOut' }, 2.1)
      .to(S.bad, { scale: 1, duration: 0.35 }, 2.55)
      .to(S.gap, { opacity: 1, duration: 0.4 }, 2.7)
      .to(S.labs.slice(2), { opacity: 1, duration: 0.5, stagger: 0.2 }, 2.8);  // midpoint label, caption
    return tl;
  }

  Deck.register('b1', {
    init(sec) { S = parts(sec); setFinal(true); },
    go(step, ctx) {
      if (!S) S = parts(ctx.sec);
      if (S.tl) { S.tl.kill(); S.tl = null; }
      if (!window.gsap) return;
      if (step === 1 && !ctx.instant && ctx.prev === 0) S.tl = play();
      else setFinal(step >= 1);
    },
    leave() { if (S && S.tl) { S.tl.progress(1); S.tl.kill(); S.tl = null; } },
  });
})();
