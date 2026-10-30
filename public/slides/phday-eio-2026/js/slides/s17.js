/* S17 — Take-home & thanks. Steps 1–3 light the three take-home cards (their text uses data-step);
   with take-home 3 the green brick drops into the inner box of the L2 bilevel loop on the staircase icon;
   step 4: "Let's talk" + "Thank you! Questions?". The funding box is static. */
Deck.register('s17', {
  steps: 4,
  go(step, ctx) {
    const sec = ctx.sec;
    sec.querySelectorAll('.s17-card').forEach(c => c.classList.toggle('is-lit', step >= +c.dataset.k));
    const on = step >= 3;
    sec.classList.toggle('s17-brick-in', on);
    const brick = sec.querySelector('.s17-inbrick');
    if (!window.gsap || !brick) return;
    gsap.killTweensOf(brick);
    if (on && !ctx.instant && ctx.prev === 2) {
      gsap.fromTo(brick, { opacity: 0, y: -46 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' });
    } else {
      gsap.set(brick, { opacity: on ? 1 : 0, y: 0 });
    }
  },
});
