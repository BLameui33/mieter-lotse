const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'src', 'ml');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

console.log('🚀 Starte Generierung der Mieter-Lotse pSEO-Seiten...\n');

// --- HILFSFUNKTIONEN ---
const loadTemplate = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');

function generateCrossLinks(allItems, currentItem, urlGenerator, nameGenerator, maxLinks = 4) {
    let otherItems = allItems.filter(item => item.slug !== currentItem.slug);
    // Fisher-Yates Shuffle für zufällige interne Links
    for (let i = otherItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherItems[i], otherItems[j]] = [otherItems[j], otherItems[i]];
    }
    const selectedItems = otherItems.slice(0, maxLinks);
    
    let html = '';
    selectedItems.forEach(item => {
        html += `<a href="${urlGenerator(item)}" class="button button-secondary" style="display:block; margin-bottom:8px;">${nameGenerator(item)}</a>\n`;
    });
    return html;
}

// =====================================================================
// SILO 1: MIETMINDERUNG
// =====================================================================
function buildMietminderung() {
    console.log('--- Baue Silo: Mietminderung ---');
    const dataPath = path.join(__dirname, 'data-mietminderung.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-mietminderung.html');
    const calcTpl = loadTemplate('tpl-rechner-mietminderung.html');

    let linkGeneratoren = `<li><a href="/generator-mietminderungsschreiben.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeines Schreiben (Universell)</a></li>\n`;
    let linkRechner = `<li><a href="/rechner-mietminderung.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeiner Rechner (Universell)</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-mietminderungsschreiben-${item.slug}.html`, item => `Vorlage: Minderung bei ${item.menu_title}`);
        let crossLinksCalc = generateCrossLinks(data, page, item => `/ml/rechner-mietminderung-${item.slug}.html`, item => `Rechner: Minderung bei ${item.menu_title}`);

        // Generator
        let fNameGen = `generator-mietminderungsschreiben-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_MANGEL\}\}/g, page.prefill_mangel)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Rechner
        let fNameCalc = `rechner-mietminderung-${page.slug}.html`;
        let contentCalc = calcTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.calc_seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.calc_seo_desc)
            .replace(/\{\{H1\}\}/g, page.calc_h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_QUOTE\}\}/g, page.prefill_quote)
            .replace(/\{\{PREFILL_MANGEL_TEXT\}\}/g, page.prefill_mangel_text)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksCalc);
        fs.writeFileSync(path.join(outputDir, fNameCalc), contentCalc, 'utf8');

        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Vorlage für ${page.menu_title}</a></li>\n`;
        linkRechner += `<li><a href="/ml/${fNameCalc}" style="color: #0056b3;">▶ Rechner für ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren
    const infoPagePath = path.join(__dirname, 'src', 'info-mietminderung.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Passendes Tool zu Ihrem Mangel wählen:</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Rechner & PDF-Vorlagen spezifisch für Ihr Problem.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Spezifische Vorlage finden <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px; display: flex; flex-wrap: wrap; gap: 20px;">
      <div style="flex: 1; min-width: 250px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #4da3ff; padding-bottom: 5px;">Mietminderung Berechnen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkRechner}
        </ul>
      </div>
      <div style="flex: 1; min-width: 250px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">PDF-Anschreiben erstellen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
      </div>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-mietminderung.html aktualisiert.');
        }
    }
    console.log('✅ Silo Mietminderung abgeschlossen.\n');
}

// =====================================================================
// SILO 2: MÄNGELANZEIGE
// =====================================================================
function buildMaengelanzeige() {
    console.log('--- Baue Silo: Mängelanzeige ---');
    const dataPath = path.join(__dirname, 'data-maengelanzeige.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-maengelanzeige.html');

    // Start des HTMLs für das Menü
    let linkGeneratoren = `<li><a href="/generator-maengelanzeige.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeines Schreiben (Universell)</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-maengelanzeige-${item.slug}.html`, item => `Vorlage: Mängelanzeige bei ${item.menu_title}`);

        // Generator pSEO Seite bauen
        let fNameGen = `generator-maengelanzeige-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_MANGEL_BESCHREIBUNG\}\}/g, page.prefill_mangel_beschreibung)
            .replace(/\{\{PREFILL_MANGEL_ORT\}\}/g, page.prefill_mangel_ort)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Link zur Liste hinzufügen
        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Vorlage für ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren
    const infoPagePath = path.join(__dirname, 'src', 'info-maengelanzeige.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Spezifische Vorlage für Ihren Mangel wählen:</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Kostenlose PDF-Muster für Ihr genaues Problem.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Mängelanzeige-Vorlagen aufklappen <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">Spezifisches PDF-Anschreiben erstellen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-maengelanzeige.html aktualisiert.');
        } else {
            console.log('⚠️ Platzhalter in info-maengelanzeige.html nicht gefunden! Bitte <!-- PSEO_MENU_START --> und <!-- PSEO_MENU_END --> einfügen.');
        }
    }
    console.log('✅ Silo Mängelanzeige abgeschlossen.\n');
}

// =====================================================================
// SILO 3: WIDERSPRUCH NEBENKOSTEN
// =====================================================================
function buildNebenkosten() {
    console.log('--- Baue Silo: Widerspruch Nebenkosten ---');
    const dataPath = path.join(__dirname, 'data-nebenkosten.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-widerspruch-nebenkosten.html');

    // Start des HTMLs für das Menü
    let linkGeneratoren = `<li><a href="/generator-widerspruch-nebenkosten.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeiner Widerspruch (Universell)</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-widerspruch-nebenkosten-${item.slug}.html`, item => `Vorlage: Widerspruch bzgl. ${item.menu_title}`);

        // Generator pSEO Seite bauen
        let fNameGen = `generator-widerspruch-nebenkosten-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_POSITION\}\}/g, page.prefill_position)
            .replace(/\{\{PREFILL_BEGRUENDUNG\}\}/g, page.prefill_begruendung)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Link zur Liste hinzufügen
        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Vorlage für ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren
    const infoPagePath = path.join(__dirname, 'src', 'info-nebenkosten.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Spezifischen Widerspruch für Ihr Problem wählen:</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Kostenlose PDF-Muster für genau Ihren Abrechnungsfehler.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Widerspruchs-Vorlagen aufklappen <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">Spezifisches PDF-Schreiben erstellen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-nebenkosten.html aktualisiert.');
        } else {
            console.log('⚠️ Platzhalter in info-nebenkosten.html nicht gefunden!');
        }
    }
    console.log('✅ Silo Widerspruch Nebenkosten abgeschlossen.\n');
}

// =====================================================================
// SILO 4: WOHNUNGSBEWERBUNG (MAPPE)
// =====================================================================
function buildWohnungsbewerbung() {
    console.log('--- Baue Silo: Wohnungsbewerbung ---');
    const dataPath = path.join(__dirname, 'data-wohnungsbewerbung.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-bewerbungsmappe.html');

    // Start des HTMLs für das Menü
    let linkGeneratoren = `<li><a href="/generator-bewerbungsmappe.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeine Bewerbungsmappe (Universell)</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-bewerbungsmappe-${item.slug}.html`, item => `Vorlage: Mappe für ${item.menu_title}`);

        // Generator pSEO Seite bauen
        let fNameGen = `generator-bewerbungsmappe-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_BERUF\}\}/g, page.prefill_beruf)
            .replace(/\{\{PREFILL_MOTIVATION\}\}/g, page.prefill_motivation)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Link zur Liste hinzufügen
        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Vorlage ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren
    const infoPagePath = path.join(__dirname, 'src', 'info-wohnungsbewerbung.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Oder passende Bewerbungsmappe (PDF) für Ihre Situation:</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Kostenlose Komplett-Generatoren mit passenden Anschreiben.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Mappen-Vorlagen aufklappen <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">PDF-Bewerbungsmappe erstellen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-wohnungsbewerbung.html aktualisiert.');
        } else {
            console.log('⚠️ Platzhalter in info-wohnungsbewerbung.html nicht gefunden!');
        }
    }
    console.log('✅ Silo Wohnungsbewerbung abgeschlossen.\n');
}

// =====================================================================
// SILO 5: WIDERSPRUCH VERMIETERKÜNDIGUNG
// =====================================================================
function buildVermieterkuendigung() {
    console.log('--- Baue Silo: Widerspruch Vermieterkündigung ---');
    const dataPath = path.join(__dirname, 'data-widerspruch-vermieterkuendigung.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-widerspruch-vermieterkuendigung.html');

    // Start des HTMLs für das Menü
    let linkGeneratoren = `<li><a href="/generator-widerspruch-vermieterkuendigung.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeiner Widerspruch (Universell)</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-widerspruch-vermieterkuendigung-${item.slug}.html`, item => `Vorlage: Widerspruch wegen ${item.menu_title}`);

        // Generator pSEO Seite bauen
        let fNameGen = `generator-widerspruch-vermieterkuendigung-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_KUENDIGUNGSGRUND\}\}/g, page.prefill_kuendigungsgrund)
            .replace(/\{\{PREFILL_FORMELLE_FEHLER\}\}/g, page.prefill_formelle_fehler)
            .replace(/\{\{PREFILL_KRITIK_KUENDIGUNGSGRUND\}\}/g, page.prefill_kritik_kuendigungsgrund)
            .replace(/\{\{PREFILL_SOZIALE_HAERTE\}\}/g, page.prefill_soziale_haerte)
            .replace(/\{\{PREFILL_ERGAENZENDE_ARGUMENTE\}\}/g, page.prefill_ergaenzende_argumente)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Link zur Liste hinzufügen
        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Vorlage ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren
    const infoPagePath = path.join(__dirname, 'src', 'info-kuendigung-vermieter.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Spezifische Vorlage für Ihren Widerspruch:</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Kostenlose PDF-Muster für Ihren Fall.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Widerspruchs-Vorlagen aufklappen <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">PDF-Widerspruch erstellen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-kuendigung-vermieter.html aktualisiert.');
        } else {
            console.log('⚠️ Platzhalter in info-kuendigung-vermieter.html nicht gefunden!');
        }
    }
    console.log('✅ Silo Widerspruch Vermieterkündigung abgeschlossen.\n');
}

// =====================================================================
// SILO 6: UNTERVERMIETUNG (ANTRAG)
// =====================================================================
function buildUntervermietung() {
    console.log('--- Baue Silo: Antrag auf Untervermietung ---');
    const dataPath = path.join(__dirname, 'data-untervermietung.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-antrag-erlaubnis-untervermietung.html');

    // Start des HTMLs für das Menü
    let linkGeneratoren = `<li><a href="/generator-antrag-erlaubnis-untervermietung.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeiner Antrag (Universell)</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-antrag-erlaubnis-untervermietung-${item.slug}.html`, item => `Vorlage: ${item.menu_title}`);

        // Generator pSEO Seite bauen
        let fNameGen = `generator-antrag-erlaubnis-untervermietung-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_DAUER\}\}/g, page.prefill_dauer)
            .replace(/\{\{PREFILL_ENTSTEHUNG\}\}/g, page.prefill_entstehung)
            .replace(/\{\{PREFILL_ERLAEUTERUNG\}\}/g, page.prefill_erlaeuterung)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Link zur Liste hinzufügen
        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Antrag ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren
    const infoPagePath = path.join(__dirname, 'src', 'info-untervermietung.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Oder spezifischen Antrag für Ihren Grund wählen:</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Kostenlose PDF-Muster für Ihre genaue Lebenssituation.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Antrags-Vorlagen aufklappen <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">PDF-Antrag auf Erlaubnis erstellen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-untervermietung.html aktualisiert.');
        } else {
            console.log('⚠️ Platzhalter in info-untervermietung.html nicht gefunden!');
        }
    }
    console.log('✅ Silo Untervermietung abgeschlossen.\n');
}

// =====================================================================
// SILO 7: WIDERSPRUCH MIETERHÖHUNG
// =====================================================================
function buildMieterhoehung() {
    console.log('--- Baue Silo: Widerspruch Mieterhöhung ---');
    const dataPath = path.join(__dirname, 'data-mieterhoehung.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-widerspruch-mieterhoehung.html');

    // Start des HTMLs für das Menü
    let linkGeneratoren = `<li><a href="/generator-widerspruch-mieterhoehung.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeiner Widerspruch (Universell)</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-widerspruch-mieterhoehung-${item.slug}.html`, item => `Vorlage: Widerspruch ${item.menu_title}`);

        // Generator pSEO Seite bauen
        let fNameGen = `generator-widerspruch-mieterhoehung-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{PREFILL_FORMELLE_FEHLER\}\}/g, page.prefill_formelle_fehler)
            .replace(/\{\{PREFILL_VERGLEICHSMIETE\}\}/g, page.prefill_vergleichsmiete)
            .replace(/\{\{PREFILL_MODERNISIERUNG\}\}/g, page.prefill_modernisierung)
            .replace(/\{\{PREFILL_ERGAENZENDE_ARGUMENTE\}\}/g, page.prefill_ergaenzende_argumente)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Link zur Liste hinzufügen
        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Vorlage ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren
    const infoPagePath = path.join(__dirname, 'src', 'info-mieterhoehung.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Passende PDF-Vorlage für Ihren Fall:</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Kostenlose Widersprüche bei falschen Fristen, Kappungsgrenzen etc.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Widerspruchs-Vorlagen aufklappen <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">PDF-Stellungnahme erstellen</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-mieterhoehung.html aktualisiert.');
        } else {
            console.log('⚠️ Platzhalter in info-mieterhoehung.html nicht gefunden!');
        }
    }
    console.log('✅ Silo Widerspruch Mieterhöhung abgeschlossen.\n');
}

// =====================================================================
// SILO 8: NEBENKOSTEN-CHECK (RECHNER) - OHNE HUB
// =====================================================================
function buildNebenkostenCheck() {
    console.log('--- Baue Silo: Nebenkosten-Check ---');
    const dataPath = path.join(__dirname, 'data-nebenkosten-check.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-nebenkosten-check.html');

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/nebenkosten-check-${item.slug}.html`, item => `Prüfen: ${item.menu_title}`);

        // pSEO Seite bauen
        let fNameGen = `nebenkosten-check-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');
        console.log(`✅ Generiert: ${page.menu_title}`);
    });
    
    console.log('✅ Silo Nebenkosten-Check abgeschlossen (ohne Hub-Seite).\n');
}

// =====================================================================
// SILO 9: WOHNFLÄCHE RÜCKFORDERUNG
// =====================================================================
function buildWohnflaecheRueckforderung() {
    console.log('--- Baue Silo: Wohnfläche Rückforderung ---');
    const dataPath = path.join(__dirname, 'data-wohnflaeche-rueckforderung.json');
    if (!fs.existsSync(dataPath)) { console.log('⚠️ übersprungen (Daten fehlen)\n'); return; }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const genTpl = loadTemplate('tpl-wohnflaeche-rueckforderung.html');

    // Start des HTMLs für das Menü
    let linkGeneratoren = `<li><a href="/generator-wohnflaeche-rueckforderung.html" style="color: #0056b3; font-weight:bold;">▶ Allgemeiner Rückforderungs-Rechner</a></li>\n`;

    data.forEach(page => {
        let crossLinksGen = generateCrossLinks(data, page, item => `/ml/generator-wohnflaeche-rueckforderung-${item.slug}.html`, item => `Fehlerquelle: ${item.menu_title}`);

        // Generator pSEO Seite bauen
        let fNameGen = `generator-wohnflaeche-rueckforderung-${page.slug}.html`;
        let contentGen = genTpl
            .replace(/\{\{SLUG\}\}/g, page.slug)
            .replace(/\{\{SEO_TITLE\}\}/g, page.seo_title)
            .replace(/\{\{SEO_DESC\}\}/g, page.seo_desc)
            .replace(/\{\{H1\}\}/g, page.h1)
            .replace(/\{\{INFO_TITEL\}\}/g, page.info_titel)
            .replace(/\{\{INFO_TEXT\}\}/g, page.info_text)
            .replace(/\{\{CROSSLINKS\}\}/g, crossLinksGen);
        
        fs.writeFileSync(path.join(outputDir, fNameGen), contentGen, 'utf8');

        // Link zur Liste hinzufügen
        linkGeneratoren += `<li><a href="/ml/${fNameGen}" style="color: #0056b3;">▶ Prüfen: ${page.menu_title}</a></li>\n`;
    });

    // Info-Seite aktualisieren (Hub-Seite)
    const infoPagePath = path.join(__dirname, 'src', 'info-wohnflaeche-rueckforderung.html');
    if (fs.existsSync(infoPagePath)) {
        let infoPageContent = fs.readFileSync(infoPagePath, 'utf8');
        let dropdownHtml = `
