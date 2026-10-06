'use strict';
const $ = (s, r = document) => r.querySelector(s);

/* ---------- icons (Lucide-style, stroke) ---------- */
const P = {
  plus: 'M5 12h14M12 5v14',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
  search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.3-4.3',
  import: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  export: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  chev: 'M6 9l6 6 6-6',
  back: 'M12 19l-7-7 7-7M19 12H5',
  sliders: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
  copy: 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zM4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2',
  cookie: 'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01'
};
const ic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${P[k]}"/></svg>`;
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = s => String(s).replace(/[&<>"]/g, m => ESC[m]);
const pad = n => String(n).padStart(2, '0');
const toLocalInput = ts => {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
function expiryText(ts) {
  const s = ts - Date.now() / 1000;
  if (s <= 0) return 'Expired';
  const m = s / 60, h = m / 60, d = h / 24;
  const t = m < 60 ? Math.max(1, Math.round(m)) + 'm' : h < 48 ? Math.round(h) + 'h' : d < 60 ? Math.round(d) + 'd' : d < 730 ? Math.round(d / 30) + 'mo' : Math.round(d / 365) + 'y';
  return 'Expires in ' + t;
}

/* ---------- settings ---------- */
const DEF = { theme: 'auto', accent: '#5b6cf5', sort: 'name', showDomain: false, confirmDeleteAll: true, exportMode: 'copy' };
const ACCENTS = ['#5b6cf5', '#8b5cf6', '#0d9488', '#e11d48', '#ea580c', '#16a34a'];
let S = { ...DEF };
const saveSettings = () => chrome.storage.local.set({ settings: S });
function applyTheme() {
  const t = S.theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : S.theme;
  document.documentElement.dataset.theme = t;
  document.documentElement.style.setProperty('--accent', S.accent);
}
function paintSettings() {
  document.querySelectorAll('[data-set]').forEach(el => {
    const k = el.dataset.set;
    if (el.classList.contains('seg')) el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === String(S[k])));
    else if (el.type === 'checkbox') el.checked = !!S[k];
    else el.value = S[k];
  });
  document.querySelectorAll('#swatches button').forEach(b => b.classList.toggle('on', b.dataset.v === S.accent));
}
function setSetting(k, v) {
  S[k] = v;
  saveSettings(); applyTheme(); paintSettings();
  if (k === 'sort') sortCookies();
  if ((k === 'sort' || k === 'showDomain') && url) render();
}

/* ---------- state ---------- */
let url, storeId;
let cookies = [];
let draft = null, openKey = null, openEl = null, filter = 'all';
const list = $('#list');
const F = { all: () => true, session: c => c.session, persistent: c => !c.session, secure: c => c.secure, httponly: c => c.httpOnly };

/* ---------- helpers ---------- */
let toastTimer;
function toast(msg, err = false, action) {
  const t = $('#toast');
  t.textContent = msg;
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.label;
    b.onclick = () => { t.className = ''; action.fn(); };
    t.append(b);
  }
  t.className = 'show' + (err ? ' err' : '') + (action ? ' act' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), action ? 5000 : 2200);
}
const keyOf = c => `${c.domain}|${c.path}|${c.name}`;
const bare = d => d.replace(/^\./, '');
const normDomain = c => (c.hostOnly ? bare(c.domain) : '.' + bare(c.domain));
const cookieUrl = c => `${c.secure ? 'https' : 'http'}://${bare(c.domain)}${c.path || '/'}`;
const mapSame = v => {
  v = String(v ?? '').toLowerCase();
  if (v === 'none' || v === 'no_restriction') return 'no_restriction';
  return v === 'lax' || v === 'strict' ? v : 'unspecified';
};
const cur = item => (item.dataset.i === 'new' ? draft : cookies[+item.dataset.i]);
const defaultExpiry = () => Math.floor(Date.now() / 1000) + 365 * 86400;

