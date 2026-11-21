/* FitLog Pro – Trainingsplan */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.plans = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  function exerciseRow(ex) {
    ex = ex || {};
    return '<div class="ex-editor-item"' + (ex.id ? ' data-id="' + ex.id + '"' : '') + '>' +
      '<input class="input ex-name" placeholder="Übung" value="' + U.esc(ex.name || '') + '">' +
      '<input class="input ex-sets" type="number" min="1" step="1" placeholder="Sätze" value="' + U.esc(ex.sets == null ? 3 : ex.sets) + '" title="Sätze">' +
      '<input class="input ex-reps" type="number" min="1" step="1" placeholder="Wdh." value="' + U.esc(ex.reps == null ? 8 : ex.reps) + '" title="Wiederholungen">' +
      '<input class="input ex-weight" type="number" min="0" step="0.5" placeholder="kg" value="' + U.esc(ex.weight == null ? 0 : ex.weight) + '" title="Gewicht in kg">' +
      '<button type="button" class="icon-btn danger" data-remove-ex title="Übung entfernen">' + UI.icon('trash') + '</button>' +
    '</div>';
  }

  function planExercises(plan) { return S.planExercises(plan); }

  function planCard(plan) {
    const exs = planExercises(plan);
    const sets = exs.reduce((s, ex) => s + (Number(ex.sets) || 0), 0);
    const target = plan.targetDate ? U.fmtDateLong(plan.targetDate) : null;
    const daysLeft = plan.targetDate ? U.diffDays(plan.targetDate, U.todayISO()) : null;
    return '<section class="card plan-card">' +
      '<div class="card-head">' +
        '<div><h2>' + U.esc(plan.name || 'Trainingsplan') + '</h2><p class="muted">' + U.esc(plan.description || (exs.length + (exs.length === 1 ? ' Übung' : ' Übungen'))) + '</p></div>' +
        '<div class="card-actions">' +
          '<button class="icon-btn" data-edit-plan="' + plan.id + '" title="Plan bearbeiten">' + UI.icon('edit') + '</button>' +
          '<button class="icon-btn danger" data-del-plan="' + plan.id + '" title="Plan löschen">' + UI.icon('trash') + '</button>' +
        '</div>' +
      '</div>' +
      (target ? '<div class="plan-target"><span class="muted small-text">Zieldatum</span><strong>' + U.esc(target) + '</strong>' +
        (daysLeft != null ? '<span class="muted small-text">' + (daysLeft >= 0 ? ('noch ' + daysLeft + (daysLeft === 1 ? ' Tag' : ' Tage')) : 'abgelaufen') + '</span>' : '') + '</div>' : '') +
      (exs.length ? '<div class="plan-ex-list">' + exs.map((ex) =>
        '<div class="plan-ex"><span>' + U.esc(ex.name) + '</span><em>' + U.fmtNum(ex.sets) + ' × ' + U.fmtNum(ex.reps) + (Number(ex.weight) ? ' · ' + U.fmtNum(ex.weight) + ' kg' : '') + '</em></div>'
      ).join('') + '</div>' : '<p class="muted small-text">Noch keine Übungen – Plan bearbeiten.</p>') +
      '<div class="plan-foot">' +
        '<button class="btn primary" data-start-plan="' + plan.id + '">' + UI.icon('play') + ' Training starten</button>' +
      '</div>' +
    '</section>';
  }

  function render(el) {
    const plans = S.state.plans;
    el.innerHTML =
      '<section class="page-head">' +
        '<div><h1>Trainingsplan</h1><p>Ein Ganzkörperplan, den du über einen festgelegten Zeitraum verfolgst.</p></div>' +
        (plans.length ? '' : '<div class="head-actions"><button class="btn primary" id="newPlan">' + UI.icon('plus') + ' Neuer Plan</button></div>') +
      '</section>' +
      (plans.length ?
        '<div class="plans-grid">' + plans.map(planCard).join('') + '</div>'
        : UI.emptyState('🗂️', 'Noch kein Trainingsplan', 'Erstelle einen Ganzkörperplan mit Übungen und einem Zieldatum. Du kannst auch eine fertige Vorlage laden.',
          '<div class="row gap center"><button class="btn primary" id="emptyNewPlan">' + UI.icon('plus') + ' Plan erstellen</button>' +
          '<button class="btn ghost" id="loadExample">Beispielplan laden</button></div>'));

    el.querySelector('#newPlan')?.addEventListener('click', () => openEditor());
    el.querySelector('#emptyNewPlan')?.addEventListener('click', () => openEditor());
    el.querySelector('#loadExample')?.addEventListener('click', () => {
      if (S.state.plans.length) { UI.toast('Es ist bereits ein Trainingsplan vorhanden.', 'error'); return; }
      loadExample();
    });

    el.querySelectorAll('[data-edit-plan]').forEach((b) => b.addEventListener('click', () => openEditor(S.plan(b.dataset.editPlan))));
    el.querySelectorAll('[data-del-plan]').forEach((b) => {
      b.addEventListener('click', async () => {
        const p = S.plan(b.dataset.delPlan);
        if (!p) return;
        const ok = await UI.confirm({ title: 'Plan löschen', message: '„' + p.name + '“ wird gelöscht. Bereits geloggte Trainings bleiben erhalten.' });
        if (ok) {
          S.deletePlan(p.id);
          UI.toast('Plan gelöscht');
          FIT.app.rerender();
        }
      });
    });
    el.querySelectorAll('[data-start-plan]').forEach((b) => {
      b.addEventListener('click', () => {
        const plan = S.plan(b.dataset.startPlan);
        if (!plan) return;
        FIT.views.training.startWorkout({
          name: plan.name,
          planId: plan.id,
          exercises: planExercises(plan).map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight }))
        });
      });
    });
  }

  function openEditor(plan) {
    const exs = plan ? planExercises(plan) : [];
    const exercises = exs.length ? exs : [{ name: '', sets: 3, reps: 8, weight: 0 }];
    const targetDate = plan && plan.targetDate ? plan.targetDate : '';
    const body =
      '<div class="form-grid two">' +
        UI.field('Plan-Name', UI.input('name', 'text', plan ? plan.name : '', 'required maxlength="60" placeholder="z. B. Ganzkörperplan"')) +
        UI.field('Beschreibung (optional)', UI.input('description', 'text', plan ? plan.description : '', 'maxlength="120" placeholder="z. B. 3× pro Woche"')) +
      '</div>' +
      '<div class="form-grid two">' +
        UI.field('Zieldatum', UI.input('targetDate', 'date', targetDate, '')) +
        UI.field('Hinweis', '<span class="muted small-text">Bis zu diesem Datum soll der Plan verfolgt werden.</span>') +
      '</div>' +
      '<div class="section-label">Übungen</div>' +
      '<div class="ex-editor-head muted small-text"><span>Übung</span><span>Sätze</span><span>Wdh.</span><span>kg</span><span></span></div>' +
      '<div class="ex-editor-list" id="planEx">' + exercises.map(exerciseRow).join('') + '</div>' +
      '<button type="button" class="btn ghost small" id="addPlanEx">' + UI.icon('plus') + ' Übung</button>';

    UI.openModal({
      title: plan ? 'Plan bearbeiten' : 'Neuer Trainingsplan',
      body,
      wide: true,
      submitLabel: plan ? 'Aktualisieren' : 'Plan speichern',
      onMount(form) {
        const list = form.querySelector('#planEx');
        form.addEventListener('click', (e) => {
          if (e.target.closest('#addPlanEx')) {
            list.insertAdjacentHTML('beforeend', exerciseRow());
            FIT.exerciseDB.attachAll(form);
            return;
          }
          const rm = e.target.closest('[data-remove-ex]');
          if (rm) {
            rm.closest('.ex-editor-item').remove();
            if (!list.children.length) list.insertAdjacentHTML('beforeend', exerciseRow());
            FIT.exerciseDB.attachAll(form);
          }
        });
        FIT.exerciseDB.attachAll(form);
      },
      onSubmit(form) {
        if (!plan && S.state.plans.length >= 1) {
          UI.toast('Es ist bereits ein Trainingsplan vorhanden. Bitte den bestehenden Plan bearbeiten oder löschen.', 'error');
          return false;
        }
        const name = String(form.name.value || '').trim();
        if (!name) throw new Error('Bitte einen Plan-Namen angeben.');
        const exs = [];
        form.querySelectorAll('#planEx .ex-editor-item').forEach((row) => {
          const exName = String(row.querySelector('.ex-name').value || '').trim();
          if (!exName) return;
          const num = (sel, def) => {
            const v = Number(String(row.querySelector(sel).value || '').replace(',', '.'));
            return Number.isFinite(v) && v >= 0 ? v : def;
          };
          exs.push({
            id: row.dataset.id || U.uid('ex'),
            name: exName,
            sets: Math.max(1, Math.round(num('.ex-sets', 3))),
            reps: Math.max(1, Math.round(num('.ex-reps', 8))),
            weight: num('.ex-weight', 0)
          });
        });
        if (!exs.length) throw new Error('Bitte mindestens eine Übung eintragen.');
        const data = {
          name,
          description: String(form.description.value || '').trim(),
          targetDate: form.targetDate.value || null,
          exercises: exs
        };
        if (plan) data.id = plan.id;
        S.savePlan(data);
        UI.toast(plan ? 'Plan aktualisiert' : 'Trainingsplan gespeichert');
        FIT.app.rerender();
      }
    });
  }

  function loadExample() {
    if (S.state.plans.length) { UI.toast('Es ist bereits ein Trainingsplan vorhanden.', 'error'); return; }
    const target = U.addDays(U.todayISO(), 56);
    S.savePlan({
      name: 'Ganzkörperplan',
      description: '3× pro Woche · 8 Wochen',
      targetDate: target,
      exercises: [
        { id: U.uid('ex'), name: 'Kniebeugen', sets: 4, reps: 8, weight: 60 },
        { id: U.uid('ex'), name: 'Bankdrücken', sets: 4, reps: 8, weight: 50 },
        { id: U.uid('ex'), name: 'Rudern (Kurzhantel)', sets: 3, reps: 10, weight: 20 },
        { id: U.uid('ex'), name: 'Schulterdrücken', sets: 3, reps: 10, weight: 15 },
        { id: U.uid('ex'), name: 'Rumänisches Kreuzheben', sets: 3, reps: 10, weight: 40 },
        { id: U.uid('ex'), name: 'Plank', sets: 3, reps: 45, weight: 0 }
      ]
    });
    UI.toast('Beispielplan geladen');
    FIT.app.rerender();
  }

  return { render, openEditor, loadExample };
})();
