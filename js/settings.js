/* FitLog Pro – Einstellungen & Datensicherung */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.settings = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  function render(el) {
    const p = S.state.profile;
    const bytes = new Blob([JSON.stringify(S.state)]).size;
    const kb = Math.max(1, Math.round(bytes / 1024));

    el.innerHTML =
      '<section class="page-head">' +
        '<div><h1>Einstellungen</h1><p>Profil, Tagesziele und deine lokalen Daten.</p></div>' +
      '</section>' +

      '<div class="settings-grid">' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Profil & Ziele</h2><p class="muted">Körperdaten eingeben und Ziele automatisch berechnen lassen.</p></div></div>' +
          '<form id="profileForm" class="form-stack">' +
            '<div class="form-grid two">' +
              UI.field('Name (optional)', UI.input('name', 'text', p.name, 'maxlength="40" placeholder="Dein Name"')) +
              UI.field('Trainings pro Woche (Ziel)', UI.input('weeklyGoal', 'number', p.weeklyGoal, 'min="0" max="21" step="1"')) +
            '</div>' +
            '<div class="section-label">Körperdaten</div>' +
            '<div class="form-grid four">' +
              UI.field('Größe (cm)', UI.input('height', 'number', p.height || '', 'min="100" max="230" step="1" placeholder="175"')) +
              UI.field('Gewicht (kg)', UI.input('weight', 'number', p.weight || '', 'min="30" max="250" step="0.1" placeholder="75"')) +
              UI.field('Alter', UI.input('age', 'number', p.age || '', 'min="14" max="90" step="1" placeholder="30"')) +
              UI.field('Geschlecht', '<select class="input" name="gender">' +
                '<option value="male"' + (p.gender !== 'female' ? ' selected' : '') + '>Männlich</option>' +
                '<option value="female"' + (p.gender === 'female' ? ' selected' : '') + '>Weiblich</option>' +
              '</select>') +
            '</div>' +
            '<div class="form-grid two">' +
              UI.field('Aktivität', '<select class="input" name="activity">' +
                '<option value="sedentary"' + (p.activity === 'sedentary' ? ' selected' : '') + '>Wenig (Büro, kaum Sport)</option>' +
                '<option value="light"' + (p.activity === 'light' ? ' selected' : '') + '>Leicht (1–2× Training/Woche)</option>' +
                '<option value="moderate"' + (p.activity !== 'sedentary' && p.activity !== 'light' && p.activity !== 'active' && p.activity !== 'very' ? ' selected' : '') + '>Moderat (3–4× Training/Woche)</option>' +
                '<option value="active"' + (p.activity === 'active' ? ' selected' : '') + '>Aktiv (5–6× Training/Woche)</option>' +
                '<option value="very"' + (p.activity === 'very' ? ' selected' : '') + '>Sehr aktiv (täglich / körperliche Arbeit)</option>' +
              '</select>') +
              UI.field('Ziel', '<select class="input" name="goalMode">' +
                '<option value="maintain"' + ((p.goalMode || 'maintain') === 'maintain' ? ' selected' : '') + '>Gewicht halten</option>' +
                '<option value="lose"' + (p.goalMode === 'lose' ? ' selected' : '') + '>Abnehmen (−500 kcal)</option>' +
                '<option value="gain"' + (p.goalMode === 'gain' ? ' selected' : '') + '>Zunehmen (+300 kcal)</option>' +
              '</select>') +
            '</div>' +
            '<div class="row gap">' +
              '<button type="button" class="btn ghost" id="calcGoals">' + UI.icon('target') + ' Ziele aus Körperdaten berechnen</button>' +
              '<span class="muted small-text" id="calcInfo"></span>' +
            '</div>' +
            '<div class="section-label">Tägliche Makro-Ziele</div>' +
            '<div class="form-grid four">' +
              UI.field('Kalorien (kcal)', UI.input('kcal', 'number', p.goals.kcal, 'min="0" step="any"')) +
              UI.field('Protein (g)', UI.input('protein', 'number', p.goals.protein, 'min="0" step="any"')) +
              UI.field('Kohlenhydrate (g)', UI.input('carbs', 'number', p.goals.carbs, 'min="0" step="any"')) +
              UI.field('Fett (g)', UI.input('fat', 'number', p.goals.fat, 'min="0" step="any"')) +
            '</div>' +
            '<div><button class="btn primary" type="submit">' + UI.icon('check') + ' Profil & Ziele speichern</button></div>' +
          '</form>' +
        '</section>' +

        '<section class="card" id="cloudAccountCard">' +
          '<div class="card-head"><div><h2>Konto & Synchronisation</h2><p class="muted">Supabase-Anmeldung für Zählerstände und Rezepte.</p></div></div>' +
          '<div id="cloudAccountBody"></div>' +
        '</section>' +

        '<section class="card">' +
          '<div class="card-head"><div><h2>Daten & Sicherung</h2><p class="muted">Lokale Daten dieses Geräts (' + kb + ' KB belegt).</p></div></div>' +
          '<p class="muted small-text">Sichere deine lokalen Daten regelmäßig als JSON-Datei – zum Beispiel vor einem Browser-Wechsel oder zum Übertragen auf ein anderes Gerät. Zählerstände und Rezepte werden über dein Supabase-Konto synchronisiert (wenn angemeldet).</p>' +
          '<div class="settings-actions">' +
            '<button class="btn ghost" id="exportData">' + UI.icon('download') + ' Backup exportieren</button>' +
            '<button class="btn ghost" id="importData">' + UI.icon('upload') + ' Backup importieren</button>' +
            '<input type="file" id="importFile" accept=".json,application/json" hidden>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<h3 class="danger-title">Alles zurücksetzen</h3>' +
          '<p class="muted small-text">Löscht Zähler, Rezepte, Tagebuch, Pläne und Trainings dauerhaft.</p>' +
          '<button class="btn danger-outline" id="resetData">' + UI.icon('trash') + ' Alle Daten löschen</button>' +
        '</section>' +

        '<section class="card wide-card">' +
          '<div class="card-head"><div><h2>Über FitLog Pro</h2><p class="muted">Version 1.0</p></div></div>' +
          '<div class="about-grid">' +
            '<div><strong>' + UI.icon('shield') + ' Datenschutz & Sync</strong><p>Lokale Daten (z. B. Tagebuch, Training, Gewohnheiten) bleiben im Browser dieses Geräts. Zählerstände und Rezepte werden über Supabase mit deinem Konto synchronisiert, wenn du angemeldet bist.</p></div>' +
            '<div><strong>' + UI.icon('download') + ' Offline</strong><p>Viele Funktionen funktionieren offline. Für Anmeldung und Cloud-Synchronisation (Zählerstände, Rezepte) ist eine Internetverbindung erforderlich.</p></div>' +
            '<div><strong>' + UI.icon('recipes') + ' Rezepte & Makros</strong><p>Rezepte speichern und mit einem Klick ins Tages-Tagebuch übernehmen.</p></div>' +
            '<div><strong>' + UI.icon('dumbbell') + ' Training</strong><p>Pläne mit Übungen anlegen, Einheiten starten und Volumen automatisch berechnen.</p></div>' +
          '</div>' +
        '</section>' +
      '</div>';

    const calcGoals = () => {
      const f = el.querySelector('#profileForm');
      const height = Number(String(f.querySelector('[name=height]').value || '').replace(',', '.'));
      const weight = Number(String(f.querySelector('[name=weight]').value || '').replace(',', '.'));
      const age = Number(String(f.querySelector('[name=age]').value || '').replace(',', '.'));
      const gender = f.querySelector('[name=gender]').value;
      const activity = f.querySelector('[name=activity]').value;
      const goalMode = f.querySelector('[name=goalMode]').value;
      if (!Number.isFinite(height) || !Number.isFinite(weight) || !Number.isFinite(age) || height <= 0 || weight <= 0 || age <= 0) {
        UI.toast('Bitte Größe, Gewicht und Alter eingeben.', 'error');
        return;
      }
      const bmr = gender === 'female'
        ? 10 * weight + 6.25 * height - 5 * age - 161
        : 10 * weight + 6.25 * height - 5 * age + 5;
      const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very: 1.9 };
      const tdee = bmr * (factors[activity] || 1.55);
      let calories = tdee;
      if (goalMode === 'lose') calories -= 500;
      if (goalMode === 'gain') calories += 300;
      calories = Math.max(1200, Math.round(calories));
      const proteinPerKg = goalMode === 'lose' ? 2.0 : 1.8;
      const protein = Math.round(weight * proteinPerKg);
      const fat = Math.round((calories * 0.25) / 9);
      const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
      f.querySelector('[name=kcal]').value = calories;
      f.querySelector('[name=protein]').value = protein;
      f.querySelector('[name=carbs]').value = carbs;
      f.querySelector('[name=fat]').value = fat;
      const info = el.querySelector('#calcInfo');
      if (info) info.textContent = 'Grundumsatz ' + Math.round(bmr) + ' kcal · Gesamtumsatz ' + Math.round(tdee) + ' kcal · Ziel ' + calories + ' kcal';
      if (profileSaveTimer) { clearTimeout(profileSaveTimer); profileSaveTimer = null; }
      try { saveProfileFromForm(f, { silent: true }); } catch (e) {}
      UI.toast('Ziele berechnet und gespeichert');
    };

    el.querySelector('#calcGoals')?.addEventListener('click', calcGoals);

    const profileForm = el.querySelector('#profileForm');
    const saveProfileFromForm = (form, opts) => {
      opts = opts || {};
      const num = (sel, def) => {
        const v = Number(String(form.querySelector(sel).value || '').replace(',', '.'));
        return Number.isFinite(v) && v >= 0 ? v : def;
      };
      const get = (sel) => {
        const node = form.querySelector(sel);
        return node ? node.value : '';
      };
      S.state.profile.name = String(get('[name=name]') || '').trim();
      S.state.profile.weeklyGoal = Math.round(num('[name=weeklyGoal]', 4));
      S.state.profile.height = num('[name=height]', 0) || null;
      S.state.profile.weight = num('[name=weight]', 0) || null;
      S.state.profile.age = num('[name=age]', 0) || null;
      S.state.profile.gender = get('[name=gender]') || S.state.profile.gender || 'male';
      S.state.profile.activity = get('[name=activity]') || S.state.profile.activity || 'moderate';
      S.state.profile.goalMode = get('[name=goalMode]') || S.state.profile.goalMode || 'maintain';
      S.state.profile.goals = {
        kcal: Math.round(num('[name=kcal]', 2400)),
        protein: Math.round(num('[name=protein]', 180)),
        carbs: Math.round(num('[name=carbs]', 250)),
        fat: Math.round(num('[name=fat]', 70))
      };
      S.save();
      FIT.app.renderNav();
      if (!opts.silent) UI.toast('Profil & Ziele gespeichert');
    };

    let profileSaveTimer = null;
    const scheduleProfileSave = () => {
      if (profileSaveTimer) clearTimeout(profileSaveTimer);
      profileSaveTimer = setTimeout(() => {
        profileSaveTimer = null;
        try { saveProfileFromForm(profileForm, { silent: true }); } catch (e) {}
      }, 350);
    };

    profileForm.addEventListener('input', scheduleProfileSave);
    profileForm.addEventListener('change', scheduleProfileSave);

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (profileSaveTimer) { clearTimeout(profileSaveTimer); profileSaveTimer = null; }
      saveProfileFromForm(e.target, { silent: false });
    });

    el.querySelector('#exportData').addEventListener('click', () => {
      U.download('fitness-studio_' + U.timestamp() + '.json', S.exportJSON());
      UI.toast('Backup exportiert');
    });

    const fileInput = el.querySelector('#importFile');
    el.querySelector('#importData').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      try {
        const text = await U.readTextFile(file);
        const ok = await UI.confirm({
          title: 'Backup importieren',
          message: 'Die aktuelle Datenlage wird vollständig durch das Backup ersetzt. Fortfahren?',
          confirmLabel: 'Importieren',
          danger: false
        });
        if (!ok) return;
        S.importJSON(text);
        UI.toast('Backup importiert');
        FIT.app.rerender();
      } catch (err) {
        UI.toast(err.message || 'Import fehlgeschlagen', 'error');
      }
    });

    el.querySelector('#resetData').addEventListener('click', async () => {
      const ok = await UI.confirm({
        title: 'Wirklich alles löschen?',
        message: 'Sämtliche lokalen Zähler, Rezepte, Tagebuch-Einträge, Pläne und Trainings auf diesem Gerät werden unwiderruflich entfernt. Cloud-Daten (Supabase) bleiben davon unberührt.',
        confirmLabel: 'Alles löschen'
      });
      if (!ok) return;
      S.reset();
      try { if (FIT.views.recipes && FIT.views.recipes.reset) FIT.views.recipes.reset(); } catch (e) {}
      try { if (FIT.views.meters && FIT.views.meters.reset) FIT.views.meters.reset(); } catch (e) {}
      UI.toast('Alle lokalen Daten gelöscht');
      location.hash = '#/dashboard';
      FIT.app.rerender();
    });

    function renderCloudAccount() {
      const body = el.querySelector('#cloudAccountBody');
      if (!body) return;
      const SB = FIT.supabase;
      const Cloud = FIT.cloud;
      if (!SB) {
        body.innerHTML = '<p class="muted">Supabase-Modul nicht geladen.</p>';
        return;
      }
      const state = SB.getState();
      if (!state.configured) {
        body.innerHTML =
          '<p class="muted small-text">Supabase ist noch nicht konfiguriert. Hinterlege die Projekt-URL und den öffentlichen Anon-Key (z. B. in <code>js/env.js</code> basierend auf <code>js/env.example.js</code> oder über Umgebungsvariablen/Globals deiner Umgebung). <strong>Keinen</strong> <code>service_role</code>- oder Secret-Schlüssel im Browser verwenden.</p>' +
          '<div class="settings-actions" style="margin-top:10px"><button class="btn ghost small" id="cloudRetryInit">Konfiguration erneut prüfen</button></div>';
        body.querySelector('#cloudRetryInit')?.addEventListener('click', async () => {
          try { await SB.init(); } catch (e) {}
          renderCloudAccount();
        });
        return;
      }
      if (state.error && !SB.getClient()) {
        body.innerHTML =
          '<p class="muted small-text">Supabase konnte nicht initialisiert werden: ' + U.esc(Cloud && Cloud.escapeErr ? Cloud.escapeErr(state.error) : String(state.error)) + '</p>' +
          '<div class="settings-actions" style="margin-top:10px"><button class="btn ghost small" id="cloudRetryInit">Erneut versuchen</button></div>';
        body.querySelector('#cloudRetryInit')?.addEventListener('click', async () => {
          try { await SB.init(); } catch (e) {}
          renderCloudAccount();
        });
        return;
      }
      if (SB.user) {
        body.innerHTML =
          '<p><strong>Angemeldet</strong></p>' +
          '<p class="muted small-text">' + U.esc(SB.userEmail ? SB.userEmail() : (SB.user.email || '')) + '</p>' +
          '<p class="muted small-text" style="margin-top:6px">Melde dich auf Handy und Computer mit demselben Konto an, um Zählerstände und Rezepte zu synchronisieren.</p>' +
          '<div class="settings-actions" style="margin-top:10px"><button class="btn ghost" id="cloudSignOut">Abmelden</button></div>';
        body.querySelector('#cloudSignOut')?.addEventListener('click', async () => {
          try {
            await SB.signOut();
            try { if (FIT.views.recipes && FIT.views.recipes.reset) FIT.views.recipes.reset(); } catch (e) {}
            try { if (FIT.views.meters && FIT.views.meters.reset) FIT.views.meters.reset(); } catch (e) {}
            UI.toast('Abgemeldet');
            renderCloudAccount();
            FIT.app.rerender();
          } catch (e) {
            UI.toast(Cloud && Cloud.escapeErr ? Cloud.escapeErr(e) : 'Abmelden fehlgeschlagen', 'error');
          }
        });
        return;
      }
      body.innerHTML =
        '<p class="muted small-text">Du bist nicht angemeldet. Melde dich an, um Zählerstände und Rezepte über Supabase zu laden und zu speichern.</p>' +
        '<div class="settings-actions" style="margin-top:10px">' +
          '<button class="btn primary" id="cloudSignIn">Anmelden</button>' +
          '<button class="btn ghost" id="cloudSignUp">Konto erstellen</button>' +
        '</div>';
      body.querySelector('#cloudSignIn')?.addEventListener('click', () => Cloud && Cloud.openAuthModal && Cloud.openAuthModal('signin', () => { renderCloudAccount(); FIT.app.rerender(); }));
      body.querySelector('#cloudSignUp')?.addEventListener('click', () => Cloud && Cloud.openAuthModal && Cloud.openAuthModal('signup', () => { renderCloudAccount(); FIT.app.rerender(); }));
    }

    renderCloudAccount();
  }

  return { render };
})();