async function setCookie(c) {
  const d = {
    url: cookieUrl(c), name: c.name, value: c.value ?? '', path: c.path || '/',
    secure: !!c.secure, httpOnly: !!c.httpOnly, sameSite: c.sameSite || 'unspecified'
  };
  if (!c.hostOnly) d.domain = normDomain(c);
  if (!c.session && c.expirationDate) d.expirationDate = c.expirationDate;
  if (storeId) d.storeId = storeId;
  const res = await chrome.cookies.set(d);
  if (!res) throw new Error(chrome.runtime.lastError?.message || 'Browser rejected this cookie');
  return res;
}
function removeCookie(c) {
  const d = { url: cookieUrl(c), name: c.name };
  if (storeId) d.storeId = storeId;
  return chrome.cookies.remove(d);
}
async function restore(arr) {
  await Promise.allSettled(arr.map(setCookie));
  toast(`Restored ${arr.length} cookie${arr.length === 1 ? '' : 's'}`);
  await load();
}
function sortCookies() {
  const by = {
    name: (a, b) => a.name.localeCompare(b.name),
    domain: (a, b) => a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name),
    expiry: (a, b) => (a.expirationDate ?? Infinity) - (b.expirationDate ?? Infinity),
    size: (a, b) => b.name.length + b.value.length - a.name.length - a.value.length
  };
  cookies.sort(by[S.sort] || by.name);
}

/* ---------- init / load ---------- */
async function init() {
  const stored = await chrome.storage.local.get('settings');
  S = { ...DEF, ...(stored.settings || {}) };
  applyTheme();
  document.querySelectorAll('[data-icon]').forEach(e => (e.innerHTML = ic(e.dataset.icon)));
  $('#swatches').innerHTML = ACCENTS.map(c => `<button style="--c:${c}" data-v="${c}" title="${c}"></button>`).join('');
  $('#about').textContent = 'Cookie Manager v' + chrome.runtime.getManifest().version;

  const [[tab], stores] = await Promise.all([
    chrome.tabs.query({ active: true, currentWindow: true }),
    chrome.cookies.getAllCookieStores()
  ]);
  try {
    url = new URL(tab.url);
    if (!/^https?:$/.test(url.protocol)) throw 0;
  } catch {
    $('#host').textContent = 'Unsupported page';
    list.innerHTML = '<div class="empty">Cookies can only be managed on<br>regular http/https websites.</div>';
    document.querySelectorAll('#btnAdd,#btnImport,#btnExport,#btnDeleteAll,#search,#filters button').forEach(b => (b.disabled = true));
    return;
  }
  storeId = stores.find(s => s.tabIds.includes(tab.id))?.id;
  $('#host').textContent = url.hostname;
  $('#impHost').textContent = url.hostname;
  await load();
}
async function load() {
  const q = { url: url.href };
  if (storeId) q.storeId = storeId;
  cookies = await chrome.cookies.getAll(q);
  for (const c of cookies) c._h = `${c.name} ${c.value} ${c.domain}`.toLowerCase();
  sortCookies();
  render();
}

/* ---------- rendering (string based, single DOM write) ---------- */
function rowHtml(c, i) {
  const tags = (c.secure ? '<span class="tag">Secure</span>' : '') + (c.httpOnly ? '<span class="tag">HttpOnly</span>' : '');
  const v = c.value.length > 90 ? c.value.slice(0, 90) + '…' : c.value;
  const info = (S.showDomain ? esc(c.domain) + ' · ' : '') + (c.session ? 'Session' : expiryText(c.expirationDate));
  return `<div class="item" data-i="${i}"><div class="row"><div class="meta"><div class="top"><span class="nm">${esc(c.name || 'New cookie')}</span>${tags}</div><div class="val">${v ? esc(v) : '<i>empty</i>'}</div><div class="info">${info}</div></div><div class="acts"><button class="ib" data-act="copy" title="Copy value">${ic('copy')}</button><button class="ib danger" data-act="del" title="Delete">${ic('trash')}</button></div><span class="chev">${ic('chev')}</span></div></div>`;
}
function render() {
  openEl = null;
  const q = $('#search').value.trim().toLowerCase(), ff = F[filter];
  let html = draft ? rowHtml(draft, 'new') : '', shown = 0;
  for (let i = 0; i < cookies.length; i++) {
    const c = cookies[i];
    if (!ff(c) || (q && !c._h.includes(q))) continue;
    html += rowHtml(c, i);
    shown++;
  }
  list.innerHTML = html || `<div class="empty">${cookies.length ? 'No matching cookies' : 'No cookies for this site'}</div>`;
  const n = cookies.length;
  $('#count').textContent = q || filter !== 'all' ? `${shown} of ${n} cookies` : `${n} cookie${n === 1 ? '' : 's'}`;
  if (draft) openForm(list.firstElementChild);
  else if (openKey) {
    const idx = cookies.findIndex(c => keyOf(c) === openKey);
    const el = idx > -1 && list.querySelector(`[data-i="${idx}"]`);
    if (el) openForm(el);
  }
}

