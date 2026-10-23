// Adminsidan: inloggning + formulär för att ändra innehåll. Sparar till Firestore (site/content).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { FIREBASE_CONFIG } from './firebase-config.js';
import { PAGES, TEXT_SECTIONS, ALL_FIELDS, STATUS, readNode } from './content-config.js';

var $ = function (id) { return document.getElementById(id); };
var app = initializeApp(FIREBASE_CONFIG);
var auth = getAuth(app);
var db = getFirestore(app);
var contentRef = doc(db, 'site', 'content');

var defaults = {};   // fält-id -> text som står i HTML-filerna
var inputs = {};     // fält-id -> inputelement
var built = false;

function el(tag, attrs, children) {
  var n = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === 'text') n.textContent = attrs[k];
    else if (k === 'class') n.className = attrs[k];
    else n.setAttribute(k, attrs[k]);
  });
  (children || []).forEach(function (c) { if (c) n.appendChild(c); });
  return n;
}

function say(node, text, kind) {
  node.textContent = text || '';
  node.dataset.kind = kind || '';
}

// ---- Hämta standardtexter från sidornas HTML ----
async function loadDefaults() {
  var docs = {};
  await Promise.all(Object.keys(PAGES).map(async function (key) {
    var res = await fetch(PAGES[key], { cache: 'no-store' });
    var html = await res.text();
    docs[key] = new DOMParser().parseFromString(html, 'text/html');
  }));
  ALL_FIELDS.forEach(function (f) {
    var t = f.targets[0];
    defaults[f.id] = readNode(docs[t.page].querySelector(t.sel), t.mode);
  });
  [1, 2, 3].forEach(function (i) {
    var strong = docs.index.querySelector('.plans .plan:nth-child(' + i + ') .plan-date strong');
    var text = strong ? strong.textContent.replace(/\s+/g, ' ').trim() : '';
    defaults['step' + i + 'Date'] = text;
    defaults['step' + i + 'Status'] = /meddelas/i.test(text) || !text ? 'soon' : 'open';
  });
}

// ---- Bygg formuläret ----
function textField(f, value) {
  var input = f.type === 'textarea'
    ? el('textarea', { id: 'f-' + f.id, rows: '3' })
    : el('input', { id: 'f-' + f.id, type: 'text' });
  input.value = value;
  inputs[f.id] = input;
  var reset = el('button', { type: 'button', class: 'link-btn small', text: 'Återställ' });
  reset.addEventListener('click', function () { input.value = defaults[f.id] || ''; });
  return el('div', { class: 'field' }, [
    el('div', { class: 'field-head' }, [el('label', { for: input.id, text: f.label }), reset]),
    input,
  ]);
}

function section(title, hint, children) {
  return el('fieldset', { class: 'card' }, [
    el('legend', { text: title }),
    hint ? el('p', { class: 'hint', text: hint }) : null,
  ].concat(children));
}

function buildForm(data) {
  var form = $('editor-form');
  form.textContent = '';
  inputs = {};

  // Banner
  var on = el('input', { id: 'f-bannerOn', type: 'checkbox' });
  on.checked = data.bannerOn === true;
  inputs.bannerOn = on;
  var bText = el('input', { id: 'f-bannerText', type: 'text', maxlength: '160' });
  bText.value = data.bannerText || '';
  inputs.bannerText = bText;
  var bLink = el('input', { id: 'f-bannerLink', type: 'text', placeholder: 't.ex. kontakt.html' });
  bLink.value = data.bannerLink || '';
  inputs.bannerLink = bLink;
  form.appendChild(section('Banner högst upp på sidan', 'Visas på alla sidor, till exempel “Anmälan öppen till höstens kurs”.', [
    el('label', { class: 'check' }, [on, el('span', { text: 'Visa bannern' })]),
    el('div', { class: 'field' }, [el('label', { for: bText.id, text: 'Text' }), bText]),
    el('div', { class: 'field' }, [el('label', { for: bLink.id, text: 'Länk (valfritt)' }), bLink]),
  ]));

  // Utbildningar
  var stepCards = [1, 2, 3].map(function (i) {
    var status = el('select', { id: 'f-step' + i + 'Status' });
    Object.keys(STATUS).forEach(function (k) { status.appendChild(el('option', { value: k, text: STATUS[k] })); });
    status.value = data['step' + i + 'Status'] || defaults['step' + i + 'Status'];
    inputs['step' + i + 'Status'] = status;

    var date = el('input', { id: 'f-step' + i + 'Date', type: 'text', placeholder: 't.ex. Söndag 15/11, kl. 9–17' });
    date.value = data['step' + i + 'Date'] || (defaults['step' + i + 'Status'] === 'open' ? defaults['step' + i + 'Date'] : '');
    inputs['step' + i + 'Date'] = date;

    var price = el('input', { id: 'f-step' + i + 'Price', type: 'text', placeholder: 't.ex. 4 500 kr' });
    price.value = data['step' + i + 'Price'] || '';
    inputs['step' + i + 'Price'] = price;

    return el('div', { class: 'step-card' }, [
      el('h3', { text: 'Steg ' + i }),
      el('div', { class: 'field' }, [el('label', { for: status.id, text: 'Status' }), status]),
      el('div', { class: 'field' }, [el('label', { for: date.id, text: 'Datum och tid (visas när anmälan är öppen)' }), date]),
      el('div', { class: 'field' }, [el('label', { for: price.id, text: 'Pris (valfritt, visas om du fyller i)' }), price]),
    ]);
  });
  form.appendChild(section('Nästa utbildningstillfälle', 'Syns i rutan på utbildningskorten och på varje stegs sida.', [el('div', { class: 'steps-grid' }, stepCards)]));

  // Texter
  TEXT_SECTIONS.forEach(function (s) {
    form.appendChild(section(s.title, 'Texterna fylls i från sidan som den ser ut nu. Ändra bara det du vill byta.',
      s.fields.map(function (f) { return textField(f, data[f.id] || defaults[f.id] || ''); })));
  });
  built = true;
}

