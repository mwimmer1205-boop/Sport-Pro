/* FitLog Pro – Tageszähler (rauchfrei, Sport, privat) */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.counters = (() => {
  const U = FIT.util;
  const S = FIT.store;
  const UI = FIT.ui;

  const HINTS = {
    smoke: 'Jeder rauchfreie Tag zählt. Tippe einen Tag im Kalender an, um ihn nachträglich zu korrigieren.',
    sport: 'Zählt jede Bewegung – Training, Laufen, Spaziergang oder Mobility.',
    private: 'Dein persönlicher Zähler – benenne ihn um, wähle Tage oder einen freien Wert.'
  };

  function hintFor(c) {
    if (c.mode === 'auto') {
      return c.key === 'smoke'
        ? 'Zählt automatisch ab deinem Rauchstopp – inklusive gespartem Geld.'
        : 'Zählt automatisch ab dem festgelegten Datum, ohne tägliches Abhaken.';
    }
    return HINTS[c.key] || '';
  }

  function heatmap(c) {
    const today = U.todayISO();
    const thisMonday = U.startOfWeek(today);
    const start = U.addDays(thisMonday, -7 * 9); // 10 Wochen inkl. aktueller
    const cells = [];
    let week = [];
    let d = start;
    while (d <= today) {
      const checked = !!c.days[d];
      const isToday = d === today;
      const label = U.fmtDate(d, { weekday: true, month: 'short' });
      week.push('<button type="button" class="heat-cell' + (checked ? ' on' : '') + (isToday ? ' today' : '') + '" data-day="' + d + '" title="' + U.esc(label + (checked ? ' · erledigt' : ' · nicht erledigt')) + '" aria-label="' + U.esc(label) + '"></button>');
      if (week.length === 7) { cells.push(week.join('')); week = []; }
      d = U.addDays(d, 1);
    }
    if (week.length) {
      while (week.length < 7) week.push('<span class="heat-cell ghost"></span>');
      cells.push(week.join(''));
    }
    return '<div class="heatmap-wrap">' +
      '<div class="heatmap">' + cells.map((w) => '<div class="heat-week">' + w + '</div>').join('') + '</div>' +
      '<div class="heatmap-legend"><span class="muted small-text">vor 10 Wochen</span><span class="muted small-text">heute</span></div>' +
    '</div>';
  }

  function card(c) {
    const isValue = c.mode === 'value';
    const isAuto = c.mode === 'auto';
    const streak = S.streak(c.key);
    const best = S.bestStreak(c.key);
    const total = S.totalDays(c.key);
    const doneToday = S.isChecked(c.key, U.todayISO());
    const goal = Number(c.goal) || 0;
    const pct = goal > 0 ? U.clamp(Math.round(((isValue ? Number(c.value) : streak) / goal) * 100), 0, 100) : 0;

    return '<section class="card counter-detail" data-counter-detail="' + c.key + '">' +
      '<div class="counter-detail-head">' +
        '<span class="counter-emoji big">' + U.esc(c.emoji || '🔥') + '</span>' +
        '<div class="counter-titles"><h2>' + U.esc(c.label) + '</h2><p class="muted">' + U.esc(hintFor(c)) + '</p></div>' +
        '<button class="icon-btn" data-edit-counter="' + c.key + '" title="Zähler anpassen">' + UI.icon('settings') + '</button>' +
      '</div>' +

      (isAuto ?
        (function () {
          const info = S.savedMoney(c.key);
          const startLabel = c.startDate ? U.fmtDateLong(c.startDate) : 'Noch kein Startdatum';
          let moneyHtml = '';
          if (info) {
            moneyHtml =
              '<div class="money-box">' +
                '<div class="money-main"><span>Gespart seit Start</span><strong>' + U.fmtNum(info.saved, 2) + ' €</strong></div>' +
                '<div class="money-breakdown">' +
                  '<span>' + U.fmtNum(info.cigarettes) + ' Zigaretten nicht geraucht</span>' +
                  '<span>' + U.fmtNum(info.packs, 1) + ' Schachteln gespart</span>' +
                  '<span>' + U.fmtNum(info.perDay) + ' / Tag · ' + U.fmtNum(info.price, 2) + ' € / Schachtel</span>' +
                '</div>' +
              '</div>';
          }
          return (
            '<div class="counter-stats">' +
              '<div><strong>' + U.fmtNum(streak) + '</strong><span>Tage seit Start</span></div>' +
              '<div><strong>' + U.fmtNum(best) + '</strong><span>Beste Serie</span></div>' +
              '<div><strong>' + U.fmtNum(total) + '</strong><span>Tage gesamt</span></div>' +
              '<div><strong>' + pct + ' %</strong><span>Ziel ' + U.fmtNum(goal) + '</span></div>' +
            '</div>' +
            '<div class="bar"><span class="bar-fill accent" style="width:' + pct + '%"></span></div>' +
            moneyHtml +
            '<div class="counter-detail-foot">' +
              '<button class="btn ' + (c.startDate ? 'ghost' : 'primary') + '" data-edit-counter="' + c.key + '">' +
                (c.startDate ? 'Startdatum ändern' : 'Startdatum festlegen') +
              '</button>' +
              '<span class="muted small-text">Seit ' + U.esc(startLabel) + '</span>' +
            '</div>'
          );
        })()
        : (isValue ?
        '<div class="value-counter">' +
          '<div class="value-main"><strong>' + U.fmtNum(c.value) + '</strong><span>von ' + U.fmtNum(c.target) + '</span></div>' +
          '<div class="bar"><span class="bar-fill accent" style="width:' + pct + '%"></span></div>' +
          '<div class="row gap">' +
            '<button class="btn ghost" data-adjust="' + c.key + '" data-delta="-1">' + UI.icon('minus') + ' −1</button>' +
            '<button class="btn primary" data-adjust="' + c.key + '" data-delta="1">' + UI.icon('plus') + ' +1</button>' +
            '<button class="btn ghost" data-reset-value="' + c.key + '">Zurücksetzen</button>' +
          '</div>' +
        '</div>'
        :
        '<div class="counter-stats">' +
          '<div><strong>' + U.fmtNum(streak) + '</strong><span>Tage in Folge</span></div>' +
          '<div><strong>' + U.fmtNum(best) + '</strong><span>Beste Serie</span></div>' +
          '<div><strong>' + U.fmtNum(total) + '</strong><span>Tage gesamt</span></div>' +
          '<div><strong>' + pct + ' %</strong><span>Ziel ' + U.fmtNum(goal) + '</span></div>' +
        '</div>' +
        '<div class="bar"><span class="bar-fill accent" style="width:' + pct + '%"></span></div>' +
        heatmap(c) +
        '<div class="counter-detail-foot">' +
          '<button class="btn ' + (doneToday ? 'done' : 'primary') + '" data-check="' + c.key + '">' +
            (doneToday ? UI.icon('check') + ' Heute erledigt – abwählen' : 'Heute abhaken') +
          '</button>' +
          '<span class="muted small-text">' + U.esc(U.fmtDateLong(U.todayISO())) + '</span>' +
        '</div>')) +
    '</section>';
  }

  function render(el) {
    el.innerHTML =
      '<section class="page-head">' +
        '<div><h1>Zähler</h1><p>Deine Gewohnheiten – Tag für Tag. Alles bleibt lokal gespeichert.</p></div>' +
      '</section>' +
      '<div class="counter-details">' + S.counterList().map(card).join('') + '</div>';

    el.querySelectorAll('[data-check]').forEach((b) => {
      b.addEventListener('click', () => {
        const changed = S.toggleDay(b.dataset.check, U.todayISO());
        if (changed) UI.toast('Tag abgehakt – stark!');
        render(el);
      });
    });
    el.querySelectorAll('.heat-cell[data-day]').forEach((b) => {
      b.addEventListener('click', () => {
        const counterEl = b.closest('[data-counter-detail]');
        if (!counterEl) return;
        S.toggleDay(counterEl.dataset.counterDetail, b.dataset.day);
        render(el);
      });
    });
    el.querySelectorAll('[data-adjust]').forEach((b) => {
      b.addEventListener('click', () => {
        S.adjustValue(b.dataset.adjust, Number(b.dataset.delta));
        render(el);
      });
    });
    el.querySelectorAll('[data-reset-value]').forEach((b) => {
      b.addEventListener('click', async () => {
        const c = S.counter(b.dataset.resetValue);
        if (!c) return;
        const ok = await UI.confirm({ title: 'Zähler zurücksetzen', message: 'Der Wert von „' + c.label + '“ wird auf 0 gesetzt.', confirmLabel: 'Zurücksetzen' });
        if (ok) { S.setCounter(c.key, { value: 0 }); UI.toast('Zurückgesetzt'); render(el); }
      });
    });
    el.querySelectorAll('[data-edit-counter]').forEach((b) => {
      b.addEventListener('click', () => openEditor(S.counter(b.dataset.editCounter)));
    });
  }

  function openEditor(c) {
    if (!c) return;
    const body =
      '<div class="form-grid two">' +
        UI.field('Bezeichnung', UI.input('label', 'text', c.label, 'required maxlength="40"')) +
        UI.field('Symbol (Emoji)', UI.input('emoji', 'text', c.emoji || '', 'maxlength="4"')) +
      '</div>' +
      UI.field('Zähl-Modus', '<select class="input" name="mode">' +
        '<option value="days"' + (c.mode === 'days' ? ' selected' : '') + '>Tage zählen (manuell, mit Serie & Kalender)</option>' +
        '<option value="value"' + (c.mode === 'value' ? ' selected' : '') + '>Freier Wert (+ / −)</option>' +
        '<option value="auto"' + (c.mode === 'auto' ? ' selected' : '') + '>Automatisch ab Datum (zählt jeden Tag weiter)</option>' +
      '</select>') +
      '<div class="form-grid two">' +
        '<label class="field" data-mode-field="days"><span class="field-label">Ziel (Tage)</span>' + UI.input('goal', 'number', c.goal, 'min="1" step="1"') + '</label>' +
        '<label class="field" data-mode-field="value"><span class="field-label">Zielwert</span>' + UI.input('target', 'number', c.target, 'min="0" step="1"') + '</label>' +
      '</div>' +
      '<label class="field" data-mode-field="auto-date"><span class="field-label">Startdatum (erster Tag)</span>' +
        UI.input('startDate', 'date', c.startDate || '', '') + '</label>' +
      '<div data-mode-field="auto" data-cost-fields>' +
        (c.key === 'smoke' ?
          '<div class="form-grid three">' +
            UI.field('Zigaretten pro Tag', UI.input('autoCigarettesPerDay', 'number', c.autoCigarettesPerDay, 'min="0" step="1"')) +
            UI.field('Zigaretten pro Schachtel', UI.input('autoPackSize', 'number', c.autoPackSize, 'min="1" step="1"')) +
            UI.field('Preis pro Schachtel (€)', UI.input('autoPricePerPack', 'number', c.autoPricePerPack, 'min="0" step="0.01"')) +
          '</div>' +
          '<p class="field-hint">Aus Zigaretten pro Tag und Schachtelpreis wird das gesparte Geld berechnet.</p>'
          : '') +
      '</div>' +
      '<p class="field-hint">Der Modus kann jederzeit gewechselt werden; bereits erfasste Tage bleiben erhalten.</p>';

    UI.openModal({
      title: 'Zähler anpassen',
      body,
      submitLabel: 'Speichern',
      onMount(form) {
        const sync = () => {
          const mode = form.mode.value;
          form.querySelectorAll('[data-mode-field]').forEach((f) => {
            const m = f.dataset.modeField;
            let show = false;
            if (m === 'days') show = mode === 'days' || mode === 'auto';
            else if (m === 'value') show = mode === 'value';
            else if (m === 'auto' || m === 'auto-date' || m === 'auto-cost') show = mode === 'auto';
            f.hidden = !show;
          });
        };
        form.mode.addEventListener('change', sync);
        sync();
      },
      onSubmit(form) {
        const label = String(form.label.value || '').trim();
        if (!label) throw new Error('Bitte eine Bezeichnung angeben.');
        const patch = {
          label,
          emoji: String(form.emoji.value || '').trim() || '🔥',
          mode: form.mode.value,
          goal: Math.max(1, Math.round(Number(form.goal.value) || 1)),
          target: Math.max(0, Math.round(Number(form.target.value) || 0))
        };
        if (patch.mode === 'auto') {
          const startInput = form.querySelector('[name="startDate"]');
          patch.startDate = startInput && startInput.value ? startInput.value : null;
          const cig = form.querySelector('[name="autoCigarettesPerDay"]');
          const pack = form.querySelector('[name="autoPackSize"]');
          const price = form.querySelector('[name="autoPricePerPack"]');
          if (cig) patch.autoCigarettesPerDay = Math.max(0, Number(cig.value) || 0);
          if (pack) patch.autoPackSize = Math.max(1, Number(pack.value) || 20);
          if (price) patch.autoPricePerPack = Math.max(0, Number(price.value) || 0);
        }
        S.setCounter(c.key, patch);
        UI.toast('Zähler gespeichert');
        FIT.app.rerender();
      }
    });
  }

  return { render, openEditor };
})();
