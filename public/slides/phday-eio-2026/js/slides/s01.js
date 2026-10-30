/* S1 — Title. A faint line drawing of the LPN3B pathway (S1 -> S2 -> S3 -> S4, same shapes as the S2 hero,
   scaled by K) draws itself on in the free space right of the title's 2nd/3rd lines (never behind the text);
   then e1, e2, e3 light up in turn (a quiet "just in time" preview) and S4 fills. Static / print / jumps: final state.
   window.S01Geo exposes the placement so s02.js can morph the S2 pathway out of this drawing. */
(function () {
  'use strict';
  const K = 0.77, X0 = 1250, Y0 = 440;                  // S2 pathway coords (x, y) -> page (X0 + K(x-16), Y0 + K(y-190))
  const X = x => X0 + K * (x - 16);
  const Y = y => Y0 + K * (y - 190);
  window.S01Geo = { K, X0, Y0 };

  function build(sec) {
    const svg = sec.querySelector('.s01-bg');
    const S = (tag, attrs, parent) => Deck.svg(tag, attrs, parent || svg);
    const st = { sec, draws: [], labels: [], flows: [], tints: [] };

    // S1: constant pool (reservoir) with its liquid level
    const tank = S('rect', { class: 's01-ln', x: X(16), y: Y(110), width: 130 * K, height: 160 * K, rx: 20 * K });
    let d = `M${X(16)},${Y(152)}`;
    for (let i = 0; i < 4; i++) d += ` q${16 * K},${-7 * K} ${32.5 * K},0`;
    const wave = S('path', { class: 's01-wave', d });
    st.draws.push(tank, wave);

    const nodes = [306, 496, 686];
    const edges = [[158, 244], [368, 434], [558, 624]];
    const enz = [159, 359, 549];
    const order = [];
    edges.forEach((e, i) => {
      const x1 = X(e[0]), x2 = X(e[1]), y = Y(190);
      const ln = S('line', { class: 's01-ln', x1, y1: y, x2: x2 - 3, y2: y });
      const hd = S('path', { class: 's01-ln', d: `M${x2 - 10 * K},${y - 8 * K} L${x2},${y} L${x2 - 10 * K},${y + 8 * K}` });
      const fl = S('line', { class: 's01-flow', 'data-e': i + 1, x1, y1: y, x2: x2 - 3, y2: y });
      st.flows.push(fl);
      // enzyme e_i above its reaction, with a tinted fill that lights up later
      const ex = X(enz[i]), ey = Y(72);
      const box = S('rect', { class: 's01-ln', x: ex, y: ey, width: 84 * K, height: 50 * K, rx: 14 * K });
      const tint = S('rect', { class: 's01-tint', 'data-e': i + 1, x: ex, y: ey, width: 84 * K, height: 50 * K, rx: 14 * K });
      st.tints.push(tint);
      const lk = S('line', { class: 's01-lnk', x1: ex + 42 * K, y1: Y(124), x2: ex + 42 * K, y2: Y(180) });
      const cx = X(nodes[i]);
      const fill4 = i === 2 ? S('circle', { class: 's01-fill4', cx, cy: Y(190), r: 52 * K }) : null;
      if (fill4) st.fill4 = fill4;
      const c = S('circle', { class: 's01-ln', cx, cy: Y(190), r: 52 * K });
      order.push(ln, hd, box, lk, c);
      st.labels.push(S('text', { class: 's01-lab s01-elab', x: ex + 42 * K, y: Y(106) + 2 * K, 'font-size': 28 * K }));
      st.labels[st.labels.length - 1].textContent = 'e' + '₁₂₃'[i];
      const t = S('text', { class: 's01-lab', x: cx, y: Y(201) + 2 * K, 'font-size': 32 * K });
      t.textContent = 'S' + '₂₃₄'[i];
      st.labels.push(t);
    });
    const t1 = S('text', { class: 's01-lab', x: X(81), y: Y(211) + 2 * K, 'font-size': 32 * K });
    t1.textContent = 'S₁';
    st.labels.unshift(t1);
    st.draws.push(...order);

    // one timeline, built once; go() either plays it or jumps to its end (idempotent)
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(st.draws, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut', stagger: 0.09 }, 0);
    tl.fromTo(st.labels, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.08 }, 0.9);
    tl.fromTo(sec.querySelector('.s01-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }, 0.2);
    st.flows.forEach((fl, i) => {
      const at = 2.6 + i * 0.85;
      tl.fromTo(st.tints[i], { opacity: 0 }, { opacity: 1, duration: 0.45 }, at);
      tl.fromTo(fl, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'power1.inOut' }, at + 0.1);
    });
    tl.fromTo(st.fill4, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 2.6 + 3 * 0.85);
    st.tl = tl;
    tl.progress(1);
    return st;
  }

  Deck.register('s01', {
    init(sec) {
      if (!window.gsap) return;
      sec._s01 = build(sec);
    },
    go(step, ctx) {
      const st = ctx.sec._s01;
      if (!st) return;
      const R = window.Reveal;
      const current = R && R.getCurrentSlide && R.getCurrentSlide() === ctx.sec;
      const print = R && R.isPrintView && R.isPrintView();
      if (current && !st.played && !Deck.isStatic && !print) {
        st.played = true;
        st.tl.restart();
      } else if (!st.tl.isActive()) {
        st.tl.progress(1).pause();
      }
    },
    leave(sec) {
      const st = sec._s01;
      if (!st) return;
      st.played = false;
      st.tl.progress(1).pause();
    },
  });
})();
