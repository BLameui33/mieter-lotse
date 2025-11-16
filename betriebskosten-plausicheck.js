// betriebskosten-plausicheck.js

function n(el){ if(!el) return 0; const raw=(el.value||"").toString().replace(",","."); const v=Number(raw); return Number.isFinite(v)?v:0; }
function euro(v){ const x=Number.isFinite(v)?v:0; return x.toFixed(2).replace(".",",")+" €"; }
function clamp(v,min,max){ return Math.min(Math.max(v,min),max); }

function badge(color, text, sub){
  const map = {
    gruen: "background:#e6f7eb;border-left:6px solid #10b981;",
    gelb:  "background:#fff7ed;border-left:6px solid #f59e0b;",
    rot:   "background:#fee2e2;border-left:6px solid #ef4444;"
  };
  return `<div class="highlight-box" style="${map[color]||""}"><strong>${text}</strong>${sub? " – "+sub:""}</div>`;
}

function bewertePlausibilitaet(kpm2, bandMin, bandMax, tolMinusPct, tolPlusPct){
  const low  = bandMin;
  const high = bandMax;
  const lowTol  = low  * (1 - tolMinusPct/100);
  const highTol = high * (1 + tolPlusPct/100);

  if (kpm2 <= 0) return { stufe: "rot", titel: "Daten prüfen", begruendung: "Kosten pro m² sind 0 oder negativ – Eingaben kontrollieren." };

  if (kpm2 < lowTol){
    return { stufe: "gelb", titel: "Auffällig niedrig", begruendung: "Deutlich unter dem unteren Referenzband – Prüfe, ob Kosten fehlen oder Vorauszahlung zu hoch war." };
  }
  if (kpm2 >= low && kpm2 <= high){
    return { stufe: "gruen", titel: "Im Rahmen", begruendung: "Innerhalb des gewählten Referenzbands." };
  }
  if (kpm2 > high && kpm2 <= highTol){
    return { stufe: "gelb", titel: "Grenzwertig", begruendung: "Knapp über dem oberen Referenzband – Details prüfen (Verbrauch/Preise)." };
  }
  return { stufe: "rot", titel: "Auffällig hoch", begruendung: "Deutlich über dem oberen Referenzband – Abrechnung & Belege prüfen lassen." };
}

function naechsteSchritteHTML(mitHeizung){
  return `
    <h3>Was jetzt prüfen?</h3>
    <ul>
      <li><strong>Abrechnungszeitraum &amp; Frist:</strong> 12 Monate üblich; Zustellung innerhalb der gesetzlichen Frist?</li>
      <li><strong>Umlageschlüssel:</strong> Nach m², Personen, Einheiten? Stimmt er mit dem Mietvertrag überein?</li>
      <li><strong>Positionen:</strong> Umlagefähig vs. nicht umlagefähig (z.&nbsp;B. Verwaltung, Instandhaltung sind nicht umlagefähig).</li>
      ${mitHeizung ? `<li><strong>Heizkosten:</strong> Verbrauchswerte, Ableseprotokoll, Brennstoffpreise, Verteilerschlüssel (HKVO) prüfen.</li>` : ``}
      <li><strong>Vorauszahlungen anpassen:</strong> Empfohlene neue Vorauszahlung siehe unten.</li>
      <li><strong>Belegeinsicht:</strong> Bei Auffälligkeiten Belegeinsicht verlangen; Mieterverein/ Beratung einschalten.</li>
    </ul>
  `;
}

