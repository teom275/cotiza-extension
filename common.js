// Código compartido entre background y popup. Sin dependencias.
const DEFAULTS = { base: 'ARS', quote: 'USD', badge: 'blue', tickers: ['SPY', 'QQQ'], provider: 'yahoo', finnhubKey: '' };
const TTL = 60 * 1000;

const getSettings = async () => ({ ...DEFAULTS, ...(await chrome.storage.local.get(Object.keys(DEFAULTS))) });

const getJSON = async (url) => {
  const r = await fetch(url, { credentials: 'omit', cache: 'no-store' });
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

async function fetchFx({ base, quote }) {
  if (base === 'ARS' && quote === 'USD') {
    const rows = await getJSON('https://dolarapi.com/v1/dolares');
    return { kind: 'ars', rows: rows.map(({ casa, nombre, compra, venta }) => ({ casa, nombre, compra, venta })) };
  }
  const d = await getJSON(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.min.json`);
  const rate = d[base.toLowerCase()]?.[quote.toLowerCase()];
  if (!rate) throw new Error('par no disponible');
  return { kind: 'pair', rate };
}

async function fetchFinnhub(sym, key) {
  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}`, { credentials: 'omit', cache: 'no-store', headers: { 'X-Finnhub-Token': key } });
  if (!r.ok) throw new Error(r.status);
  const d = await r.json();
  if (!d.c) throw new Error('no encontrado');
  return { sym, price: d.c, prev: d.pc, currency: 'USD', spark: [] };
}

async function fetchStock(sym) {
  const d = await getJSON(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1mo&interval=1d`);
  const res = d.chart?.result?.[0];
  if (!res) throw new Error('no encontrado');
  const { regularMarketPrice: price, regularMarketTime: t, currency } = res.meta;
  const closes = (res.indicators.quote[0].close || []).filter((x) => x != null);
  const ts = res.timestamp || [];
  const today = ts.length && new Date(ts[ts.length - 1] * 1000).toDateString() === new Date(t * 1000).toDateString();
  const prev = closes[closes.length - (today ? 2 : 1)] ?? price;
  return { sym, price, prev, currency, spark: closes.slice(-22) };
}

// Refresca y cachea. Devuelve el caché si es reciente (salvo force).
async function refresh(force) {
  const s = await getSettings();
  const { cache } = await chrome.storage.local.get('cache');
  const key = JSON.stringify([s.base, s.quote, s.tickers, s.provider, s.finnhubKey]);
  if (!force && cache && cache.key === key && Date.now() - cache.t < TTL) return cache;
  const [fx, ...st] = await Promise.allSettled([fetchFx(s), ...s.tickers.map((t) => (s.provider === 'finnhub' && s.finnhubKey ? fetchFinnhub(t, s.finnhubKey) : fetchStock(t)))]);
  const out = {
    key, t: Date.now(),
    fx: fx.status === 'fulfilled' ? fx.value : cache?.fx,
    stocks: st.map((r, i) => (r.status === 'fulfilled' ? r.value : cache?.stocks?.find((x) => x.sym === s.tickers[i]) || { sym: s.tickers[i], err: true })),
    fxErr: fx.status !== 'fulfilled',
  };
  await chrome.storage.local.set({ cache: out });
  return out;
}

function badgeText(c, s) {
  let v;
  if (c.fx?.kind === 'ars') v = c.fx.rows.find((r) => r.casa === s.badge)?.venta;
  else v = c.fx?.rate;
  if (v == null) return '';
  return v >= 100 ? String(Math.round(v)) : String(+v.toPrecision(3)).slice(0, 4);
}