<!-- PSEO_MENU_START -->
<div class="pseo-hub-box" style="margin: 30px 0; border: 1px solid #d1d5db; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: sans-serif;">
  <div style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #ffffff; border-radius: 8px 8px 0 0;">
    <h3 style="margin: 0; font-size: 1.15rem; color: #1a3a5c;">Wo liegt der Fehler in Ihrer Wohnung?</h3>
    <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #555;">Kostenloser Rückforderungs-Rechner für Ihre spezifische Bauweise.</p>
  </div>
  <details style="cursor: pointer; padding: 0;">
    <summary style="font-weight: bold; padding: 15px 20px; color: #0056b3; background-color: #f0f7ff; border-radius: 0 0 8px 8px; list-style-type: none; outline: none;">
      <span style="display: flex; justify-content: space-between; align-items: center;">
        Fehlerquellen & Rechner aufklappen <span style="font-size: 1.2em;">▼</span>
      </span>
    </summary>
    <div style="padding: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #333; font-size: 1rem; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">Rückforderung berechnen (PDF)</h4>
        <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
${linkGeneratoren}
        </ul>
    </div>
  </details>
</div>
<style>
.pseo-hub-box details > summary::-webkit-details-marker { display: none; }
.pseo-hub-box a { text-decoration: none; }
.pseo-hub-box a:hover { text-decoration: underline !important; color: #0c447c !important; }
</style>
<!-- PSEO_MENU_END -->`;
        
        const regex = /<!-- PSEO_MENU_START -->[\s\S]*?<!-- PSEO_MENU_END -->/;
        if (regex.test(infoPageContent)) {
            infoPageContent = infoPageContent.replace(regex, dropdownHtml);
            fs.writeFileSync(infoPagePath, infoPageContent, 'utf8');
            console.log('✅ Hub-Menü in info-wohnflaeche-rueckforderung.html aktualisiert.');
        } else {
            console.log('⚠️ Platzhalter in info-wohnflaeche-rueckforderung.html nicht gefunden!');
        }
    } else {
        console.log('⚠️ Info-Seite info-wohnflaeche-rueckforderung.html existiert nicht. Hub-Erstellung übersprungen.');
    }
    console.log('✅ Silo Wohnfläche Rückforderung abgeschlossen.\n');
}

// =====================================================================
// HAUPT-AUSFÜHRUNG
// =====================================================================
buildMietminderung();
buildMaengelanzeige();
buildNebenkosten();
buildWohnungsbewerbung();
buildVermieterkuendigung();
buildUntervermietung();
buildMieterhoehung();
buildNebenkostenCheck();
buildWohnflaecheRueckforderung(); // Neu hinzugefügt!

console.log('🎉 Fertig! Der Build lief ohne Fehler durch.');

