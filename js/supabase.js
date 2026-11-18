/* FitLog Pro – Supabase-Client & Auth-Helfer */
window.FIT = window.FIT || {};

FIT.supabase = (() => {
  let client = null;
  let session = null;
  let user = null;
  let ready = false;
  let initError = null;
  const listeners = new Set();

  function readConfig() {
    const env = (typeof window.__env === 'object' && window.__env) ||
      (typeof window.__ENV === 'object' && window.__ENV) ||
      (typeof window.ENV === 'object' && window.ENV) ||
      {};
    const pick = (...vals) => {
      for (const v of vals) {
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return '';
    };
    const url = pick(
      env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_URL, env.VITE_SUPABASE_URL,
      window.SUPABASE_URL, window.NEXT_PUBLIC_SUPABASE_URL, window.VITE_SUPABASE_URL
    );
    const anonKey = pick(
      env.SUPABASE_ANON_KEY, env.SUPABASE_KEY, env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      env.VITE_SUPABASE_ANON_KEY, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      window.SUPABASE_ANON_KEY, window.SUPABASE_KEY, window.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      window.VITE_SUPABASE_ANON_KEY
    );
    return { url, anonKey };
  }

  function isConfigured() {
    const cfg = readConfig();
    return !!(cfg.url && cfg.anonKey);
  }

  function notify() {
    const state = getState();
    listeners.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });
  }

  function getState() {
    return { ready, session, user, configured: isConfigured(), error: initError };
  }

  async function init() {
    if (client) return client;
    const cfg = readConfig();
    if (!cfg.url || !cfg.anonKey) {
      initError = 'Supabase ist nicht konfiguriert (URL oder öffentlicher Anon-Key fehlt).';
      ready = true;
      notify();
      return null;
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      initError = 'Supabase-Bibliothek konnte nicht geladen werden.';
      ready = true;
      notify();
      return null;
    }
    try {
      client = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      session = data.session || null;
      user = session ? session.user : null;
      client.auth.onAuthStateChange((_event, newSession) => {
        session = newSession || null;
        user = session ? session.user : null;
        notify();
        try {
          if (FIT.app && typeof FIT.app.rerender === 'function') FIT.app.rerender();
        } catch (e) {}
      });
      initError = null;
    } catch (e) {
      console.error('Supabase-Init fehlgeschlagen', e);
      initError = e && e.message ? e.message : 'Supabase konnte nicht initialisiert werden.';
      client = null;
    }
    ready = true;
    notify();
    return client;
  }

  function getClient() { return client; }

  function requireClient() {
    if (!client) throw new Error(initError || 'Supabase ist nicht verfügbar. Bitte Anmeldung/Konfiguration prüfen.');
    return client;
  }

  async function signIn(email, password) {
    const c = requireClient();
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password) {
    const c = requireClient();
    const { data, error } = await c.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const c = requireClient();
    const { error } = await c.auth.signOut();
    if (error) throw error;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function userEmail() { return user && user.email ? user.email : ''; }

  return {
    init, getClient, requireClient, getState, isConfigured,
    signIn, signUp, signOut, onChange, userEmail,
    get session() { return session; },
    get user() { return user; },
    get ready() { return ready; },
    get error() { return initError; }
  };
})();
