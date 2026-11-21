/* Sport Pro – Trainingsmodus (Live-Training + Verlauf) */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.log = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  const ACTIVE_KEY = 'fitness-studio.active-workout';
  let active = null;
  let tickTimer = null;
  let restTimer = null;
  let restRemaining = 0;

  function loadActive() {
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      active = raw ? JSON.parse(raw) : null;
    } catch (e) {
      active = null;
    }
    syncTheme();
  }

  function syncTheme() {
    try { document.body.classList.toggle('workout-active', !!active); } catch (e) {}
  }

  function saveActive() {
    if (active) localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    else localStorage.removeItem(ACTIVE_KEY);
  }

  function clearActive() {
    active = null;
    saveActive();
  }

  function clearTimers() {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    if (restTimer) { clearInterval(restTimer); restTimer = null; }
  }

  function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return (h > 0 ? pad(h) + ':' : '') + pad(m) + ':' + pad(s);
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function uid(prefix) { return U.uid(prefix); }

  function defaultSets(count, reps, weight) {
    const n = Math.max(1, Number(count) || 3);
    return Array.from({ length: n }, () => ({
      reps: Number(reps) || 8,
      weight: Number(weight) || 0,
      done: false
    }));
  }

  function startWorkout(opts) {
    opts = opts || {};
    const exercises = (opts.exercises && opts.exercises.length)
      ? opts.exercises.map((ex) => ({
          id: uid('ex'),
          name: ex.name || '',
          planned: (Number(ex.sets) || 0) + ' × ' + (Number(ex.reps) || 0) +
            (Number(ex.weight) ? ' · ' + U.fmtNum(ex.weight) + ' kg' : ''),
          sets: defaultSets(ex.sets, ex.reps, ex.weight)
        }))
      : [{ id: uid('ex'), name: '', planned: '', sets: defaultSets(3, 8, 0) }];

    active = {
      id: uid('aw'),
      name: opts.name || 'Freies Training',
      planId: opts.planId || null,
      dayId: opts.dayId || null,
      startedAt: Date.now(),
      exercises: exercises,
      notes: ''
    };
    restRemaining = 0;
    saveActive();
    syncTheme();
    if (location.hash !== '#/training') location.hash = '#/training';
    setTimeout(() => {
      const el = document.getElementById('view');
      if (el && active) renderActive(el);
    }, 0);
  }

  function clearActiveAndSave() {
    active = null;
    restRemaining = 0;
    clearTimers();
    saveActive();
    syncTheme();
  }

  function cancelWorkout() {
    UI.confirm({
      title: 'Training abbrechen?',
      message: 'Das laufende Training wird verworfen und nicht gespeichert.',
      confirmLabel: 'Verwerfen'
    }).then((ok) => {
      if (ok) {
        clearActiveAndSave();
        FIT.app.rerender();
      }
    });
  }

  function addExercise() {
    if (!active) return;
    active.exercises.push({ id: uid('ex'), name: '', planned: '', sets: defaultSets(3, 8, 0) });
    saveActive();
    renderActiveView();
  }

  function removeExercise(exId) {
    if (!active || active.exercises.length <= 1) {
      UI.toast('Mindestens eine Übung ist nötig.', 'error');
      return;
    }
    active.exercises = active.exercises.filter((ex) => ex.id !== exId);
    saveActive();
    renderActiveView();
  }

  function addSet(exId) {
    const ex = active.exercises.find((e) => e.id === exId);
    if (!ex) return;
    const last = ex.sets[ex.sets.length - 1] || { reps: 8, weight: 0 };
    ex.sets.push({ reps: last.reps, weight: last.weight, done: false });
    saveActive();
    renderActiveView();
  }

  function removeLastSet(exId) {
    const ex = active.exercises.find((e) => e.id === exId);
    if (!ex || ex.sets.length <= 1) return;
    ex.sets.pop();
    saveActive();
    renderActiveView();
  }

  function toggleSet(exId, idx) {
    const ex = active.exercises.find((e) => e.id === exId);
    if (!ex || !ex.sets[idx]) return;
    ex.sets[idx].done = !ex.sets[idx].done;
    saveActive();
    if (ex.sets[idx].done) {
      renderActiveView();
      startRest(90);
    } else {
      renderActiveView();
    }
  }

  function startRest(seconds) {
    restRemaining = Math.max(0, Number(seconds) || 0);
    if (restTimer) clearInterval(restTimer);
    const bar = document.getElementById('restBar');
    if (bar) bar.hidden = restRemaining <= 0;
    const rem = document.getElementById('restRemaining');
    if (rem) rem.textContent = formatTime(restRemaining);
    if (restRemaining <= 0) return;
    restTimer = setInterval(() => {
      restRemaining -= 1;
      const rEl = document.getElementById('restRemaining');
      if (rEl) rEl.textContent = formatTime(restRemaining);
      if (restRemaining <= 0) {
        clearInterval(restTimer);
        restTimer = null;
        const b = document.getElementById('restBar');
        if (b) b.hidden = true;
      }
    }, 1000);
  }

  function skipRest() {
    restRemaining = 0;
    if (restTimer) { clearInterval(restTimer); restTimer = null; }
    const bar = document.getElementById('restBar');
    if (bar) bar.hidden = true;
  }

  function finishWorkout() {
    if (!active) return;
    const exercises = active.exercises.map((ex) => {
      const name = (ex.name || '').trim();
      if (!name) return null;
      const sets = ex.sets
        .filter((s) => (Number(s.reps) || 0) > 0 || s.done)
        .map((s) => ({ reps: Math.max(0, Number(s.reps) || 0), weight: Math.max(0, Number(s.weight) || 0) }))
        .filter((s) => s.reps > 0);
      if (!sets.length) return null;
      return { id: ex.id, name: name, sets };
    }).filter(Boolean);

    if (!exercises.length) {
      UI.toast('Bitte mindestens einen Satz mit Wiederholungen erfassen.', 'error');
      return;
    }

    const duration = Math.max(1, Math.round((Date.now() - active.startedAt) / 60000));
    S.saveWorkout({
      name: active.name,
      date: U.todayISO(),
      duration: duration,
      notes: (active.notes || '').trim(),
      exercises: exercises,
      planId: active.planId,
      dayId: active.dayId
    });

    clearActiveAndSave();
    UI.toast('Training gespeichert – stark!');
    FIT.app.rerender();
  }

  function openExerciseVideo(name) {
    const q = encodeURIComponent(String(name || '') + ' Ausführung Übung');
    const src = 'https://www.youtube.com/embed?listType=search&list=' + q;
    UI.openModal({
      title: (name || 'Übung') + ' – Video',
      body: '<div class="video-wrap"><iframe src="' + U.esc(src) + '" title="' + U.esc(name) + '" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
        '<p class="muted small-text" style="margin-top:10px">Videos von YouTube. Internetverbindung erforderlich.</p>',
      wide: true,
      submitLabel: 'Schließen',
      onSubmit() {}
    });
  }

  function renderActiveView() {
    const el = document.getElementById('view');
    if (el) renderActive(el);
  }

  function renderActive(el) {
    clearTimers();
    const elapsed = formatElapsed(Date.now() - active.startedAt);
    const restHidden = restRemaining <= 0 ? 'hidden' : '';

    el.innerHTML =
      '<section class="live-workout">' +
        '<div class="live-head">' +
          '<div><h1>' + U.esc(active.name) + '</h1>' +
          '<p class="muted">Gestartet ' + U.esc(U.fmtDate(U.toISO(new Date(active.startedAt)), { weekday: true, month: 'short' })) +
          ' · Dauer <span id="elapsedTime">' + elapsed + '</span></p></div>' +
          '<div class="live-actions">' +
            '<button class="btn ghost" id="cancelWorkout">Abbrechen</button>' +
            '<button class="btn primary" id="finishWorkout">Training beenden</button>' +
          '</div>' +
        '</div>' +
        '<div id="restBar" class="rest-bar" ' + restHidden + '>' +
          '<span>Pause</span><strong id="restRemaining">' + formatTime(restRemaining) + '</strong>' +
          '<button class="btn small ghost" id="skipRest">Überspringen</button>' +
        '</div>' +
        '<div class="live-exercises">' +
          active.exercises.map((ex) => {
            return '<section class="card live-exercise" data-ex="' + ex.id + '">' +
              '<div class="live-ex-head">' +
                '<input class="input ex-name" value="' + U.esc(ex.name) + '" placeholder="Übung wählen oder eingeben" autocomplete="off">' +
                (active.exercises.length > 1
                  ? '<button class="icon-btn danger" data-remove-ex="' + ex.id + '" title="Übung entfernen">' + UI.icon('trash') + '</button>'
                  : '') +
              '</div>' +
              (ex.planned ? '<p class="muted small-text">Geplant: ' + U.esc(ex.planned) + '</p>' : '') +
              '<div class="set-table-head"><span>#</span><span>kg</span><span>Wdh.</span><span></span></div>' +
              '<div class="set-list">' +
                ex.sets.map((set, si) => {
                  return '<div class="set-row ' + (set.done ? 'done' : '') + '" data-ex="' + ex.id + '" data-set="' + si + '">' +
                    '<span class="set-index">' + (si + 1) + '</span>' +
                    '<input class="input set-weight" type="number" min="0" step="0.5" value="' + U.esc(set.weight) + '" data-field="weight" placeholder="kg">' +
                    '<input class="input set-reps" type="number" min="0" step="1" value="' + U.esc(set.reps) + '" data-field="reps" placeholder="Wdh.">' +
                    '<button class="set-check ' + (set.done ? 'done' : '') + '" data-toggle="' + ex.id + '|' + si + '" aria-label="Satz abhaken">' + UI.icon('check') + '</button>' +
                  '</div>';
                }).join('') +
              '</div>' +
              '<div class="live-ex-foot">' +
                '<button class="btn ghost small" data-add-set="' + ex.id + '">' + UI.icon('plus') + ' Satz</button>' +
                (ex.sets.length > 1 ? '<button class="btn ghost small" data-remove-last="' + ex.id + '">Satz entfernen</button>' : '') +
                (ex.name ? '<button type="button" class="btn ghost small" data-video="' + U.esc(ex.name) + '">' + UI.icon('play') + ' Video</button>' : '') +
              '</div>' +
            '</section>';
          }).join('') +
        '</div>' +
        '<button class="btn ghost small" id="addExercise">' + UI.icon('plus') + ' Übung hinzufügen</button>' +
        '<label class="field"><span class="field-label">Notizen</span>' +
          '<textarea class="input" id="liveNotes" rows="2" placeholder="Gefühl, Besonderheiten …">' + U.esc(active.notes) + '</textarea>' +
        '</label>' +
      '</section>';

    FIT.exerciseDB.attachAll(el);

    el.querySelector('#finishWorkout').addEventListener('click', finishWorkout);
    el.querySelector('#cancelWorkout').addEventListener('click', cancelWorkout);
    el.querySelector('#addExercise').addEventListener('click', addExercise);
    const skip = el.querySelector('#skipRest');
    if (skip) skip.addEventListener('click', skipRest);

    el.querySelectorAll('[data-add-set]').forEach((b) => {
      b.addEventListener('click', () => addSet(b.dataset.addSet));
    });
    el.querySelectorAll('[data-video]').forEach((b) => {
      b.addEventListener('click', () => openExerciseVideo(b.dataset.video));
    });
    el.querySelectorAll('[data-remove-last]').forEach((b) => {
      b.addEventListener('click', () => removeLastSet(b.dataset.removeLast));
    });
    el.querySelectorAll('[data-remove-ex]').forEach((b) => {
      b.addEventListener('click', () => removeExercise(b.dataset.removeEx));
    });
    el.querySelectorAll('[data-toggle]').forEach((b) => {
      b.addEventListener('click', () => {
        const parts = b.dataset.toggle.split('|');
        toggleSet(parts[0], Number(parts[1]));
      });
    });

    el.querySelectorAll('.set-row').forEach((row) => {
      const exId = row.dataset.ex;
      const si = Number(row.dataset.set);
      const ex = active.exercises.find((e) => e.id === exId);
      if (!ex) return;
      row.querySelectorAll('input[data-field]').forEach((inp) => {
        inp.addEventListener('input', () => {
          const set = ex.sets[si];
          if (!set) return;
          set[inp.dataset.field] = inp.value;
          saveActive();
        });
      });
    });

    el.querySelectorAll('.live-exercise input.ex-name').forEach((inp) => {
      inp.addEventListener('input', () => {
        const card = inp.closest('.live-exercise');
        const ex = active.exercises.find((e) => e.id === card.dataset.ex);
        if (ex) { ex.name = inp.value; saveActive(); }
      });
    });

    const notes = el.querySelector('#liveNotes');
    if (notes) notes.addEventListener('input', () => { active.notes = notes.value; saveActive(); });

    tickTimer = setInterval(() => {
      const t = document.getElementById('elapsedTime');
      if (t) t.textContent = formatElapsed(Date.now() - active.startedAt);
    }, 1000);

    if (restRemaining > 0) {
      const bar = document.getElementById('restBar');
      if (bar) bar.hidden = false;
      const rem = document.getElementById('restRemaining');
      if (rem) rem.textContent = formatTime(restRemaining);
      restTimer = setInterval(() => {
        restRemaining -= 1;
        const rEl = document.getElementById('restRemaining');
        if (rEl) rEl.textContent = formatTime(restRemaining);
        if (restRemaining <= 0) {
          clearInterval(restTimer);
          restTimer = null;
          const b = document.getElementById('restBar');
          if (b) b.hidden = true;
        }
      }, 1000);
    }
  }

  function setVolume(set) {
    return (Number(set && set.reps) || 0) * (Number(set && set.weight) || 0);
  }

  function exerciseVolumeText(ex) {
    const sets = Array.isArray(ex.sets) && ex.sets.length && typeof ex.sets[0] === 'object' ? ex.sets : null;
    if (!sets) {
      return U.fmtNum(ex.sets || 0) + ' × ' + U.fmtNum(ex.reps || 0) +
        (Number(ex.weight) ? ' · ' + U.fmtNum(ex.weight) + ' kg' : '');
    }
    const allSame = sets.every((s) => s.reps === sets[0].reps && s.weight === sets[0].weight);
    if (allSame) {
      return sets.length + ' × ' + U.fmtNum(sets[0].reps) +
        (Number(sets[0].weight) ? ' · ' + U.fmtNum(sets[0].weight) + ' kg' : '');
    }
    return sets.map((s) => U.fmtNum(s.reps) + '×' + U.fmtNum(s.weight)).join(', ') +
      (sets.some((s) => Number(s.weight) > 0) ? ' kg' : '');
  }

  function workoutCard(w) {
    const vol = S.workoutVolume(w);
    const exs = w.exercises || [];
    const d = U.parseISO(w.date);
    return '<article class="card workout-card">' +
      '<div class="workout-date"><strong>' + d.getDate() + '</strong><span>' + U.esc(new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(d).replace('.', '')) + '</span></div>' +
      '<div class="workout-content">' +
        '<div class="workout-head">' +
          '<div><h3>' + U.esc(w.name || 'Training') + '</h3>' +
          '<p class="muted small-text">' + U.esc(U.fmtDate(w.date, { weekday: true, month: 'short', year: true })) +
          (Number(w.duration) ? ' · ' + U.fmtNum(w.duration) + ' Min' : '') +
          ' · ' + U.fmtNum(Math.round(vol)) + ' kg Volumen</p></div>' +
          '<div class="card-actions">' +
            '<button class="icon-btn" data-edit-workout="' + w.id + '" title="Bearbeiten">' + UI.icon('edit') + '</button>' +
            '<button class="icon-btn danger" data-del-workout="' + w.id + '" title="Löschen">' + UI.icon('trash') + '</button>' +
          '</div>' +
        '</div>' +
        (exs.length ? '<div class="workout-ex-list">' + exs.map((ex) =>
          '<div class="workout-ex"><span class="workout-ex-name">' + U.esc(ex.name) + '</span>' +
          '<span class="workout-ex-data">' + U.esc(exerciseVolumeText(ex)) + '</span></div>'
        ).join('') + '</div>' : '') +
        (w.notes ? '<p class="workout-notes">' + U.esc(w.notes) + '</p>' : '') +
      '</div>' +
    '</article>';
  }

  function chart(weeks) {
    const max = Math.max(1, ...weeks.map((w) => w.volume));
    const cols = weeks.map((w, i) => {
      const pct = w.volume > 0 ? Math.max(3, Math.round((w.volume / max) * 100)) : 0;
      const d = U.parseISO(w.start);
      const label = i === weeks.length - 1 ? 'Diese' : d.getDate() + '.' + (d.getMonth() + 1) + '.';
      const tip = 'Woche ab ' + U.fmtDate(w.start, { month: 'short' }) + ': ' + U.fmtNum(Math.round(w.volume)) + ' kg Volumen · ' + w.count + (w.count === 1 ? ' Training' : ' Trainings');
      return '<div class="chart-col" title="' + U.esc(tip) + '">' +
        '<div class="chart-bar-wrap"><div class="chart-bar' + (i === weeks.length - 1 ? ' current' : '') + '" style="height:' + pct + '%"></div></div>' +
        '<span class="chart-label">' + U.esc(label) + '</span>' +
      '</div>';
    }).join('');
    return '<div class="chart">' + cols + '</div>';
  }

  function render(el) {
    clearTimers();
    if (active) { renderActive(el); return; }

    const workouts = S.sortedWorkouts();
    const week = S.lastWeeks(8);
    const totalVol = S.totalVolume();
    const goal = Number(S.state.profile.weeklyGoal) || 0;
    const thisWeek = S.workoutsThisWeek();
    const withDuration = workouts.filter((w) => Number(w.duration) > 0);
    const avgDuration = withDuration.length ? Math.round(withDuration.reduce((s, w) => s + Number(w.duration), 0) / withDuration.length) : 0;

    const plans = S.state.plans.filter((p) => S.planExercises(p).length);

    let startBody;
    if (plans.length) {
      const plan = plans[0];
      startBody =
        '<p class="muted small-text">Startet deinen Ganzkörperplan in Echtzeit. Gewichte und Wiederholungen werden Satz für Satz erfasst.</p>' +
        '<div class="plan-preview">' +
          '<strong>' + U.esc(plan.name) + '</strong>' +
          '<span class="muted small-text">' + U.fmtNum(S.planExercises(plan).length) + ' Übungen' +
            (plan.targetDate ? ' · Zieldatum ' + U.esc(U.fmtDate(plan.targetDate, { day: 'numeric', month: 'short', year: true })) : '') + '</span>' +
        '</div>' +
        '<button class="btn primary full" id="startPlan">' + UI.icon('play') + ' Training starten</button>';
    } else {
      startBody =
        UI.emptyState('🗂️', 'Noch kein Trainingsplan', 'Lege zuerst einen Ganzkörperplan an. Danach kannst du ihn hier mit einem Klick starten.',
          '<div class="row gap center"><a class="btn primary" href="#/plans">' + UI.icon('plus') + ' Plan erstellen</a>' +
          '<button class="btn ghost" id="manualEntry2">' + UI.icon('edit') + ' Manuell eintragen</button></div>');
    }

    FIT.app.setPageActions('<button class="btn ghost small" id="manualEntry">' + UI.icon('edit') + ' Manuell</button>');
    el.innerHTML =

      '<section class="card live-start">' +
        '<div class="card-head"><div><h2>Training starten</h2><p class="muted">Gewichte und Wiederholungen werden Satz für Satz erfasst.</p></div></div>' +
        startBody +
      '</section>' +

      '<div class="grid stats-grid">' +
        '<div class="card stat-card"><span class="stat-icon">' + UI.icon('dumbbell') + '</span><div><strong>' + U.fmtNum(workouts.length) + '</strong><span>' + (workouts.length === 1 ? 'Training gesamt' : 'Trainings gesamt') + '</span></div></div>' +
        '<div class="card stat-card"><span class="stat-icon">' + UI.icon('calendar') + '</span><div><strong>' + thisWeek + ' / ' + U.fmtNum(goal) + '</strong><span>diese Woche</span></div></div>' +
        '<div class="card stat-card"><span class="stat-icon">' + UI.icon('flame') + '</span><div><strong>' + U.fmtNum(Math.round(totalVol / 1000), 1) + ' t</strong><span>Gesamtvolumen</span></div></div>' +
        '<div class="card stat-card"><span class="stat-icon">' + UI.icon('clock') + '</span><div><strong>' + U.fmtNum(avgDuration) + ' Min</strong><span>Ø Dauer</span></div></div>' +
      '</div>' +

      '<section class="card">' +
        '<div class="card-head"><div><h2>Wochenvolumen</h2><p class="muted">Sätze × Wiederholungen × Gewicht · letzte 8 Wochen</p></div></div>' +
        chart(week) +
      '</section>' +

      '<section class="log-section">' +
        '<div class="section-head"><h2>Verlauf</h2><span class="muted small-text">' + (workouts.length === 1 ? '1 Eintrag' : workouts.length + ' Einträge') + '</span></div>' +
        (workouts.length ? '<div class="workout-list">' + workouts.map(workoutCard).join('') + '</div>'
          : UI.emptyState('📝', 'Noch kein Training geloggt', 'Starte dein erstes Live-Training oder trage eine Einheit manuell ein.',
            '<div class="row gap center"><button class="btn primary" id="emptyStart">' + UI.icon('play') + ' Erstes Training</button>' +
            '<a class="btn ghost" href="#/plans">Zu den Plänen</a></div>')) +
      '</section>';

    document.getElementById('manualEntry')?.addEventListener('click', () => openEditor({}));
    el.querySelector('#emptyStart')?.addEventListener('click', () => startWorkout({}));

    const startPlan = el.querySelector('#startPlan');
    if (startPlan) {
      startPlan.addEventListener('click', () => {
        const plans = S.state.plans.filter((p) => S.planExercises(p).length);
        if (!plans.length) { UI.toast('Bitte zuerst einen Trainingsplan anlegen.', 'error'); return; }
        const plan = plans[0];
        startWorkout({
          name: plan.name,
          planId: plan.id,
          exercises: S.planExercises(plan).map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight }))
        });
      });
    }
    const manualEntry2 = el.querySelector('#manualEntry2');
    if (manualEntry2) manualEntry2.addEventListener('click', () => openEditor({}));

    el.querySelectorAll('[data-edit-workout]').forEach((b) => b.addEventListener('click', () => openEditor({ id: b.dataset.editWorkout })));
    el.querySelectorAll('[data-del-workout]').forEach((b) => {
      b.addEventListener('click', async () => {
        const w = S.workout(b.dataset.delWorkout);
        if (!w) return;
        const ok = await UI.confirm({ title: 'Training löschen', message: 'Der Eintrag „' + (w.name || 'Training') + '“ vom ' + U.fmtDate(w.date, { month: 'short', year: true }) + ' wird entfernt.' });
        if (ok) {
          S.deleteWorkout(w.id);
          UI.toast('Training gelöscht');
          FIT.app.rerender();
        }
      });
    });
  }

  function openEditor(opts) {
    opts = opts || {};
    const existing = opts.id ? S.workout(opts.id) : null;
    const base = existing || {};
    const exercises = existing ? (existing.exercises || []) : (opts.exercises || []);
    const name = existing ? existing.name : (opts.name || '');
    const date = existing ? existing.date : (opts.date || U.todayISO());
    const duration = existing ? existing.duration : '';
    const notes = existing ? existing.notes : '';

    const body =
      '<div class="form-grid two">' +
        UI.field('Bezeichnung', UI.input('name', 'text', name, 'required maxlength="80" placeholder="z. B. Push · Bankdrücken"')) +
        UI.field('Datum', UI.input('date', 'date', date, 'required')) +
      '</div>' +
      '<div class="form-grid two">' +
        UI.field('Dauer (Minuten)', UI.input('duration', 'number', duration, 'min="0" step="5" placeholder="60"')) +
        UI.field('Notizen (optional)', UI.input('notes', 'text', notes, 'maxlength="160" placeholder="Gefühl, Besonderheiten …"')) +
      '</div>' +
      '<div class="section-label">Übungen <span class="volume-live" id="volumeLive"></span></div>' +
      '<div class="ex-editor-head muted small-text"><span>Übung</span><span>Sätze</span><span>Wdh.</span><span>kg</span><span></span></div>' +
      '<div class="ex-editor-list" id="logEx">' + (exercises.length ? exercises.map(exRow).join('') : exRow()) + '</div>' +
      '<button type="button" class="btn ghost small" id="addLogEx">' + UI.icon('plus') + ' Übung</button>';

    UI.openModal({
      title: existing ? 'Training bearbeiten' : 'Training manuell eintragen',
      body,
      wide: true,
      submitLabel: existing ? 'Aktualisieren' : 'Training speichern',
      onMount(form) {
        const list = form.querySelector('#logEx');
        const live = form.querySelector('#volumeLive');

        const updateVolume = () => {
          let vol = 0;
          list.querySelectorAll('.ex-editor-item').forEach((row) => {
            const s = Number(row.querySelector('.ex-sets').value) || 0;
            const r = Number(row.querySelector('.ex-reps').value) || 0;
            const w = Number(row.querySelector('.ex-weight').value) || 0;
            vol += s * r * w;
          });
          live.textContent = vol > 0 ? U.fmtNum(Math.round(vol)) + ' kg Volumen' : '';
        };

        form.addEventListener('input', (e) => {
          if (e.target.closest('.ex-editor-item')) updateVolume();
        });
        form.addEventListener('click', (e) => {
          if (e.target.closest('#addLogEx')) {
            list.insertAdjacentHTML('beforeend', exRow());
            FIT.exerciseDB.attachAll(form);
            updateVolume();
            return;
          }
          const rm = e.target.closest('[data-remove-ex]');
          if (rm) {
            rm.closest('.ex-editor-item').remove();
            if (!list.children.length) list.insertAdjacentHTML('beforeend', exRow());
            FIT.exerciseDB.attachAll(form);
            updateVolume();
          }
        });
        FIT.exerciseDB.attachAll(form);
        updateVolume();
      },
      onSubmit(form) {
        const workoutName = String(form.name.value || '').trim() || 'Training';
        if (!form.date.value) throw new Error('Bitte ein Datum wählen.');
        const exs = [];
        form.querySelectorAll('#logEx .ex-editor-item').forEach((row) => {
          const exName = String(row.querySelector('.ex-name').value || '').trim();
          if (!exName) return;
          const num = (sel, def) => {
            const v = Number(String(row.querySelector(sel).value || '').replace(',', '.'));
            return Number.isFinite(v) && v >= 0 ? v : def;
          };
          const sets = Math.max(1, Math.round(num('.ex-sets', 3)));
          const reps = Math.max(1, Math.round(num('.ex-reps', 8)));
          const weight = num('.ex-weight', 0);
          exs.push({
            id: row.dataset.id || uid('ex'),
            name: exName,
            sets: Array.from({ length: sets }, () => ({ reps: reps, weight: weight }))
          });
        });
        if (!exs.length) throw new Error('Bitte mindestens eine Übung eintragen.');
        const dur = Number(String(form.duration.value || '').replace(',', '.'));
        const data = {
          name: workoutName,
          date: form.date.value,
          duration: Number.isFinite(dur) && dur >= 0 ? dur : 0,
          notes: String(form.notes.value || '').trim(),
          exercises: exs
        };
        if (existing) {
          data.id = existing.id;
          data.planId = existing.planId;
          data.dayId = existing.dayId;
        } else {
          data.planId = opts.planId || null;
          data.dayId = opts.dayId || null;
        }
        S.saveWorkout(data);
        UI.toast(existing ? 'Training aktualisiert' : 'Training gespeichert');
        FIT.app.rerender();
      }
    });
  }

  function exRow(ex) {
    ex = ex || {};
    return '<div class="ex-editor-item"' + (ex.id ? ' data-id="' + ex.id + '"' : '') + '>' +
      '<input class="input ex-name" placeholder="Übung" value="' + U.esc(ex.name || '') + '">' +
      '<input class="input ex-sets" type="number" min="1" step="1" placeholder="Sätze" value="' + U.esc(ex.sets == null ? 3 : (Array.isArray(ex.sets) ? ex.sets.length : ex.sets)) + '" title="Sätze">' +
      '<input class="input ex-reps" type="number" min="1" step="1" placeholder="Wdh." value="' + U.esc(ex.reps == null ? 8 : ex.reps) + '" title="Wiederholungen">' +
      '<input class="input ex-weight" type="number" min="0" step="0.5" placeholder="kg" value="' + U.esc(ex.weight == null ? 0 : ex.weight) + '" title="Gewicht in kg">' +
      '<button type="button" class="icon-btn danger" data-remove-ex title="Übung entfernen">' + UI.icon('trash') + '</button>' +
    '</div>';
  }

  loadActive();

  return { render, openEditor, chart, startWorkout, persistActive: () => saveActive() };
})();

FIT.views.training = FIT.views.log;
