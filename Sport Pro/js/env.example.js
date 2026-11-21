// Kopiere diese Datei nach `js/env.js` und trage deine Supabase-Zugangsdaten ein.
// Verwende NUR den öffentlichen "anon"/publishable Schlüssel (niemals service_role/secret).
//
// window.__env = {
//   SUPABASE_URL: 'https://btrdlfmjeufksipzsnyx.supabase.co',
//   SUPABASE_ANON_KEY: 'DEIN_ANON_KEY'
// };
//
// Alternativ können die Werte auch anderweitig als Umgebungsvariablen/Globals
// bereitgestellt werden (z. B. window.SUPABASE_URL / window.SUPABASE_ANON_KEY),
// sofern deine Hosting-/Build-Umgebung das injiziert.
window.__env = window.__env || {
  SUPABASE_URL: 'https://btrdlfmjeufksipzsnyx.supabase.co',
  SUPABASE_ANON_KEY: ''
};
