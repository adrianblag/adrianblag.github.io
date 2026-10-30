/* B2 — Full multistart results (success %, mean time per start).
   Static table built from DATA.multistart.configs with the S14 sequential colour scale. No steps. */
(function () {
  'use strict';

  const ROWS = [
    { prob: 'LPN3B', param: 'PWC', name: 'LPN3B', sub: '' },
    { prob: 'LPDN4', param: 'PWC', name: 'LPDN4', sub: '' },
    { prob: 'GBD',   param: 'PWC', name: 'GBD',   sub: '' },
    { prob: 'SC',    param: 'PWC', name: 'SC',    sub: 'PWC' },
    { prob: 'SC',    param: 'PWL', name: 'SC',    sub: 'PWL' },
    { prob: 'BSUB',  param: 'PWC', name: 'BSUB',  sub: 'PWC' },
    { prob: 'BSUB',  param: 'PWL', name: 'BSUB',  sub: 'PWL' },
  ];
  const METHODS = [
    { key: 'CasADi MS',      cls: 'ms' },
    { key: 'CasADi CVP',     cls: 'cvp' },
    { key: 'FiniteDiff CVP', cls: 'fd' },
    { key: 'ACADOS',         cls: 'acados' },
  ];
  const NBSP = ' ';   // narrow no-break space before %

  const fmtPct = v => (v === 100 || v === 0) ? String(v) : v.toFixed(1);
  // same precision as the approved script table: >= 100 s whole seconds, 2-100 s one decimal, < 2 s two decimals
  const fmtTime = t => t >= 100 ? Math.round(t).toLocaleString('en-US') : t >= 2 ? t.toFixed(1) : t.toFixed(2);
  const seqPos = v => Math.max(0, Math.min(6, v / 100 * 6));

  function seqFill(el, v) {
    const p = seqPos(v), lo = Math.floor(p), hi = Math.min(6, lo + 1), f = p - lo;
    el.style.background = 'var(--seq-' + Math.round(p) + ')';      // fallback if color-mix is unsupported
    if (f > 1e-6 && lo < 6) el.style.background = 'color-mix(in oklab, var(--seq-' + lo + ') ' + ((1 - f) * 100).toFixed(1) + '%, var(--seq-' + hi + '))';
    else el.style.background = 'var(--seq-' + lo + ')';
  }

  function build(sec) {
    const D = window.DATA && window.DATA.multistart;
    if (!D) throw new Error('DATA.multistart missing');
    const cfg = (prob, param, method) => D.configs.find(c => c.problem === prob && c.param === param && c.method === method);
    const tab = sec.querySelector('.b2-table');
    const div = (cls, parent, html) => { const e = document.createElement('div'); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; parent.appendChild(e); return e; };

    // header
    div('b2-h', tab, 'Problem').setAttribute('role', 'columnheader');
    METHODS.forEach(m => {
      const h = div('b2-h', tab, '<span class="b2-mk b2-mk-' + m.cls + '" aria-hidden="true"></span>' + m.key);
      h.setAttribute('role', 'columnheader');
    });

    // rows
    ROWS.forEach(row => {
      div('b2-row', tab, row.name + (row.sub ? '<span>' + row.sub + '</span>' : '')).setAttribute('role', 'rowheader');
      METHODS.forEach(m => {
        const c = cfg(row.prob, row.param, m.key);
        if (!c) { div('b2-nr', tab, '<i>not run</i>').setAttribute('role', 'cell'); return; }
        const v = c.success_pct, p = seqPos(v);
        const cell = div('b2-cell' + (p >= 3.5 ? ' b2-dk' : '') + (p >= 5.5 ? ' b2-lt' : '') + (v === 0 ? ' b2-zero' : ''), tab);
        cell.setAttribute('role', 'cell');
        seqFill(cell, v);
        let html = '<span class="b2-pct">' + fmtPct(v) + NBSP + '%</span>';
        if (v > 0) html += '<span class="b2-dot">·</span><span class="b2-t">' + fmtTime(c.mean_time_s) + NBSP + 's</span>';
        cell.innerHTML = html;
      });
    });

    // notes computed from the data: N per problem, starts per configuration, 95 % half-width
    const set = (k, html) => { const e = sec.querySelector('[data-b2="' + k + '"]'); if (e) e.innerHTML = html; };
    const nStarts = D.configs[0].n_starts;
    set('nstarts', nStarts.toLocaleString('en-US'));
    const byN = {};
    ['LPN3B', 'LPDN4', 'GBD', 'SC', 'BSUB'].forEach(prob => {
      const n = D.configs.find(c => c.problem === prob).N;
      (byN[n] = byN[n] || []).push(prob);
    });
    set('Nline', Object.keys(byN).sort((a, b) => b - a).map(n => '<i>N</i>' + NBSP + '=' + NBSP + n + ' (' + byN[n].join(', ') + ')').join(', '));
    const hw = 1.96 * Math.sqrt(0.25 / nStarts) * 100;
    const hwEl = sec.querySelector('[data-b2="hw"]');
    if (hwEl && window.katex) katex.render('1.96\\sqrt{0.25/' + nStarts + '}\\approx ' + hw.toFixed(1), hwEl, { throwOnError: false });
    else if (hwEl) hwEl.textContent = '1.96·√(0.25/' + nStarts + ') ≈ ' + hw.toFixed(1);
  }

  Deck.register('b2', {
    init(sec) { build(sec); },
    go() { /* static slide */ },
  });
})();
