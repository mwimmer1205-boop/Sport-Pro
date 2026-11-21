/* Sport Pro – Datenmodell & lokale Speicherung */
window.FIT = window.FIT || {};

FIT.store = (() => {
  const U = FIT.util;
  const KEY = 'fitness-studio.v1';

  const MEALS = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'];

  function defaults() {
    return {
      version: 1,
      profile: {
        name: '',
        weeklyGoal: 4,
        goals: { kcal: 2400, protein: 180, carbs: 250, fat: 70 },
        height: null, weight: null, age: null, gender: 'male',
        activity: 'moderate', goalMode: 'maintain',
        deviceMode: 'auto'
      },
      counters: {
        smoke: {
          key: 'smoke', label: 'Rauchen', emoji: '🚭', mode: 'auto',
          goal: 30, days: {}, value: 0, target: 100,
          startDate: U.todayISO(), autoCigarettesPerDay: 20, autoPackSize: 20, autoPricePerPack: 7
        },
        sport: {
          key: 'sport', label: 'Sport', emoji: '🏋️', mode: 'days',
          goal: 30, days: {}, value: 0, target: 100,
          startDate: null, autoCigarettesPerDay: 0, autoPackSize: 20, autoPricePerPack: 0
        },
        private: {
          key: 'private', label: 'Counter', emoji: '🎯', mode: 'auto',
          goal: 30, days: {}, value: 0, target: 100,
          startDate: U.todayISO(), autoCigarettesPerDay: 0, autoPackSize: 20, autoPricePerPack: 0
        }
      },
      recipes: [],
      diary: {},
      plans: [],
      workouts: []
    };
  }

  let state = defaults();

  function merge(base, stored) {
    if (!stored || typeof stored !== 'object') return base;
    const out = base;
    if (stored.profile && typeof stored.profile === 'object') {
      out.profile = Object.assign(out.profile, stored.profile);
      out.profile.goals = Object.assign(base.profile.goals, stored.profile.goals || {});
    }
    if (stored.counters && typeof stored.counters === 'object') {
      Object.keys(out.counters).forEach((k) => {
        if (stored.counters[k] && typeof stored.counters[k] === 'object') {
          out.counters[k] = Object.assign(out.counters[k], stored.counters[k]);
          out.counters[k].days = (stored.counters[k].days && typeof stored.counters[k].days === 'object') ? stored.counters[k].days : {};
          out.counters[k].key = k;
        }
      });
    }
    ['recipes', 'plans', 'workouts'].forEach((k) => {
      if (Array.isArray(stored[k])) out[k] = stored[k];
    });
    if (stored.diary && typeof stored.diary === 'object') out.diary = stored.diary;
    return out;
  }

  function migrateCounterLabels() {
    const renames = {
      smoke: { 'Nicht geraucht': 'Rauchen' },
      sport: { 'Sport gemacht': 'Sport' },
      private: { 'Privater Zähler': 'Counter' }
    };
    Object.keys(renames).forEach((key) => {
      const c = state.counters && state.counters[key];
      if (!c) return;
      const next = renames[key][c.label];
      if (next) c.label = next;
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { state = defaults(); return state; }
      state = merge(defaults(), JSON.parse(raw));
      migrateCounterLabels();
    } catch (e) {
      console.warn('Sport Pro: Speicher konnte nicht gelesen werden.', e);
      state = defaults();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Sport Pro: Speichern fehlgeschlagen.', e);
      return false;
    }
  }

  /* ---------- Zähler ---------- */

  function autoDays(c) {
    if (!c || c.mode !== 'auto' || !c.startDate) return 0;
    const diff = U.diffDays(U.todayISO(), c.startDate);
    if (diff < 0) return 0;
    return diff + 1;
  }

  function counter(id) {
    return state.counters[id];
  }

  function counterList() {
    return Object.values(state.counters);
  }

  function isChecked(id, date) {
    const c = state.counters[id];
    if (!c) return false;
    if (c.mode === 'auto') {
      if (!c.startDate) return false;
      return date >= c.startDate && date <= U.todayISO();
    }
    return !!c.days[date];
  }

  function toggleDay(id, date) {
    const c = state.counters[id];
    if (!c) return false;
    if (c.mode === 'auto') return isChecked(id, date);
    if (c.days[date]) delete c.days[date];
    else c.days[date] = true;
    save();
    return !!c.days[date];
  }

  function streak(id) {
    const c = state.counters[id];
    if (!c) return 0;
    if (c.mode === 'auto') return autoDays(c);
    let day = U.todayISO();
    if (!c.days[day]) day = U.addDays(day, -1);
    let n = 0;
    while (c.days[day]) {
      n += 1;
      day = U.addDays(day, -1);
      if (n > 20000) break;
    }
    return n;
  }

  function bestStreak(id) {
    const c = state.counters[id];
    if (!c) return 0;
    if (c.mode === 'auto') return autoDays(c);
    const dates = Object.keys(c.days).filter((d) => c.days[d]).sort();
    let best = 0, run = 0, prev = null;
    dates.forEach((d) => {
      run = (prev && U.diffDays(d, prev) === 1) ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    });
    return best;
  }

  function totalDays(id) {
    const c = state.counters[id];
    if (!c) return 0;
    if (c.mode === 'auto') return autoDays(c);
    return Object.keys(c.days).filter((d) => c.days[d]).length;
  }

  function lastDays(id, count) {
    const c = state.counters[id];
    const out = [];
    const today = U.todayISO();
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = U.addDays(today, -i);
      let checked = false;
      if (c) {
        if (c.mode === 'auto') checked = !!c.startDate && d >= c.startDate && d <= today;
        else checked = !!c.days[d];
      }
      out.push({ date: d, checked });
    }
    return out;
  }

  function setCounter(id, patch) {
    const c = state.counters[id];
    if (!c) return;
    Object.assign(c, patch);
    save();
  }

  function adjustValue(id, delta) {
    const c = state.counters[id];
    if (!c) return;
    c.value = Math.max(0, Math.round((Number(c.value) || 0) + delta));
    save();
  }

  function savedMoney(id) {
    const c = state.counters[id];
    if (!c || c.mode !== 'auto' || !c.startDate) return null;
    const days = autoDays(c);
    const perDay = Math.max(0, Number(c.autoCigarettesPerDay) || 0);
    const packSize = Math.max(1, Number(c.autoPackSize) || 20);
    const price = Math.max(0, Number(c.autoPricePerPack) || 0);
    if (perDay <= 0 || price <= 0) return null;
    const cigarettes = days * perDay;
    const packs = cigarettes / packSize;
    const saved = cigarettes * (price / packSize);
    return { days, cigarettes, packs, saved, perDay, packSize, price };
  }

  /* ---------- Rezepte ---------- */

  function recipe(id) {
    return state.recipes.find((r) => r.id === id);
  }

  function saveRecipe(data) {
    if (data.id) {
      const i = state.recipes.findIndex((r) => r.id === data.id);
      if (i >= 0) state.recipes[i] = Object.assign({}, state.recipes[i], data);
      else state.recipes.unshift(data);
    } else {
      data.id = U.uid('rec');
      data.createdAt = Date.now();
      state.recipes.unshift(data);
    }
    save();
    return data;
  }

  function deleteRecipe(id) {
    state.recipes = state.recipes.filter((r) => r.id !== id);
    save();
  }

  /* ---------- Tagebuch ---------- */

  function diaryEntries(date) {
    return state.diary[date] || [];
  }

  function addDiaryEntry(date, entry) {
    if (!state.diary[date]) state.diary[date] = [];
    state.diary[date].push(Object.assign({ id: U.uid('ent'), time: Date.now() }, entry));
    save();
  }

  function removeDiaryEntry(date, id) {
    state.diary[date] = (state.diary[date] || []).filter((e) => e.id !== id);
    if (!state.diary[date].length) delete state.diary[date];
    save();
  }

  const emptyMacros = () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

  function dayTotals(date) {
    return diaryEntries(date).reduce((sum, e) => {
      const m = e.macros || {};
      sum.kcal += Number(m.kcal) || 0;
      sum.protein += Number(m.protein) || 0;
      sum.carbs += Number(m.carbs) || 0;
      sum.fat += Number(m.fat) || 0;
      return sum;
    }, emptyMacros());
  }

  /* ---------- Trainingspläne ---------- */

  function plan(id) {
    return state.plans.find((p) => p.id === id);
  }

  function planExercises(p) {
    if (!p) return [];
    if (Array.isArray(p.exercises)) return p.exercises;
    if (Array.isArray(p.days)) return p.days.reduce((acc, d) => acc.concat(d.exercises || []), []);
    return [];
  }

  function savePlan(data) {
    if (data.id) {
      const i = state.plans.findIndex((p) => p.id === data.id);
      if (i >= 0) state.plans[i] = Object.assign({}, state.plans[i], data);
      else state.plans.unshift(data);
    } else {
      data.id = U.uid('plan');
      data.createdAt = Date.now();
      state.plans.unshift(data);
    }
    save();
    return data;
  }

  function deletePlan(id) {
    state.plans = state.plans.filter((p) => p.id !== id);
    save();
  }

  /* ---------- Trainingslog ---------- */

  function workout(id) {
    return state.workouts.find((w) => w.id === id);
  }

  function setVolume(set) {
    return (Number(set && set.reps) || 0) * (Number(set && set.weight) || 0);
  }

  function exerciseVolume(ex) {
    if (!ex) return 0;
    if (Array.isArray(ex.sets) && ex.sets.length && typeof ex.sets[0] === 'object') {
      return ex.sets.reduce((sum, set) => sum + setVolume(set), 0);
    }
    return (Number(ex.sets) || 0) * (Number(ex.reps) || 0) * (Number(ex.weight) || 0);
  }

  function workoutVolume(w) {
    if (!w || !Array.isArray(w.exercises)) return 0;
    return w.exercises.reduce((s, ex) => s + exerciseVolume(ex), 0);
  }

  function saveWorkout(data) {
    if (data.id) {
      const i = state.workouts.findIndex((w) => w.id === data.id);
      if (i >= 0) state.workouts[i] = Object.assign({}, state.workouts[i], data);
      else state.workouts.unshift(data);
    } else {
      data.id = U.uid('wo');
      data.createdAt = Date.now();
      state.workouts.unshift(data);
    }
    try {
      const d = data && data.date;
      const sport = state.counters && state.counters.sport;
      if (d && sport && sport.mode === 'days' && !sport.days[d]) {
        sport.days[d] = true;
      }
    } catch (e) {}
    save();
    return data;
  }

  function deleteWorkout(id) {
    state.workouts = state.workouts.filter((w) => w.id !== id);
    save();
  }

  function sortedWorkouts() {
    return state.workouts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.createdAt || 0) - (a.createdAt || 0));
  }

  function workoutsOn(date) {
    return state.workouts.filter((w) => w.date === date);
  }

  function workoutsThisWeek() {
    const start = U.startOfWeek(U.todayISO());
    const end = U.addDays(start, 6);
    return state.workouts.filter((w) => w.date >= start && w.date <= end).length;
  }

  function lastWeeks(n = 8) {
    const thisWeek = U.startOfWeek(U.todayISO());
    const out = [];
    for (let i = n - 1; i >= 0; i -= 1) {
      const start = U.addDays(thisWeek, -7 * i);
      const end = U.addDays(start, 6);
      const list = state.workouts.filter((w) => w.date >= start && w.date <= end);
      out.push({
        start, end,
        count: list.length,
        volume: list.reduce((s, w) => s + workoutVolume(w), 0)
      });
    }
    return out;
  }

  function totalVolume() {
    return state.workouts.reduce((s, w) => s + workoutVolume(w), 0);
  }

  /* ---------- Import / Export ---------- */

  function exportJSON() {
    return JSON.stringify(Object.assign({ exportedAt: new Date().toISOString() }, state), null, 2);
  }

  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') throw new Error('Ungültige Datei.');
    if (!data.counters && !data.recipes && !data.workouts && !data.plans) {
      throw new Error('Die Datei enthält keine Sport Pro-Daten.');
    }
    state = merge(defaults(), data);
    save();
    return state;
  }

  function reset() {
    state = defaults();
    localStorage.removeItem(KEY);
    return state;
  }

  return {
    KEY, MEALS, get state() { return state; },
    load, save, defaults,
    counter, counterList, isChecked, toggleDay, streak, bestStreak, totalDays, lastDays, setCounter, adjustValue, autoDays, savedMoney,
    recipe, saveRecipe, deleteRecipe,
    diaryEntries, addDiaryEntry, removeDiaryEntry, dayTotals, emptyMacros,
    plan, planExercises, savePlan, deletePlan,
    workout, workoutVolume, exerciseVolume, saveWorkout, deleteWorkout, sortedWorkouts,
    workoutsOn, workoutsThisWeek, lastWeeks, totalVolume,
    exportJSON, importJSON, reset
  };
})();
