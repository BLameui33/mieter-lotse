const fs = require('fs');
const path = require('path');

// 1. HIER DEINE ECHTE DOMAIN EINTRAGEN
const BASE_URL = 'https://mieter-lotse.de';

// Pfade definieren
const DOCS_DIR = path.join(__dirname, 'docs');
const OUTPUT_PATH = path.join(DOCS_DIR, 'sitemap.xml'); // Speichert die Sitemap direkt im /docs-Ordner

/**
 * Durchsucht den Ordner rekursiv nach HTML-Dateien
 */
function getHtmlFiles(dirPath, fileList = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        
        if (fs.statSync(filePath).isDirectory()) {
            // Wenn es ein Ordner ist (z. B. 'ml'), tiefer gehen
            getHtmlFiles(filePath, fileList);
        } else {
            // Nur HTML-Dateien erfassen (Sitemap ignoriert Bilder/CSS etc.)
            if (file.endsWith('.html')) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

/**
 * Generiert die XML-Struktur
 */
function generateSitemap() {
    if (!fs.existsSync(DOCS_DIR)) {
        console.error(`❌ Fehler: Der Ordner "${DOCS_DIR}" wurde nicht gefunden.`);
        return;
    }

    const files = getHtmlFiles(DOCS_DIR);
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    let xmlEntries = '';

    files.forEach((file) => {
        // Relativen Pfad zum /docs-Ordner berechnen
        let relativePath = path.relative(DOCS_DIR, file);
        
        // Windows-Backslashes (\) in Web-Slashes (/) umwandeln
        relativePath = relativePath.replace(/\\/g, '/');

        // "index.html" entfernen, damit die URL sauberer aussieht (aus docs/ml/index.html wird /ml/)
        if (relativePath.endsWith('index.html')) {
            relativePath = relativePath.slice(0, -10);
        } else {
            // OPTIONAL: Falls du "Pretty URLs" nutzt (ohne .html Endung auf dem Server),
            // kannst du die nächste Zeile einkommentieren:
            // relativePath = relativePath.replace('.html', '');
        }

        // Finale URL zusammenbauen
        const finalUrl = `${BASE_URL}/${relativePath}`.replace(/\/+$/, ''); // Verhindert doppelte Slashes am Ende

        // XML-Eintrag für diese Seite generieren
        xmlEntries += `  <url>\n`;
        xmlEntries += `    <loc>${finalUrl || BASE_URL + '/'}</loc>\n`;
        xmlEntries += `    <lastmod>${currentDate}</lastmod>\n`;
        xmlEntries += `    <changefreq>weekly</changefreq>\n`;
        xmlEntries += `    <priority>${relativePath === '' ? '1.0' : '0.8'}</priority>\n`;
        xmlEntries += `  </url>\n`;
    });

    // Das XML-Template zusammenfügen
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}</urlset>`;

    // Datei schreiben
    fs.writeFileSync(OUTPUT_PATH, sitemapXml, 'utf8');
    console.log(`\n✅ Sitemap erfolgreich erstellt unter: ${OUTPUT_PATH}`);
    console.log(`📄 Gefundene Seiten: ${files.length}\n`);
}

// Skript ausführen
generateSitemap();