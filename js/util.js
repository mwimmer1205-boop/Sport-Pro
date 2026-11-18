/* FitLog Pro – allgemeine Helfer */
window.FIT = window.FIT || {};

FIT.util = (() => {
  const esc = (str) => String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  let seq = 0;
  const uid = (prefix = 'id') => {
    seq += 1;
    return prefix + '-' + Date.now().toString(36) + '-' + seq.toString(36) + Math.random().toString(36).slice(2, 5);
  };

  const pad = (n) => String(n).padStart(2, '0');

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function toISO(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseISO(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return new Date();
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function addDays(iso, n) {
    const d = parseISO(iso);
    d.setDate(d.getDate() + n);
    return toISO(d);
  }

  function diffDays(a, b) {
    const da = parseISO(a), db = parseISO(b);
    return Math.round((da - db) / 86400000);
  }

  function startOfWeek(iso) {
    const d = parseISO(iso);
    const wd = (d.getDay() + 6) % 7; // Mo = 0
    d.setDate(d.getDate() - wd);
    return toISO(d);
  }

  const fmtNum = (n, dec = 0) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '0';
    return v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  function fmtDate(iso, opts = {}) {
    const d = parseISO(iso);
    const o = { weekday: opts.weekday ? 'short' : undefined, day: 'numeric', month: opts.month || 'short' };
    if (opts.year) o.year = 'numeric';
    try {
      return new Intl.DateTimeFormat('de-DE', o).format(d);
    } catch (e) {
      return iso;
    }
  }

  function fmtDateLong(iso) {
    const d = parseISO(iso);
    try {
      return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) {
      return iso;
    }
  }

  function fmtWeekday(iso) {
    try {
      return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(parseISO(iso));
    } catch (e) {
      return '';
    }
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const round1 = (n) => Math.round(Number(n || 0) * 10) / 10;

  function download(filename, content, mime = 'application/json') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(r.error);
      r.readAsText(file);
    });
  }

  function timestamp() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes());
  }

  return {
    esc, uid, todayISO, toISO, parseISO, addDays, diffDays, startOfWeek,
    fmtNum, fmtDate, fmtDateLong, fmtWeekday, clamp, round1, download,
    readTextFile, timestamp
  };
})();
