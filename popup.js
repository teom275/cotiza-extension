const $ = (id) => document.getElementById(id);
const CUR = 'ARS USD EUR BRL GBP JPY CNY CLP UYU MXN COP CAD CHF BTC ETH'.split(' ');
const fmt = (n, d = 2) => n == null ? '–' : n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const el = (t, c, h) => Object.assign(document.createElement(t), { className: c || '', innerHTML: h ?? '' });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function bars(pts) {
  if (!pts?.length) return '';
  const lo = Math.min(...pts), r = Math.max(...pts) - lo || 1;
  return `<div class="bars">${pts.map((v) => `<i style="height:${18 + ((v - lo) / r) * 82}%"></i>`).join('')}</div>`;
}
const money = (n) => { const [i, d] = fmt(n, 2).split(','); return `<sup>$</sup>${i}${d !== '00' ? `<small class="label">,${d}</small>` : ''}`; };

function render(c, s) {
  $('upd').textContent = c.fxErr ? 'sin conexión' : 'act. ' + new Date(c.t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const fx = $('fx'); fx.replaceChildren();
  $('badgeRow').hidden = !(s.badgeOn && s.base === 'ARS' && s.quote === 'USD');
  if (c.fx?.kind === 'ars') {
    $('badge').replaceChildren(...c.fx.rows.map((r) => Object.assign(el('option', '', esc(r.nombre)), { value: r.casa, selected: r.casa === s.badge })));
    const hero = c.fx.rows.find((r) => r.casa === s.badge) || c.fx.rows[0];
    fx.append(el('div', 'card hero', `<div class="label">Dólar ${esc(hero.nombre)}</div><div class="big">${money(hero.venta)}</div><span class="pill">${hero.compra ? `compra ${fmt(hero.compra, 0)}` : 'venta'}</span>`));
    const g = el('div', 'grid');
    for (const r of c.fx.rows) if (r !== hero) g.append(el('div', 'card', `<div class="label">${esc(r.nombre)}</div><div class="v">$${fmt(r.venta, 0)}</div>`));
    fx.append(g);
  } else if (c.fx?.kind === 'pair') {
    fx.append(el('div', 'card hero', `<div class="label">1 ${esc(s.base)} equivale a</div><div class="big">${fmt(c.fx.rate, 4)} <small class="label">${esc(s.quote)}</small></div><span class="pill">1 ${esc(s.quote)} = ${fmt(1 / c.fx.rate, 4)} ${esc(s.base)}</span>`));
  } else fx.append(el('div', 'err', 'Sin datos todavía'));

  const st = $('stocks'); st.replaceChildren();
  for (const k of c.stocks) {
    const x = `<button class="x" data-s="${esc(k.sym)}" title="Quitar">✕</button>`;
    if (k.err) { st.append(el('div', 'card stock', `<div class="sym">${esc(k.sym)}</div><div class="label">no disponible</div>${x}`)); continue; }
    const pct = ((k.price - k.prev) / k.prev) * 100, up = pct >= 0;
    st.append(el('div', 'card stock', `<div class="top"><div><div class="sym">${esc(k.sym)}</div><span class="pill ${up ? 'up' : ''}">${up ? '▲' : '▼'} ${fmt(Math.abs(pct))}%</span></div><div class="px">${fmt(k.price)}<div class="label">${esc(k.currency || '')}</div></div></div>${bars(k.spark)}${x}`));
  }
  for (const row of st.children) { row.draggable = true; row.dataset.s = row.querySelector('.x').dataset.s; }
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
  let drag;
  $('stocks').ondragstart = (e) => { drag = e.target.closest('.stock')?.dataset.s; };
  $('stocks').ondragover = (e) => { if (drag) e.preventDefault(); };
  $('stocks').ondrop = async (e) => {
    const to = e.target.closest('.stock')?.dataset.s;
    if (!drag || !to || drag === to) return;
    const t = (await getSettings()).tickers, i = t.indexOf(to);
    t.splice(t.indexOf(drag), 1);
    t.splice(i, 0, drag);
    drag = null; await chrome.storage.local.set({ tickers: t }); load(true);
  };
  $('badgeOn').value = s.badgeOn ? '1' : '0';
  $('badgeOn').onchange = async () => { await chrome.storage.local.set({ badgeOn: $('badgeOn').value === '1' }); load(true); };
  $('badge').onchange = () => chrome.storage.local.set({ badge: $('badge').value });
  for (const b of document.querySelectorAll('nav button')) b.onclick = () => {
    for (const x of document.querySelectorAll('nav button')) x.classList.toggle('on', x === b);
    for (const v of ['fxView', 'stView', 'settings']) $(v).hidden = v !== b.dataset.v;
  };
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
