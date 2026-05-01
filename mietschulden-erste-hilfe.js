// mietschulden-erste-hilfe.js

function n(el){ if(!el) return 0; const raw=(el.value||"").toString().replace(",","."); const v=Number(raw); return Number.isFinite(v)?v:0; }
function euro(v){ const x=Number.isFinite(v)?v:0; return x.toFixed(2).replace(".",",")+" €"; }

function stufeAmpel({ rueckstand, monate, mahnung, kuendigung }){
  const m = Math.max(0, Math.floor(monate||0));
  const rs = Math.max(0, rueckstand||0);
  const hatMahnung = mahnung === "ja";
  const hatKuendigung = kuendigung === "ja";

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
  const basis = Math.max(0, rueckstand||0);
  const rate = Math.max(50, Math.ceil(basis / 6 / 10) * 10); // glatte Zehner
  const monate = Math.max(1, Math.ceil(basis / rate));
  return { rate, monate };
}

function ratenplanText({ rueckstand, rate, monate, absName, absStr, absOrt, empfName, empfStr, empfOrt }){
  const heute = new Date().toLocaleDateString("de-DE");
  
  // Nutze Eingabefelder oder Fallbacks für die Text-Ansicht
  const an = absName || "Vor- und Nachname";
  const as = absStr || "Straße Hausnummer";
  const ao = absOrt || "PLZ Ort";
  const en = empfName || "Vermieter/in";
  const es = empfStr || "Adresse";
  const eo = empfOrt || "";

  return `${an}
${as}
${ao}

${en}
${es}
${eo}

${heute}

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

// NEU: PDF Generierung mit jsPDF
// NEU: PDF Generierung mit jsPDF INKLUSIVE Tilgungsplan-Tabelle
function generatePDF(input, raten) {
  if (!window.jspdf) {
    alert("Fehler beim Laden der PDF-Erstellung. Bitte Browser aktualisieren.");
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ format: 'a4' });
  const heute = new Date().toLocaleDateString("de-DE");

  const absName = input.absName || "[Dein Vor- und Nachname]";
  const absStr = input.absStr || "[Deine Straße Hausnummer]";
  const absOrt = input.absOrt || "[Deine PLZ Ort]";
  const empfName = input.empfName || "[Name Vermieter / Verwaltung]";
  const empfStr = input.empfStr || "[Straße Hausnummer]";
  const empfOrt = input.empfOrt || "[PLZ Ort]";

  // Absender klein über Sichtfenster
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`${absName} • ${absStr} • ${absOrt}`, 25, 45);

  // Empfänger im Sichtfenster
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(empfName, 25, 55);
  doc.text(empfStr, 25, 62);
  doc.text(empfOrt, 25, 69);

  // Datum Rechts
  doc.text(`${absOrt}, den ${heute}`, 185, 90, { align: "right" });

  // Betreff
  doc.setFont("helvetica", "bold");
  doc.text("Vorschlag zur Ratenzahlung wegen Mietrückstand", 25, 110);

  // Anschreiben
  doc.setFont("helvetica", "normal");
  const bodyText = `Sehr geehrte Damen und Herren,

leider bin ich in eine finanzielle Notlage geraten, weshalb aktuell ein Mietrückstand in Höhe von ${euro(input.rueckstand)} entstanden ist. Der Erhalt meiner Wohnung ist mir extrem wichtig, daher möchte ich den Rückstand schnellstmöglich und zuverlässig ausgleichen.

Um die Außenstände abzubauen, schlage ich Ihnen hiermit folgende verbindliche Ratenzahlung vor:`;

  doc.text(bodyText, 25, 125, { maxWidth: 160, lineHeightFactor: 1.5 });

  // --- NEU: DER KONKRETE RATENPLAN (TABELLE / LISTE) ---
  let startY = 160;
  doc.setFont("helvetica", "bold");
  doc.text("Vorgeschlagener Tilgungsplan (zusätzlich zur laufenden Miete):", 25, startY);
  
  doc.setFont("helvetica", "normal");
  startY += 8;

  // Wir berechnen die Monate (Start ist der nächste Monat)
  let currentDate = new Date();
  let restSchuld = input.rueckstand;

  for (let i = 1; i <= raten.monate; i++) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    let monatJahr = ("0" + (currentDate.getMonth() + 1)).slice(-2) + "." + currentDate.getFullYear();
    
    // Letzte Rate ist vielleicht etwas geringer als die anderen (Restbetrag)
    let aktuelleRate = (restSchuld < raten.rate) ? restSchuld : raten.rate;
    restSchuld -= aktuelleRate;

    doc.text(`Rate ${i}:`, 30, startY);
    doc.text(`fällig bis 03.${monatJahr}`, 55, startY);
    doc.text(`-> ${euro(aktuelleRate)}`, 110, startY);
    
    startY += 7;

    // Falls die Liste zu lang wird (Seitenumbruch verhindern)
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }
  }

  startY += 10;
  const schlussText = `Ich versichere Ihnen, dass ich die laufende Miete ab sofort wieder pünktlich in voller Höhe überweisen werde (getrennt von der Rate).

Ich bitte Sie herzlich um eine kurze Bestätigung dieses Ratenplans.

Mit freundlichen Grüßen


___________________________________
${absName} (Unterschrift)`;

  doc.text(schlussText, 25, startY, { maxWidth: 160, lineHeightFactor: 1.5 });
  
  // Download auslösen
  doc.save("Ratenplan_Mietschulden.pdf");
}

function checklistHTML(input, stufe, raten){
  const blocks = [];

  // NEU: PDF Download Box eingebaut über die Textarea
  blocks.push(`
    <h3>1) Sofort Vermieter kontaktieren – Ratenplan anbieten</h3>
    <p>Telefonisch ankündigen, danach <strong>schriftlich</strong> (per Einwurf/Einschreiben) bestätigen.</p>
    <ul>
      <li>Rückstand bestätigen und <strong>Raten</strong> anbieten: ${euro(raten.rate)} × ${raten.monate} Monate.</li>
      <li><strong>Laufende Miete</strong> ab sofort pünktlich zahlen (separat von den Raten).</li>
    </ul>

    <h4>Dein persönlicher Ratenplan (PDF oder Text)</h4>
    <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
      <p style="margin-top:0;"><strong>Empfehlung:</strong> Lade dir das Anschreiben als fertig formatiertes PDF (passend für Fensterumschläge) herunter. Einfach ausdrucken, unterschreiben, abschicken.</p>
      <button type="button" id="btn_download_pdf" style="background-color: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;">
        📄 Als PDF herunterladen
      </button>
    </div>

    <p style="margin-bottom: 5px;"><strong>Alternativ:</strong> Text in dein eigenes Word-Dokument kopieren:</p>
    <textarea id="ms_ratenbrief" style="width:100%;min-height:220px;">${ratenplanText({
      rueckstand: input.rueckstand,
      rate: raten.rate,
      monate: raten.monate,
      absName: input.absName,
      absStr: input.absStr,
      absOrt: input.absOrt,
      empfName: input.empfName,
      empfStr: input.empfStr,
      empfOrt: input.empfOrt
    })}</textarea>
    <div class="button-container" style="margin:1rem 0;">
      <button type="button" class="button" id="ms_copy">Text kopieren</button>
    </div>
  `);

  blocks.push(`
    <h3>2) Kostenübernahme / Darlehen prüfen</h3>
    <ul>
      <li><strong>Jobcenter (SGB II):</strong> In Notlagen sind <em>Darlehen</em> zur Sicherung der Unterkunft möglich. Termin <strong>sofort</strong> anfragen.</li>
      <li><strong>Sozialamt (SGB XII):</strong> Wenn kein SGB II, dort <em>Hilfen zur Unterkunft</em> erfragen.</li>
    </ul>
  `);

  blocks.push(`
    <h3>3) Rechtliche Hilfe & Beratung</h3>
    <ul>
      <li><strong>Mieterverein</strong> oder <strong>Fachanwält*in Mietrecht</strong> kontaktieren.</li>
      <li><strong>Beratungshilfe</strong> beim Amtsgericht beantragen.</li>
    </ul>
  `);

  if (input.kuendigung === "ja"){
    blocks.push(`
      <h3 style="color: #d32f2f;">4) WICHTIG: Kündigung liegt vor!</h3>
      <p style="border-left: 4px solid #d32f2f; padding-left: 10px;">
        Wird der <strong>gesamte Rückstand</strong> kurzfristig ausgeglichen, kann 
        die fristlose Kündigung unter Umständen geheilt werden („Schonfristzahlung“).
        <strong>Gehen Sie sofort mit der Kündigung zum Jobcenter/Sozialamt</strong> und klären Sie eine mögliche Übernahme!
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
          <tr><td>Mahnung / Kündigung</td><td>${input.mahnung === "ja" ? "Mahnung" : ""} ${input.kuendigung === "ja" ? "Kündigung" : ""} ${input.mahnung==="nein" && input.kuendigung==="nein" ? "Nein":""}</td></tr>
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
      kuendigung: (ku && ku.value) || "nein",
      
      // Adressdaten fürs PDF
      absName: document.getElementById("ms_abs_name") ? document.getElementById("ms_abs_name").value : "",
      absStr: document.getElementById("ms_abs_str") ? document.getElementById("ms_abs_str").value : "",
      absOrt: document.getElementById("ms_abs_ort") ? document.getElementById("ms_abs_ort").value : "",
      empfName: document.getElementById("ms_empf_name") ? document.getElementById("ms_empf_name").value : "",
      empfStr: document.getElementById("ms_empf_str") ? document.getElementById("ms_empf_str").value : "",
      empfOrt: document.getElementById("ms_empf_ort") ? document.getElementById("ms_empf_ort").value : ""
    };

    if(input.rueckstand <= 0) {
      out.innerHTML = `<div class="warning-box">Bitte gib einen Mietrückstand an.</div>`;
      return;
    }

    const stufe = stufeAmpel(input);
    out.innerHTML = ergebnisHTML(input, stufe);

    // Event Listener für den NEUEN PDF Download Button
    const pdfBtn = document.getElementById("btn_download_pdf");
    if (pdfBtn) {
      pdfBtn.addEventListener("click", () => {
        generatePDF(input, ratenvorschlag(input.rueckstand));
      });
    }

    // Originaler Copy-Button für Textarea
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