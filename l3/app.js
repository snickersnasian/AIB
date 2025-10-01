


/* app.js — Minimal Event Logger logic for a static site (no dependencies). */

/**
 * Read stable pseudo user id from localStorage or create one.
 * @returns {string} A persistent pseudo-random user identifier.
 */
function getOrCreateUserId() {
  const KEY = 'uid';
  let uid = localStorage.getItem(KEY);
  if (uid && typeof uid === 'string' && uid.length >= 12) return uid;
  // Generate short, stable pseudo id. Avoids crypto.randomUUID for broader support.
  const rand = () => Math.random().toString(36).slice(2, 10);
  uid = `u_${Date.now().toString(36)}_${rand()}_${rand()}`;
  localStorage.setItem(KEY, uid);
  return uid;
}

/**
 * Read GAS Web App URL from localStorage.
 * @returns {string|null} Saved URL or null.
 */
function readSavedGasUrl() {
  return localStorage.getItem('gas_url');
}

/**
 * Persist GAS Web App URL to localStorage after validation.
 * Updates status on success/failure.
 */
function saveGasUrl() {
  const input = document.getElementById('gasUrl');
  const url = input.value.trim();
  if (!url) return setStatus('Missing Web App URL');
  if (!isValidExecUrl(url)) return setStatus('Invalid URL (must end with /exec)');
  localStorage.setItem('gas_url', url);
  setStatus('Saved Web App URL');
}

/**
 * Validate that a string is a URL ending with /exec.
 * @param {string} url
 * @returns {boolean}
 */
function isValidExecUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.pathname.endsWith('/exec');
  } catch {
    return false;
  }
}

/**
 * Set a concise status message for the user.
 * @param {string} msg
 */
function setStatus(msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
}

/**
 * Send an event log via a CORS simple request (no custom headers).
 * Body is application/x-www-form-urlencoded through URLSearchParams.
 * @param {{event:string, variant?:string|null, meta?:Record<string,any>}} payload
 * @returns {Promise<void>}
 */
async function sendLogSimple(payload) {
  const gasUrl = readSavedGasUrl();
  if (!gasUrl) { setStatus('Missing Web App URL'); return; }
  if (!isValidExecUrl(gasUrl)) { setStatus('Invalid URL'); return; }

  const userId = getOrCreateUserId();
  const ts = Date.now();
  const meta = JSON.stringify({
    page: location.pathname,
    ua: navigator.userAgent,
    ...(payload.meta || {})
  });

  const body = new URLSearchParams();
  body.set('event', payload.event);
  body.set('variant', payload.variant ?? '');
  body.set('userId', userId);
  body.set('ts', String(ts));
  body.set('meta', meta);

  let resp;
  try {
    resp = await fetch(gasUrl, { method: 'POST', body });
  } catch (e) {
    setStatus('Network error');
    return;
  }
  if (!resp.ok) {
    setStatus(`HTTP ${resp.status}`);
    return;
  }
  setStatus('Logged');
}

/**
 * Wire UI events and hydrate from localStorage on page load.
 */
function init() {
  const gasInput = document.getElementById('gasUrl');
  const saved = readSavedGasUrl();
  if (saved) gasInput.value = saved;

  document.getElementById('saveUrl').addEventListener('click', saveGasUrl);

  document.getElementById('ctaA').addEventListener('click', () => {
    void sendLogSimple({ event: 'cta_click', variant: 'A' });
  });
  document.getElementById('ctaB').addEventListener('click', () => {
    void sendLogSimple({ event: 'cta_click', variant: 'B' });
  });
  document.getElementById('heartbeat').addEventListener('click', () => {
    void sendLogSimple({ event: 'heartbeat', variant: '' });
  });

  // Ensure uid exists early.
  getOrCreateUserId();
}

document.addEventListener('DOMContentLoaded', init);