/* ---------- form (built lazily) ---------- */
function openForm(item) {
  if (openEl && openEl !== item) closeForm(openEl);
  const c = cur(item);
  item.classList.add('open');
  item.append(buildForm(c));
  openEl = item;
  if (item.dataset.i === 'new') $('.f-name', item).focus();
}
function closeForm(item) {
  if (item.dataset.i === 'new') { draft = null; item.remove(); }
  else { item.classList.remove('open'); $('.form', item)?.remove(); }
  if (openEl === item) openEl = null;
}
function buildForm(c) {
  const f = document.createElement('div');
  f.className = 'form';
  f.innerHTML = `
    <div class="fld"><label>Name</label><input type="text" class="f-name" spellcheck="false"></div>
    <div class="fld"><label>Value</label><textarea class="f-value" rows="3" spellcheck="false"></textarea></div>
    <button class="adv-toggle" data-act="adv">Advanced ${ic('chev')}</button>
    <div class="adv hidden">
      <div class="grid2">
        <div class="fld"><label>Domain</label><input type="text" class="f-domain" spellcheck="false"></div>
        <div class="fld"><label>Path</label><input type="text" class="f-path" spellcheck="false"></div>
      </div>
      <div class="grid2">
        <div class="fld"><label>Expires</label><input type="datetime-local" step="1" class="f-exp"></div>
        <div class="fld"><label>SameSite</label><select class="f-same"><option value="unspecified">Unspecified</option><option value="no_restriction">None</option><option value="lax">Lax</option><option value="strict">Strict</option></select></div>
      </div>
      <div class="chips">
        <label class="chip"><input type="checkbox" class="f-host"><span>Host only</span></label>
        <label class="chip"><input type="checkbox" class="f-session"><span>Session</span></label>
        <label class="chip"><input type="checkbox" class="f-secure"><span>Secure</span></label>
        <label class="chip"><input type="checkbox" class="f-http"><span>HttpOnly</span></label>
      </div>
    </div>
    <div class="actions"><button class="btn ghost danger" data-act="del">Delete</button><button class="btn primary" data-act="save">Save</button></div>`;
  $('.f-name', f).value = c.name;
  $('.f-value', f).value = c.value;
  $('.f-domain', f).value = c.domain;
  $('.f-path', f).value = c.path;
  $('.f-exp', f).value = c.expirationDate ? toLocalInput(c.expirationDate) : '';
  $('.f-same', f).value = c.sameSite || 'unspecified';
  $('.f-host', f).checked = !!c.hostOnly;
  $('.f-session', f).checked = !!c.session;
  $('.f-secure', f).checked = !!c.secure;
  $('.f-http', f).checked = !!c.httpOnly;
  $('.f-exp', f).disabled = !!c.session;
  return f;
}

async function saveForm(item) {
  const f = $('.form', item), c = cur(item), isNew = item.dataset.i === 'new';
  const n = {
    name: $('.f-name', f).value.trim(), value: $('.f-value', f).value,
    domain: $('.f-domain', f).value.trim() || url.hostname, path: $('.f-path', f).value.trim() || '/',
    hostOnly: $('.f-host', f).checked, session: $('.f-session', f).checked,
    secure: $('.f-secure', f).checked, httpOnly: $('.f-http', f).checked, sameSite: $('.f-same', f).value
  };
  if (!n.name) return toast('Name is required', true);
  if (!n.session) {
    const t = new Date($('.f-exp', f).value).getTime();
    if (isNaN(t)) return toast('Invalid expiration date', true);
    n.expirationDate = t / 1000;
  }
  try {
    await setCookie(n);
    const newKey = keyOf({ domain: normDomain(n), path: n.path, name: n.name });
    if (!isNew && keyOf(c) !== newKey) await removeCookie(c);
    draft = null;
    openKey = newKey;
    toast('Cookie saved');
    await load();
  } catch (e) {
    toast(e.message || 'Could not save cookie', true);
  }
}

async function deleteItem(item) {
  if (item.dataset.i === 'new') return closeForm(item);
  const c = cur(item);
  cookies = cookies.filter(x => x !== c);
  if (openKey === keyOf(c)) openKey = null;
  render();
  try { await removeCookie(c); toast('Cookie deleted', false, { label: 'Undo', fn: () => restore([c]) }); }
  catch { toast('Delete failed', true); load(); }
}

