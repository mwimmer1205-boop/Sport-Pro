/* FitLog Pro – App-Shell, Navigation & Routing */
window.FIT = window.FIT || {};

FIT.app = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  const NAV = [
    { route: 'dashboard', label: 'Übersicht', icon: 'dashboard' },
    { route: 'nutrition', label: 'Ernährung', icon: 'nutrition' },
    { route: 'recipes', label: 'Rezepte', icon: 'recipes' },
    { route: 'plans', label: 'Trainingsplan', icon: 'plans' },
    { route: 'training', label: 'Trainingsmodus', icon: 'log' },
    { route: 'counters', label: 'Gewohnheiten', icon: 'counters' },
    { route: 'settings', label: 'Einstellungen', icon: 'settings' }
  ];

  const TITLES = {
    dashboard: 'Übersicht', nutrition: 'Ernährung', recipes: 'Rezepte',
    plans: 'Trainingsplan', training: 'Trainingsmodus', log: 'Trainingsmodus',
    counters: 'Gewohnheiten', settings: 'Einstellungen'
  };

  let current = 'dashboard';

  function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.innerHTML = NAV.map((n) =>
      '<a class="nav-link" href="#/' + n.route + '" data-route="' + n.route + '">' +
        UI.icon(n.icon) + '<span>' + n.label + '</span>' +
      '</a>'
    ).join('');
    const profile = document.getElementById('sideProfile');
    if (profile) {
      const name = S.state.profile.name || 'Dein Profil';
      profile.innerHTML = '<span class="avatar">' + U.esc((S.state.profile.name || 'F').slice(0, 1).toUpperCase()) + '</span>' +
        '<span class="side-profile-text"><strong>' + U.esc(name) + '</strong><small>lokal gespeichert</small></span>';
    }
    const sideDate = document.getElementById('sideDate');
    if (sideDate) sideDate.textContent = U.fmtDate(U.todayISO(), { weekday: true, month: 'short' });
    setActive(current);
  }

  function setActive(route) {
    document.querySelectorAll('.nav-link').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = TITLES[route] || 'FitLog Pro';
  }

  function routeFromHash() {
    const raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    if (raw === 'log') return 'training';
    return TITLES[raw] ? raw : 'dashboard';
  }

  async function render() {
    const route = routeFromHash();
    current = route;
    setActive(route);
    const view = document.getElementById('view');
    const mod = FIT.views[route];
    if (!view || !mod) return;
    try { document.body.dataset.route = route; } catch (e) {}
    try {
      await mod.render(view);
    } catch (err) {
      console.error(err);
      view.innerHTML = '<div class="empty"><div class="empty-emoji">⚠️</div><h3>Da ist etwas schiefgelaufen</h3><p>' +
        U.esc(err.message || 'Unbekannter Fehler') + '</p><button class="btn primary" onclick="location.reload()">Neu laden</button></div>';
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function rerender() {
    applyDeviceMode(getDeviceMode());
    render();
    renderNav();
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('scrim')?.classList.remove('show');
  }

  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('scrim')?.classList.add('show');
  }

  function getDeviceMode() {
    const mode = S.state.profile && S.state.profile.deviceMode;
    return (mode === 'mobile' || mode === 'desktop' || mode === 'auto') ? mode : 'auto';
  }

  function applyDeviceMode(mode) {
    const m = (mode === 'mobile' || mode === 'desktop' || mode === 'auto') ? mode : 'auto';
    document.body.classList.toggle('device-mobile', m === 'mobile');
    document.body.classList.toggle('device-desktop', m === 'desktop');
    if (m === 'desktop') closeSidebar();
    const btn = document.getElementById('deviceToggle');
    if (btn) {
      btn.classList.toggle('is-mobile', m === 'mobile');
      let title = 'Ansicht: Automatisch (wechseln zu Handy/Computer)';
      if (m === 'mobile') title = 'Ansicht: Handy (wechseln zu Computer)';
      if (m === 'desktop') title = 'Ansicht: Computer (wechseln zu Handy)';
      btn.title = title;
      btn.setAttribute('aria-label', title);
    }
  }

  function toggleDeviceMode() {
    const current = getDeviceMode();
    let next;
    if (current === 'auto') {
      next = window.innerWidth <= 900 ? 'desktop' : 'mobile';
    } else {
      next = current === 'mobile' ? 'desktop' : 'mobile';
    }
    S.state.profile.deviceMode = next;
    S.save();
    applyDeviceMode(next);
  }

  function setupQuickMenu() {
    const btn = document.getElementById('quickAdd');
    const menu = document.getElementById('quickMenu');
    if (!btn || !menu) return;

    const close = () => menu.classList.remove('show');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('show') && !menu.contains(e.target)) close();
    });

    menu.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      close();
      if (action === 'recipe') {
        location.hash = '#/recipes';
        setTimeout(() => FIT.views.recipes.openEditor(), 60);
      } else if (action === 'meal') {
        location.hash = '#/nutrition';
        setTimeout(() => FIT.views.nutrition.openAddRecipe(null, null, U.todayISO()), 60);
      } else if (action === 'workout') {
        location.hash = '#/training';
        setTimeout(() => FIT.views.training.startWorkout({}), 60);
      } else if (action === 'checkin') {
        location.hash = '#/counters';
      }
    });
  }

  async function initCloud() {
    if (FIT.supabase && typeof FIT.supabase.init === 'function') {
      try { await FIT.supabase.init(); } catch (e) { console.error(e); }
    }
  }

  async function init() {
    S.load();
    applyDeviceMode(getDeviceMode());
    renderNav();
    setupQuickMenu();

    document.getElementById('menuBtn')?.addEventListener('click', openSidebar);
    document.getElementById('scrim')?.addEventListener('click', closeSidebar);
    document.getElementById('nav')?.addEventListener('click', (e) => {
      if (e.target.closest('.nav-link')) closeSidebar();
    });
    document.getElementById('deviceToggle')?.addEventListener('click', toggleDeviceMode);

    if (!location.hash) history.replaceState(null, '', '#/dashboard');
    window.addEventListener('hashchange', render);
    window.addEventListener('beforeunload', () => {
      try { S.save(); } catch (e) {}
      try { if (FIT.views.training && typeof FIT.views.training.persistActive === 'function') FIT.views.training.persistActive(); } catch (e) {}
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        try { S.save(); } catch (e) {}
        try { if (FIT.views.training && typeof FIT.views.training.persistActive === 'function') FIT.views.training.persistActive(); } catch (e) {}
      }
    });

    await initCloud();
    render();

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  return { init, render, rerender, renderNav, setActive, applyDeviceMode, toggleDeviceMode, get current() { return current; } };
})();

document.addEventListener('DOMContentLoaded', () => FIT.app.init());
