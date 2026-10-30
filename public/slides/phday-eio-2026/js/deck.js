/* ==========================================================================
   deck.js — step engine for the PhDay-EIO deck (published web version:
   light "journal" look only, no speaker notes).

   Authoring model
   ---------------
   * Each slide is a <section data-module="sNN" data-block="...">.
   * Elements with data-step="k" appear when the slide reaches step k
     (data-until="m" hides them again from step m on).
   * deck.js counts the steps of a slide (max data-step, or module.steps) and
     injects one hidden reveal.js fragment per step, so arrow keys / clicker
     advance step by step and going back works.
   * Optional JS per slide (js/slides/sNN.js):
       Deck.register('sNN', {
         steps: 3,                       // optional; else from data-step
         init(sec) { ... },             // once, after fonts + Reveal ready
         go(step, ctx) { ... },         // every time the step changes
                                        // ctx = {instant, dir, prev, sec}
         leave(sec) { ... },            // optional, when leaving the slide
       });
     go() must be idempotent: go(k, {instant:true}) has to render the exact
     final state of step k from ANY previous state (used for jumps, going
     backwards, ?static and PDF printing).
   * URL flags: ?static     -> every go() is instant, no animation
                ?print-pdf  -> reveal.js print layout (last step of each slide)
   ========================================================================== */
