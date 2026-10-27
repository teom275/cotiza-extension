const $ = (id) => document.getElementById(id);
const CUR = 'ARS USD EUR BRL GBP JPY CNY CLP UYU MXN COP CAD CHF BTC ETH'.split(' ');
const fmt = (n, d = 2) => n == null ? '–' : n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const el = (t, c, h) => Object.assign(document.createElement(t), { className: c || '', innerHTML: h ?? '' });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function spark(pts, up) {
  if (!pts?.length) return '';
  const lo = Math.min(...pts), hi = Math.max(...pts), r = hi - lo || 1;
  const p = pts.map((v, i) => `${(i / (pts.length - 1 || 1)) * 56},${20 - ((v - lo) / r) * 18}`).join(' ');
  return `<svg viewBox="0 0 56 22"><polyline points="${p}" fill="none" stroke="${up ? 'var(--up)' : 'var(--dn)'}" stroke-width="1.5"/></svg>`;
}

function render(c, s) {
  $('upd').textContent = c.fxErr ? 'sin conexión' : new Date(c.t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const fx = $('fx'); fx.replaceChildren();
  $('badgeRow').hidden = !(s.base === 'ARS' && s.quote === 'USD');
  if (c.fx?.kind === 'ars') {
    $('badge').replaceChildren(...c.fx.rows.map((r) => Object.assign(el('option', '', esc(r.nombre)), { value: r.casa, selected: r.casa === s.badge })));
    for (const r of c.fx.rows) fx.append(el('div', 'row', `<div class="n">${esc(r.nombre)}<small>compra ${fmt(r.compra, 0)}</small></div><div class="v"><b>$${fmt(r.venta, 0)}</b></div>`));
  } else if (c.fx?.kind === 'pair') {
    fx.append(el('div', 'row', `<div class="n">1 ${s.base}<small>1 ${s.quote} = ${fmt(1 / c.fx.rate, 4)} ${s.base}</small></div><div class="v"><b>${fmt(c.fx.rate, 4)} ${s.quote}</b></div>`));
  }
  const st = $('stocks'); st.replaceChildren();
  for (const k of c.stocks) {
    if (k.err) { st.append(el('div', 'row', `<div class="n">${esc(k.sym)}<small>no disponible</small></div><button class="x" data-s="${esc(k.sym)}">✕</button>`)); continue; }
    const d = k.price - k.prev, pct = (d / k.prev) * 100, up = d >= 0;
    st.append(el('div', 'row', `<div class="n">${esc(k.sym)}<small>${esc(k.currency || '')}</small></div>${spark(k.spark, up)}<div class="v"><b>${fmt(k.price)}</b><small class="${up ? 'up' : 'dn'}" style="display:block">${up ? '+' : ''}${fmt(pct)}%</small></div><button class="x" data-s="${esc(k.sym)}">✕</button>`));
  }
}

async function load(force) {
  const s = await getSettings();
  try { render(await refresh(force), s); } catch { $('upd').textContent = 'error'; }
}

(async () => {
  const s = await getSettings();
  for (const id of ['base', 'quote']) {
    $(id).replaceChildren(...CUR.map((c) => Object.assign(el('option', '', c), { value: c, selected: c === s[id] })));
    $(id).onchange = async () => { await chrome.storage.local.set({ [id]: $(id).value }); load(true); };
  }
  $('badge').onchange = () => chrome.storage.local.set({ badge: $('badge').value });
  $('cfg').onclick = () => { $('settings').hidden = !$('settings').hidden; };
  $('stocks').onclick = async (e) => {
    const sym = e.target.dataset?.s; if (!sym) return;
    const cur = await getSettings();
    await chrome.storage.local.set({ tickers: cur.tickers.filter((t) => t !== sym) }); load(true);
  };
  $('add').onsubmit = async (e) => {
    e.preventDefault();
    const sym = $('sym').value.trim().toUpperCase().replace(/[^A-Z0-9.\-=^]/g, '');
    if (!sym) return;
    const cur = await getSettings();
    if (!cur.tickers.includes(sym)) await chrome.storage.local.set({ tickers: [...cur.tickers, sym] });
    $('sym').value = ''; load(true);
  };
  load(false);
})();
