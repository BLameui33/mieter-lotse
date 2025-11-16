// mietschulden-erste-hilfe.js

function n(el){ if(!el) return 0; const raw=(el.value||"").toString().replace(",","."); const v=Number(raw); return Number.isFinite(v)?v:0; }
function euro(v){ const x=Number.isFinite(v)?v:0; return x.toFixed(2).replace(".",",")+" €"; }

function stufeAmpel({ rueckstand, monate, mahnung, kuendigung }){
  const m = Math.max(0, Math.floor(monate||0));
  const rs = Math.max(0, rueckstand||0);
  const hatMahnung = mahnung === "ja";
  const hatKuendigung = kuendigung === "ja";

  // Heuristik (sehr bewusst einfach):
  // Rot: Kündigung ODER m >= 2 ODER Rückstand >= 1000 €
  // Gelb: (sonst) Mahnung ODER m == 1 ODER Rückstand 200–999 €
  // Grün: alles darunter
  if (hatKuendigung || m >= 2 || rs >= 1000){
    return { farbe: "rot", label: "Akut", beschr: "Sofort handeln – Kündigung/akute Räumungsgefahr möglich." };
  }
  if (hatMahnung || m === 1 || (rs >= 200 && rs < 1000)){
    return { farbe: "gelb", label: "Dringend", beschr: "Kurzfristig handeln – Rückstand zügig klären." };
  }
  return { farbe: "gruen", label: "Beobachten", beschr: "Aktuell nicht akut – Vorbeugen und Rückstand vermeiden." };
}

function badgeHTML(stufe){
  const colorMap = {
    rot:   "background:#fee2e2;border-left:6px solid #ef4444;",
    gelb:  "background:#fff7ed;border-left:6px solid #f59e0b;",
    gruen: "background:#e6f7eb;border-left:6px solid #10b981;"
  };
  return `
    <div class="highlight-box" style="${colorMap[stufe.farbe]||""}">
      <strong>Ampel:</strong> ${stufe.label} – ${stufe.beschr}
    </div>
  `;
}

function ratenvorschlag(rueckstand){
  // Vorschlag: Rückstand in 6 Monaten tilgen, min. 50 € / Monat
  const basis = Math.max(0, rueckstand||0);
  const rate = Math.max(50, Math.ceil(basis / 6 / 10) * 10); // glatte Zehner
  const monate = Math.max(1, Math.ceil(basis / rate));
  return { rate, monate };
}

function ratenplanText({ rueckstand, rate, monate }){
  const heute = new Date();
  const fmt = heute.toLocaleDateString("de-DE");
  return `Vor- und Nachname
Straße Hausnummer
PLZ Ort

Vermieter/in
Adresse

${fmt}

Betreff: Vorschlag zur Ratenzahlung wegen Mietrückstand

Sehr geehrte Damen und Herren,

leider ist bei mir ein Mietrückstand in Höhe von ${euro(rueckstand)} entstanden. 
Ich möchte die Rückstände schnellstmöglich ausgleichen und schlage folgende Ratenzahlung vor:

• Monatliche Rate: ${euro(rate)} 
• Anzahl der Raten: ${monate} 
• Beginn: zum nächstmöglichen Monatsersten

Die laufende Miete werde ich ab sofort wieder vollständig und pünktlich zahlen.
Bitte bestätigen Sie mir die Ratenzahlungsvereinbarung schriftlich. 
Falls Sie einen alternativen Vorschlag haben, lassen Sie ihn mir bitte zukommen.

Mit freundlichen Grüßen

(Unterschrift)`;
}

