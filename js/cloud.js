/* Sport Pro – Cloud/Supabase UI-Helfer */
window.FIT = window.FIT || {};

FIT.cloud = (() => {
  const U = FIT.util;
  const UI = FIT.ui;
  const SB = FIT.supabase;

  function escapeErr(e) {
    if (!e) return 'Unbekannter Fehler.';
    if (typeof e === 'string') return e;
    return e.message || e.error_description || e.details || 'Unbekannter Fehler.';
  }

  function loadingCard(text) {
    return '<div class="card cloud-state"><div class="cloud-spinner" aria-hidden="true"></div><p>' + U.esc(text || 'Lade Daten …') + '</p></div>';
  }

  function errorCard(message, retryId) {
    return '<div class="card cloud-state error">' +
      '<p><strong>Fehler</strong></p>' +
      '<p class="muted">' + U.esc(message || 'Aktion fehlgeschlagen.') + '</p>' +
      (retryId ? '<button class="btn ghost small" id="' + U.esc(retryId) + '">Erneut versuchen</button>' : '') +
    '</div>';
  }

  function configNotice() {
    const state = SB.getState();
    if (state.configured) return '';
    return '<div class="card cloud-state warn">' +
      '<p><strong>Supabase nicht konfiguriert</strong></p>' +
      '<p class="muted">Bitte Supabase-URL und öffentlichen Anon-Key bereitstellen (z. B. über <code>js/env.js</code> auf Basis von <code>js/env.example.js</code> oder per Umgebungsvariablen/Globals). Niemals einen <code>service_role</code>- oder Secret-Schlüssel im Browser verwenden.</p>' +
    '</div>';
  }

  function authCard(title, text) {
    const state = SB.getState();
    if (!state.configured) return configNotice();
    if (state.error && !SB.getClient()) return errorCard(state.error);
    if (SB.user) return '';
    return '<div class="card cloud-state auth-card">' +
      '<h3>' + U.esc(title || 'Anmeldung erforderlich') + '</h3>' +
      '<p class="muted">' + U.esc(text || 'Bitte melde dich an, um diese Daten geräteübergreifend zu laden und zu speichern.') + '</p>' +
      '<div class="row gap" style="margin-top:10px">' +
        '<button class="btn primary" id="cloudSignIn">Anmelden</button>' +
        '<button class="btn ghost" id="cloudSignUp">Konto erstellen</button>' +
      '</div>' +
    '</div>';
  }

  function bindAuthCard(el, onDone) {
    const signInBtn = el.querySelector('#cloudSignIn');
    const signUpBtn = el.querySelector('#cloudSignUp');
    if (signInBtn) signInBtn.addEventListener('click', () => openAuthModal('signin', onDone));
    if (signUpBtn) signUpBtn.addEventListener('click', () => openAuthModal('signup', onDone));
  }

  function openAuthModal(mode, onDone) {
    mode = mode || 'signin';
    const isSignUp = mode === 'signup';
    const body =
      UI.field('E-Mail', UI.input('email', 'email', '', 'required autocomplete="email" placeholder="name@example.com"')) +
      UI.field('Passwort', UI.input('password', 'password', '', 'required minlength="6" autocomplete="' + (isSignUp ? 'new-password' : 'current-password') + '"')) +
      '<p class="muted small-text" id="authHint">' + (isSignUp ? 'Nach der Registrierung musst du ggf. deine E-Mail bestätigen (abhängig von den Supabase-Auth-Einstellungen).' : 'Melde dich mit demselben Konto auf Handy und Computer an.') + '</p>' +
      '<div class="row gap" style="margin-top:6px">' +
        '<button type="button" class="btn ghost small" id="authToggle">' + (isSignUp ? 'Stattdessen anmelden' : 'Stattdessen Konto erstellen') + '</button>' +
      '</div>';
    UI.openModal({
      title: isSignUp ? 'Konto erstellen' : 'Anmelden',
      body,
      submitLabel: isSignUp ? 'Registrieren' : 'Anmelden',
      onMount(form) {
        const toggle = form.querySelector('#authToggle');
        if (toggle) {
          toggle.addEventListener('click', () => {
            UI.closeModal();
            setTimeout(() => openAuthModal(isSignUp ? 'signin' : 'signup', onDone), 0);
          });
        }
      },
      async onSubmit(form) {
        const email = String(form.email.value || '').trim();
        const password = String(form.password.value || '');
        if (!email) throw new Error('Bitte E-Mail-Adresse eingeben.');
        if (!password) throw new Error('Bitte Passwort eingeben.');
        try {
          if (isSignUp) {
            const data = await SB.signUp(email, password);
            if (data && data.session) {
              UI.toast('Konto erstellt und angemeldet');
            } else {
              UI.toast('Konto erstellt. Bitte E-Mail bestätigen und danach anmelden.');
            }
          } else {
            await SB.signIn(email, password);
            UI.toast('Angemeldet');
          }
          if (typeof onDone === 'function') onDone();
          else if (FIT.app) FIT.app.rerender();
        } catch (e) {
          throw new Error(escapeErr(e));
        }
      }
    });
  }

  async function withLoading(el, fn, opts) {
    opts = opts || {};
    const loadingText = opts.loadingText || 'Lade Daten …';
    if (el) el.innerHTML = loadingCard(loadingText);
    try {
      return await fn();
    } catch (e) {
      const msg = escapeErr(e);
      if (el) {
        el.innerHTML = errorCard(msg, opts.retryId || 'cloudRetry');
        const retry = el.querySelector('#' + (opts.retryId || 'cloudRetry'));
        if (retry && typeof opts.retry === 'function') retry.addEventListener('click', opts.retry);
      } else {
        UI.toast(msg, 'error');
      }
      throw e;
    }
  }

  return { escapeErr, loadingCard, errorCard, configNotice, authCard, bindAuthCard, openAuthModal, withLoading };
})();