(function () {
  'use strict';
  const mods = {};
  const params = new URLSearchParams(location.search);
  const STATIC = params.has('static');
  const state = new WeakMap();   // section -> {step, inited}

  function register(id, mod) { mods[id] = mod; }
  function modOf(sec) { return sec && sec.dataset.module ? mods[sec.dataset.module] : null; }

  function stepsOf(sec) {
    let m = 0;
    sec.querySelectorAll('[data-step]').forEach(e => { m = Math.max(m, parseInt(e.dataset.step, 10) || 0); });
    sec.querySelectorAll('[data-until]').forEach(e => { m = Math.max(m, (parseInt(e.dataset.until, 10) || 0)); });
    const mod = modOf(sec);
    if (mod && mod.steps) m = Math.max(m, mod.steps);
    if (sec.dataset.steps) m = Math.max(m, parseInt(sec.dataset.steps, 10) || 0);
    return m;
  }

  function injectTriggers(sec) {
    const n = stepsOf(sec);
    sec.dataset.nsteps = n;
    for (let i = 1; i <= n; i++) {
      const f = document.createElement('span');
      f.className = 'fragment step-trigger';
      f.setAttribute('data-fragment-index', String(i));
      f.setAttribute('aria-hidden', 'true');
      sec.appendChild(f);
    }
  }

  function stepNow(sec) {
    return sec.querySelectorAll('.step-trigger.visible').length;
  }

  function applyGeneric(sec, step) {
    sec.querySelectorAll('[data-step]').forEach(e => {
      const s = parseInt(e.dataset.step, 10) || 0;
      const u = e.dataset.until ? parseInt(e.dataset.until, 10) : Infinity;
      e.classList.toggle('is-on', step >= s && step < u);
      e.classList.toggle('is-off-after', step >= u);
    });
    sec.querySelectorAll('[data-until]:not([data-step])').forEach(e => {
      const u = parseInt(e.dataset.until, 10);
      e.classList.toggle('is-off-after', step >= u);
    });
  }

  function render(sec, step, opts) {
    if (!sec) return;
    const st = state.get(sec) || { step: -1, inited: false };
    const instant = STATIC || !!opts.instant;
    if (instant) sec.classList.add('deck-instant');
    applyGeneric(sec, step);
    const mod = modOf(sec);
    if (mod && mod.go) {
      try {
        mod.go(step, { instant, dir: step >= st.step ? 1 : -1, prev: st.step, sec });
      } catch (err) { console.error('[deck] go() failed on', sec.dataset.module, err); }
    }
    st.step = step; state.set(sec, st);
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => sec.classList.remove('deck-instant')));
  }

  function initModules() {
    document.querySelectorAll('.reveal .slides section[data-module]').forEach(sec => {
      const mod = modOf(sec);
      const st = state.get(sec) || { step: -1, inited: false };
      if (mod && mod.init && !st.inited) {
        try { mod.init(sec); } catch (err) { console.error('[deck] init() failed on', sec.dataset.module, err); }
      }
      st.inited = true; state.set(sec, st);
      // render the "resting" state: final state in print view, step 0 otherwise
      render(sec, Reveal.isPrintView() ? stepsOf(sec) : 0, { instant: true });
    });
  }

  // ---------- theme ----------
  // Fixed: the light "journal" look, set on <html> in index.html
  // (data-theme="light" data-style="journal").
  if (STATIC) document.documentElement.classList.add('is-static');

  // ---------- helpers for slide modules ----------
  const NS = 'http://www.w3.org/2000/svg';
  const helpers = {
    css(name, el) { return getComputedStyle(el || document.documentElement).getPropertyValue(name).trim(); },
    svg(tag, attrs, parent) {
      const e = document.createElementNS(NS, tag);
      if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    },
    fmt(x, d) { return Number(x).toLocaleString('en-US', { maximumFractionDigits: d === undefined ? 2 : d, minimumFractionDigits: d === undefined ? 0 : d }); },
    isStatic: STATIC,
    // kill every tween touching any of the targets (gsap.killTweensOf(array) misses delayed per-element tweens)
    kill(targets) { if (window.gsap) gsap.getTweensOf(targets).forEach(t => t.kill()); },
    // tween helper: GSAP if present, honours instant
    to(targets, vars, instant) {
      if (!window.gsap) return;
      if (instant) { helpers.kill(targets); gsap.set(targets, Object.assign({}, vars, { duration: 0, delay: 0 })); }
      else gsap.to(targets, vars);
    },
  };

  window.Deck = Object.assign({ register, stepsOf, render }, helpers);

  // ---------- boot ----------
  // KaTeX macros: theme-aware colours via CSS classes, and step reveals inside formulas:
  //   \cx{x} \cu{u} \cth{\theta} \cy{y} \cinv{..} \cnow{..} \cbad{..} \cwarn{..} \cmut{..}
  //   \step{2}{...}  -> part of a formula that appears at step 2
  const MACROS = {
    '\\cx': '\\htmlClass{t-mech}{#1}', '\\cu': '\\htmlClass{t-learn}{#1}', '\\cth': '\\htmlClass{t-theta}{#1}',
    '\\cy': '\\htmlClass{t-y}{#1}', '\\cinv': '\\htmlClass{t-inv}{#1}', '\\cnow': '\\htmlClass{t-now}{#1}',
    '\\cbad': '\\htmlClass{t-bad}{#1}', '\\cwarn': '\\htmlClass{t-warn}{#1}', '\\cmut': '\\htmlClass{muted}{#1}',
    '\\step': '\\htmlData{step=#1}{#2}',
  };

  function boot() {
    if (window.renderMathInElement) {
      renderMathInElement(document.querySelector('.reveal .slides'), {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'aside'],
        throwOnError: false, strict: false, macros: MACROS,
        trust: ctx => ['\\htmlClass', '\\htmlData', '\\htmlId'].includes(ctx.command),
      });
    }
    // after KaTeX, so that \step{k}{..} inside formulas is counted
    document.querySelectorAll('.reveal .slides section').forEach(sec => {
      if (!sec.querySelector('section')) injectTriggers(sec);   // skip vertical-stack parents
    });
    const deck = Reveal.initialize({
      width: 1920, height: 1080, margin: 0.02, minScale: 0.1, maxScale: 3,
      hash: true, fragmentInURL: true, history: false,
      // On-screen arrows for web visitors (there is no clicker); they also
      // take clicks, and keyboard / swipe navigation work as usual.
      controls: true, controlsTutorial: true, controlsBackArrows: 'faded',
      progress: false, center: false, slideNumber: false,
      transition: STATIC ? 'none' : 'fade', transitionSpeed: 'fast', backgroundTransition: 'none',
      autoAnimate: false, navigationMode: 'linear',
      pdfSeparateFragments: false, pdfMaxPagesPerSlide: 1,
      plugins: [],
    });
    deck.then(() => {
      const go = (instant) => { const sec = Reveal.getCurrentSlide(); render(sec, stepNow(sec), { instant }); };
      const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      fontsReady.then(() => {
        initModules();
        go(true);
        Reveal.on('slidechanged', e => {
          const m = modOf(e.previousSlide);
          if (m && m.leave) { try { m.leave(e.previousSlide); } catch (err) { console.error(err); } }
          go(true);
        });
        Reveal.on('fragmentshown', () => go(false));
        Reveal.on('fragmenthidden', () => go(true));
        document.documentElement.classList.add('deck-ready');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