/* ---------- list events (delegated) ---------- */
list.addEventListener('click', e => {
  const item = e.target.closest('.item');
  if (!item) return;
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'del') return deleteItem(item);
  if (act === 'save') return saveForm(item);
  if (act === 'copy') {
    navigator.clipboard.writeText(cur(item).value).then(() => toast('Value copied'), () => toast('Copy failed', true));
    return;
  }
  if (act === 'adv') {
    e.target.closest('.adv-toggle').classList.toggle('on');
    $('.adv', item).classList.toggle('hidden');
    return;
  }
  if (e.target.closest('.form')) return;
  if (item.classList.contains('open')) { openKey = null; closeForm(item); }
  else { openKey = item.dataset.i === 'new' ? null : keyOf(cur(item)); openForm(item); }
});
list.addEventListener('change', e => {
  if (e.target.classList.contains('f-session')) $('.f-exp', e.target.closest('.form')).disabled = e.target.checked;
});
list.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('input[type=text]')) saveForm(e.target.closest('.item'));
});
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('on', x === b));
  render();
});

/* ---------- toolbar ---------- */
function addNew() {
  draft = {
    name: '', value: '', domain: url.hostname, path: '/', hostOnly: true, session: false,
    secure: url.protocol === 'https:', httpOnly: false, sameSite: 'unspecified', expirationDate: defaultExpiry()
  };
  $('#search').value = ''; filter = 'all';
  document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('on', x.dataset.f === 'all'));
  render();
  list.scrollTop = 0;
}
let armTimer;
async function deleteAll() {
  const b = $('#btnDeleteAll');
  if (!cookies.length) return toast('No cookies to delete', true);
  if (S.confirmDeleteAll && !b.classList.contains('armed')) {
    b.classList.add('armed');
    toast(`Click again to delete all ${cookies.length} cookies`);
    clearTimeout(armTimer);
    armTimer = setTimeout(() => b.classList.remove('armed'), 3000);
    return;
  }
  clearTimeout(armTimer);
  b.classList.remove('armed');
  const all = cookies;
  cookies = []; openKey = null;
  render();
  await Promise.all(all.map(removeCookie));
  toast('All cookies deleted', false, { label: 'Undo', fn: () => restore(all) });
}

/* ---------- export ---------- */
async function doExport(fmt) {
  $('#exportMenu').classList.add('hidden');
  if (!cookies.length) return toast('No cookies to export', true);
  let out;
  if (fmt === 'json') {
    out = JSON.stringify(cookies.map(c => ({
      domain: c.domain, expirationDate: c.expirationDate, hostOnly: c.hostOnly, httpOnly: c.httpOnly,
      name: c.name, path: c.path, sameSite: c.sameSite, secure: c.secure, session: c.session,
      storeId: c.storeId, value: c.value
    })), null, 2);
  } else if (fmt === 'header') {
    out = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  } else {
    out = '# Netscape HTTP Cookie File\n' + cookies.map(c => [
      (c.httpOnly ? '#HttpOnly_' : '') + c.domain, c.hostOnly ? 'FALSE' : 'TRUE', c.path,
      c.secure ? 'TRUE' : 'FALSE', c.session ? 0 : Math.floor(c.expirationDate), c.name, c.value
    ].join('\t')).join('\n');
  }
  if (S.exportMode === 'file') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
    a.download = `${url.hostname}-cookies.${fmt === 'json' ? 'json' : 'txt'}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Downloaded ${cookies.length} cookies`);
  } else {
    try { await navigator.clipboard.writeText(out); toast(`Copied ${cookies.length} cookies`); }
    catch { toast('Clipboard write failed', true); }
  }
}

