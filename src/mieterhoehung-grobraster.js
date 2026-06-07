// mieterhoehung-grobraster.js

function n(el){ if(!el) return 0; const raw=(el.value||"").toString().replace(",","."); const v=Number(raw); return Number.isFinite(v)?v:0; }
function euro(v){ const x=Number.isFinite(v)?v:0; return x.toFixed(2).replace(".",",")+" €"; }

function diffInMonths(fromDate){
  if(!fromDate) return null;
  const d = new Date(fromDate);
  if(isNaN(d.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function badge(color, text, sub){
  const map = {
    gruen: "background:#e6f7eb;border-left:6px solid #10b981;",
    gelb:  "background:#fff7ed;border-left:6px solid #f59e0b;",
    rot:   "background:#fee2e2;border-left:6px solid #ef4444;"
  };
  return `<div class="highlight-box" style="${map[color]||""}"><strong>${text}</strong>${sub? " – "+sub:""}</div>`;
}

function grobrasterBewertung({ alt, neu, lastMonths, angespannt, modernisierung, sondermiete, mietspiegel }){
  const pctCap = angespannt ? 0.15 : 0.20;
  const incAbs = Math.max(0, neu - alt);
  const incPct = alt > 0 ? incAbs / alt : 0;

  // Sonderfall: Index/Staffel -> andere Regeln, hier nur Hinweis
  if (sondermiete === "index" || sondermiete === "staffel"){
    return {
      stufe: "gelb",
      titel: "Sonderfall (Index/Staffel)",
      begruendung: "Bei Index- oder Staffelmieten gelten abweichende Regeln. Bitte Vertrag/Staffel/Indexwert prüfen.",
      incPct, pctCap, lastMonths,
      flags: { sonder: true }
    };
  }

  // Sonderfall: Modernisierung -> andere Obergrenzen/Ansätze (hier nicht berechnet)
  if (modernisierung){
    return {
      stufe: "gelb",
      titel: "Sonderfall (Modernisierung)",
      begruendung: "Modernisierungserhöhungen folgen eigenen Berechnungsregeln. Belege/Kostenansatz prüfen lassen.",
      incPct, pctCap, lastMonths,
      flags: { modernisierung: true }
    };
  }

  // Frist-Check (vereinfacht)
  let fristOk = true, fristNote = "";
  if (lastMonths === null){
    fristOk = false; fristNote = "Datum der letzten Erhöhung unbekannt";
  } else if (lastMonths < 12){
    fristOk = false; fristNote = "Seit letzter Erhöhung < 12 Monate";
  } else if (lastMonths >= 12 && lastMonths < 15){
    fristOk = true;  fristNote = "Zwischen 12–15 Monaten: Zugang/Wirksamkeit genau prüfen";
  } else {
    fristOk = true;  fristNote = "≥ 15 Monate";
  }

  // Kappungsgrenze
  const capOk = incPct <= pctCap + 0.005; // Toleranz 0,5 %-Punkte
  const capDelta = incPct - pctCap;

  // Mietspiegel (optional)
  let spiegelOk = null;
  if (mietspiegel > 0){
    spiegelOk = neu <= mietspiegel;
  }

  // Einordnung
  if (!fristOk) {
    return {
      stufe: "rot",
      titel: "Eher unzulässig",
      begruendung: fristNote + ".",
      incPct, pctCap, lastMonths, spiegelOk
    };
  }

  if (!capOk && capDelta > 0.02){
    return {
      stufe: "rot",
      titel: "Eher unzulässig",
      begruendung: `Erhöhung um ${(incPct*100).toFixed(1).replace(".",",")} % über Kappungsgrenze (${(pctCap*100).toFixed(0)} %).`,
      incPct, pctCap, lastMonths, spiegelOk
    };
  }

  // Grenzfälle: knapp über Cap (≤2 %-Punkte), 12–15 Monate, Mietspiegel fehlt/überschritten
  const grenzFrist = lastMonths >= 12 && lastMonths < 15;
  const grenzCap   = !capOk && capDelta <= 0.02;
  const grenzSpiegel = (spiegelOk === false) || (spiegelOk === null);

  if (grenzFrist || grenzCap || grenzSpiegel){
    return {
      stufe: "gelb",
      titel: "Grenzwertig",
      begruendung: [
        grenzFrist ? "Frist nahe der Grenze" : null,
        grenzCap ? "knapp über Kappungsgrenze" : null,
        (spiegelOk === false) ? "über ortsüblicher Vergleichsmiete" : (spiegelOk === null ? "Mietspiegel nicht geprüft" : null)
      ].filter(Boolean).join(" · "),
      incPct, pctCap, lastMonths, spiegelOk
    };
  }

  return {
    stufe: "gruen",
    titel: "Wahrscheinlich zulässig",
    begruendung: `Frist eingehalten und Erhöhung ≤ ${(pctCap*100).toFixed(0)} %.`,
    incPct, pctCap, lastMonths, spiegelOk
  };
}

function naechsteSchritteHTML(res){
  const steps = [];

  // immer: Formalien & Begründung prüfen
  steps.push(`
    <h3>Was jetzt prüfen?</h3>
    <ul>
      <li><strong>Formalia des Mieterhöhungsverlangens:</strong> Schriftform, Begründung (Mietspiegel/Vergleichswohnungen), richtige Berechnung.</li>
      <li><strong>Mietspiegel:</strong> Feld, Lage, Baujahr, Ausstattung – passt die Einstufung?</li>
      <li><strong>Kappungsgrenze:</strong> Gilt vor Ort 15&nbsp;% (angespannter Markt) oder 20&nbsp;%?</li>
      <li><strong>Fristen:</strong> Mind. 12 Monate seit letzter Erhöhung; Wirksamkeit in der Regel später (vereinfacht).</li>
    </ul>
  `);

  // Bei Gelb/Rot: Hilfe holen
  if (res.stufe !== "gruen"){
    steps.push(`
      <h3>Hilfe holen</h3>
      <ul>
        <li><strong>Mieterverein</strong> oder <strong>Rechtsberatung</strong> kontaktieren (Fristen beachten!).</li>
        <li>Unterlagen bereithalten: Erhöhungsschreiben, letzte Erhöhung (Datum), Mietvertrag, ggf. Mietspiegel-Auszug.</li>
      </ul>
    `);
  }

  // Sonderfälle
  steps.push(`
    <h3>Sonderfälle</h3>
    <ul>
      <li><strong>Modernisierung:</strong> Eigene Berechnungsregeln (z.&nbsp;B. Kostenansatz, Abzüge, Kappung) – Belege prüfen lassen.</li>
      <li><strong>Index-/Staffelmiete:</strong> Vertragliche Regelungen/VPI-Werte bzw. Staffeltermine genau prüfen.</li>
    </ul>
  `);

  return steps.join("\n");
}

function ergebnisHTML(input, res){
  const pct = (res.incPct*100).toFixed(1).replace(".",",");
  const cap = (res.pctCap*100).toFixed(0);

  const farbe = res.stufe === "gruen" ? "gruen" : (res.stufe === "gelb" ? "gelb" : "rot");

  const header = res.stufe === "gruen"
    ? badge(farbe, res.titel, res.begruendung)
    : badge(farbe, res.titel, res.begruendung);

  const lastTxt = (res.lastMonths === null) ? "unbekannt" : `${res.lastMonths} Monate`;

  const spiegelRow = (res.spiegelOk === null)
    ? `<tr><td>Ortsübliche Vergleichsmiete</td><td>nicht angegeben</td></tr>`
    : `<tr><td>Ortsübliche Vergleichsmiete</td><td>${res.spiegelOk ? "≤ Vergleichsmiete" : "über Vergleichsmiete"}</td></tr>`;

  return `
    <h2>Ergebnis: Mieterhöhung – Grobraster</h2>

    ${header}

    <div class="pflegegrad-result-card">
      <h3>Deine Angaben & Berechnung</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Größe</th><th>Wert</th></tr></thead>
        <tbody>
          <tr><td>Bisherige / neue Kaltmiete</td><td>${euro(input.alt)} → <strong>${euro(input.neu)}</strong></td></tr>
          <tr><td>Erhöhungsprozentsatz</td><td><strong>${pct} %</strong></td></tr>
          <tr><td>Kappungsgrenze (regional)</td><td>${cap} %</td></tr>
          <tr><td>Seit letzter Erhöhung</td><td>${lastTxt}</td></tr>
          <tr><td>Modernisierung als Begründung?</td><td>${input.modernisierung ? "Ja" : "Nein"}</td></tr>
          <tr><td>Index-/Staffelmiete?</td><td>${
            input.sondermiete === "index" ? "Indexmiete" : (input.sondermiete === "staffel" ? "Staffelmiete" : "Nein")
          }</td></tr>
          ${spiegelRow}
        </tbody>
      </table>

      ${naechsteSchritteHTML(res)}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const alt = document.getElementById("mh_alt");
  const neu = document.getElementById("mh_neu");
  const last = document.getElementById("mh_last_date");
  const ang = document.getElementById("mh_angespannt");
  const mod = document.getElementById("mh_mod");
  const sdm = document.getElementById("mh_sondermiete");
  const spg = document.getElementById("mh_mietspiegel");

  const btn = document.getElementById("mh_check");
  const reset = document.getElementById("mh_reset");
  const out = document.getElementById("mh_ergebnis");

  if (!btn || !out) return;

  btn.addEventListener("click", () => {
    const input = {
      alt: n(alt),
      neu: n(neu),
      lastMonths: diffInMonths(last && last.value),
      angespannt: (ang && ang.value) === "ja",
      modernisierung: (mod && mod.value) === "ja",
      sondermiete: (sdm && sdm.value) || "keine",
      mietspiegel: n(spg)
    };

    // Basic Plausibilitätscheck
    if (input.alt <= 0 || input.neu <= 0 || input.neu < input.alt){
      out.innerHTML = `
        <div class="warning-box">
          Bitte gib eine plausible <strong>bisherige</strong> und <strong>neue</strong> Kaltmiete an (neu ≥ alt &gt; 0).
        </div>`;
      return;
    }

    const res = grobrasterBewertung(input);
    out.innerHTML = ergebnisHTML(input, res);
    out.scrollIntoView({ behavior: "smooth" });
  });

  if (reset){
    reset.addEventListener("click", () => {
      setTimeout(() => { out.innerHTML = ""; }, 0);
    });
  }
});
