/* FitLog Pro – UI-Bausteine: Icons, Dialoge, Toasts */
window.FIT = window.FIT || {};

FIT.ui = (() => {
  const U = FIT.util;

  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    recipes: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h5"/>',
    nutrition: '<path d="M12 2a9 9 0 0 0-9 9 9 9 0 0 0 18 0 9 9 0 0 0-9-9z"/><path d="M12 7v10M7 12h10"/>',
    plans: '<path d="M9 5h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/><rect x="9" y="2" width="6" height="6" rx="1.5"/><path d="M7 12h10M7 16h7"/>',
    log: '<path d="M6.5 6.5 17.5 17.5M4 9l-2 2 2 2M20 9l2 2-2 2M9 4l2-2 2 2M9 20l2 2 2-2"/><path d="M9 9h2v2H9zM13 13h2v2h-2z"/>',
    counters: '<path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2.5-5C10 9.5 11 11 12 11c0-3-1.5-6 0-9z"/><path d="M12 22a7 7 0 0 0 7-7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.6.7 1 1.55 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    flame: '<path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2.5-5C10 9.5 11 11 12 11c0-3-1.5-6 0-9z"/>',
    minus: '<path d="M5 12h14"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    dumbbell: '<path d="M6.5 6.5 17.5 17.5M4 9l-2 2 2 2M20 9l2 2-2 2M9 4l2-2 2 2M9 20l2 2 2-2M9 9h2v2H9zM13 13h2v2h-2z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'
  };

  function icon(name, cls = '') {
    const p = paths[name] || '';
    return '<svg class="ico ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  function toast(message, type = 'ok') {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = (type === 'error' ? icon('close') : icon('check')) + '<span>' + U.esc(message) + '</span>';
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  const modalStack = [];

  function closeModal() {
    const ctx = modalStack.pop();
    if (!ctx) return;
    ctx.wrap.classList.remove('show');
    setTimeout(() => ctx.wrap.remove(), 180);
    if (!modalStack.length) document.body.classList.remove('modal-open');
    if (ctx.onClose) ctx.onClose();
  }

  // Ein einziger Handler schließt immer nur den obersten Dialog.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalStack.length) closeModal();
  });

  /**
   * openModal({ title, body, submitLabel, onSubmit, onMount, wide, hideFooter })
   * onSubmit(form) -> return false (or throw) to keep open.
   */
  function openModal(opts) {
    const root = document.getElementById('modalRoot');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head">' +
          '<h2>' + U.esc(opts.title || '') + '</h2>' +
          '<button type="button" class="icon-btn" data-close aria-label="Schließen">' + icon('close') + '</button>' +
        '</div>' +
        '<form class="modal-form" novalidate>' +
          '<div class="modal-body">' + (opts.body || '') + '</div>' +
          (opts.hideFooter ? '' :
          '<div class="modal-foot">' +
            '<button type="button" class="btn ghost" data-close>Abbrechen</button>' +
            '<button type="submit" class="btn primary">' + U.esc(opts.submitLabel || 'Speichern') + '</button>' +
          '</div>') +
        '</form>' +
      '</div>';
    root.appendChild(wrap);
    wrap.style.zIndex = String(100 + modalStack.length);
    modalStack.push({ wrap, onClose: opts.onClose || null });
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => wrap.classList.add('show'));

    const form = wrap.querySelector('form');
    wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) closeModal(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (opts.onSubmit) {
        try {
          const res = opts.onSubmit(form);
          if (res !== false) closeModal();
        } catch (err) {
          toast(err.message || 'Bitte Eingaben prüfen.', 'error');
        }
      } else {
        closeModal();
      }
    });

    if (opts.onMount) opts.onMount(form);
    const first = form.querySelector('input:not([type=hidden]), select, textarea');
    if (first) setTimeout(() => { try { first.focus(); } catch (e) {} }, 60);
    return { form, close: closeModal };
  }

  function confirm(opts) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (value) => { if (!done) { done = true; resolve(value); } };
      openModal({
        title: opts.title || 'Sicher?',
        body: '<p class="modal-text">' + U.esc(opts.message || '') + '</p>',
        submitLabel: opts.confirmLabel || 'Löschen',
        onClose() { finish(false); },
        onMount(form) {
          const btn = form.querySelector('button[type=submit]');
          if (btn) btn.classList.add(opts.danger === false ? 'primary' : 'danger');
        },
        onSubmit() { finish(true); }
      });
    });
  }

  const macroPill = (label, value, unit = 'g') =>
    '<span class="macro-pill"><b>' + U.fmtNum(value, value % 1 ? 1 : 0) + unit + '</b> ' + U.esc(label) + '</span>';

  const kcalPill = (kcal) =>
    '<span class="kcal-pill">' + U.fmtNum(kcal) + ' kcal</span>';

  const field = (label, inner, hint) =>
    '<label class="field"><span class="field-label">' + U.esc(label) + '</span>' + inner +
    (hint ? '<span class="field-hint">' + U.esc(hint) + '</span>' : '') + '</label>';

  const input = (name, type, value, attrs = '') =>
    '<input class="input" name="' + name + '" type="' + type + '" value="' + U.esc(value == null ? '' : value) + '" ' + attrs + '>';

  function emptyState(emoji, title, text, action) {
    return '<div class="empty"><div class="empty-emoji">' + emoji + '</div><h3>' + U.esc(title) + '</h3>' +
      '<p>' + U.esc(text) + '</p>' + (action || '') + '</div>';
  }

  return { icon, toast, openModal, closeModal, confirm, macroPill, kcalPill, field, input, emptyState };
})();