function ergebnisHTML(inp, calc, bew){
  const header = badge(bew.stufe === "gruen" ? "gruen" : (bew.stufe === "gelb" ? "gelb" : "rot"), bew.titel, bew.begruendung);

  return `
    <h2>Ergebnis: Plausibilität der Betriebskosten</h2>

    ${header}

    <div class="pflegegrad-result-card">
      <h3>Deine Abrechnung (Kurzüberblick)</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Größe</th><th>Wert</th></tr></thead>
        <tbody>
          <tr><td>Wohnfläche</td><td>${inp.flaeche.toFixed(1).replace(".", ",")} m²</td></tr>
          <tr><td>Vorauszahlungen (gesamt im Zeitraum)</td><td>${euro(calc.vorausGesamt)}</td></tr>
          <tr><td>Nach-/Rückzahlung (für Zeitraum)</td><td>${euro(inp.nachzahlung)}</td></tr>
          <tr><td><strong>Ist-Kosten im Zeitraum</strong></td><td><strong>${euro(calc.istGesamt)}</strong></td></tr>
          <tr><td>Monatliche Ist-Kosten</td><td>${euro(calc.istProMonat)}</td></tr>
          <tr><td><strong>Ist-Kosten pro m²/Monat</strong></td><td><strong>${calc.kpm2.toFixed(2).replace(".", ",")} €/m²</strong></td></tr>
        </tbody>
      </table>

      <h3>Vergleich mit Referenzband</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Band (€/m²/Monat)</th><th>Toleranz unten</th><th>Toleranz oben</th></tr></thead>
        <tbody>
          <tr>
            <td>${inp.bandMin.toFixed(2).replace(".", ",")} – ${inp.bandMax.toFixed(2).replace(".", ",")}</td>
            <td>−${inp.tolMinus}%</td>
            <td>+${inp.tolPlus}%</td>
          </tr>
        </tbody>
      </table>

      <h3>Vorauszahlung anpassen?</h3>
      <p>
        Deine <strong>empfohlene neue Vorauszahlung</strong> (Monat) nach dieser Abrechnung:
        <strong>${euro(calc.empfohleneVorauszahlung)}</strong>.
        (Basis: Ist-Kosten / Monat, aufgerundet auf 5-€-Schritte.)
      </p>

      ${naechsteSchritteHTML(inp.mitHeizung)}

      <p class="hinweis">
        Hinweis: Referenzband ist nur eine grobe Orientierung und kann regional stark abweichen 
        (Gebäudezustand, Energiepreise, Baujahr, Lage, Abrechnungspraxis).
      </p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  // Inputs
  const fl = document.getElementById("bk_flaeche");
  const vz = document.getElementById("bk_voraus");
  const mo = document.getElementById("bk_monate");
  const nz = document.getElementById("bk_nachzahlung");
  const hz = document.getElementById("bk_mit_heizung");

  const bmin = document.getElementById("bk_band_min");
  const bmax = document.getElementById("bk_band_max");
  const tolP = document.getElementById("bk_tol_plus");
  const tolM = document.getElementById("bk_tol_minus");

  const btn = document.getElementById("bk_check");
  const reset = document.getElementById("bk_reset");
  const out = document.getElementById("bk_ergebnis");

  // Heuristik: Band automatisch vorbelegen, wenn Heizungs-Toggle wechselt
  function applyBandPreset(){
    const withHeat = (hz && hz.value) === "ja";
    if (withHeat){
      if (n(bmin) === 0) bmin.value = 3.50;
      if (n(bmax) === 0) bmax.value = 5.50;
    } else {
      if (n(bmin) === 0 || n(bmin) > 3.5) bmin.value = 1.80;
      if (n(bmax) === 0 || n(bmax) > 6)  bmax.value = 3.20;
    }
  }
  if (hz) { hz.addEventListener("change", () => { applyBandPreset(); out.innerHTML = ""; }); }

  if (!btn || !out) return;

  btn.addEventListener("click", () => {
    const inp = {
      flaeche: n(fl),
      voraus: n(vz),
      monate: Math.max(1, Math.floor(n(mo))),
      nachzahlung: n(nz),
      mitHeizung: (hz && hz.value) === "ja",
      bandMin: n(bmin),
      bandMax: n(bmax),
      tolPlus: clamp(n(tolP), 0, 50),
      tolMinus: clamp(n(tolM), 0, 50)
    };

    // Plausibilität der Eingaben
    if (inp.flaeche <= 0 || inp.voraus < 0 || inp.monate <= 0){
      out.innerHTML = `<div class="warning-box">Bitte gib eine plausible Wohnfläche, Vorauszahlung und Monate an.</div>`;
      return;
    }

    // Rechnen
    const vorausGesamt = inp.voraus * inp.monate;
    const istGesamt = vorausGesamt + inp.nachzahlung; // Nachzahlung (+) / Rückzahlung (−)
    const istProMonat = istGesamt / inp.monate;
    const kpm2 = inp.flaeche > 0 ? (istProMonat / inp.flaeche) : 0;

    // Empfehlung Vorauszahlung: glatter 5-€-Schritt
    const empV = Math.max(0, Math.ceil(istProMonat / 5) * 5);

    const bew = bewertePlausibilitaet(kpm2, inp.bandMin, inp.bandMax, inp.tolMinus, inp.tolPlus);

    out.innerHTML = ergebnisHTML(inp, {
      vorausGesamt, istGesamt, istProMonat, kpm2, empfohleneVorauszahlung: empV
    }, bew);
    out.scrollIntoView({ behavior: "smooth" });
  });

  if (reset){
    reset.addEventListener("click", () => {
      setTimeout(() => { out.innerHTML = ""; }, 0);
    });
  }
});
