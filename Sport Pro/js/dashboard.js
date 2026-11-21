/* FitLog Pro – Dashboard */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.dashboard = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  function greeting() {
    const h = new Date().getHours();
    if (h < 11) return 'Guten Morgen';
    if (h < 18) return 'Hallo';
    return 'Guten Abend';
  }

  function counterCard(c) {
    const isValue = c.mode === 'value';
    const isAuto = c.mode === 'auto';
    const streak = S.streak(c.key);
    const total = S.totalDays(c.key);
    const goal = Number(c.goal) || 0;
    const doneToday = S.isChecked(c.key, U.todayISO());
    const dots = S.lastDays(c.key, 14).map((d) => {
      const title = U.fmtDate(d.date, { weekday: true, month: 'short' }) + (d.checked ? ' ✓' : '');
      const today = d.date === U.todayISO() ? ' today' : '';
      return '<span class="dot' + (d.checked ? ' on' : '') + today + '" title="' + U.esc(title) + '"></span>';
    }).join('');

    if (isAuto) {
      const info = S.savedMoney(c.key);
      const pct = goal > 0 ? U.clamp(Math.round((streak / goal) * 100), 0, 100) : 0;
      const moneyLine = info ? (U.fmtNum(info.saved, 2) + ' € gespart') : (c.startDate ? 'Automatisch' : 'Startdatum festlegen');
      return '<article class="card counter-card" data-counter="' + c.key + '">' +
        '<div class="counter-head">' +
          '<span class="counter-emoji">' + U.esc(c.emoji || '🎯') + '</span>' +
          '<div class="counter-titles"><h3>' + U.esc(c.label) + '</h3><p>Ziel ' + U.fmtNum(goal) + ' Tage</p></div>' +
        '</div>' +
        '<div class="counter-value-row"><span class="counter-value">' + U.fmtNum(streak) + '</span><span class="counter-unit">Tage seit Start</span></div>' +
        '<div class="bar slim"><span class="bar-fill accent" style="width:' + pct + '%"></span></div>' +
        '<div class="counter-foot">' +
          '<button class="btn small ' + (c.startDate ? 'ghost' : 'primary') + '" data-edit-counter="' + c.key + '">' + (c.startDate ? 'Anpassen' : 'Startdatum') + '</button>' +
          '<span class="counter-meta">' + U.esc(moneyLine) + '</span>' +
        '</div>' +
      '</article>';
    }

    if (isValue) {
      const target = Number(c.target) || 0;
      const pct = target > 0 ? U.clamp(Math.round((Number(c.value) / target) * 100), 0, 100) : 0;
      return '<article class="card counter-card" data-counter="' + c.key + '">' +
        '<div class="counter-head">' +
          '<span class="counter-emoji">' + U.esc(c.emoji || '🎯') + '</span>' +
          '<div class="counter-titles"><h3>' + U.esc(c.label) + '</h3><p>Ziel ' + U.fmtNum(target) + '</p></div>' +
        '</div>' +
        '<div class="counter-value-row"><span class="counter-value">' + U.fmtNum(c.value) + '</span><span class="counter-unit">aktuell</span></div>' +
        '<div class="bar slim"><span class="bar-fill accent" style="width:' + pct + '%"></span></div>' +
        '<div class="counter-foot">' +
          '<button class="btn small ghost" data-adjust="' + c.key + '" data-delta="-1" aria-label="verringern">' + UI.icon('minus') + '</button>' +
          '<button class="btn small ghost" data-adjust="' + c.key + '" data-delta="1" aria-label="erhöhen">' + UI.icon('plus') + '</button>' +
          '<span class="counter-meta">' + pct + ' %</span>' +
        '</div>' +
      '</article>';
    }

    const pct = goal > 0 ? U.clamp(Math.round((streak / goal) * 100), 0, 100) : 0;
    return '<article class="card counter-card" data-counter="' + c.key + '">' +
      '<div class="counter-head">' +
        '<span class="counter-emoji">' + U.esc(c.emoji || '🔥') + '</span>' +
        '<div class="counter-titles"><h3>' + U.esc(c.label) + '</h3><p>Ziel ' + U.fmtNum(goal) + ' Tage</p></div>' +
      '</div>' +
      '<div class="counter-value-row"><span class="counter-value">' + U.fmtNum(streak) + '</span><span class="counter-unit">Tage in Folge</span></div>' +
      '<div class="dots" aria-hidden="true">' + dots + '</div>' +
      '<div class="counter-foot">' +
        '<button class="btn small ' + (doneToday ? 'done' : 'primary') + '" data-check="' + c.key + '">' +
          (doneToday ? UI.icon('check') + ' Erledigt' : 'Heute abhaken') +
        '</button>' +
        '<span class="counter-meta">Gesamt ' + U.fmtNum(total) + ' · ' + pct + ' %</span>' +
      '</div>' +
    '</article>';
  }

  function render(el) {
    const today = U.todayISO();
    const name = S.state.profile.name ? ', ' + S.state.profile.name : '';
    const goals = S.state.profile.goals;
    const totals = S.dayTotals(today);
    const kcalPct = goals.kcal > 0 ? U.clamp(Math.round((totals.kcal / goals.kcal) * 100), 0, 100) : 0;
    const entries = S.diaryEntries(today);
    const todayWorkouts = S.workoutsOn(today);
    const week = S.lastWeeks(8);

    const macroBar = (label, val, goal, cls) => {
      const pct = goal > 0 ? U.clamp(Math.round((val / goal) * 100), 0, 100) : 0;
      return '<div class="macro-row">' +
        '<div class="macro-row-head"><span>' + U.esc(label) + '</span><span>' + U.fmtNum(val) + ' / ' + U.fmtNum(goal) + ' g</span></div>' +
        '<div class="bar"><span class="bar-fill ' + cls + '" style="width:' + pct + '%"></span></div>' +
      '</div>';
    };

    let trainingBody;
    if (todayWorkouts.length) {
      trainingBody = todayWorkouts.map((w) =>
        '<button class="workout-mini" data-open-workout="' + w.id + '">' +
          '<span class="workout-mini-icon">' + UI.icon('dumbbell') + '</span>' +
          '<span class="workout-mini-main"><strong>' + U.esc(w.name || 'Training') + '</strong>' +
          '<small>' + (Number(w.duration) ? U.fmtNum(w.duration) + ' Min · ' : '') + U.fmtNum(Math.round(S.workoutVolume(w))) + ' kg Volumen</small></span>' +
          UI.icon('chevronRight') +
        '</button>'
      ).join('') + '<button class="btn ghost small full" id="dashAddWorkout">Weiteres Training eintragen</button>';
    } else {
      const plans = S.state.plans.filter((p) => S.planExercises(p).length);
      if (plans.length) {
        trainingBody = '<p class="muted small-text">Heute ist noch kein Training eingetragen.</p>' +
          '<select class="input" id="dashPlanPick">' +
            plans.map((p) => '<option value="' + p.id + '">' + U.esc(p.name) + '</option>').join('') +
          '</select>' +
          '<div class="row gap">' +
            '<button class="btn primary grow" id="dashStartPlan">' + UI.icon('play') + ' Training starten</button>' +
            '<button class="btn ghost" id="dashAddWorkout" title="Leeres Training">' + UI.icon('plus') + '</button>' +
          '</div>';
      } else {
        trainingBody = '<p class="muted small-text">Lege zuerst einen Trainingsplan an – oder trage direkt ein Training ein.</p>' +
          '<div class="row gap"><a class="btn primary" href="#/plans">' + UI.icon('plans') + ' Plan anlegen</a>' +
          '<button class="btn ghost" id="dashAddWorkout">Training eintragen</button></div>';
      }
    }

    el.innerHTML =
      '<section class="page-head dashboard-head">' +
        '<div><h1>' + greeting() + name + ' 👋</h1><p>' + U.esc(U.fmtDateLong(today)) + '</p></div>' +
        '<div class="head-actions">' +
          '<a class="btn ghost" href="#/recipes">' + UI.icon('recipes') + ' Rezepte</a>' +
          '<a class="btn primary" href="#/nutrition">' + UI.icon('plus') + ' Mahlzeit</a>' +
        '</div>' +
      '</section>' +

      '<div class="grid counters-grid dashboard-counters">' + S.counterList().map(counterCard).join('') + '</div>' +

      '<div class="dash-grid dashboard-main">' +
        '<section class="card nutrition-summary">' +
          '<div class="card-head"><div><h2>Ernährung heute</h2><p class="muted">' + (entries.length === 1 ? '1 Eintrag' : U.fmtNum(entries.length) + ' Einträge') + '</p></div>' +
          '<a class="btn ghost small" href="#/nutrition">Tagebuch</a></div>' +
          '<div class="kcal-row">' +
            '<div class="ring" style="--p:' + kcalPct + '"><div class="ring-inner"><strong>' + U.fmtNum(totals.kcal) + '</strong><span>von ' + U.fmtNum(goals.kcal) + ' kcal</span></div></div>' +
            '<div class="kcal-info">' +
              '<div class="kcal-remaining">' + (goals.kcal - totals.kcal >= 0 ? U.fmtNum(goals.kcal - totals.kcal) + ' kcal übrig' : U.fmtNum(totals.kcal - goals.kcal) + ' kcal über Ziel') + '</div>' +
              '<div class="muted small-text">Protein, Kohlenhydrate und Fett im Blick behalten.</div>' +
            '</div>' +
          '</div>' +
          macroBar('Protein', totals.protein, goals.protein, 'protein') +
          macroBar('Kohlenhydrate', totals.carbs, goals.carbs, 'carbs') +
          macroBar('Fett', totals.fat, goals.fat, 'fat') +
        '</section>' +

        '<section class="card dashboard-training">' +
          '<div class="card-head"><div><h2>Training heute</h2><p class="muted">' + (todayWorkouts.length ? 'Erledigt – stark!' : 'Bereit für die nächste Einheit?') + '</p></div>' +
          '<a class="icon-btn" href="#/training" title="Trainingsmodus">' + UI.icon('log') + '</a></div>' +
          '<div class="training-body">' + trainingBody + '</div>' +
        '</section>' +
      '</div>' +

      '<section class="card dashboard-volume">' +
        '<div class="card-head"><div><h2>Wochenvolumen</h2><p class="muted">Letzte 8 Wochen · ' + U.fmtNum(S.workoutsThisWeek()) + ' von ' + U.fmtNum(S.state.profile.weeklyGoal) + ' Trainings diese Woche</p></div>' +
        '<a class="btn ghost small" href="#/training">Details</a></div>' +
        FIT.views.log.chart(week) +
      '</section>';

    el.querySelectorAll('[data-check]').forEach((b) => {
      b.addEventListener('click', () => {
        const changed = S.toggleDay(b.dataset.check, today);
        if (changed) UI.toast('Tag abgehakt – weiter so!');
        FIT.app.rerender();
      });
    });
    el.querySelectorAll('[data-adjust]').forEach((b) => {
      b.addEventListener('click', () => {
        S.adjustValue(b.dataset.adjust, Number(b.dataset.delta));
        FIT.app.rerender();
      });
    });
    el.querySelectorAll('[data-edit-counter]').forEach((b) => {
      b.addEventListener('click', () => FIT.views.counters.openEditor(S.counter(b.dataset.editCounter)));
    });
    el.querySelectorAll('[data-open-workout]').forEach((b) => {
      b.addEventListener('click', () => FIT.views.training.openEditor({ id: b.dataset.openWorkout }));
    });

    const addBtn = el.querySelector('#dashAddWorkout');
    if (addBtn) addBtn.addEventListener('click', () => FIT.views.training.openEditor({}));

    const startBtn = el.querySelector('#dashStartPlan');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const pick = el.querySelector('#dashPlanPick');
        if (!pick) return;
        const plan = S.plan(pick.value);
        if (!plan) return;
        FIT.views.training.startWorkout({
          name: plan.name,
          planId: plan.id,
          exercises: S.planExercises(plan).map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight }))
        });
      });
    }
  }

  return { render };
})();
