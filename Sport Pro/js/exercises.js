/* FitLog Pro – Übungsdatenbank mit Suche und Auswahl */
window.FIT = window.FIT || {};

FIT.exerciseDB = (() => {
  const U = FIT.util;
  const UI = FIT.ui;

  const MUSCLE_ORDER = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Beine', 'Gesäß', 'Waden', 'Bauch', 'Ganzkörper', 'Cardio'];

  const RAW = [
    // Brust
    ['Bankdrücken', 'Brust', 'Langhantel'],
    ['Schrägbankdrücken', 'Brust', 'Langhantel'],
    ['Schrägbankdrücken (Kurzhantel)', 'Brust', 'Kurzhantel'],
    ['Flachbankdrücken (Kurzhantel)', 'Brust', 'Kurzhantel'],
    ['Decline Bankdrücken', 'Brust', 'Langhantel'],
    ['Brustpresse', 'Brust', 'Maschine'],
    ['Butterfly', 'Brust', 'Maschine'],
    ['Kabel-Crossover', 'Brust', 'Kabelzug'],
    ['Liegestütze', 'Brust', 'Körpergewicht'],
    ['Dips (Brust)', 'Brust', 'Körpergewicht'],
    // Rücken
    ['Klimmzüge', 'Rücken', 'Körpergewicht'],
    ['Latzug', 'Rücken', 'Kabelzug'],
    ['Rudern (Langhantel)', 'Rücken', 'Langhantel'],
    ['Rudern (Kurzhantel)', 'Rücken', 'Kurzhantel'],
    ['Rudern (Kabelzug)', 'Rücken', 'Kabelzug'],
    ['T-Bar Rudern', 'Rücken', 'Langhantel'],
    ['Kreuzheben', 'Rücken', 'Langhantel'],
    ['Überzüge', 'Rücken', 'Kurzhantel'],
    ['Rückenstrecken', 'Rücken', 'Maschine'],
    ['Good Mornings', 'Rücken', 'Langhantel'],
    // Schultern
    ['Schulterdrücken', 'Schultern', 'Langhantel'],
    ['Schulterdrücken (Kurzhantel)', 'Schultern', 'Kurzhantel'],
    ['Arnold Press', 'Schultern', 'Kurzhantel'],
    ['Seitheben', 'Schultern', 'Kurzhantel'],
    ['Seitheben (Kabelzug)', 'Schultern', 'Kabelzug'],
    ['Vorgebeugtes Seitheben', 'Schultern', 'Kurzhantel'],
    ['Frontheben', 'Schultern', 'Kurzhantel'],
    ['Schulterpresse', 'Schultern', 'Maschine'],
    ['Aufrechtes Rudern', 'Schultern', 'Langhantel'],
    ['Reverse Flys', 'Schultern', 'Maschine'],
    ['Face Pulls', 'Schultern', 'Kabelzug'],
    // Bizeps
    ['Bizepscurls', 'Bizeps', 'Langhantel'],
    ['Kurzhantelcurls', 'Bizeps', 'Kurzhantel'],
    ['Hammercurls', 'Bizeps', 'Kurzhantel'],
    ['Konzentrationscurls', 'Bizeps', 'Kurzhantel'],
    ['Kabelcurls', 'Bizeps', 'Kabelzug'],
    ['Preachercurls', 'Bizeps', 'Maschine'],
    // Trizeps
    ['Trizepsdrücken', 'Trizeps', 'Kabelzug'],
    ['Trizepsdrücken (Kurzhantel)', 'Trizeps', 'Kurzhantel'],
    ['Dips (Trizeps)', 'Trizeps', 'Körpergewicht'],
    ['Engbankdrücken', 'Trizeps', 'Langhantel'],
    ['Stirndrücken', 'Trizeps', 'Langhantel'],
    ['Trizeps-Kickbacks', 'Trizeps', 'Kurzhantel'],
    ['Overhead Trizeps-Extension', 'Trizeps', 'Kurzhantel'],
    // Beine
    ['Kniebeugen', 'Beine', 'Langhantel'],
    ['Frontkniebeugen', 'Beine', 'Langhantel'],
    ['Goblet Squat', 'Beine', 'Kurzhantel'],
    ['Sumo-Kniebeugen', 'Beine', 'Langhantel'],
    ['Beinpresse', 'Beine', 'Maschine'],
    ['Hackenschmidt', 'Beine', 'Maschine'],
    ['Ausfallschritte', 'Beine', 'Kurzhantel'],
    ['Bulgarian Split Squats', 'Beine', 'Kurzhantel'],
    ['Step-ups', 'Beine', 'Kurzhantel'],
    ['Beinstrecker', 'Beine', 'Maschine'],
    ['Beinbeuger', 'Beine', 'Maschine'],
    ['Rumänisches Kreuzheben', 'Beine', 'Langhantel'],
    ['Adduktoren', 'Beine', 'Maschine'],
    // Gesäß
    ['Hip Thrust', 'Gesäß', 'Langhantel'],
    ['Glute Bridge', 'Gesäß', 'Körpergewicht'],
    ['Abduktoren', 'Gesäß', 'Maschine'],
    // Waden
    ['Wadenheben (stehend)', 'Waden', 'Maschine'],
    ['Wadenheben (sitzend)', 'Waden', 'Maschine'],
    // Bauch
    ['Crunches', 'Bauch', 'Körpergewicht'],
    ['Plank', 'Bauch', 'Körpergewicht'],
    ['Seitstütz', 'Bauch', 'Körpergewicht'],
    ['Beinheben', 'Bauch', 'Körpergewicht'],
    ['Hängendes Beinheben', 'Bauch', 'Körpergewicht'],
    ['Russian Twist', 'Bauch', 'Kurzhantel'],
    ['Cable Crunches', 'Bauch', 'Kabelzug'],
    ['Ab Wheel', 'Bauch', 'Sonstiges'],
    ['Mountain Climbers', 'Bauch', 'Körpergewicht'],
    ['Dead Bug', 'Bauch', 'Körpergewicht'],
    // Ganzkörper
    ['Burpees', 'Ganzkörper', 'Körpergewicht'],
    ['Kettlebell Swing', 'Ganzkörper', 'Kettlebell'],
    ['Clean and Press', 'Ganzkörper', 'Langhantel'],
    ['Thrusters', 'Ganzkörper', 'Langhantel'],
    ["Farmer's Carry", 'Ganzkörper', 'Kurzhantel'],
    ['Battle Ropes', 'Ganzkörper', 'Sonstiges'],
    ['Box Jumps', 'Ganzkörper', 'Körpergewicht'],
    ['Jumping Jacks', 'Ganzkörper', 'Körpergewicht'],
    // Cardio
    ['Laufband', 'Cardio', 'Laufband'],
    ['Fahrrad-Ergometer', 'Cardio', 'Fahrrad'],
    ['Crosstrainer', 'Cardio', 'Crosstrainer'],
    ['Rudergerät', 'Cardio', 'Rudergerät'],
    ['Seilspringen', 'Cardio', 'Sonstiges'],
    ['Stairmaster', 'Cardio', 'Stairmaster'],
    ['Walking', 'Cardio', 'Laufband'],
    ['Schwimmen', 'Cardio', 'Sonstiges']
  ];

  const LIST = RAW.map(([name, muscle, equipment]) => ({ name, muscle, equipment }));
  const norm = (s) => String(s || '').toLowerCase();

  function search(query) {
    const q = norm(query).trim();
    if (!q) return LIST.slice();
    const parts = q.split(/\s+/);
    return LIST.filter((ex) => {
      const haystack = norm(ex.name + ' ' + ex.muscle + ' ' + ex.equipment);
      return parts.every((p) => haystack.includes(p));
    });
  }

  function meta(ex) {
    return ex.muscle + ' · ' + ex.equipment;
  }

  function attach(input) {
    if (!input || input.dataset.comboReady) return;
    input.dataset.comboReady = '1';
    input.setAttribute('autocomplete', 'off');

    const wrap = document.createElement('div');
    wrap.className = 'combo';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'combo-btn';
    btn.title = 'Übungsdatenbank öffnen';
    btn.setAttribute('aria-label', 'Übungsdatenbank öffnen');
    btn.innerHTML = UI.icon('dumbbell');
    wrap.appendChild(btn);

    const menu = document.createElement('div');
    menu.className = 'combo-menu';
    menu.setAttribute('role', 'listbox');
    wrap.appendChild(menu);

    let active = -1;
    let picking = false;

    const close = () => { menu.classList.remove('show', 'up'); active = -1; };

    const choose = (name) => {
      picking = true;
      input.value = name;
      close();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      picking = false;
    };

    const render = () => {
      if (picking) return;
      const found = search(input.value).slice(0, 60);
      active = -1;
      menu.innerHTML = found.length
        ? found.map((ex) =>
            '<button type="button" class="combo-item" role="option" data-ex="' + U.esc(ex.name) + '">' +
              '<span>' + U.esc(ex.name) + '</span><small>' + U.esc(meta(ex)) + '</small>' +
            '</button>').join('')
        : '<div class="combo-empty">Keine Übung gefunden – Name kann frei eingegeben werden.</div>';
      menu.classList.add('show');
      menu.classList.remove('up');
      const rect = menu.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 12) menu.classList.add('up');
    };

    input.addEventListener('focus', render);
    input.addEventListener('input', render);
    input.addEventListener('blur', () => setTimeout(close, 150));

    input.addEventListener('keydown', (e) => {
      if (!menu.classList.contains('show')) {
        if (e.key === 'ArrowDown') { e.preventDefault(); render(); }
        return;
      }
      const nodes = Array.from(menu.querySelectorAll('.combo-item'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        active = Math.min(nodes.length - 1, active + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        active = Math.max(0, active - 1);
      } else if (e.key === 'Enter') {
        if (active >= 0 && nodes[active]) {
          e.preventDefault();
          choose(nodes[active].dataset.ex);
          return;
        }
        e.preventDefault();
        close();
        return;
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      } else {
        return;
      }
      nodes.forEach((n, i) => n.classList.toggle('active', i === active));
      if (nodes[active]) nodes[active].scrollIntoView({ block: 'nearest' });
    });

    menu.addEventListener('mousedown', (e) => e.preventDefault());
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-ex]');
      if (item) choose(item.dataset.ex);
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openPicker(choose);
    });
  }

  function attachAll(root) {
    if (!root) return;
    root.querySelectorAll('input.ex-name').forEach(attach);
  }

  function openPicker(onPick) {
    const body =
      '<div class="ex-picker-toolbar">' +
        '<label class="search-box grow">' + UI.icon('search') +
          '<input class="input" id="exSearch" type="search" placeholder="Übung, Muskelgruppe oder Gerät suchen …">' +
        '</label>' +
        '<select class="input ex-muscle-select" id="exMuscle">' +
          ['Alle Muskelgruppen'].concat(MUSCLE_ORDER).map((m) => '<option>' + m + '</option>').join('') +
        '</select>' +
      '</div>' +
      '<div class="ex-picker-meta"><span class="muted small-text" id="exCount"></span>' +
        '<span class="muted small-text">' + (onPick ? 'Übung anklicken, um sie zu übernehmen' : '') + '</span></div>' +
      '<div class="ex-picker-list" id="exList"></div>';

    UI.openModal({
      title: 'Übungsdatenbank',
      body,
      wide: true,
      submitLabel: 'Schließen',
      onSubmit() {},
      onMount(form) {
        const list = form.querySelector('#exList');
        const searchInput = form.querySelector('#exSearch');
        const muscleSelect = form.querySelector('#exMuscle');
        const count = form.querySelector('#exCount');

        const draw = () => {
          const found = search(searchInput.value).filter((ex) =>
            muscleSelect.value === 'Alle Muskelgruppen' || ex.muscle === muscleSelect.value
          );
          count.textContent = found.length + (found.length === 1 ? ' Übung' : ' Übungen');
          if (!found.length) {
            list.innerHTML = '<div class="combo-empty">Keine passende Übung gefunden.</div>';
            return;
          }
          const groups = {};
          found.forEach((ex) => { (groups[ex.muscle] = groups[ex.muscle] || []).push(ex); });
          list.innerHTML = MUSCLE_ORDER.filter((g) => groups[g]).map((group) =>
            '<div class="ex-picker-group">' + U.esc(group) + '</div>' +
            groups[group].map((ex) =>
              '<button type="button" class="ex-picker-item" data-pick="' + U.esc(ex.name) + '">' +
                '<span>' + U.esc(ex.name) + '</span><small>' + U.esc(ex.equipment) + '</small>' +
              '</button>').join('')
          ).join('');
        };

        searchInput.addEventListener('input', draw);
        muscleSelect.addEventListener('change', draw);
        list.addEventListener('click', (e) => {
          const item = e.target.closest('[data-pick]');
          if (!item) return;
          if (onPick) onPick(item.dataset.pick);
          UI.closeModal();
        });
        draw();
        setTimeout(() => { try { searchInput.focus(); } catch (e) {} }, 60);
      }
    });
  }

  return { all: () => LIST.slice(), search, attach, attachAll, openPicker, MUSCLE_ORDER };
})();
