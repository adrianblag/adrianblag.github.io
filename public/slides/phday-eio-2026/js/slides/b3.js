/* B3 — Non-identifiability in IOC: the mechanisms (backup).
   Steps (generic data-step reveals): 0 scaling + context · 1 equivalent functionals · 2 inverse KKT + constraint arc.
   Going forward into step 1 the two state paths draw on and the end-point rings pop; into step 2 the illustrative
   control trajectory draws on and its constraint-driven arc lights up. Any other entry sets the final state. */
(function () {
  'use strict';
  let S = null;

  function parts(sec) {
    const q = s => sec.querySelector(s), qa = s => [...sec.querySelectorAll(s)];
    return {
      p1: q('.b3-p1'), p2: q('.b3-p2'), rings: qa('.b3-ring'), g2txt: qa('.b3-g2 text'),
      traj: q('.b3-traj'), band: q('.b3-band'), bandlab: q('.b3-bandlab'), intlab: q('.b3-intlab'),
    };
  }

  function set2(on) {
    gsap.killTweensOf([S.p1, S.p2, ...S.rings, ...S.g2txt]);
    gsap.set(S.p1, { drawSVG: on ? '0% 100%' : '0% 0%' });
    gsap.set([S.p2, ...S.g2txt], { opacity: on ? 1 : 0 });
    gsap.set(S.rings, { scale: on ? 1 : 0, transformOrigin: '50% 50%' });
  }
  function set3(on) {
    gsap.killTweensOf([S.traj, S.band, S.bandlab, S.intlab]);
    gsap.set(S.traj, { drawSVG: on ? '0% 100%' : '0% 0%' });
    gsap.set([S.band, S.bandlab, S.intlab], { opacity: on ? 1 : 0 });
  }

  function play2() {
    set2(false);
    return gsap.timeline({ defaults: { ease: 'power2.out' } })
      .to(S.p1, { drawSVG: '0% 100%', duration: 0.9, ease: 'power2.inOut' }, 0.3)
      .to(S.p2, { opacity: 1, duration: 0.6 }, 0.9)
      .to(S.rings, { scale: 1, duration: 0.4, stagger: 0.12, ease: 'back.out(1.7)' }, 1.2)
      .to(S.g2txt, { opacity: 1, duration: 0.5, stagger: 0.1 }, 1.4);
  }
  function play3() {
    set3(false);
    return gsap.timeline({ defaults: { ease: 'power2.out' } })
      .to(S.traj, { drawSVG: '0% 100%', duration: 1.2, ease: 'power1.inOut' }, 0.3)
      .to(S.intlab, { opacity: 1, duration: 0.4 }, 0.8)
      .to(S.band, { opacity: 1, duration: 0.6 }, 1.3)
      .to(S.bandlab, { opacity: 1, duration: 0.5 }, 1.5);
  }

  Deck.register('b3', {
    init(sec) { S = parts(sec); set2(true); set3(true); },
    go(step, ctx) {
      if (!S) S = parts(ctx.sec);
      if (S.tl) { S.tl.kill(); S.tl = null; }
      if (!window.gsap) return;
      const fwd = !ctx.instant && ctx.prev === step - 1;
      set2(step >= 1); set3(step >= 2);
      if (fwd && step === 1) S.tl = play2();
      else if (fwd && step === 2) S.tl = play3();
    },
    leave() { if (S && S.tl) { S.tl.progress(1); S.tl.kill(); S.tl = null; } },
  });
})();
