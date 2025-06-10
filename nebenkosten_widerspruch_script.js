document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchNebenkostenForm');
    const saveBtn = document.getElementById('saveBtnNKWiderspruch');
    const loadBtn = document.getElementById('loadBtnNKWiderspruch');
    const closePopupBtn = document.getElementById('closePopupBtnNKWiderspruch');
    const spendenPopup = document.getElementById('spendenPopupNKWiderspruch');
    const storageKey = 'widerspruchNebenkostenFormData';

    const widerspruchspunkteContainer = document.getElementById('widerspruchspunkteContainer');
    const addWiderspruchspunktBtn = document.getElementById('addWiderspruchspunktBtn');
    let widerspruchspunktCounter = 1; // Zählt die Widerspruchsblöcke

    // --- Dynamische Widerspruchsblöcke hinzufügen ---
    if (addWiderspruchspunktBtn) {
        addWiderspruchspunktBtn.addEventListener('click', function() {
            widerspruchspunktCounter++;
            const newBlock = document.createElement('div');
            newBlock.classList.add('widerspruchspunkt-block');
            newBlock.innerHTML = `
                <h4 style="font-size:1.1em; margin-top:1rem; color:#555;">Widerspruchspunkt ${widerspruchspunktCounter}</h4>
                <label for="widerspruchspunkt${widerspruchspunktCounter}_position">Beanstandete Kostenposition / Aspekt:</label>
                <input type="text" id="widerspruchspunkt${widerspruchspunktCounter}_position" name="widerspruch_position[]" required placeholder="z.B. Heizkosten, Hausreinigung">
                <label for="widerspruchspunkt${widerspruchspunktCounter}_begruendung">Begründung für die Beanstandung:</label>
                <textarea id="widerspruchspunkt${widerspruchspunktCounter}_begruendung" name="widerspruch_begruendung[]" rows="3" required placeholder="z.B. Verteilerschlüssel falsch, Kosten zu hoch - bitte Belege"></textarea>
                <button type="button" class="removeWiderspruchspunktBtn button-secondary" style="font-size:0.8em; padding:5px 10px; background-color:#e74c3c; margin-top:0.5rem;">Diesen Punkt entfernen</button>
            `;
            widerspruchspunkteContainer.appendChild(newBlock);
            updateRemoveButtonsWiderspruch();
        });
    }

    function updateRemoveButtonsWiderspruch() {
        const removeButtons = widerspruchspunkteContainer.querySelectorAll('.removeWiderspruchspunktBtn');
        removeButtons.forEach(btn => {
            btn.onclick = function() { 
                btn.parentElement.remove();
                const verbleibendeBloecke = widerspruchspunkteContainer.querySelectorAll('.widerspruchspunkt-block');
                widerspruchspunktCounter = verbleibendeBloecke.length; 
                verbleibendeBloecke.forEach((block, index) => {
                    const newIndex = index + 1;
                    block.querySelector('h4').textContent = `Widerspruchspunkt ${newIndex}`;
                    // IDs der Inputs und Textareas anpassen (wichtig für Speichern/Laden und eindeutige Labels)
                    block.querySelector('input[name="widerspruch_position[]"]').id = `widerspruchspunkt${newIndex}_position`;
                    block.querySelector('textarea[name="widerspruch_begruendung[]"]').id = `widerspruchspunkt${newIndex}_begruendung`;
                    // Labels' "for" Attribute anpassen
                    block.querySelectorAll('label').forEach(label => {
                        const forAttr = label.getAttribute('for');
                        if(forAttr && forAttr.includes('_position')) label.setAttribute('for', `widerspruchspunkt${newIndex}_position`);
                        if(forAttr && forAttr.includes('_begruendung')) label.setAttribute('for', `widerspruchspunkt${newIndex}_begruendung`);
                    });
                });
                if (widerspruchspunktCounter === 0 && addWiderspruchspunktBtn) {
                    addWiderspruchspunktBtn.click(); // Fügt einen neuen leeren Block hinzu, wenn alle entfernt wurden
                }
            };
        });
    }
    updateRemoveButtonsWiderspruch(); // Für den ersten, statisch im HTML erstellten Block


    // --- Speichern & Laden Logik ---
    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        if (element && typeof element.value !== 'undefined' && element.value !== null) {
            return String(element.value);
        }
        return defaultValue;
    }
    function getElementChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }
    
    const formElementIds = [ 
        "mieterName", "mieterAdresse", 
        "vermieterName", "vermieterAdresse",
        "datumNebenkostenabrechnung", "abrechnungszeitraum", "nachforderungGuthaben",
        "forderungNebenkosten", "fristStellungnahmeNK",
        "anlageSonstigesNKWiderspruch"
    ];
    const belegeinsichtCheckboxId = "antragBelegeinsicht";
    const anlagenCheckboxName = "anlagenNKWiderspruch";

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            data[id] = getElementValue(id);
        });
        data[belegeinsichtCheckboxId] = getElementChecked(belegeinsichtCheckboxId);
        
        data.widerspruchspunkte = [];
        const positions = document.querySelectorAll('input[name="widerspruch_position[]"]');
        const begruendungen = document.querySelectorAll('textarea[name="widerspruch_begruendung[]"]');
        for (let i = 0; i < positions.length; i++) {
            if (positions[i].value.trim() !== "" || begruendungen[i].value.trim() !== "") { 
                data.widerspruchspunkte.push({
                    position: positions[i].value,
                    begruendung: begruendungen[i].value
                });
            }
        }
        
        data.anlagen = [];
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`).forEach(cb => data.anlagen.push(cb.value));
        return data;
    }

    function populateForm(data) {
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.value = data[id];
            }
        });
        const belegeinsichtEl = document.getElementById(belegeinsichtCheckboxId);
        if (belegeinsichtEl && data[belegeinsichtCheckboxId] !== undefined) {
            belegeinsichtEl.checked = data[belegeinsichtCheckboxId];
        }

        // Widerspruchspunkte wiederherstellen
        widerspruchspunkteContainer.innerHTML = ''; 
        widerspruchspunktCounter = 0;
        if (data.widerspruchspunkte && data.widerspruchspunkte.length > 0) {
            data.widerspruchspunkte.forEach((punkt) => {
                widerspruchspunktCounter++;
                const newBlock = document.createElement('div');
                newBlock.classList.add('widerspruchspunkt-block');
                newBlock.innerHTML = `
                    <h4 style="font-size:1.1em; margin-top:${widerspruchspunktCounter > 1 ? '1.5rem' : '0'}; border-top:${widerspruchspunktCounter > 1 ? '1px dashed #ccc' : 'none'}; padding-top:${widerspruchspunktCounter > 1 ? '1rem' : '0'};">Widerspruchspunkt ${widerspruchspunktCounter}</h4>
                    <label for="widerspruchspunkt${widerspruchspunktCounter}_position">Beanstandete Kostenposition / Aspekt:</label>
                    <input type="text" id="widerspruchspunkt${widerspruchspunktCounter}_position" name="widerspruch_position[]" value="${punkt.position || ''}" required>
                    <label for="widerspruchspunkt${widerspruchspunktCounter}_begruendung">Begründung für die Beanstandung:</label>
                    <textarea id="widerspruchspunkt${widerspruchspunktCounter}_begruendung" name="widerspruch_begruendung[]" rows="3" required>${punkt.begruendung || ''}</textarea>
                    ${widerspruchspunktCounter > 1 ? '<button type="button" class="removeWiderspruchspunktBtn button-secondary" style="font-size:0.8em; padding:5px 10px; background-color:#e74c3c; margin-top:0.5rem;">Diesen Punkt entfernen</button>' : ''}
                `;
                widerspruchspunkteContainer.appendChild(newBlock);
            });
        } else { 
            // Erstelle den ersten Widerspruchspunkt-Block, wenn keine Daten geladen wurden oder keine Punkte gespeichert waren
            widerspruchspunktCounter = 1;
            const firstBlock = document.createElement('div');
            firstBlock.classList.add('widerspruchspunkt-block');
            firstBlock.innerHTML = `
                <h4>Widerspruchspunkt 1</h4>
                <label for="widerspruchspunkt1_position">Beanstandete Kostenposition / Aspekt:</label>
                <input type="text" id="widerspruchspunkt1_position" name="widerspruch_position[]" required placeholder="z.B. Heizkosten, Hausreinigung">
                <label for="widerspruchspunkt1_begruendung">Begründung für die Beanstandung:</label>
                <textarea id="widerspruchspunkt1_begruendung" name="widerspruch_begruendung[]" rows="3" required placeholder="z.B. Verteilerschlüssel falsch, Kosten zu hoch - bitte Belege"></textarea>
            `; // Kein Entfernen-Button für den ersten Block initial
            widerspruchspunkteContainer.appendChild(firstBlock);
        }
        updateRemoveButtonsWiderspruch();

        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(cb => {
            if (cb) cb.checked = !!(data.anlagen && data.anlagen.includes(cb.value));
        });
    }
    
    // Initial einen Widerspruchsblock anzeigen, falls der Container leer ist (nachdem HTML geladen wurde)
    if (widerspruchspunkteContainer && widerspruchspunkteContainer.children.length === 0 && addWiderspruchspunktBtn) {
       addWiderspruchspunktBtn.click(); // Ersten Block hinzufügen
       const firstRemoveBtn = widerspruchspunkteContainer.querySelector('.widerspruchspunkt-block .removeWiderspruchspunktBtn');
       if(firstRemoveBtn) firstRemoveBtn.remove(); // Beim allerersten Block den Entfernen-Button nicht anzeigen
    }


    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const data = getFormData();
          if(data.widerspruchspunkte.length === 0 || data.widerspruchspunkte.every(p => p.position.trim() === "" && p.begruendung.trim() === "")) {
              alert("Bitte geben Sie mindestens einen Widerspruchspunkt mit Begründung an.");
              return;
          }
          localStorage.setItem(storageKey, JSON.stringify(data));
          alert('Ihre Eingaben wurden im Browser gespeichert!');
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                populateForm(JSON.parse(savedData));
                alert('Gespeicherte Eingaben wurden geladen!');
            } else {
                alert('Keine gespeicherten Daten gefunden.');
            }
        });
    }
    
    const autoLoadData = localStorage.getItem(storageKey);
    if (autoLoadData) {
      try {
        populateForm(JSON.parse(autoLoadData));
      } catch (e) {
        console.error("Fehler beim Laden der Daten für NK-Widerspruch:", e);
        localStorage.removeItem(storageKey);
      }
    }

    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', function() {
            spendenPopup.style.display = 'none';
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = getFormData();
            if(formData.widerspruchspunkte.length === 0 || formData.widerspruchspunkte.every(p => p.position.trim() === "" && p.begruendung.trim() === "" )) {
                alert("Bitte geben Sie mindestens einen Widerspruchspunkt mit Position und Begründung an.");
                return;
            }
            generateNKWiderspruchPDF(formData); 
        });
    }
}); // Ende DOMContentLoaded

function generateNKWiderspruchPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 3; 
    const subHeadingFontSize = 11;
    const textFontSize = 10;     

    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin/2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle); 
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        const fontStyle = options.fontStyle || "normal";
        const extraSpacing = options.extraSpacingAfter === undefined ? spaceAfterParagraph : options.extraSpacingAfter;
        doc.setFontSize(paragraphFontSize);
        doc.setFont("times", fontStyle);
        
        const lines = doc.splitTextToSize(textToWrite, pageWidth - (2 * margin));
        for (let i = 0; i < lines.length; i++) {
            if (y + paragraphLineHeight > usableHeight - (margin/2) ) { doc.addPage(); y = margin; }
            doc.text(lines[i], margin, y);
            y += paragraphLineHeight;
        }
        if (y + extraSpacing > usableHeight - (margin/2) && lines.length > 0) {
             doc.addPage(); y = margin;
        } else if (lines.length > 0) { 
            y += extraSpacing;
        }
    }
    function getFormattedDateValue(value, defaultValue = "N/A") {
        return value ? new Date(value).toLocaleDateString("de-DE") : defaultValue;
    }
    
    const {
        mieterName, mieterAdresse, 
        vermieterName, vermieterAdresse,
        datumNebenkostenabrechnung, abrechnungszeitraum, nachforderungGuthaben,
        widerspruchspunkte, // Array von Objekten
        antragBelegeinsicht, // boolean
        forderungNebenkosten, fristStellungnahmeNK,
        anlagen, 
        anlageSonstigesNKWiderspruch // Dieser Wert wird bereits im 'anlagen' Array enthalten sein, falls ausgefüllt
    } = data;

    const datumNkFormatiert = getFormattedDateValue(datumNebenkostenabrechnung, 'UNBEKANNT');
    const fristStellungnahmeFormatiert = getFormattedDateValue(fristStellungnahmeNK, '');


    doc.setFont("times", "normal");

    // Absender (Mieter)
    writeLine(mieterName, defaultLineHeight, "normal", textFontSize);
    mieterAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger (Vermieter)
    writeLine(vermieterName, defaultLineHeight, "normal", textFontSize);
    vermieterAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let mietobjektAdresseKurz = (mieterAdresse.split("\n")[0] || '[Adresse der Wohnung]').trim();
    let betreffText = `Widerspruch gegen die Nebenkostenabrechnung vom ${datumNkFormatiert}`;
    betreffText += `\nfür das Mietobjekt: ${mietobjektAdresseKurz}`;
    betreffText += `\nAbrechnungszeitraum: ${abrechnungszeitraum || 'N/A'}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit lege ich fristgerecht Widerspruch gegen die von Ihnen erstellte Nebenkostenabrechnung vom ${datumNkFormatiert} für den Abrechnungszeitraum ${abrechnungszeitraum || 'N/A'} ein. Die Abrechnung weist eine ${nachforderungGuthaben || 'Nachzahlung/ein Guthaben'} aus.`);
    writeParagraph(`Nach sorgfältiger Prüfung der Abrechnung bin ich zu dem Ergebnis gekommen, dass diese in mehreren Punkten fehlerhaft bzw. nicht nachvollziehbar ist.`);
    
    // Auflistung der Widerspruchspunkte
    if (widerspruchspunkte && widerspruchspunkte.length > 0) {
        writeLine("Im Einzelnen beanstande ich folgende Punkte:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph/2;
        widerspruchspunkte.forEach((punkt, index) => {
            writeParagraph(`${index + 1}. Beanstandete Kostenposition/Aspekt: ${punkt.position || 'Nicht spezifiziert'}`, defaultLineHeight, textFontSize, {fontStyle:"bold", extraSpacingAfter:1});
            writeParagraph(`   Begründung: ${punkt.begruendung || 'Keine detaillierte Begründung angegeben.'}`, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight*0.5});
        });
    } else {
        writeParagraph("Die genauen Punkte meines Widerspruchs entnehmen Sie bitte der beigefügten detaillierten Begründung.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    
    // Antrag auf Belegeinsicht
    if (antragBelegeinsicht) {
        y += defaultLineHeight/2;
        writeLine("Antrag auf Belegeinsicht:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph/2;
        writeParagraph("Zur weiteren Klärung der oben genannten Punkte beantrage ich hiermit gemäß § 259 BGB Einsicht in sämtliche Originalbelege, die dieser Nebenkostenabrechnung zugrunde liegen. Bitte nennen Sie mir hierfür zeitnah Terminvorschläge oder ermöglichen Sie mir die Zusendung von Kopien gegen Übernahme der Kopierkosten.", defaultLineHeight, textFontSize);
    }
    
    // Forderung
    writeLine("Meine Forderung:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    if (forderungNebenkosten.trim() !== "") {
        writeParagraph(forderungNebenkosten, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else {
        writeParagraph(`Ich fordere Sie daher auf, die Nebenkostenabrechnung vom ${datumNkFormatiert} unter Berücksichtigung meiner Einwände zu korrigieren und mir eine neue, nachvollziehbare Abrechnung zukommen zu lassen. Ein sich daraus ergebendes Guthaben bitte ich auf mein Konto zu überweisen.`, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    }

    // Fristsetzung
    if (fristStellungnahmeFormatiert && fristStellungnahmeFormatiert !== "N/A") {
        writeParagraph(`Ich bitte um Ihre schriftliche Stellungnahme bzw. um die Zusendung einer korrigierten Abrechnung bis zum **${fristStellungnahmeFormatiert}**.`, defaultLineHeight, textFontSize);
    } else {
        const standardFrist = new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); // Ca. 3 Wochen
        writeParagraph(`Ich bitte um Ihre schriftliche Stellungnahme bzw. um die Zusendung einer korrigierten Abrechnung bis spätestens zum **${standardFrist}**.`, defaultLineHeight, textFontSize);
    }
    writeParagraph("Bis zur Klärung der strittigen Punkte werde ich eventuelle Nachforderungen aus der beanstandeten Abrechnung nur unter Vorbehalt leisten bzw. mein Zurückbehaltungsrecht ausüben.", defaultLineHeight, textFontSize, {fontStyle:"italic"});

    // Anlagen
    if (anlagen && anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    writeParagraph("Mit freundlichen Grüßen");
    writeParagraph("\n\n_________________________"); 
    writeParagraph(mieterName);

    doc.save("widerspruch_nebenkostenabrechnung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupNKWiderspruch");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}