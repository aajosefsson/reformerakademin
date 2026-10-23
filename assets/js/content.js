// Hämtar redigerat innehåll från Firestore och lägger in det på sidan.
// HTML-filerna innehåller alltid grundtexterna, så sidan fungerar även om hämtningen misslyckas.
import { FIREBASE_CONFIG } from './firebase-config.js';
import { ALL_FIELDS, STATUS_TEXT, pageName, writeNode } from './content-config.js';

var CACHE_KEY = 'rk-content-v1';
var PAGE = pageName(location.pathname);

function parseDoc(doc) {
  var out = {};
  var fields = (doc && doc.fields) || {};
  Object.keys(fields).forEach(function (k) {
    var v = fields[k];
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('booleanValue' in v) out[k] = v.booleanValue;
  });
  return out;
}

function applyText(data) {
  ALL_FIELDS.forEach(function (field) {
    var value = data[field.id];
    if (typeof value !== 'string' || !value.trim()) return;
    field.targets.forEach(function (t) {
      if (t.page !== PAGE) return;
      writeNode(document.querySelector(t.sel), t.mode, value.trim());
    });
  });
}

function applySteps(data) {
  [1, 2, 3].forEach(function (i) {
    var status = data['step' + i + 'Status'];
    var date = data['step' + i + 'Date'];
    var price = data['step' + i + 'Price'];
    var text = null;
    if (status === 'full' || status === 'soon') text = STATUS_TEXT[status];
    else if (typeof date === 'string' && date.trim()) text = date.trim();

    var card = document.querySelector('.plans .plan:nth-child(' + i + ')');
    var cardBox = card && card.querySelector('.plan-date');
    var cardStrong = cardBox && cardBox.querySelector('strong');
    var step = document.getElementById('steg-' + i);
    var banner = step && step.querySelector('.next-date');
    var bannerStrong = banner && banner.querySelector('strong');
    var link = banner && banner.querySelector('.nd-link');

    if (text !== null) {
      if (cardStrong) cardStrong.textContent = text;
      if (bannerStrong) bannerStrong.textContent = text;
    }
    if (cardBox && status) cardBox.classList.toggle('soon', status !== 'open');
    if (link && status === 'full') link.textContent = 'Hör av dig om väntelista →';

    // Pris
    document.querySelectorAll('.dyn-price[data-step="' + i + '"]').forEach(function (n) { n.remove(); });
    if (typeof price === 'string' && price.trim()) {
      var label = 'Pris: ' + price.trim();
      if (cardBox) {
        var p = document.createElement('p');
        p.className = 'plan-price dyn-price';
        p.dataset.step = i;
        p.textContent = label;
        cardBox.parentNode.insertBefore(p, cardBox);
      }
      if (banner) {
        var q = document.createElement('p');
        q.className = 'step-price dyn-price';
        q.dataset.step = i;
        q.textContent = label;
        banner.parentNode.insertBefore(q, banner);
      }
    }
  });
}

function applyBanner(data) {
  var old = document.querySelector('.site-banner');
  if (old) old.remove();
  if (data.bannerOn !== true || !data.bannerText || !data.bannerText.trim()) return;
  var bar = document.createElement('div');
  bar.className = 'site-banner';
  bar.setAttribute('role', 'status');
  var span = document.createElement('span');
  span.textContent = data.bannerText.trim();
  bar.appendChild(span);
  var url = (data.bannerLink || '').trim();
  if (url && /^(https?:\/\/|[\w\-./#?=]+$)/.test(url)) {
    var a = document.createElement('a');
    a.href = url;
    a.textContent = 'Läs mer →';
    bar.appendChild(a);
  }
  document.body.insertBefore(bar, document.body.firstChild);
}

function applyAll(data) {
  applyText(data);
  applySteps(data);
  applyBanner(data);
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
}
function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
}

(function init() {
  if (!FIREBASE_CONFIG.projectId || FIREBASE_CONFIG.projectId.indexOf('KLISTRA') === 0) return;
  var cached = readCache();
  if (cached) applyAll(cached);

  var url = 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_CONFIG.projectId +
    '/databases/(default)/documents/site/content?key=' + encodeURIComponent(FIREBASE_CONFIG.apiKey);
  fetch(url, { cache: 'no-store' })
    .then(function (r) { return r.status === 404 ? { fields: {} } : r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (doc) {
      var fresh = parseDoc(doc);
      // Om admin har återställt något som fanns i cachen: ladda om en gång så att grundtexten kommer tillbaka
      var removed = cached && Object.keys(cached).some(function (k) { return !(k in fresh) || fresh[k] === ''; });
      writeCache(fresh);
      if (removed && !sessionStorage.getItem('rk-reloaded')) {
        sessionStorage.setItem('rk-reloaded', '1');
        location.reload();
        return;
      }
      applyAll(fresh);
    })
    .catch(function () { /* grundtexterna i HTML används */ });
})();
