const fs = require('fs');
const https = require('https');

// ==========================================
// EINSTELLUNGEN & API-KEY
// ==========================================
const OPENAI_API_KEY = "Hier Key";
const MODELL = "gpt-5.4-mini"; 
const FORTSCHRITT_DATEI = './fortschritt.json';

// ==========================================
// DER PROFESSIONELLE SYSTEM-PROMPT (Noch strenger!)
// ==========================================
const SYSTEM_PROMPT = `
Du bist ein hochqualifizierter juristischer Auditor für das deutsche Zivil- und Sozialrecht.

DEINE AUFGABE:
Prüfe den folgenden HTML-Textabschnitt auf ECHTE, SCHWERE sachliche, rechtliche oder logische Fehler. 

STRIKTE REGELN (MUSS BEFOLGT WERDEN!):
1. KEINE GRAMMATIK- ODER STIL-KORREKTUREN! Der Text besteht oft aus einzelnen Listenpunkten (<li>), denen der Hauptsatz fehlt. Ignoriere fehlende Satzanfänge, abgehackte Sätze oder Rechtschreibfehler komplett!
2. SEI NICHT PINGELIG! Ignoriere ungenaue Formulierungen, fehlende Ausnahmen oder umgangssprachliche Vereinfachungen. Ein Ratgeber muss nicht klingen wie ein Gesetzestext. 
3. ZAHLEN-TABU: Korrigiere NIEMALS konkrete Geldbeträge, es sei denn, es handelt sich um völlig falsche gesetzliche Fristen oder Prozentvorgaben (z.B. Zuzahlungs-Deckelungen).
4. BEHALTE HTML-TAGS: Wenn der Text <strong>, <a> oder <br> Tags enthält, MÜSSEN diese exakt so in deiner Korrektur erhalten bleiben.
5. ABSOLUTES ZAHLEN-TABU: Gesetze, Freibeträge und Tage (z.B. Krankengeldtage) ändern sich jährlich. Du darfst NIEMALS konkrete Tage, Euro-Beträge oder Prozentangaben im Text verändern! Wenn du stark vermutest, dass eine Zahl falsch ist, belasse den Text in der KORREKTUR exakt wie im Original, aber schreibe in die BEGRÜNDUNG: "ACHTUNG: Bitte Zahl manuell auf Aktualität für das Zieljahr prüfen."

ANTWORT-FORMAT:
- Wenn kein schwerer rechtlicher Fehler vorliegt: Antworte NUR mit "OK".
- Wenn ein echter rechtlicher Fehler vorliegt, antworte ZWINGEND in exakt diesem Format (mit Zeilenumbruch):

FEHLER: [Kurze Begründung, warum es rechtlich falsch ist]
KORREKTUR: [Der fertig formulierte, neue Textabschnitt]
`;

// ==========================================
// HILFSFUNKTIONEN
// ==========================================
function ladeFortschritt() {
  if (fs.existsSync(FORTSCHRITT_DATEI)) {
    return JSON.parse(fs.readFileSync(FORTSCHRITT_DATEI, 'utf-8'));
  }
  return { erledigteDateien: [] };
}

function speichereFortschritt(fortschritt) {
  fs.writeFileSync(FORTSCHRITT_DATEI, JSON.stringify(fortschritt, null, 2));
}

function frageOpenAI(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: MODELL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ],
      temperature: 0.1
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json.choices[0].message.content.trim());
        } catch (e) {
          reject(new Error("Fehler beim Verarbeiten der API-Antwort"));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

// ==========================================
// HAUPTLOGIK
// ==========================================
async function startePruefung() {
  const fortschritt = ladeFortschritt();

  const dateien = fs.readdirSync('.').filter(datei => {
    return fs.statSync(datei).isFile() && 
           datei.toLowerCase().startsWith('info') && 
           datei.endsWith('.html');
  });

  console.log(`📁 ${dateien.length} HTML-Datei(en) mit Präfix 'info' gefunden.`);

  for (const datei of dateien) {
    if (fortschritt.erledigteDateien.includes(datei)) {
      console.log(`⏭️  Überspringe (bereits geprüft): ${datei}`);
      continue;
    }

    console.log(`\n🔍 Prüfe Datei: ${datei}...`);
    let html = fs.readFileSync(datei, 'utf-8');
    let fehlerGefunden = 0;

    // Regex, die das öffnende Tag (1), den Inhalt (3) und das schließende Tag (4) fängt
    const regex = /(<(p|li)[^>]*>)([\s\S]*?)(<\/\2>)/gi;
    const matches = [...html.matchAll(regex)];

    // Rückwärts durchlaufen, damit Index-Verschiebungen keine Probleme machen
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const ganzerBlock = match[0];
      const oeffnendesTag = match[1];
      const htmlInhalt = match[3];
      const schliessendesTag = match[4];

      // Wir lassen die inneren HTML-Tags (wie <strong>) diesmal drin, 
      // damit die KI sie im KORREKTUR-Teil übernehmen kann!
      const textFuerKi = htmlInhalt.trim();

      if (textFuerKi.length < 30) continue;

      try {
        const antwort = await frageOpenAI(textFuerKi);

        if (antwort !== "OK" && !antwort.toUpperCase().startsWith("OK")) {
          // Extrahiere FEHLER und KORREKTUR aus der Antwort
          const fehlerMatch = antwort.match(/FEHLER:\s*([\s\S]*?)(?=KORREKTUR:|$)/i);
          const korrekturMatch = antwort.match(/KORREKTUR:\s*([\s\S]*)/i);

          if (fehlerMatch && korrekturMatch) {
            fehlerGefunden++;
            const grund = fehlerMatch[1].trim();
            const neuerText = korrekturMatch[1].trim();

            console.log(`  ⚠️  Korrektur angewendet: "${neuerText.substring(0, 40)}..."`);

            // Baue den neuen HTML-Baustein zusammen
            const neuerBlock = oeffnendesTag + neuerText + schliessendesTag;
            
            // Baue den Kommentar mit dem alten Text
            const kommentar = `\n<!-- KI-AUDIT:\nGRUND: ${grund}\nALTER TEXT: ${htmlInhalt.trim()}\n-->\n`;

            // Ersetze den alten Bereich im Gesamt-HTML
            const startPos = match.index;
            const endPos = match.index + ganzerBlock.length;
            
            html = html.slice(0, startPos) + neuerBlock + kommentar + html.slice(endPos);
          } else {
             // Fallback, falls die KI sich nicht an das Format hält
             console.log(`  🤔 Formatierungsproblem bei KI-Antwort übersprungen.`);
          }
        }
      } catch (error) {
        console.error(`  ❌ API-Fehler: ${error.message}`);
        await new Promise(res => setTimeout(res, 2000));
      }
    }

    fs.writeFileSync(datei, html, 'utf-8');
    console.log(`✅ Fertig mit ${datei}. ${fehlerGefunden} Absätze direkt ersetzt.`);

    fortschritt.erledigteDateien.push(datei);
    speichereFortschritt(fortschritt);
  }

  console.log('\n🎉 Prüfung abgeschlossen!');
}

startePruefung();