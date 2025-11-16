// schimmel-sofortcheck.js

function nBool(val){ return (val === "ja"); }

function ampelStufe(inp){
  let score = 0;

  if (nBool(inp.sichtbar)) score += 4;          // sichtbarer Befall = stark
  if (nBool(inp.geruch)) score += 2;            // muffig = Hinweis
  if (inp.feuchte === "ja") score += 2;         // >60% rel. LF
  if (nBool(inp.wasserschaden)) score += 3;     // Leck/Feuchteeintrag

  // Nutzungseinfluss (klein gewichtet)
  if (inp.lueften === "selten") score += 1;
  if (inp.lueften === "regelmaessig") score -= 1;
  if (inp.heizen === "kalt") score += 1;
  if (inp.heizen === "konstant") score -= 1;

  // Altbau/ungedämmt begünstigt Wärmebrücken -> +1
  if (inp.baujahr === "alt") score += 1;

  // Einstufung
  if (score >= 5) return {farbe:"rot", titel:"Akut – handeln!", text:"Sichtbarer Befall/hohe Feuchte oder Wasserschaden."};
  if (score >= 3) return {farbe:"gelb", titel:"Dringend prüfen", text:"Erhöhtes Risiko. In 48 Std. reagieren und dokumentieren."};
  return {farbe:"gruen", titel:"Beobachten", text:"Aktuell kein akuter Hinweis. Weiter beobachten & vorbeugen."};
}

function badge(stufe){
  const map = {
    rot:   "background:#fee2e2;border-left:6px solid #ef4444;",
    gelb:  "background:#fff7ed;border-left:6px solid #f59e0b;",
    gruen: "background:#e6f7eb;border-left:6px solid #10b981;"
  };
  return `<div class="highlight-box" style="${map[stufe.farbe]}"><strong>${stufe.titel}</strong> – ${stufe.text}</div>`;
}

function sofortMassnahmenHTML(inp, stufe){
  const list = [];

  // immer
  list.push(`
    <h3>Sofortmaßnahmen (24–48 Std.)</h3>
    <ul>
      <li><strong>Dokumentieren:</strong> Fotos/Videos (mit Datum), betroffene Stellen, Größe, Farbe, Verlauf.</li>
      <li><strong>Hygrometer:</strong> rel. Luftfeuchte messen (Ziel 40–60 %). Kurzzeitig <em>Stoßlüften</em> (5–10 Min., 2–4×/Tag).</li>
      <li><strong>Heizen:</strong> Räume konstant temperieren (z. B. 19–21 °C), Türen zu feuchten Räumen schließen.</li>
      ${nBool(inp.wasserschaden) ? "<li><strong>Wasserzufuhr stoppen:</strong> Haupthahn/Leck provisorisch sichern, sofort Hausverwaltung informieren.</li>" : ""}
      <li><strong>Keine großflächige Trockenreinigung:</strong> Nicht trocken abbürsten (Sporen). Kleinere Stellen nur feucht abwischen (Handschuhe/Maske), Ursache klären.</li>
    </ul>
  `);

  // Kontaktpflicht / Anzeige
  list.push(`
    <h3>Vermieter/Hausverwaltung informieren</h3>
    <ul>
      <li><strong>Mangelanzeige</strong> schriftlich senden (Einwurf/Einschreiben). Frist zur Abhilfe setzen.</li>
      <li>Fotos beifügen, kurz <strong>Symptome/Ursachenverdacht</strong> schildern (z. B. Wärmebrücke, eindringende Feuchte).</li>
      <li>Bei ausbleibender Reaktion: Beratung/Mieterverein einschalten.</li>
    </ul>
  `);

  // Fachliche Hilfe bei rot/gelb
  if (stufe.farbe !== "gruen"){
    list.push(`
      <h3>Fachliche Hilfe</h3>
      <ul>
        <li><strong>Schadensursache klären:</strong> Fachbetrieb/Bauingenieur/Hausverwaltung.</li>
        <li><strong>Innenluft/Materialprobe</strong> nur bei Bedarf (teils kostenpflichtig) – vorher beraten lassen.</li>
        <li>Gesundheit: Bei Beschwerden <strong>ärztlich</strong> abklären.</li>
      </ul>
    `);
  }

  return list.join("\n");
}

function maengelanzeigeText(inp){
  const datum = new Date().toLocaleDateString("de-DE");
  const raum = (inp.raum && inp.raum.trim()) ? inp.raum.trim() : "Wohnung (genaue Stelle)";
  const sicht = (inp.sichtbar === "ja") ? "sichtbarer Schimmelbefall" : "Feuchte-/Schimmelverdacht";
  const zusatz = [];
  if (inp.feuchte === "ja") zusatz.push("Luftfeuchte > 60 %");
  if (inp.geruch === "ja") zusatz.push("muffiger Geruch");
  if (inp.wasserschaden === "ja") zusatz.push("möglicher Wasserschaden/Leck");
  const zusatzStr = zusatz.length ? " (" + zusatz.join(", ") + ")" : "";

  return `Vor- und Nachname
Straße Hausnummer
PLZ Ort

Vermieter/in / Hausverwaltung
Adresse

${datum}

Betreff: Mangelanzeige – ${sicht} im Bereich ${raum}

Sehr geehrte Damen und Herren,

in meiner Wohnung liegt seit kurzem ${sicht}${zusatzStr} vor. Bitte veranlassen Sie kurzfristig die 
Ursachenklärung und Beseitigung des Mangels. Fotos/Videos habe ich angefertigt und kann sie Ihnen zur Verfügung stellen.

Ich setze Ihnen hierfür eine angemessene Frist von 14 Tagen ab Zugang dieses Schreibens. 
Bitte bestätigen Sie mir den Eingang sowie das weitere Vorgehen schriftlich.

Mit freundlichen Grüßen

(Unterschrift)`;
}

