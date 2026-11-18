/* FitLog Pro – Rezepte */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.recipes = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  function macrosOf(r) {
    return Object.assign(S.emptyMacros(), r.macros || {});
  }

  function card(r) {
    const m = macrosOf(r);
    const ingredients = String(r.ingredients || '').split('\n').map((s) => s.trim()).filter(Boolean);
    return '<article class="recipe-card" data-search="' + U.esc((r.name + ' ' + (r.category || '') + ' ' + (r.ingredients || '')).toLowerCase()) + '">' +
      '<div class="recipe-top">' +
        '<span class="tag">' + U.esc(r.category || 'Allgemein') + '</span>' +
        '<div class="card-actions">' +
          '<button class="icon-btn" data-edit-recipe="' + r.id + '" title="Bearbeiten">' + UI.icon('edit') + '</button>' +
          '<button class="icon-btn danger" data-del-recipe="' + r.id + '" title="Löschen">' + UI.icon('trash') + '</button>' +
        '</div>' +
      '</div>' +
      '<h3 class="recipe-name">' + U.esc(r.name) + '</h3>' +
      (ingredients.length ? '<p class="recipe-ingredients">' + U.esc(ingredients.slice(0, 4).join(' · ')) + (ingredients.length > 4 ? ' …' : '') + '</p>' : '<p class="recipe-ingredients muted">Keine Zutaten hinterlegt</p>') +
      '<div class="macro-pills">' +
        UI.kcalPill(m.kcal) +
        UI.macroPill('P', m.protein) +
        UI.macroPill('K', m.carbs) +
        UI.macroPill('F', m.fat) +
      '</div>' +
      '<div class="recipe-foot">' +
        '<span class="muted small-text">pro Portion' + (Number(r.servings) > 1 ? ' · ' + U.fmtNum(r.servings) + ' Portionen' : '') + '</span>' +
        '<button class="btn small primary" data-add-recipe="' + r.id + '">' + UI.icon('plus') + ' Tagebuch</button>' +
      '</div>' +
    '</article>';
  }

  function render(el) {
    const list = S.state.recipes;
    el.innerHTML =
      '<section class="page-head">' +
        '<div><h1>Rezepte</h1><p>Makros pro Portion speichern und direkt ins Tagebuch übernehmen.</p></div>' +
        '<div class="head-actions">' +
          '<button class="btn ghost" id="importRecipes">' + UI.icon('upload') + ' Importieren</button>' +
          '<button class="btn ghost" id="importOff">' + UI.icon('search') + ' Open Food Facts</button>' +
          '<button class="btn ghost" id="importOffMulti">' + UI.icon('plus') + ' Mehrere Zutaten (OFF)</button>' +
          '<button class="btn primary" id="newRecipe">' + UI.icon('plus') + ' Neues Rezept</button>' +
        '</div>' +
      '</section>' +
      (list.length ?
        '<div class="toolbar">' +
          '<label class="search-box">' + UI.icon('search') + '<input id="recipeSearch" class="input" type="search" placeholder="Rezept, Kategorie oder Zutat suchen …"></label>' +
          '<span class="muted small-text" id="recipeCount">' + (list.length === 1 ? '1 Rezept' : list.length + ' Rezepte') + '</span>' +
        '</div>' +
        '<div class="recipes-grid" id="recipesGrid">' + list.map(card).join('') + '</div>' +
        '<p class="empty-filter muted" id="noRecipeMatch" hidden>Kein Rezept passt zur Suche.</p>'
        : UI.emptyState('🍳', 'Noch keine Rezepte', 'Speichere deine Lieblingsgerichte mit Kalorien, Protein, Kohlenhydraten und Fett – so hast du deine Makros immer im Blick.',
          '<button class="btn primary" id="emptyNewRecipe">' + UI.icon('plus') + ' Erstes Rezept anlegen</button>'));

    const openNew = () => openEditor();
    el.querySelector('#newRecipe')?.addEventListener('click', openNew);
    el.querySelector('#emptyNewRecipe')?.addEventListener('click', openNew);
    el.querySelector('#importOff')?.addEventListener('click', () => openImport('recipe'));
    el.querySelector('#importOffMulti')?.addEventListener('click', () => openMultiImport());
    el.querySelector('#importRecipes')?.addEventListener('click', () => openImportRecipes());

    el.querySelectorAll('[data-edit-recipe]').forEach((b) => {
      b.addEventListener('click', () => openEditor(S.recipe(b.dataset.editRecipe)));
    });
    el.querySelectorAll('[data-del-recipe]').forEach((b) => {
      b.addEventListener('click', async () => {
        const r = S.recipe(b.dataset.delRecipe);
        if (!r) return;
        const ok = await UI.confirm({ title: 'Rezept löschen', message: '„' + r.name + '“ wird dauerhaft entfernt. Einträge im Tagebuch bleiben erhalten.' });
        if (ok) {
          S.deleteRecipe(r.id);
          UI.toast('Rezept gelöscht');
          FIT.app.rerender();
        }
      });
    });
    el.querySelectorAll('[data-add-recipe]').forEach((b) => {
      b.addEventListener('click', () => FIT.views.nutrition.openAddRecipe(b.dataset.addRecipe, null, U.todayISO()));
    });

    const search = el.querySelector('#recipeSearch');
    if (search) {
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        let visible = 0;
        el.querySelectorAll('#recipesGrid .recipe-card').forEach((cardEl) => {
          const hit = !q || (cardEl.dataset.search || '').includes(q);
          cardEl.hidden = !hit;
          if (hit) visible += 1;
        });
        el.querySelector('#recipeCount').textContent = visible + ' von ' + (list.length === 1 ? '1 Rezept' : list.length + ' Rezepten');
        el.querySelector('#noRecipeMatch').hidden = visible > 0;
      });
    }
  }

  function openEditor(recipe) {
    const r = recipe || {};
    const m = macrosOf(r);
    const cats = Array.from(new Set(S.state.recipes.map((x) => x.category).filter(Boolean)));
    const body =
      '<div class="form-grid two">' +
        UI.field('Name', UI.input('name', 'text', r.name || '', 'required maxlength="80" placeholder="z. B. Hähnchen-Reis-Bowl"')) +
        UI.field('Kategorie', '<input class="input" name="category" list="recipeCats" value="' + U.esc(r.category || 'Allgemein') + '" placeholder="Allgemein">' +
          '<datalist id="recipeCats">' + cats.map((c) => '<option value="' + U.esc(c) + '">').join('') + '</datalist>') +
      '</div>' +
      UI.field('Portionen (Rezept ergibt)', UI.input('servings', 'number', r.servings || 1, 'min="0.5" step="0.5"')) +
      '<div class="section-label">Makros pro Portion</div>' +
      '<div class="form-grid four">' +
        UI.field('Kalorien (kcal)', UI.input('kcal', 'number', m.kcal, 'min="0" step="1"')) +
        UI.field('Protein (g)', UI.input('protein', 'number', m.protein, 'min="0" step="0.1"')) +
        UI.field('Kohlenhydrate (g)', UI.input('carbs', 'number', m.carbs, 'min="0" step="0.1"')) +
        UI.field('Fett (g)', UI.input('fat', 'number', m.fat, 'min="0" step="0.1"')) +
      '</div>' +
      UI.field('Zutaten (eine pro Zeile)', '<textarea class="input" name="ingredients" rows="4" placeholder="200 g Hähnchenbrust&#10;150 g Reis&#10;Gemüse nach Wahl">' + U.esc(r.ingredients || '') + '</textarea>') +
      UI.field('Zubereitung (optional)', '<textarea class="input" name="steps" rows="3" placeholder="Kurze Schritte …">' + U.esc(r.steps || '') + '</textarea>');

    UI.openModal({
      title: recipe ? 'Rezept bearbeiten' : 'Neues Rezept',
      body,
      wide: true,
      submitLabel: recipe ? 'Aktualisieren' : 'Rezept speichern',
      onSubmit(form) {
        const data = new FormData(form);
        const name = String(data.get('name') || '').trim();
        if (!name) throw new Error('Bitte einen Namen für das Rezept angeben.');
        const num = (k) => Math.max(0, Number(String(data.get(k) || '0').replace(',', '.')) || 0);
        const recipeData = {
          name,
          category: String(data.get('category') || '').trim() || 'Allgemein',
          servings: Math.max(0.5, num('servings') || 1),
          macros: { kcal: Math.round(num('kcal')), protein: U.round1(num('protein')), carbs: U.round1(num('carbs')), fat: U.round1(num('fat')) },
          ingredients: String(data.get('ingredients') || '').trim(),
          steps: String(data.get('steps') || '').trim()
        };
        if (recipe) recipeData.id = recipe.id;
        S.saveRecipe(recipeData);
        UI.toast(recipe ? 'Rezept aktualisiert' : 'Rezept gespeichert');
        FIT.app.rerender();
      }
    });
  }

  /* ---------- Open Food Facts ---------- */

  function offNutriments(p) {
    const n = (p && p.nutriments) || {};
    const kcal = n['energy-kcal_100g'] != null ? n['energy-kcal_100g']
      : (n['energy-kcal'] != null ? n['energy-kcal']
      : (n['energy_100g'] != null ? Math.round(Number(n['energy_100g']) / 4.184) : 0));
    return {
      kcal: Math.round(Number(kcal) || 0),
      protein: U.round1(Number(n['proteins_100g'] != null ? n['proteins_100g'] : (n['proteins'] || 0))),
      carbs: U.round1(Number(n['carbohydrates_100g'] != null ? n['carbohydrates_100g'] : (n['carbohydrates'] || 0))),
      fat: U.round1(Number(n['fat_100g'] != null ? n['fat_100g'] : (n['fat'] || 0)))
    };
  }

  async function offFetchProduct(barcode) {
    const res = await fetch('https://world.openfoodfacts.org/api/v0/product/' + encodeURIComponent(barcode) + '.json');
    if (!res.ok) throw new Error('Netzwerkfehler.');
    const data = await res.json();
    if (data.status !== 1 || !data.product) throw new Error('Produkt nicht gefunden.');
    return data.product;
  }

  async function offSearch(query) {
    const q = String(query || '').trim();
    if (!q) return [];
    if (/^\\d{8,}$/.test(q)) {
      try { return [await offFetchProduct(q)]; } catch (e) { /* fall through to text search */ }
    }
    const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(q) +
      '&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,brands,nutriments,serving_size';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Netzwerkfehler.');
    const data = await res.json();
    return (data.products || []).filter((p) => p && p.product_name && p.nutriments);
  }

  function openImport(defaultAction) {
    defaultAction = defaultAction || 'recipe';
    const body =
      '<div class="off-search">' +
        '<label class="search-box grow">' + UI.icon('search') +
          '<input class="input" id="offQuery" type="search" placeholder="Produktname oder Barcode suchen …">' +
        '</label>' +
        '<button type="button" class="btn primary" id="offSearchBtn">Suchen</button>' +
      '</div>' +
      '<p class="muted small-text" id="offStatus">Durchsucht Open Food Facts im Internet (erfordert Verbindung).</p>' +
      '<div class="off-results" id="offResults"></div>' +
      '<div id="offSelected"></div>';

    UI.openModal({
      title: 'Open Food Facts – Lebensmittel importieren',
      body,
      wide: true,
      submitLabel: 'Schließen',
      onSubmit() {},
      onMount(form) {
        const query = form.querySelector('#offQuery');
        const btn = form.querySelector('#offSearchBtn');
        const status = form.querySelector('#offStatus');
        const results = form.querySelector('#offResults');
        const selected = form.querySelector('#offSelected');

        const showSelected = (product) => {
          const m = offNutriments(product);
          const name = product.product_name || 'Unbekanntes Produkt';
          const brand = product.brands ? ' · ' + product.brands : '';
          selected.innerHTML =
            '<div class="off-selected">' +
              '<h3>' + U.esc(name) + '</h3>' +
              '<p class="muted small-text">' + U.esc((product.code || '') + brand) +
                ' · pro 100 g: ' + U.fmtNum(m.kcal) + ' kcal, P ' + U.fmtNum(m.protein) +
                ', K ' + U.fmtNum(m.carbs) + ', F ' + U.fmtNum(m.fat) + '</p>' +
              '<div class="form-grid two">' +
                UI.field('Menge (g)', UI.input('offAmount', 'number', 100, 'min="1" step="1" id="offAmount"')) +
                UI.field('Portionen (Rezept)', UI.input('offServings', 'number', 1, 'min="1" step="1" id="offServings"')) +
              '</div>' +
              '<div class="preview-box" id="offPreview"></div>' +
              '<div class="row gap">' +
                '<button type="button" class="btn primary" id="offSaveRecipe">' + UI.icon('plus') + ' Als Rezept speichern</button>' +
                '<button type="button" class="btn ghost" id="offAddDiary">' + UI.icon('nutrition') + ' Direkt ins Tagebuch</button>' +
              '</div>' +
              '<button type="button" class="btn ghost small" id="offBack">Zurück zur Suche</button>' +
            '</div>';

          const amount = selected.querySelector('#offAmount');
          const servings = selected.querySelector('#offServings');
          const preview = selected.querySelector('#offPreview');

          const updatePreview = () => {
            const g = Math.max(1, Number(amount.value) || 100);
            const s = Math.max(1, Number(servings.value) || 1);
            const factor = g / 100 / s;
            const mm = { kcal: Math.round(m.kcal * factor * s * 100 / 100), protein: U.round1(m.protein * (g / 100)), carbs: U.round1(m.carbs * (g / 100)), fat: U.round1(m.fat * (g / 100)) };
            // per portion:
            const perPortion = { kcal: Math.round((m.kcal * g / 100) / s), protein: U.round1((m.protein * g / 100) / s), carbs: U.round1((m.carbs * g / 100) / s), fat: U.round1((m.fat * g / 100) / s) };
            preview.innerHTML =
              '<div class="preview-title">' + U.fmtNum(g) + ' g gesamt · ' + U.fmtNum(s) + ' Portion(en)</div>' +
              '<div class="macro-pills">' + UI.kcalPill(perPortion.kcal * s) +
                UI.macroPill('Protein', perPortion.protein * s) +
                UI.macroPill('Kohlenhydrate', perPortion.carbs * s) +
                UI.macroPill('Fett', perPortion.fat * s) + '</div>' +
              '<p class="muted small-text" style="margin-top:6px">Pro Portion: ' + U.fmtNum(perPortion.kcal) + ' kcal · P ' + U.fmtNum(perPortion.protein) + ' · K ' + U.fmtNum(perPortion.carbs) + ' · F ' + U.fmtNum(perPortion.fat) + '</p>';
            selected.dataset.perPortion = JSON.stringify(perPortion);
            selected.dataset.total = JSON.stringify({ kcal: Math.round(m.kcal * g / 100), protein: U.round1(m.protein * g / 100), carbs: U.round1(m.carbs * g / 100), fat: U.round1(m.fat * g / 100) });
            selected.dataset.amount = g;
            selected.dataset.servings = s;
            selected.dataset.name = name;
            selected.dataset.code = product.code || '';
          };
          amount.addEventListener('input', updatePreview);
          servings.addEventListener('input', updatePreview);
          updatePreview();

          selected.querySelector('#offBack').addEventListener('click', () => { selected.innerHTML = ''; results.style.display = ''; });

          selected.querySelector('#offSaveRecipe').addEventListener('click', () => {
            const perPortion = JSON.parse(selected.dataset.perPortion);
            const s = Number(selected.dataset.servings) || 1;
            const g = Number(selected.dataset.amount) || 100;
            S.saveRecipe({
              name: selected.dataset.name,
              category: 'Open Food Facts',
              servings: s,
              macros: perPortion,
              ingredients: selected.dataset.name + ' – ' + g + ' g (Open Food Facts)',
              steps: 'Quelle: Open Food Facts (' + selected.dataset.code + ')'
            });
            UI.toast('Rezept aus Open Food Facts gespeichert');
            UI.closeModal();
            FIT.app.rerender();
          });

          selected.querySelector('#offAddDiary').addEventListener('click', () => {
            const total = JSON.parse(selected.dataset.total);
            const g = Number(selected.dataset.amount) || 100;
            S.addDiaryEntry(U.todayISO(), {
              type: 'custom',
              name: selected.dataset.name + ' (' + g + ' g)',
              meal: 'Snack',
              macros: total
            });
            UI.toast('Zum heutigen Tagebuch hinzugefügt');
            UI.closeModal();
            FIT.app.rerender();
          });
        };

        const runSearch = async () => {
          const q = query.value.trim();
          if (!q) { UI.toast('Bitte Suchbegriff eingeben.', 'error'); return; }
          status.textContent = 'Suche in Open Food Facts …';
          results.innerHTML = '<div class="combo-empty">Suche läuft …</div>';
          selected.innerHTML = '';
          try {
            const products = await offSearch(q);
            if (!products.length) {
              results.innerHTML = '<div class="combo-empty">Keine Produkte gefunden.</div>';
              status.textContent = 'Keine Treffer.';
              return;
            }
            results.innerHTML = products.map((p) => {
              const m = offNutriments(p);
              const name = p.product_name || 'Unbekannt';
              const brand = p.brands ? ' · ' + p.brands : '';
              return '<button type="button" class="off-result" data-code="' + U.esc(p.code || '') + '">' +
                '<div class="off-result-main"><strong>' + U.esc(name) + '</strong><small>' + U.esc(brand) + '</small></div>' +
                '<div class="off-result-macros">' + U.fmtNum(m.kcal) + ' kcal · P ' + U.fmtNum(m.protein) +
                  ' · K ' + U.fmtNum(m.carbs) + ' · F ' + U.fmtNum(m.fat) + ' / 100 g</div>' +
              '</button>';
            }).join('');
            status.textContent = products.length + (products.length === 1 ? ' Treffer' : ' Treffer') + ' – Produkt anklicken.';
            results.querySelectorAll('.off-result').forEach((btn) => {
              btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                const product = products.find((p) => (p.code || '') === code);
                if (product) showSelected(product);
              });
            });
          } catch (e) {
            results.innerHTML = '<div class="combo-empty">Fehler: ' + U.esc(e.message || 'Keine Verbindung') + '</div>';
            status.textContent = 'Suche fehlgeschlagen.';
          }
        };

        btn.addEventListener('click', runSearch);
        query.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });
        setTimeout(() => { try { query.focus(); } catch (e) {} }, 60);
      }
    });
  }

  /* ---------- Rezept aus mehreren Open-Food-Facts-Zutaten ---------- */

  function openMultiImport() {
    const ingredients = [];

    const body =
      '<div class="off-multi">' +
        '<div class="off-multi-search">' +
          '<div class="off-search">' +
            '<label class="search-box grow">' + UI.icon('search') +
              '<input class="input" id="offMultiQuery" type="search" placeholder="Zutat suchen (Name oder Barcode) …">' +
            '</label>' +
            '<button type="button" class="btn primary" id="offMultiSearchBtn">Suchen</button>' +
          '</div>' +
          '<p class="muted small-text" id="offMultiStatus">Produkt suchen und anklicken, um es als Zutat hinzuzufügen.</p>' +
          '<div class="off-results" id="offMultiResults"></div>' +
        '</div>' +
        '<div class="off-multi-ingredients">' +
          '<h3>Zutaten</h3>' +
          '<div class="off-ingredient-list" id="offMultiList"></div>' +
          '<div class="preview-box" id="offMultiTotal"></div>' +
          '<label class="field"><span class="field-label">Rezeptname</span>' + UI.input('offMultiName', 'text', '', 'maxlength="80" placeholder="z. B. Bananen-Joghurt-Bowl"') + '</label>' +
          '<label class="field"><span class="field-label">Portionen (Rezept)</span>' + UI.input('offMultiServings', 'number', 1, 'min="1" step="1"') + '</label>' +
          '<button type="button" class="btn primary full" id="offMultiSave">Rezept speichern</button>' +
        '</div>' +
      '</div>';

    UI.openModal({
      title: 'Rezept aus mehreren Open-Food-Facts-Zutaten',
      body,
      wide: true,
      submitLabel: 'Schließen',
      onSubmit() {},
      onMount(form) {
        const query = form.querySelector('#offMultiQuery');
        const searchBtn = form.querySelector('#offMultiSearchBtn');
        const status = form.querySelector('#offMultiStatus');
        const results = form.querySelector('#offMultiResults');
        const list = form.querySelector('#offMultiList');
        const totalBox = form.querySelector('#offMultiTotal');
        const nameInput = form.querySelector('[name="offMultiName"]');
        const servingsInput = form.querySelector('[name="offMultiServings"]');
        const saveBtn = form.querySelector('#offMultiSave');

        const ingredientMacros = (ing) => {
          const m = ing.macros; const f = ing.amount / 100;
          return { kcal: Math.round(m.kcal * f), protein: U.round1(m.protein * f), carbs: U.round1(m.carbs * f), fat: U.round1(m.fat * f) };
        };

        const renderIngredients = () => {
          if (!ingredients.length) {
            list.innerHTML = '<div class="combo-empty">Noch keine Zutaten. Suche ein Produkt und klicke es an.</div>';
          } else {
            list.innerHTML = ingredients.map((ing, idx) => {
              const m = ingredientMacros(ing);
              return '<div class="off-ingredient" data-idx="' + idx + '">' +
                '<div class="off-ingredient-main">' +
                  '<strong>' + U.esc(ing.product.product_name || 'Produkt') + '</strong>' +
                  '<small>' + U.esc((ing.product.brands ? ing.product.brands + ' · ' : '') + U.fmtNum(ing.macros.kcal) + ' kcal / 100 g') + '</small>' +
                '</div>' +
                '<input type="number" class="input off-ing-amount" min="1" step="1" value="' + U.esc(ing.amount) + '" data-idx="' + idx + '">' +
                '<span class="off-ing-macros">' + U.fmtNum(m.kcal) + ' kcal · P ' + U.fmtNum(m.protein) + ' · K ' + U.fmtNum(m.carbs) + ' · F ' + U.fmtNum(m.fat) + '</span>' +
                '<button type="button" class="icon-btn danger" data-remove-idx="' + idx + '" title="Entfernen">' + UI.icon('trash') + '</button>' +
              '</div>';
            }).join('');
          }

          const totals = ingredients.reduce((sum, ing) => {
            const m = ingredientMacros(ing);
            sum.kcal += m.kcal; sum.protein += m.protein; sum.carbs += m.carbs; sum.fat += m.fat;
            return sum;
          }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

          const servings = Math.max(1, Number(servingsInput.value) || 1);
          const perPortion = {
            kcal: Math.round(totals.kcal / servings),
            protein: U.round1(totals.protein / servings),
            carbs: U.round1(totals.carbs / servings),
            fat: U.round1(totals.fat / servings)
          };

          totalBox.innerHTML =
            '<div class="preview-title">' + ingredients.length + (ingredients.length === 1 ? ' Zutat' : ' Zutaten') +
              ' · ' + U.fmtNum(totals.kcal) + ' kcal gesamt</div>' +
            '<div class="macro-pills">' + UI.kcalPill(totals.kcal) +
              UI.macroPill('Protein', totals.protein) +
              UI.macroPill('Kohlenhydrate', totals.carbs) +
              UI.macroPill('Fett', totals.fat) + '</div>' +
            '<p class="muted small-text" style="margin-top:6px">Pro Portion (' + U.fmtNum(servings) + '): ' +
              U.fmtNum(perPortion.kcal) + ' kcal · P ' + U.fmtNum(perPortion.protein) +
              ' · K ' + U.fmtNum(perPortion.carbs) + ' · F ' + U.fmtNum(perPortion.fat) + '</p>';

          totalBox.dataset.totals = JSON.stringify(totals);
          totalBox.dataset.perPortion = JSON.stringify(perPortion);
          totalBox.dataset.servings = servings;
        };

        const runSearch = async () => {
          const q = query.value.trim();
          if (!q) { UI.toast('Bitte Suchbegriff eingeben.', 'error'); return; }
          status.textContent = 'Suche in Open Food Facts …';
          results.innerHTML = '<div class="combo-empty">Suche läuft …</div>';
          try {
            const products = await offSearch(q);
            if (!products.length) {
              results.innerHTML = '<div class="combo-empty">Keine Produkte gefunden.</div>';
              status.textContent = 'Keine Treffer.';
              return;
            }
            results.innerHTML = products.map((p) => {
              const m = offNutriments(p);
              const name = p.product_name || 'Unbekannt';
              const brand = p.brands ? ' · ' + p.brands : '';
              return '<button type="button" class="off-result" data-code="' + U.esc(p.code || '') + '">' +
                '<div class="off-result-main"><strong>' + U.esc(name) + '</strong><small>' + U.esc(brand) + '</small></div>' +
                '<div class="off-result-macros">' + U.fmtNum(m.kcal) + ' kcal · P ' + U.fmtNum(m.protein) +
                  ' · K ' + U.fmtNum(m.carbs) + ' · F ' + U.fmtNum(m.fat) + ' / 100 g</div>' +
              '</button>';
            }).join('');
            status.textContent = products.length + (products.length === 1 ? ' Treffer' : ' Treffer') + ' – Produkt anklicken, um es hinzuzufügen.';
            results.querySelectorAll('.off-result').forEach((btn) => {
              btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                const product = products.find((p) => (p.code || '') === code);
                if (product) {
                  ingredients.push({ product: product, amount: 100, macros: offNutriments(product) });
                  renderIngredients();
                  UI.toast('Zutat hinzugefügt');
                }
              });
            });
          } catch (e) {
            results.innerHTML = '<div class="combo-empty">Fehler: ' + U.esc(e.message || 'Keine Verbindung') + '</div>';
            status.textContent = 'Suche fehlgeschlagen.';
          }
        };

        searchBtn.addEventListener('click', runSearch);
        query.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });

        list.addEventListener('input', (e) => {
          const input = e.target.closest('.off-ing-amount');
          if (!input) return;
          const idx = Number(input.dataset.idx);
          if (!ingredients[idx]) return;
          ingredients[idx].amount = Math.max(1, Number(input.value) || 1);
          renderIngredients();
        });

        list.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-remove-idx]');
          if (!btn) return;
          const idx = Number(btn.dataset.removeIdx);
          ingredients.splice(idx, 1);
          renderIngredients();
        });

        servingsInput.addEventListener('input', renderIngredients);

        saveBtn.addEventListener('click', () => {
          const name = String(nameInput.value || '').trim();
          if (!name) { UI.toast('Bitte einen Rezeptnamen angeben.', 'error'); return; }
          if (!ingredients.length) { UI.toast('Bitte mindestens eine Zutat hinzufügen.', 'error'); return; }
          const totals = JSON.parse(totalBox.dataset.totals || '{}');
          const perPortion = JSON.parse(totalBox.dataset.perPortion || '{}');
          const servings = Number(totalBox.dataset.servings) || 1;
          S.saveRecipe({
            name: name,
            category: 'Open Food Facts',
            servings: servings,
            macros: perPortion,
            ingredients: ingredients.map((ing) => (ing.product.product_name || 'Produkt') + ' – ' + ing.amount + ' g').join('\\n'),
            steps: 'Quelle: Open Food Facts (' + ingredients.map((ing) => ing.product.code).filter(Boolean).join(', ') + ')'
          });
          UI.toast('Rezept aus mehreren Zutaten gespeichert');
          UI.closeModal();
          FIT.app.rerender();
        });

        renderIngredients();
        setTimeout(() => { try { query.focus(); } catch (e) {} }, 60);
      }
    });
  }

  /* ---------- Import-Helfer (CSV / Excel) ---------- */

  function parseCSV(text) {
    const firstLine = String(text || '').split(/\r?\n/).find((l) => l.trim() !== '') || '';
    const delims = [',', ';', '\t'];
    const counts = delims.map((d) => firstLine.split(d).length);
    const delim = delims[counts.indexOf(Math.max.apply(null, counts))];
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 1; }
          else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delim) { row.push(field); field = ''; }
        else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (ch === '\r') { /* skip */ }
        else field += ch;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
  }

  function normHeader(h) {
    return String(h || '').trim().toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  }

  function headerIndex(headers, names) {
    for (let i = 0; i < headers.length; i += 1) {
      if (names.indexOf(normHeader(headers[i])) !== -1) return i;
    }
    return -1;
  }

  function numValue(v) {
    const s = String(v == null ? '' : v).trim().replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function rowToRecipe(headers, row) {
    const get = (names) => {
      const idx = headerIndex(headers, names);
      return idx >= 0 ? row[idx] : '';
    };
    const name = String(get(['name', 'produkt', 'product', 'lebensmittel', 'rezept']) || '').trim();
    if (!name) return null;
    return {
      name: name,
      category: String(get(['kategorie', 'category']) || 'Importiert').trim() || 'Importiert',
      servings: Math.max(0.5, numValue(get(['portionen', 'servings', 'portions'])) || 1),
      macros: {
        kcal: Math.round(numValue(get(['kcal', 'kalorien', 'calories', 'energy']))),
        protein: U.round1(numValue(get(['protein', 'eiweiss', 'eiweiß']))),
        carbs: U.round1(numValue(get(['kohlenhydrate', 'carbs', 'carbohydrates']))),
        fat: U.round1(numValue(get(['fett', 'fat'])))
      },
      ingredients: String(get(['zutaten', 'ingredients']) || '').trim(),
      steps: String(get(['zubereitung', 'steps', 'anleitung']) || '').trim()
    };
  }

  function csvToRecipes(text) {
    const rows = parseCSV(text);
    if (!rows.length) return [];
    const headers = rows[0];
    const out = [];
    for (let i = 1; i < rows.length; i += 1) {
      const r = rowToRecipe(headers, rows[i]);
      if (r) out.push(r);
    }
    return out;
  }

  async function unzipXLSX(buffer) {
    const bytes = new Uint8Array(buffer);
    const files = {};
    let i = 0;
    while (i < bytes.length - 4) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
        const view = new DataView(bytes.buffer, i);
        const method = view.getUint16(8, true);
        const csize = view.getUint32(18, true);
        const fnlen = view.getUint16(26, true);
        const exlen = view.getUint16(28, true);
        const name = new TextDecoder().decode(bytes.slice(i + 30, i + 30 + fnlen));
        const dataStart = i + 30 + fnlen + exlen;
        const cdata = bytes.slice(dataStart, dataStart + csize);
        let data;
        if (method === 0) {
          data = cdata;
        } else if (method === 8) {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(cdata);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks = [];
          while (true) {
            const res = await reader.read();
            if (res.done) break;
            chunks.push(res.value);
          }
          const total = chunks.reduce((s, c) => s + c.length, 0);
          const out = new Uint8Array(total);
          let off = 0;
          chunks.forEach((c) => { out.set(c, off); off += c.length; });
          data = out;
        } else {
          throw new Error('Nicht unterstützte Komprimierung.');
        }
        files[name] = data;
        i = dataStart + csize;
      } else {
        i += 1;
      }
    }
    return files;
  }

  async function xlsxToRecipes(buffer) {
    const files = await unzipXLSX(buffer);
    let shared = [];
    if (files['xl/sharedStrings.xml']) {
      const xml = new TextDecoder().decode(files['xl/sharedStrings.xml']);
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      shared = Array.from(doc.getElementsByTagName('si')).map((si) =>
        Array.from(si.getElementsByTagName('t')).map((t) => t.textContent).join('')
      );
    }
    const sheetNames = Object.keys(files).filter((n) => n.startsWith('xl/worksheets/sheet') && n.endsWith('.xml'));
    if (!sheetNames.length) throw new Error('Kein Arbeitsblatt gefunden.');

    // Alle Blätter auswerten und das mit den meisten Datenzeilen verwenden.
    let bestRows = null;
    for (const sn of sheetNames) {
      try {
        const xml = new TextDecoder().decode(files[sn]);
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const cellMap = {};
        const rowsSet = new Set();
        const colsSet = new Set();
        Array.from(doc.getElementsByTagName('c')).forEach((c) => {
          const ref = c.getAttribute('r');
          if (!ref) return;
          const col = ref.replace(/[0-9]/g, '');
          const row = parseInt(ref.replace(/[^0-9]/g, ''), 10);
          if (!row) return;
          rowsSet.add(row);
          colsSet.add(col);
          let value = '';
          const t = c.getAttribute('t');
          if (t === 's') {
            const v = c.getElementsByTagName('v')[0]?.textContent;
            value = shared[Number(v)] || '';
          } else if (t === 'inlineStr') {
            value = c.getElementsByTagName('t')[0]?.textContent || '';
          } else if (t === 'str') {
            value = c.getElementsByTagName('v')[0]?.textContent || '';
          } else {
            value = c.getElementsByTagName('v')[0]?.textContent || '';
          }
          (cellMap[row] = cellMap[row] || {})[col] = value;
        });
        const colIndex = (col) => {
          let idx = 0;
          for (let i = 0; i < col.length; i += 1) idx = idx * 26 + (col.charCodeAt(i) - 64);
          return idx - 1;
        };
        const sortedRows = Array.from(rowsSet).sort((a, b) => a - b);
        const allCols = Array.from(colsSet).sort((a, b) => colIndex(a) - colIndex(b));
        const rows = sortedRows.map((r) => allCols.map((col) => (cellMap[r] && cellMap[r][col]) || ''));
        if (!bestRows || rows.length > bestRows.length) bestRows = rows;
      } catch (e) { /* ignore broken sheet */ }
    }
    if (!bestRows || !bestRows.length) throw new Error('Kein Arbeitsblatt gefunden.');
    const rows = bestRows;
    if (!rows.length) return [];
    const headers = rows[0];
    const out = [];
    for (let i = 1; i < rows.length; i += 1) {
      const recipe = rowToRecipe(headers, rows[i]);
      if (recipe) out.push(recipe);
    }
    return out;
  }

  /* ---------- Rezepte importieren (JSON / CSV / Excel) ---------- */

  function openImportRecipes() {
    const body =
      '<p class="muted small-text">Rezepte aus <strong>JSON</strong>, <strong>CSV</strong> oder <strong>Excel (.xlsx)</strong> importieren. ' +
        'JSON: <code>{"recipes":[{"name":"...","macros":{"kcal":0,"protein":0,"carbs":0,"fat":0},"servings":1,"category":"...","ingredients":"...","steps":"..."}]}</code> oder ein Array. ' +
        'CSV/Excel: Spalten wie <code>Name, Kategorie, Portionen, kcal, Protein, Kohlenhydrate, Fett, Zutaten, Zubereitung</code>.</p>' +
      '<div class="settings-actions">' +
        '<button type="button" class="btn ghost" id="pickRecipeFile">Datei wählen</button>' +
        '<input type="file" id="recipeFile" accept=".json,.csv,.xlsx,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>' +
      '</div>' +
      '<textarea class="input" id="recipeImportText" rows="9" placeholder="[{ &quot;name&quot;: &quot;Haferbrei&quot;, &quot;macros&quot;: { &quot;kcal&quot;: 350, &quot;protein&quot;: 12, &quot;carbs&quot;: 55, &quot;fat&quot;: 8 } }]"></textarea>' +
      '<p class="muted small-text" id="recipeImportInfo"></p>';

    UI.openModal({
      title: 'Rezepte importieren',
      body,
      wide: true,
      submitLabel: 'Importieren',
      onMount(form) {
        const fileInput = form.querySelector('#recipeFile');
        const pickBtn = form.querySelector('#pickRecipeFile');
        const text = form.querySelector('#recipeImportText');
        const info = form.querySelector('#recipeImportInfo');

        const updateInfo = () => {
          const raw = text.value.trim();
          if (!raw) { info.textContent = ''; return; }
          try {
            let data = JSON.parse(raw);
            if (Array.isArray(data)) data = { recipes: data };
            const list = Array.isArray(data.recipes) ? data.recipes : [];
            const valid = list.filter((r) => r && String(r.name || '').trim()).length;
            info.textContent = list.length + (list.length === 1 ? ' Eintrag' : ' Einträge') + ' gefunden, davon ' + valid + ' gültig.';
            info.style.color = valid > 0 ? 'var(--muted)' : 'var(--danger)';
          } catch (e) {
            info.textContent = 'Ungültiges JSON: ' + (e.message || '');
            info.style.color = 'var(--danger)';
          }
        };
        text.addEventListener('input', updateInfo);

        pickBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
          const file = fileInput.files && fileInput.files[0];
          fileInput.value = '';
          if (!file) return;
          const name = (file.name || '').toLowerCase();
          if (name.endsWith('.xlsx')) {
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const recipes = await xlsxToRecipes(reader.result);
                text.value = JSON.stringify(recipes, null, 2);
              } catch (e) {
                text.value = '';
                UI.toast('Excel konnte nicht gelesen werden: ' + (e.message || ''), 'error');
              }
              updateInfo();
            };
            reader.readAsArrayBuffer(file);
          } else if (name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                text.value = JSON.stringify(csvToRecipes(String(reader.result || '')), null, 2);
              } catch (e) {
                text.value = String(reader.result || '');
                UI.toast('CSV-Fehler: ' + (e.message || ''), 'error');
              }
              updateInfo();
            };
            reader.readAsText(file);
          } else {
            const reader = new FileReader();
            reader.onload = () => { text.value = String(reader.result || ''); updateInfo(); };
            reader.readAsText(file);
          }
        });
      },
      onSubmit(form) {
        const raw = form.querySelector('#recipeImportText').value.trim();
        if (!raw) throw new Error('Bitte JSON einfügen oder eine Datei wählen.');
        let data;
        try { data = JSON.parse(raw); } catch (e) { throw new Error('Ungültiges JSON: ' + (e.message || '')); }
        if (Array.isArray(data)) data = { recipes: data };
        if (!data || !Array.isArray(data.recipes)) throw new Error('Erwartet wird ein Objekt mit "recipes" oder ein Array.');
        let count = 0;
        data.recipes.forEach((r) => {
          if (!r || !String(r.name || '').trim()) return;
          const m = r.macros || {};
          S.saveRecipe({
            name: String(r.name).trim(),
            category: String(r.category || 'Importiert').trim() || 'Importiert',
            servings: Math.max(0.5, Number(r.servings) || 1),
            macros: {
              kcal: Math.round(Number(m.kcal) || 0),
              protein: U.round1(Number(m.protein) || 0),
              carbs: U.round1(Number(m.carbs) || 0),
              fat: U.round1(Number(m.fat) || 0)
            },
            ingredients: String(r.ingredients || '').trim(),
            steps: String(r.steps || '').trim()
          });
          count += 1;
        });
        if (!count) throw new Error('Keine gültigen Rezepte gefunden.');
        UI.toast(count + (count === 1 ? ' Rezept' : ' Rezepte') + ' importiert');
        UI.closeModal();
        FIT.app.rerender();
      }
    });
  }

  return { render, openEditor, openImport, openMultiImport, openImportRecipes };
})();
