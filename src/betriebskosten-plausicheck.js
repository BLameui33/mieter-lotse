function n(el){ if(!el) return 0; const raw=(el.value||"").toString().replace(",","."); const v=Number(raw); return Number.isFinite(v)?v:0; }
function euro(v){ return (Number.isFinite(v)?v:0).toFixed(2).replace(".",",")+" €"; }
function clamp(v,min,max){ return Math.min(Math.max(v,min),max); }

function badge(color, text, sub){
  const map = {
    gruen: "background:#e6f7eb; border-left:6px solid #10b981; color: #065f46;",
    gelb:  "background:#fff7ed; border-left:6px solid #f59e0b; color: #92400e;",
    rot:   "background:#fee2e2; border-left:6px solid #ef4444; color: #991b1b;"
  };
  return `<div style="padding: 1rem; margin-bottom: 1rem; border-radius: 0 4px 4px 0; ${map[color]||""}"><strong>${text}</strong>${sub? "<br><small>"+sub+"</small>":""}</div>`;
}

// Generiert einen visuellen Balken für das Ergebnis
function renderScale(kpm2, min, max, highTol) {
  // Begrenze Prozentwert für die Anzeige (damit der Pfeil nicht aus dem Bild fliegt)
  const range = highTol - (min * 0.8);
  let percent = ((kpm2 - (min * 0.8)) / range) * 100;
  percent = clamp(percent, 5, 95); 

  return `
    <div style="margin: 2rem 0;">
      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #6b7280; margin-bottom: 5px;">
        <span>Günstig</span>
        <span>Durchschnitt</span>
        <span>Teuer</span>
      </div>
      <div style="width:100%; height:12px; background: linear-gradient(to right, #10b981 0%, #f59e0b 60%, #ef4444 100%); border-radius:6px; position:relative;">
        <div style="position:absolute; left:${percent}%; top:-8px; width:4px; height:28px; background:#111; border-radius:2px; box-shadow: 0 0 4px rgba(0,00,0.3); transition: left 0.5s ease-out;">
          <div style="position:absolute; top:-25px; left:-20px; width:44px; text-align:center; font-weight:bold; font-size:0.8rem; background:#111; color:#fff; padding:2px 4px; border-radius:4px;">Deins</div>
        </div>
      </div>
    </div>
  `;
}

function bewertePlausibilitaet(kpm2, bandMin, bandMax, tolMinusPct, tolPlusPct){
  const low = bandMin;
  const high = bandMax;
  const lowTol = low * (1 - tolMinusPct/100);
  const highTol = high * (1 + tolPlusPct/100);

  if (kpm2 <= 0) return { stufe: "rot", titel: "Daten prüfen", begruendung: "Kosten pro m² sind 0 oder negativ – Eingaben kontrollieren." };
  if (kpm2 < lowTol) return { stufe: "gelb", titel: "Auffällig niedrig", begruendung: "Deine Kosten sind ungewöhnlich niedrig. Prüfe, ob Positionen in der Abrechnung fehlen oder die Vorauszahlung zu hoch angesetzt war." };
  if (kpm2 >= lowTol && kpm2 <= high) return { stufe: "gruen", titel: "Völlig im Rahmen", begruendung: "Deine Nebenkosten bewegen sich im normalen, statistischen Durchschnitt." };
  if (kpm2 > high && kpm2 <= highTol) return { stufe: "gelb", titel: "Grenzwertig / Etwas erhöht", begruendung: "Deine Kosten liegen leicht über dem Durchschnitt. Ein Blick auf Heizkosten oder Wasserverbrauch lohnt sich." };
  
  return { stufe: "rot", titel: "Auffällig hoch", begruendung: "Deine Kosten sind deutlich über dem Durchschnitt. Du solltest die Abrechnung detailliert prüfen (oder prüfen lassen) und Belege anfordern." };
}

