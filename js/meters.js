/* FitLog Pro – Zählerstände (Supabase: public.meter_readings) */
window.FIT = window.FIT || {};
FIT.views = FIT.views || {};

FIT.views.meters = (() => {
  const U = FIT.util;
  const UI = FIT.ui;
  const SB = FIT.supabase;
  const Cloud = FIT.cloud;

  let cache = [];
  let loaded = false;
  let loading = false;
  let lastError = null;

  function normalizeReadingAt(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString();
  }

  function toInputDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fmtReadingAt(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    try {
      return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
    } catch (e) {
      return d.toLocaleString('de-DE');
    }
  }

  async function fetchAll() {
    const client = SB.requireClient();
    if (!SB.user) throw new Error('Bitte zuerst anmelden.');
    const { data, error } = await client
      .from('meter_readings')
      .select('*')
      .order('reading_at', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    cache = Array.isArray(data) ? data : [];
    loaded = true;
    lastError = null;
    return cache;
  }

  async function ensureLoaded(force) {
    if (loading) return cache;
    if (loaded && !force) return cache;
    loading = true;
    try {
      await fetchAll();
    } finally {
      loading = false;
    }
    return cache;
  }

  function rowCard(r) {
    const value = r.reading_value == null ? '' : U.fmtNum(Number(r.reading_value), String(r.reading_value).includes('.') ? 2 : 0);
    const unit = r.unit ? ' ' + U.esc(r.unit) : '';
    return '<article class="card meter-card" data-id="' + U.esc(r.id || '') + '">' +
      '<div class="card-head">' +
        '<div><h3>' + U.esc(r.meter_name || 'Zähler') + '</h3>' +
          '<p class="muted">' + U.esc(fmtReadingAt(r.reading_at)) + '</p></div>' +
        '<div class="card-actions">' +
          '<button class="icon-btn" data-edit-meter="' + U.esc(r.id || '') + '" title="Bearbeiten">' + UI.icon('edit') + '</button>' +
          '<button class="icon-btn danger" data-del-meter="' + U.esc(r.id || '') + '" title="Löschen">' + UI.icon('trash') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="meter-value"><strong>' + U.esc(value) + '</strong><span>' + unit + '</span></div>' +
      (r.notes ? '<p class="muted small-text">' + U.esc(r.notes) + '</p>' : '') +
    '</article>';
  }

  async function render(el) {
    const state = SB.getState();
    if (!state.configured || !SB.user) {
      el.innerHTML =
        '<section class="page-head"><div><h1>Zählerstände</h1><p>Strom, Gas, Wasser & mehr – geräteübergreifend gespeichert.</p></div></section>' +
        Cloud.authCard('Anmeldung für Zählerstände', 'Melde dich an, um Zählerstände über dein Supabase-Konto auf Handy und Computer zu verwalten.');
      Cloud.bindAuthCard(el, () => { loaded = false; FIT.app.rerender(); });
      return;
    }

    el.innerHTML =
      '<section class="page-head"><div><h1>Zählerstände</h1><p>Strom, Gas, Wasser & mehr – gespeichert in Supabase.</p></div>' +
      '<div class="head-actions"><button class="btn primary" id="newMeter">' + UI.icon('plus') + ' Neuer Zählerstand</button></div></section>' +
      '<div id="metersBody">' + Cloud.loadingCard('Lade Zählerstände …') + '</div>';

    const body = el.querySelector('#metersBody');
    el.querySelector('#newMeter').addEventListener('click', () => openEditor());

    try {
      await ensureLoaded(!loaded);
      renderList(body);
    } catch (e) {
      lastError = Cloud.escapeErr(e);
      body.innerHTML = Cloud.errorCard(lastError, 'metersRetry');
      body.querySelector('#metersRetry')?.addEventListener('click', async () => {
        loaded = false;
        body.innerHTML = Cloud.loadingCard('Lade Zählerstände …');
        try { await ensureLoaded(true); renderList(body); }
        catch (err) { body.innerHTML = Cloud.errorCard(Cloud.escapeErr(err), 'metersRetry'); body.querySelector('#metersRetry')?.addEventListener('click', () => render(el)); }
      });
    }
  }

  function renderList(body) {
    if (!body) return;
    if (!cache.length) {
      body.innerHTML = UI.emptyState('📟', 'Noch keine Zählerstände', 'Erfasse deinen ersten Zählerstand – er wird sicher in deinem Konto gespeichert.',
        '<button class="btn primary" id="emptyNewMeter">' + UI.icon('plus') + ' Zählerstand erfassen</button>');
      body.querySelector('#emptyNewMeter')?.addEventListener('click', () => openEditor());
      return;
    }
    body.innerHTML = '<div class="meters-list">' + cache.map(rowCard).join('') + '</div>';
    body.querySelectorAll('[data-edit-meter]').forEach((b) => b.addEventListener('click', () => {
      const r = cache.find((x) => String(x.id) === String(b.dataset.editMeter));
      if (r) openEditor(r);
    }));
    body.querySelectorAll('[data-del-meter]').forEach((b) => b.addEventListener('click', () => removeReading(b.dataset.delMeter)));
  }

  function openEditor(reading) {
    const r = reading || {};
    const body =
      '<div class="form-grid two">' +
        UI.field('Zähler / Bezeichnung', UI.input('meter_name', 'text', r.meter_name || '', 'required maxlength="120" placeholder="z. B. Strom Keller"')) +
        UI.field('Ablesezeitpunkt', '<input class="input" name="reading_at" type="datetime-local" value="' + U.esc(toInputDateTime(r.reading_at || new Date().toISOString())) + '" required>') +
      '</div>' +
      '<div class="form-grid two">' +
        UI.field('Wert', UI.input('reading_value', 'number', r.reading_value == null ? '' : r.reading_value, 'required step="any" placeholder="z. B. 12345,6"')) +
        UI.field('Einheit', UI.input('unit', 'text', r.unit || '', 'maxlength="30" placeholder="z. B. kWh, m³"')) +
      '</div>' +
      UI.field('Notizen (optional)', '<textarea class="input" name="notes" rows="3" maxlength="500" placeholder="Hinweise …">' + U.esc(r.notes || '') + '</textarea>');

    UI.openModal({
      title: reading ? 'Zählerstand bearbeiten' : 'Neuer Zählerstand',
      body,
      wide: false,
      submitLabel: reading ? 'Aktualisieren' : 'Speichern',
      async onSubmit(form) {
        const meter_name = String(form.meter_name.value || '').trim();
        const reading_at_raw = form.reading_at.value;
        const reading_value_raw = String(form.reading_value.value || '').replace(',', '.');
        const unit = String(form.unit.value || '').trim();
        const notes = String(form.notes.value || '').trim();
        if (!meter_name) throw new Error('Bitte eine Bezeichnung angeben.');
        if (!reading_at_raw) throw new Error('Bitte einen Zeitpunkt angeben.');
        if (reading_value_raw === '' || !Number.isFinite(Number(reading_value_raw))) throw new Error('Bitte einen gültigen Wert angeben.');
        const payload = {
          meter_name,
          reading_value: Number(reading_value_raw),
          unit: unit || null,
          reading_at: new Date(reading_at_raw).toISOString(),
          notes: notes || null
        };
        const client = SB.requireClient();
        if (reading && reading.id) {
          const { error } = await client.from('meter_readings').update(payload).eq('id', reading.id);
          if (error) throw new Error(Cloud.escapeErr(error));
          UI.toast('Zählerstand aktualisiert');
        } else {
          // user_id nicht selbst übermitteln – wird durch DB/Auth gesetzt
          const { error } = await client.from('meter_readings').insert(payload);
          if (error) throw new Error(Cloud.escapeErr(error));
          UI.toast('Zählerstand gespeichert');
        }
        loaded = false;
        FIT.app.rerender();
      }
    });
  }

  async function removeReading(id) {
    const r = cache.find((x) => String(x.id) === String(id));
    const ok = await UI.confirm({ title: 'Zählerstand löschen', message: '„' + (r ? r.meter_name : 'Zählerstand') + '“ wird dauerhaft entfernt.' });
    if (!ok) return;
    try {
      const client = SB.requireClient();
      const { error } = await client.from('meter_readings').delete().eq('id', id);
      if (error) throw error;
      UI.toast('Zählerstand gelöscht');
      loaded = false;
      FIT.app.rerender();
    } catch (e) {
      UI.toast(Cloud.escapeErr(e), 'error');
    }
  }

  function reset() { cache = []; loaded = false; loading = false; lastError = null; }

  try {
    SB.onChange((state) => {
      if (!state.user) { reset(); }
      else { loaded = false; }
    });
  } catch (e) {}

  return { render, reset };
})();
