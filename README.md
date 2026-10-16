# Reformerakademin — hemsida

Statisk sajt (ren HTML, CSS och lite JS). Inget byggsteg, inga beroenden.

## Mappstruktur

```
reformerakademin/
├── index.html          Startsida (hero, metod, varför, tre steg, om oss-teaser, CTA)
├── utbildningar.html   De tre utbildningsstegen med fullt innehåll, mål och examinering
├── om-oss.html         Om oss: Carola & Jenny
├── kontakt.html        Kontaktformulär (Netlify Forms)
├── tack.html           Visas efter skickat formulär
├── 404.html            Sida som visas vid felaktig länk
├── netlify.toml        Netlify-inställningar
├── assets/
│   ├── css/styles.css  All styling. Färger & typsnitt längst upp (design tokens)
│   ├── js/main.js      Mobilmeny
│   └── images/         Alla bilder
└── README.md
```

## Vanliga ändringar

| Jag vill… | Gör så här |
|---|---|
| Byta färger | `assets/css/styles.css`, avsnitt **1. Design tokens** (`--cream`, `--moss`, `--blush` …) |
| Byta typsnitt | 1) Välj typsnitt på fonts.google.com. 2) Byt `<link href="https://fonts.googleapis.com/...">` i varje HTML-fil. 3) Byt `--font-display` / `--font-body` i `styles.css`. |
| Byta bild | Lägg ny bild i `assets/images/` och ändra `src="..."` i HTML:en. Håll bilder under ~300 KB (JPG, max ~1800 px bred). |
| Lägga in porträtt på Carola & Jenny | Lägg `carola.jpg` / `jenny.jpg` i `assets/images/` och ersätt `<div class="photo-placeholder">…</div>` med en `<img>` (exempel finns som kommentar i `om-oss.html`). |
| Ändra utbildningstexterna | Korta kort: `index.html`, sektionen `id="utbildning"`. Full text: `utbildningar.html` |
| Skriva om-oss-texter | `om-oss.html`, leta efter `TODO` |

Header och footer är kopierade i varje HTML-fil. Ändrar du menyn, gör ändringen i alla sex sidfilerna.

## Köra lokalt i VS Code

1. Installera tillägget **Live Server** (Ritwick Dey).
2. Högerklicka på `index.html` → **Open with Live Server**.

(Formuläret fungerar bara på den riktiga Netlify-sajten, inte lokalt.)

## Deploya

Se steg-för-steg-guiden i chatten. Kort version: GitHub-repo → Netlify "Import from Git" → publish directory `.` → klart. Varje `git push` uppdaterar sajten automatiskt.