/* ---------- import ---------- */
function normalizeJson(o) {
  if (!o || !o.name) return null;
  const dom = o.domain || url.hostname;
  const exp = o.expirationDate ?? o.expires ?? o.expiry;
  return {
    name: String(o.name), value: String(o.value ?? ''), domain: dom, path: o.path || '/',
    secure: !!o.secure, httpOnly: !!o.httpOnly, hostOnly: o.hostOnly ?? !String(dom).startsWith('.'),
    session: o.session ?? !exp, expirationDate: exp ? Number(exp) : undefined, sameSite: mapSame(o.sameSite)
  };
}
function parseNetscape(text) {
  const out = [];
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line) continue;
    let httpOnly = false;
    if (line.startsWith('#HttpOnly_')) { httpOnly = true; line = line.slice(10); }
    else if (line.startsWith('#')) continue;
    let f = line.split('\t');
    if (f.length < 7) f = line.split(/\s+/);
    if (f.length < 7) continue;
    const [domain, incl, path, secure, exp, name, ...rest] = f;
    const e = Number(exp);
    out.push({
      name, value: rest.join(' '), domain, path, httpOnly, secure: secure.toUpperCase() === 'TRUE',
      hostOnly: incl.toUpperCase() !== 'TRUE', session: !e, expirationDate: e || undefined, sameSite: 'unspecified'
    });
  }
  return out;
}
function parseHeader(text) {
  const exp = defaultExpiry();
  return text.replace(/^cookie:\s*/i, '').split(';').map(p => p.trim()).filter(Boolean).map(p => {
    const i = p.indexOf('=');
    if (i < 1) return null;
    return {
      name: p.slice(0, i).trim(), value: p.slice(i + 1).trim(), domain: url.hostname, path: '/', hostOnly: true,
      session: false, secure: url.protocol === 'https:', httpOnly: false, sameSite: 'unspecified', expirationDate: exp
    };
  }).filter(Boolean);
}
function parseImport(text) {
  text = text.trim();
  if (!text) throw new Error('Nothing to import');
  if (text[0] === '[' || text[0] === '{') {
    const j = JSON.parse(text);
    return (Array.isArray(j) ? j : [j]).map(normalizeJson).filter(Boolean);
  }
  if (/^# Netscape/i.test(text) || text.includes('\t') || text.includes('\n')) return parseNetscape(text);
  return parseHeader(text);
}
async function doImport() {
  let items;
  try { items = parseImport($('#importText').value); }
  catch (e) { return toast('Could not parse: ' + e.message, true); }
  if (!items.length) return toast('No valid cookies found', true);
  const res = await Promise.allSettled(items.map(setCookie));
  const ok = res.filter(r => r.status === 'fulfilled').length;
  const bad = res.find(r => r.status === 'rejected');
  toast(ok === items.length ? `Imported ${ok} cookies` : `Imported ${ok}/${items.length}. ${bad?.reason?.message || ''}`, ok === 0);
  if (ok) { $('#importText').value = ''; showView('main'); await load(); }
}

/* ---------- views & wiring ---------- */
const VIEWS = { main: '#mainView', import: '#importView', settings: '#settingsView' };
function showView(v) {
  for (const k in VIEWS) $(VIEWS[k]).classList.toggle('hidden', k !== v);
  if (v === 'import') $('#importText').focus();
  if (v === 'settings') paintSettings();
}
let searchTimer;
$('#search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(render, 80); });
$('#btnAdd').onclick = addNew;
$('#btnDeleteAll').onclick = deleteAll;
$('#btnImport').onclick = () => showView('import');
$('#btnSettings').onclick = () => showView('settings');
document.querySelectorAll('.back').forEach(b => (b.onclick = () => showView('main')));
$('#btnDoImport').onclick = doImport;
$('#btnExport').onclick = e => {
  e.stopPropagation();
  $('#menuTitle').textContent = S.exportMode === 'file' ? 'Download as' : 'Copy to clipboard as';
  $('#exportMenu').classList.toggle('hidden');
};
$('#exportMenu').onclick = e => { const b = e.target.closest('[data-fmt]'); if (b) doExport(b.dataset.fmt); e.stopPropagation(); };
document.addEventListener('click', () => $('#exportMenu').classList.add('hidden'));

/* settings events */
$('#settingsView').addEventListener('click', e => {
  const seg = e.target.closest('.seg button');
  if (seg) return setSetting(seg.parentElement.dataset.set, seg.dataset.v);
  const sw = e.target.closest('#swatches button');
  if (sw) return setSetting('accent', sw.dataset.v);
});
$('#settingsView').addEventListener('change', e => {
  const el = e.target, k = el.dataset.set;
  if (!k) return;
  if (el.type === 'checkbox') setSetting(k, el.checked);
  else setSetting(k, el.value);
});
$('#btnReset').onclick = () => {
  S = { ...DEF };
  saveSettings(); applyTheme(); paintSettings(); sortCookies();
  if (url) render();
  toast('Settings reset');
};

init();