document.addEventListener("DOMContentLoaded", () => {
  const fl = document.getElementById("bk_flaeche");
  const pers = document.getElementById("bk_personen");
  const vz = document.getElementById("bk_voraus");
  const mo = document.getElementById("bk_monate");
  const nz = document.getElementById("bk_nachzahlung");
  const hz = document.getElementById("bk_mit_heizung");

  const bmin = document.getElementById("bk_band_min");
  const bmax = document.getElementById("bk_band_max");
  const tolP = document.getElementById("bk_tol_plus");
  const tolM = document.getElementById("bk_tol_minus");
  const btn = document.getElementById("bk_check");
  const out = document.getElementById("bk_ergebnis");

  // Dynamische Anpassung des Referenzbandes basierend auf Eingaben
  function updateBandDynamically() {
    const withHeat = (hz && hz.value) === "ja";
    const persons = n(pers) || 1;
    const area = n(fl) || 60;
    
    // Basiswerte: Kalte Betriebskosten steigen leicht mit der Personenanzahl (Wasser/Müll)
    // Heuristik: 1.80€ Grundkosten + 0.30€ pro Person / 50qm
    let calcMin = 1.60 + ((persons * 0.20) * (50 / area)); 
    let calcMax = 2.60 + ((persons * 0.35) * (50 / area));

    if (withHeat) {
      calcMin += 1.20; // Plus Heizkosten Min
      calcMax += 2.50; // Plus Heizkosten Max
    }

    bmin.value = calcMin.toFixed(2);
    bmax.value = calcMax.toFixed(2);
  }

  // Event Listener für dynamisches Updaten
  if(hz) hz.addEventListener("change", updateBandDynamically);
  if(pers) pers.addEventListener("input", updateBandDynamically);
  if(fl) fl.addEventListener("blur", updateBandDynamically);

  if (!btn || !out) return;

  btn.addEventListener("click", () => {
    // Sichere Werte nochmal ab
    updateBandDynamically();

    const inp = {
      flaeche: n(fl), voraus: n(vz), monate: Math.max(1, Math.floor(n(mo))),
      nachzahlung: n(nz), mitHeizung: (hz && hz.value) === "ja",
      bandMin: n(bmin), bandMax: n(bmax), tolPlus: clamp(n(tolP), 0, 50), tolMinus: clamp(n(tolM), 0, 50)
    };

    if (inp.flaeche <= 0 || inp.voraus < 0 || inp.monate <= 0){
      out.innerHTML = badge("rot", "Eingabefehler", "Bitte gib eine plausible Wohnfläche und Vorauszahlung an.");
      return;
    }

    const vorausGesamt = inp.voraus * inp.monate;
    const istGesamt = vorausGesamt + inp.nachzahlung; 
    const istProMonat = istGesamt / inp.monate;
    const kpm2 = inp.flaeche > 0 ? (istProMonat / inp.flaeche) : 0;
    const empV = Math.max(0, Math.ceil(istProMonat / 5) * 5);

    const bew = bewertePlausibilitaet(kpm2, inp.bandMin, inp.bandMax, inp.tolMinus, inp.tolPlus);
    const scaleHTML = renderScale(kpm2, inp.bandMin, inp.bandMax, inp.bandMax * (1 + inp.tolPlus/100));

    out.innerHTML = `
      ${badge(bew.stufe, bew.titel, bew.begruendung)}
      ${scaleHTML}
      <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 1rem;">
        <h3 style="margin-top:0; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">Zahlen auf einen Blick</h3>
        <p style="display: flex; justify-content: space-between; margin: 0.5rem 0;"><span>Tatsächliche Kosten pro Monat:</span> <strong>${euro(istProMonat)}</strong></p>
        <p style="display: flex; justify-content: space-between; margin: 0.5rem 0; font-size: 1.1rem;"><span>Deine Kosten pro m²:</span> <strong>${kpm2.toFixed(2).replace(".", ",")} €/m²</strong></p>
        <p style="display: flex; justify-content: space-between; margin: 0.5rem 0; color: #6b7280;"><span>Normales Referenzband:</span> <span>${inp.bandMin.toFixed(2).replace(".", ",")} – ${inp.bandMax.toFixed(2).replace(".", ",")} €/m²</span></p>
        
        <div style="margin-top: 1.5rem; background: #e0f2fe; padding: 1rem; border-radius: 6px; border-left: 4px solid #0284c7;">
          <strong>💡 Tipp für die Zukunft:</strong><br>
          Um Nachzahlungen zu vermeiden, sollte deine Vorauszahlung bei ca. <strong>${euro(empV)}</strong> liegen.
        </div>
      </div>
    `;
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});