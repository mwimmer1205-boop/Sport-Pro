/* FitLog Pro – Ernährungstagebuch & Makro-Tracking */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.nutrition = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  let selectedDate = U.todayISO();

  function macroBar(label, value, goal, cls) {
    const pct = goal > 0 ? U.clamp(Math.round((value / goal) * 100), 0, 100) : 0;
    return '<div class="macro-row">' +
      '<div class="macro-row-head"><span>' + U.esc(label) + '</span><span>' + U.fmtNum(value) + ' / ' + U.fmtNum(goal) + ' g</span></div>' +
      '<div class="bar"><span class="bar-fill ' + cls + '" style="width:' + pct + '%"></span></div>' +
    '</div>';
  }

  function entryRow(entry, date) {
    const m = entry.macros || {};
    return '<div class="entry-row">' +
      '<div class="entry-main">' +
        '<strong>' + U.esc(entry.name) + '</strong>' +
        '<small>' + (entry.type === 'recipe' && Number(entry.portion) !== 1 ? U.fmtNum(entry.portion, entry.portion % 1 ? 1 : 0) + ' Portionen · ' : '') + U.fmtNum(m.kcal) + ' kcal</small>' +
      '</div>' +
      '<div class="entry-macros">' +
        '<span class="mini-macro protein">P ' + U.fmtNum(m.protein) + '</span>' +
        '<span class="mini-macro carbs">K ' + U.fmtNum(m.carbs) + '</span>' +
        '<span class="mini-macro fat">F ' + U.fmtNum(m.fat) + '</span>' +
      '</div>' +
      '<button class="icon-btn danger" data-del-entry="' + entry.id + '" title="Eintrag löschen">' + UI.icon('trash') + '</button>' +
    '</div>';
  }

  function render(el) {
    const goals = S.state.profile.goals;
    const totals = S.dayTotals(selectedDate);
    const entries = S.diaryEntries(selectedDate);
    const kcalPct = goals.kcal > 0 ? U.clamp(Math.round((totals.kcal / goals.kcal) * 100), 0, 100) : 0;
    const isToday = selectedDate === U.todayISO();

    const mealSections = S.MEALS.map((meal) => {
      const list = entries.filter((e) => (e.meal || 'Snack') === meal);
      const kcal = list.reduce((s, e) => s + (Number(e.macros && e.macros.kcal) || 0), 0);
      return '<section class="card meal-card">' +
        '<div class="card-head">' +
          '<div><h2>' + U.esc(meal) + '</h2><p class="muted">' + (list.length ? U.fmtNum(kcal) + ' kcal' : 'noch leer') + '</p></div>' +
          '<button class="icon-btn" data-add-meal="' + U.esc(meal) + '" title="Eintrag hinzufügen">' + UI.icon('plus') + '</button>' +
        '</div>' +
        (list.length ? '<div class="entry-list">' + list.map((e) => entryRow(e, selectedDate)).join('') + '</div>' : '') +
      '</section>';
    }).join('');

    el.innerHTML =
      '<section class="page-head">' +
        '<div><h1>Ernährung</h1><p>Mahlzeiten und Makros für den Tag erfassen.</p></div>' +
        '<div class="head-actions">' +
          '<button class="btn ghost" id="importOff">' + UI.icon('search') + ' Open Food Facts</button>' +
          '<button class="btn ghost" id="addCustom">' + UI.icon('plus') + ' Eigenes Lebensmittel</button>' +
          '<button class="btn primary" id="addRecipe">' + UI.icon('recipes') + ' Rezept hinzufügen</button>' +
        '</div>' +
      '</section>' +

      '<div class="date-bar card">' +
        '<button class="icon-btn" id="prevDay" title="Vortag">' + UI.icon('chevronLeft') + '</button>' +
        '<div class="date-current"><input type="date" class="input date-input" id="datePick" value="' + selectedDate + '" max="' + U.addDays(U.todayISO(), 365) + '">' +
          '<span class="date-label">' + U.esc(isToday ? 'Heute · ' : '') + U.fmtDateLong(selectedDate) + '</span></div>' +
        '<button class="icon-btn" id="nextDay" title="Folgetag">' + UI.icon('chevronRight') + '</button>' +
        (!isToday ? '<button class="btn ghost small" id="jumpToday">Heute</button>' : '') +
      '</div>' +

      '<div class="nutrition-layout">' +
        '<section class="card nutrition-summary sticky">' +
          '<div class="card-head"><div><h2>Tagesbilanz</h2><p class="muted">' + (entries.length === 1 ? '1 Eintrag' : U.fmtNum(entries.length) + ' Einträge') + '</p></div></div>' +
          '<div class="ring large" style="--p:' + kcalPct + '"><div class="ring-inner"><strong>' + U.fmtNum(totals.kcal) + '</strong><span>von ' + U.fmtNum(goals.kcal) + ' kcal</span></div></div>' +
          '<p class="kcal-remaining centered">' + (goals.kcal - totals.kcal >= 0
            ? '<strong>' + U.fmtNum(goals.kcal - totals.kcal) + '</strong> kcal übrig'
            : '<strong class="over">' + U.fmtNum(totals.kcal - goals.kcal) + '</strong> kcal über Ziel') + '</p>' +
          macroBar('Protein', totals.protein, goals.protein, 'protein') +
          macroBar('Kohlenhydrate', totals.carbs, goals.carbs, 'carbs') +
          macroBar('Fett', totals.fat, goals.fat, 'fat') +
          '<a class="btn ghost small full" href="#/settings">Ziele anpassen</a>' +
        '</section>' +
        '<div class="meals">' + mealSections + '</div>' +
      '</div>';

    const setDate = (d) => { selectedDate = d; render(el); };

    el.querySelector('#prevDay').addEventListener('click', () => setDate(U.addDays(selectedDate, -1)));
    el.querySelector('#nextDay').addEventListener('click', () => setDate(U.addDays(selectedDate, 1)));
    el.querySelector('#datePick').addEventListener('change', (e) => {
      if (e.target.value) setDate(e.target.value);
    });
    const jump = el.querySelector('#jumpToday');
    if (jump) jump.addEventListener('click', () => setDate(U.todayISO()));
    el.querySelector('#addCustom').addEventListener('click', () => openCustom());
    el.querySelector('#addRecipe').addEventListener('click', () => openAddRecipe());
    el.querySelector('#importOff')?.addEventListener('click', () => FIT.views.recipes.openImport('diary'));
    el.querySelectorAll('[data-add-meal]').forEach((b) => {
      b.addEventListener('click', () => openAddRecipe(null, b.dataset.addMeal));
    });
    el.querySelectorAll('[data-del-entry]').forEach((b) => {
      b.addEventListener('click', () => {
        S.removeDiaryEntry(selectedDate, b.dataset.delEntry);
        UI.toast('Eintrag entfernt');
        render(el);
      });
    });
  }

  function openAddRecipe(recipeId, presetMeal, date) {
    const targetDate = date || selectedDate;
    const recipes = S.state.recipes;
    if (!recipes.length) {
      UI.openModal({
        title: 'Noch keine Rezepte',
        body: '<p class="modal-text">Lege zuerst ein Rezept mit Makros an – danach kannst du es mit einem Klick ins Tagebuch übernehmen.</p>',
        submitLabel: 'Zu den Rezepten',
        onSubmit() { location.hash = '#/recipes'; }
      });
      return;
    }
    const options = recipes.map((r) => '<option value="' + r.id + '"' + (r.id === recipeId ? ' selected' : '') + '>' + U.esc(r.name) + ' · ' + U.fmtNum((r.macros || {}).kcal || 0) + ' kcal</option>').join('');
    const body =
      UI.field('Rezept', '<select class="input" name="recipe">' + options + '</select>') +
      '<div class="form-grid two">' +
        UI.field('Portionen', UI.input('portion', 'number', 1, 'min="0.25" step="0.25"')) +
        UI.field('Mahlzeit', '<select class="input" name="meal">' + S.MEALS.map((m) => '<option' + (m === presetMeal ? ' selected' : '') + '>' + m + '</option>').join('') + '</select>') +
      '</div>' +
      '<div class="preview-box" id="recipePreview"></div>';

    UI.openModal({
      title: 'Rezept ins Tagebuch',
      body,
      submitLabel: 'Hinzufügen',
      onMount(form) {
        const update = () => {
          const r = S.recipe(form.recipe.value);
          const p = Math.max(0.25, Number(form.portion.value) || 1);
          const m = r ? r.macros || {} : {};
          document.getElementById('recipePreview').innerHTML =
            '<div class="preview-title">' + U.esc(r ? r.name : '') + ' · ' + U.fmtNum(p, p % 1 ? 2 : 0) + ' Portion(en)</div>' +
            '<div class="macro-pills">' + UI.kcalPill((Number(m.kcal) || 0) * p) +
              UI.macroPill('Protein', (Number(m.protein) || 0) * p) +
              UI.macroPill('Kohlenhydrate', (Number(m.carbs) || 0) * p) +
              UI.macroPill('Fett', (Number(m.fat) || 0) * p) + '</div>';
        };
        form.recipe.addEventListener('change', update);
        form.portion.addEventListener('input', update);
        update();
      },
      onSubmit(form) {
        const r = S.recipe(form.recipe.value);
        if (!r) throw new Error('Rezept nicht gefunden.');
        const portion = Math.max(0.25, Number(form.portion.value) || 1);
        const m = r.macros || {};
        S.addDiaryEntry(targetDate, {
          type: 'recipe',
          recipeId: r.id,
          name: r.name,
          meal: form.meal.value || 'Snack',
          portion,
          macros: {
            kcal: Math.round((Number(m.kcal) || 0) * portion),
            protein: U.round1((Number(m.protein) || 0) * portion),
            carbs: U.round1((Number(m.carbs) || 0) * portion),
            fat: U.round1((Number(m.fat) || 0) * portion)
          }
        });
        UI.toast('Zum Tagebuch hinzugefügt');
        FIT.app.rerender();
      }
    });
  }

  function openCustom() {
    const body =
      UI.field('Bezeichnung', UI.input('name', 'text', '', 'required maxlength="80" placeholder="z. B. Proteinshake"')) +
      '<div class="form-grid two">' +
        UI.field('Mahlzeit', '<select class="input" name="meal">' + S.MEALS.map((m) => '<option>' + m + '</option>').join('') + '</select>') +
        UI.field('Kalorien (kcal)', UI.input('kcal', 'number', '', 'min="0" step="1" placeholder="0"')) +
      '</div>' +
      '<div class="form-grid three">' +
        UI.field('Protein (g)', UI.input('protein', 'number', '', 'min="0" step="0.1"')) +
        UI.field('Kohlenhydrate (g)', UI.input('carbs', 'number', '', 'min="0" step="0.1"')) +
        UI.field('Fett (g)', UI.input('fat', 'number', '', 'min="0" step="0.1"')) +
      '</div>';

    UI.openModal({
      title: 'Eigenes Lebensmittel',
      body,
      submitLabel: 'Hinzufügen',
      onSubmit(form) {
        const data = new FormData(form);
        const name = String(data.get('name') || '').trim();
        if (!name) throw new Error('Bitte eine Bezeichnung angeben.');
        const num = (k) => Math.max(0, Number(String(data.get(k) || '0').replace(',', '.')) || 0);
        S.addDiaryEntry(selectedDate, {
          type: 'custom',
          name,
          meal: data.get('meal') || 'Snack',
          macros: { kcal: Math.round(num('kcal')), protein: U.round1(num('protein')), carbs: U.round1(num('carbs')), fat: U.round1(num('fat')) }
        });
        UI.toast('Zum Tagebuch hinzugefügt');
        FIT.app.rerender();
      }
    });
  }

  return {
    render, openAddRecipe, openCustom,
    get selectedDate() { return selectedDate; },
    set selectedDate(v) { selectedDate = v; }
  };
})();
