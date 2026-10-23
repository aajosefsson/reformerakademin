// Delad konfiguration för innehåll som kan ändras i adminsidan.
// Varje fält pekar på ett element på en sida (selektor). Vill du göra fler texter
// redigerbara lägger du bara till en rad här, i rätt sektion.
// Lägg INTE till känsliga uppgifter här. Den här filen är publik.

export const PAGES = {
  'index': 'index.html',
  'utbildningar': 'utbildningar.html',
  'om-oss': 'om-oss.html',
};

const T = 'text';       // enradig text
const A = 'textarea';   // flera rader

// sel = CSS-selektor. mode: 'text' (hela elementets text) eller 'firstText' (första textnoden).
function f(id, label, type, page, sel, mode) {
  return { id, label, type, targets: [{ page, sel, mode: mode || 'text' }] };
}

const stepNames = [1, 2, 3].map((i) => ({
  id: `step${i}Name`,
  label: `Steg ${i}, namn`,
  type: T,
  targets: [
    { page: 'index', sel: `.plans .plan:nth-child(${i}) h3`, mode: 'text' },
    { page: 'utbildningar', sel: `#steg-${i} .step-head h2`, mode: 'text' },
  ],
}));
const stepSummaries = [1, 2, 3].map((i) =>
  f(`step${i}Summary`, `Steg ${i}, kort beskrivning på startsidan`, A, 'index', `.plans .plan:nth-child(${i}) .summary`)
);

export const TEXT_SECTIONS = [
  {
    title: 'Startsidan',
    fields: [
      f('heroLine1', 'Rubrik, första raden', T, 'index', '.hero h1', 'firstText'),
      f('heroEm', 'Rubrik, kursiverad del', T, 'index', '.hero h1 em'),
      f('heroIntro', 'Ingress under rubriken', A, 'index', '.hero-sub p'),
      f('whyHeading', 'Rubrik: varför Reformerakademin', A, 'index', '.why-top h2'),
      f('why1Title', 'Punkt 1, rubrik', T, 'index', '.why-row:nth-child(1) h3'),
      f('why1Text', 'Punkt 1, text', A, 'index', '.why-row:nth-child(1) p'),
      f('why2Title', 'Punkt 2, rubrik', T, 'index', '.why-row:nth-child(2) h3'),
      f('why2Text', 'Punkt 2, text', A, 'index', '.why-row:nth-child(2) p'),
      f('why3Title', 'Punkt 3, rubrik', T, 'index', '.why-row:nth-child(3) h3'),
      f('why3Text', 'Punkt 3, text', A, 'index', '.why-row:nth-child(3) p'),
      f('why4Title', 'Punkt 4, rubrik', T, 'index', '.why-row:nth-child(4) h3'),
      f('why4Text', 'Punkt 4, text', A, 'index', '.why-row:nth-child(4) p'),
      f('plansHeading', 'Rubrik över utbildningskorten', T, 'index', '.pricing h2'),
      ...stepNames,
      ...stepSummaries,
      f('certNote', 'Text under korten om certifiering', A, 'index', '.plans-note'),
      f('teaserText', 'Text vid bilden på Carola och Jenny', A, 'index', '.teaser p'),
    ],
  },
  {
    title: 'Om oss',
    fields: [
      f('storyHeading', 'Rubrik', T, 'om-oss', '.story h2'),
      f('story1', 'Inledning, stycke 1', A, 'om-oss', '.story-text p:nth-of-type(1)'),
      f('story2', 'Inledning, stycke 2', A, 'om-oss', '.story-text p:nth-of-type(2)'),
      f('story3', 'Inledning, stycke 3', A, 'om-oss', '.story-text p:nth-of-type(3)'),
      f('jennyTitle', 'Jenny, titel', A, 'om-oss', '.bios article:nth-of-type(1) .bio-title'),
      f('jenny1', 'Jenny, stycke 1', A, 'om-oss', '.bios article:nth-of-type(1) .bio p:nth-of-type(2)'),
      f('jenny2', 'Jenny, stycke 2', A, 'om-oss', '.bios article:nth-of-type(1) .bio p:nth-of-type(3)'),
      f('carolaTitle', 'Carola, titel', A, 'om-oss', '.bios article:nth-of-type(2) .bio-title'),
      f('carola1', 'Carola, stycke 1', A, 'om-oss', '.bios article:nth-of-type(2) .bio p:nth-of-type(2)'),
      f('carola2', 'Carola, stycke 2', A, 'om-oss', '.bios article:nth-of-type(2) .bio p:nth-of-type(3)'),
      f('carolaQuote', 'Carola, citat', A, 'om-oss', '.bios article:nth-of-type(2) blockquote'),
      f('carola3', 'Carola, stycke 3', A, 'om-oss', '.bios article:nth-of-type(2) .bio p:nth-of-type(4)'),
    ],
  },
];

export const ALL_FIELDS = TEXT_SECTIONS.flatMap((s) => s.fields);

// Status för ett utbildningssteg
export const STATUS = {
  open: 'Anmälan öppen (visa datum)',
  full: 'Fullbokat',
  soon: 'Datum meddelas inom kort',
};
export const STATUS_TEXT = { full: 'Fullbokat', soon: 'Datum meddelas inom kort' };

export function pageName(pathname) {
  var last = (pathname || '').split('/').pop().replace(/\.html$/, '');
  return last || 'index';
}

// Läs/skriv text på ett element
export function readNode(el, mode) {
  if (!el) return '';
  if (mode === 'firstText') {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.textContent.trim()) return n.textContent.trim();
    }
    return '';
  }
  return el.textContent.replace(/\s+/g, ' ').trim();
}
export function writeNode(el, mode, value) {
  if (!el) return;
  if (mode === 'firstText') {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.textContent.trim()) { n.textContent = value; return; }
    }
    return;
  }
  el.textContent = value;
}