function ergebnisHTML(inp){
  const stufe = ampelStufe(inp);
  const header = badge(stufe);

  return `
    <h2>Ergebnis: Schimmel – Sofortcheck</h2>

    ${header}

    <div class="pflegegrad-result-card">
      <h3>Deine Angaben (Kurzüberblick)</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Angabe</th><th>Wert</th></tr></thead>
        <tbody>
          <tr><td>Raum/Stelle</td><td>${inp.raum ? inp.raum : "—"}</td></tr>
          <tr><td>Sichtbarer Schimmel</td><td>${inp.sichtbar === "ja" ? "Ja" : "Nein"}</td></tr>
          <tr><td>Muffiger Geruch</td><td>${inp.geruch === "ja" ? "Ja" : "Nein"}</td></tr>
          <tr><td>Luftfeuchte &gt; 60 %</td><td>${
            inp.feuchte === "ja" ? "Ja" : (inp.feuchte === "nein" ? "Nein" : "Unbekannt")
          }</td></tr>
          <tr><td>Wasserschaden/Feuchtefleck</td><td>${inp.wasserschaden === "ja" ? "Ja" : "Nein"}</td></tr>
          <tr><td>Lüften</td><td>${
            inp.lueften === "regelmaessig" ? "Regelmäßig Stoßlüften" : (inp.lueften === "selten" ? "Selten" : "Teils/teils")
          }</td></tr>
          <tr><td>Heizen</td><td>${
            inp.heizen === "konstant" ? "Konstant temperiert" : (inp.heizen === "kalt" ? "Meist kalt" : "Normal")
          }</td></tr>
          <tr><td>Baujahr/Modernisierung</td><td>${
            inp.baujahr === "alt" ? "Altbau/ungedämmt" : (inp.baujahr === "neu" ? "Neu(ere) Dämmung/Fenster" : "Unbekannt")
          }</td></tr>
        </tbody>
      </table>

      ${sofortMassnahmenHTML(inp, stufe)}

      <h3>Mängelanzeige – Vorlage</h3>
      <textarea id="sm_brief" style="width:100%;min-height:240px;">${maengelanzeigeText(inp)}</textarea>
      <div class="button-container" style="margin:1rem 0;">
        <button type="button" id="sm_copy" class="button">Text kopieren</button>
      </div>

      <p class="hinweis">
        Hinweis: Ob <strong>Mietminderung</strong> in Betracht kommt, hängt vom Einzelfall ab. 
        Vorher <strong>beraten lassen</strong> (Mieterverein/Rechtsberatung) und stets <strong>beweisen</strong> (Fotos, Zeugen, Messwerte).
      </p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const raum = document.getElementById("sm_raum");
  const sichtbar = document.getElementById("sm_sichtbar");
  const geruch = document.getElementById("sm_geruch");
  const feuchte = document.getElementById("sm_feuchte");
  const wasserschaden = document.getElementById("sm_wasserschaden");
  const lueften = document.getElementById("sm_lueften");
  const heizen = document.getElementById("sm_heizen");
  const baujahr = document.getElementById("sm_baujahr");

  const btn = document.getElementById("sm_check");
  const reset = document.getElementById("sm_reset");
  const out = document.getElementById("sm_ergebnis");

  if (!btn || !out) return;

  btn.addEventListener("click", () => {
    const inp = {
      raum: (raum && raum.value) || "",
      sichtbar: (sichtbar && sichtbar.value) || "nein",
      geruch: (geruch && geruch.value) || "nein",
      feuchte: (feuchte && feuchte.value) || "unbekannt",
      wasserschaden: (wasserschaden && wasserschaden.value) || "nein",
      lueften: (lueften && lueften.value) || "normal",
      heizen: (heizen && heizen.value) || "normal",
      baujahr: (baujahr && baujahr.value) || "unbekannt"
    };

    out.innerHTML = ergebnisHTML(inp);

    // Copy-Button für Mängelanzeige
    const copyBtn = document.getElementById("sm_copy");
    const ta = document.getElementById("sm_brief");
    if (copyBtn && ta){
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(ta.value);
          copyBtn.textContent = "Kopiert!";
          setTimeout(()=> copyBtn.textContent = "Text kopieren", 1800);
        } catch (e) {
          ta.select();
          document.execCommand("copy");
          copyBtn.textContent = "Kopiert!";
          setTimeout(()=> copyBtn.textContent = "Text kopieren", 1800);
        }
      });
    }

    out.scrollIntoView({ behavior: "smooth" });
  });

  if (reset){
    reset.addEventListener("click", () => {
      setTimeout(() => { out.innerHTML = ""; }, 0);
    });
  }
});
