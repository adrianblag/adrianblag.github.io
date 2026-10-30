/* S3 — Regulation as optimal control: L turns into a red "?" at step 3 */
Deck.register('s03', {
  go(step, ctx) {
    ctx.sec.classList.toggle('s03-unknown', step >= 3);
  },
});