// ---- Spara ----
function collect() {
  var out = {};
  out.bannerOn = inputs.bannerOn.checked;
  out.bannerText = inputs.bannerText.value.trim();
  out.bannerLink = inputs.bannerLink.value.trim();
  [1, 2, 3].forEach(function (i) {
    var status = inputs['step' + i + 'Status'].value;
    var date = inputs['step' + i + 'Date'].value.trim();
    var price = inputs['step' + i + 'Price'].value.trim();
    if (status !== defaults['step' + i + 'Status']) out['step' + i + 'Status'] = status;
    if (status === 'open' && date && date !== defaults['step' + i + 'Date']) out['step' + i + 'Date'] = date;
    else if (status === 'open' && date && defaults['step' + i + 'Status'] === 'soon') out['step' + i + 'Date'] = date;
    if (price) out['step' + i + 'Price'] = price;
  });
  ALL_FIELDS.forEach(function (f) {
    var v = inputs[f.id].value.trim();
    if (v && v !== (defaults[f.id] || '')) out[f.id] = v;
  });
  return out;
}

async function save() {
  var btn = $('save');
  var msg = $('save-msg');
  btn.disabled = true;
  say(msg, 'Sparar…');
  try {
    await setDoc(contentRef, collect());
    say(msg, 'Sparat. Ändringarna syns nu på sidan.', 'ok');
  } catch (e) {
    say(msg, 'Det gick inte att spara' + (e && e.code === 'permission-denied' ? ': kontot saknar behörighet.' : '. Försök igen.'), 'err');
  }
  btn.disabled = false;
}

// ---- Inloggning ----
var LOGIN_ERRORS = {
  'auth/invalid-credential': 'Fel e-post eller lösenord.',
  'auth/invalid-email': 'Kontrollera e-postadressen.',
  'auth/too-many-requests': 'För många försök. Vänta en stund och försök igen.',
  'auth/network-request-failed': 'Nätverksfel. Kontrollera anslutningen.',
};

$('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  say($('login-msg'), 'Loggar in…');
  try {
    await signInWithEmailAndPassword(auth, $('email').value.trim(), $('password').value);
    say($('login-msg'), '');
  } catch (err) {
    say($('login-msg'), LOGIN_ERRORS[err.code] || 'Det gick inte att logga in.', 'err');
  }
});
$('reset').addEventListener('click', async function () {
  var email = $('email').value.trim();
  if (!email) { say($('login-msg'), 'Skriv din e-postadress ovan först.', 'err'); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    say($('login-msg'), 'Vi har skickat en länk för att välja nytt lösenord.', 'ok');
  } catch (err) {
    say($('login-msg'), 'Det gick inte att skicka länken.', 'err');
  }
});
$('logout').addEventListener('click', function () { signOut(auth); });
$('save').addEventListener('click', save);

onAuthStateChanged(auth, async function (user) {
  $('loading').hidden = true;
  if (!user) {
    $('login').hidden = false;
    $('editor').hidden = true;
    $('savebar').hidden = true;
    $('top-right').hidden = true;
    return;
  }
  $('login').hidden = true;
  $('top-right').hidden = false;
  $('loading').hidden = false;
  say($('loading'), 'Hämtar innehåll…');
  try {
    if (!Object.keys(defaults).length) await loadDefaults();
    var snap = await getDoc(contentRef);
    buildForm(snap.exists() ? snap.data() : {});
    $('editor').hidden = false;
    $('savebar').hidden = false;
    $('loading').hidden = true;
  } catch (err) {
    say($('loading'), 'Det gick inte att hämta innehållet. Ladda om sidan.', 'err');
  }
});
