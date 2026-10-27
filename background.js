if (typeof importScripts === 'function') importScripts('common.js');

// Solo se despierta cada 5 min para actualizar el badge; el resto del tiempo está inactivo.
async function update(force) {
  try {
    const [c, s] = [await refresh(force), await getSettings()];
    await chrome.action.setBadgeText({ text: badgeText(c, s) });
  } catch (e) { /* sin red: dejamos el badge como estaba */ }
}
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('tick', { periodInMinutes: 5 });
  chrome.action.setBadgeBackgroundColor({ color: '#3a3f4b' });
  chrome.action.setBadgeTextColor?.({ color: '#e6e8ee' });
  update(true);
});
chrome.runtime.onStartup.addListener(() => update(true));
chrome.alarms.onAlarm.addListener(() => update(true));
chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && (ch.base || ch.quote || ch.badge)) update(true); });