function checklistHTML(input, stufe, raten){
  // Bausteine je nach Lage
  const blocks = [];

  // 1) Immer: Vermieter kontaktieren + Ratenplan
  blocks.push(`
    <h3>1) Sofort Vermieter kontaktieren – Ratenplan anbieten</h3>
    <p>Telefonisch ankündigen, danach <strong>schriftlich</strong> (per Einwurf/Einschreiben) bestätigen.</p>
    <ul>
      <li>Rückstand bestätigen und <strong>Raten</strong> anbieten: ${euro(raten.rate)} × ${raten.monate} Monate.</li>
      <li><strong>Laufende Miete</strong> ab sofort pünktlich zahlen (separat von den Raten).</li>
      <li>Nachweis über Zahlungseingänge aufbewahren.</li>
    </ul>
    <h4>Ratenplan-Vorlage</h4>
    <textarea id="ms_ratenbrief" style="width:100%;min-height:220px;">${ratenplanText({
      rueckstand: input.rueckstand,
      rate: raten.rate,
      monate: raten.monate
    })}</textarea>
    <div class="button-container" style="margin:1rem 0;">
      <button type="button" class="button" id="ms_copy">Text kopieren</button>
    </div>
  `);

  // 2) Kostenübernahme prüfen
  blocks.push(`
    <h3>2) Kostenübernahme / Darlehen prüfen</h3>
    <ul>
      <li><strong>Jobcenter (SGB II):</strong> In Notlagen sind <em>Darlehen</em> zur Sicherung der Unterkunft möglich (Mietschulden). Termin <strong>sofort</strong> anfragen.</li>
      <li><strong>Sozialamt (SGB XII):</strong> Wenn kein SGB II, dort <em>Hilfen zur Unterkunft</em> erfragen.</li>
      <li>Unterlagen mitnehmen: Mahnung/Kündigung, Mietkontoauszug, Mietvertrag, Einkommensnachweise, Personalausweis.</li>
    </ul>
  `);

  // 3) Rechtliche Hilfe
  blocks.push(`
    <h3>3) Rechtliche Hilfe & Beratung</h3>
    <ul>
      <li><strong>Mieterverein</strong> oder <strong>Fachanwält*in Mietrecht</strong> kontaktieren.</li>
      <li><strong>Beratungshilfe</strong> beim Amtsgericht beantragen (geringe Eigenmittel → Schein für anwaltliche Beratung).</li>
      <li>Bei Räumungsklage: <em>Fristen beachten</em> und umgehend reagieren.</li>
    </ul>
  `);

  // 4) Speziell bei Kündigung: Schonfristzahlung-Hinweis (informativ, nicht rechtsverbindlich)
  if (input.kuendigung === "ja"){
    blocks.push(`
      <h3>4) Wichtiger Hinweis bei Kündigung</h3>
      <p>
        Wird der <strong>gesamte Rückstand</strong> kurzfristig ausgeglichen (z. B. durch Darlehen), kann 
        eine <em>fristlose Kündigung</em> in bestimmten Konstellationen geheilt werden (Stichwort „Schonfristzahlung“).
        Bitte unbedingt mit Rechtsberatung klären und <strong>Fristen</strong> beachten.
      </p>
    `);
  }

  return blocks.join("\n");
}

function ergebnisHTML(input, stufe){
  const raten = ratenvorschlag(input.rueckstand);
  return `
    <h2>Ergebnis: Erste Hilfe bei Mietschulden</h2>

    ${badgeHTML(stufe)}

    <div class="pflegegrad-result-card">
      <h3>Deine Angaben (Kurzüberblick)</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Angabe</th><th>Wert</th></tr></thead>
        <tbody>
          <tr><td>Rückstand</td><td>${euro(input.rueckstand)}</td></tr>
          <tr><td>Monate im Rückstand</td><td>${Math.max(0, Math.floor(input.monate||0))}</td></tr>
          <tr><td>Mahnung erhalten</td><td>${input.mahnung === "ja" ? "Ja" : "Nein"}</td></tr>
          <tr><td>Kündigung erhalten</td><td>${input.kuendigung === "ja" ? "Ja" : "Nein"}</td></tr>
        </tbody>
      </table>

      ${checklistHTML(input, stufe, raten)}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const rs = document.getElementById("ms_rueckstand");
  const mo = document.getElementById("ms_monate");
  const ma = document.getElementById("ms_mahnung");
  const ku = document.getElementById("ms_kuendigung");

  const btn = document.getElementById("ms_check");
  const reset = document.getElementById("ms_reset");
  const out = document.getElementById("ms_ergebnis");

  if (!btn || !out) return;

  btn.addEventListener("click", () => {
    const input = {
      rueckstand: n(rs),
      monate: n(mo),
      mahnung: (ma && ma.value) || "nein",
      kuendigung: (ku && ku.value) || "nein"
    };

    const stufe = stufeAmpel(input);
    out.innerHTML = ergebnisHTML(input, stufe);

    // Copy-Button für Ratenbrief aktivieren
    const copyBtn = document.getElementById("ms_copy");
    const ta = document.getElementById("ms_ratenbrief");
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

  if (reset) {
    reset.addEventListener("click", () => {
      setTimeout(() => { out.innerHTML = ""; }, 0);
    });
  }
});
