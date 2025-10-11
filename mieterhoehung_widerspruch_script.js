document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchMieterhoehungForm');
    const saveBtn = document.getElementById('saveBtnMieterhoehung');
    const loadBtn = document.getElementById('loadBtnMieterhoehung');
    const closePopupBtn = document.getElementById('closePopupBtnMieterhoehung');
    const spendenPopup = document.getElementById('spendenPopupMieterhoehung');
    const storageKey = 'widerspruchMieterhoehungFormData';

    // --- Steuerung der dynamischen Detail-Felder für Widerspruchsgründe ---
    const widerspruchsgrundCheckboxes = document.querySelectorAll('input[name="widerspruchsgrund"]');
    const detailsFormelleFehlerDiv = document.getElementById('detailsFormelleFehler');
    const detailsJahressperrfristDiv = document.getElementById('detailsJahressperrfrist');
    const detailsKappungsgrenzeDiv = document.getElementById('detailsKappungsgrenze');
    const detailsVergleichsmieteDiv = document.getElementById('detailsVergleichsmiete');
    const detailsModernisierungDiv = document.getElementById('detailsModernisierung');
    const entscheidungMieterSelect = document.getElementById('entscheidungMieter');
    const zustimmungTeilweiseDetailsDiv = document.getElementById('zustimmungTeilweiseDetails');
    const textBegruendungVermieterDiv = document.getElementById('detailsBegruendungVermieter'); // Div für Details zur Vermieterbegründung
    const begruendungVermieterSelect = document.getElementById('begruendungVermieter');


    function toggleDetailDiv(checkboxValue, detailsDiv, requiredTextareaId = null) {
        const checkbox = document.querySelector(`input[name="widerspruchsgrund"][value="${checkboxValue}"]`);
        if (checkbox && detailsDiv) {
            const isVisible = checkbox.checked;
            detailsDiv.style.display = isVisible ? 'block' : 'none';
            detailsDiv.classList.toggle('sub-details-active', isVisible);
            if (requiredTextareaId) {
                const textarea = document.getElementById(requiredTextareaId);
                if (textarea) textarea.required = isVisible;
            }
        }
    }

    widerspruchsgrundCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.value === 'formell') toggleDetailDiv('formell', detailsFormelleFehlerDiv, 'textFormelleFehler');
            if (this.value === 'jahressperrfrist') toggleDetailDiv('jahressperrfrist', detailsJahressperrfristDiv, 'datumLetzteMieterhoehung');
            if (this.value === 'kappungsgrenze') toggleDetailDiv('kappungsgrenze', detailsKappungsgrenzeDiv, 'mieteVor3Jahren');
            if (this.value === 'vergleichsmiete') toggleDetailDiv('vergleichsmiete', detailsVergleichsmieteDiv, 'textVergleichsmiete');
            if (this.value === 'modernisierung') toggleDetailDiv('modernisierung', detailsModernisierungDiv, 'textModernisierung');
        });
        // Initialer Check beim Laden der Seite
        if (cb.value === 'formell') toggleDetailDiv('formell', detailsFormelleFehlerDiv, 'textFormelleFehler');
        if (cb.value === 'jahressperrfrist') toggleDetailDiv('jahressperrfrist', detailsJahressperrfristDiv, 'datumLetzteMieterhoehung');
        if (cb.value === 'kappungsgrenze') toggleDetailDiv('kappungsgrenze', detailsKappungsgrenzeDiv, 'mieteVor3Jahren');
        if (cb.value === 'vergleichsmiete') toggleDetailDiv('vergleichsmiete', detailsVergleichsmieteDiv, 'textVergleichsmiete');
        if (cb.value === 'modernisierung') toggleDetailDiv('modernisierung', detailsModernisierungDiv, 'textModernisierung');

    });

    if(entscheidungMieterSelect && zustimmungTeilweiseDetailsDiv) {
        entscheidungMieterSelect.addEventListener('change', function() {
            const isVisible = this.value === 'zustimmung_teilweise';
            zustimmungTeilweiseDetailsDiv.style.display = isVisible ? 'block' : 'none';
            zustimmungTeilweiseDetailsDiv.classList.toggle('sub-details-active', isVisible);
            document.getElementById('zustimmungBetrag').required = isVisible;
        });
        // Initialer Check
        const isVisibleInitial = entscheidungMieterSelect.value === 'zustimmung_teilweise';
        zustimmungTeilweiseDetailsDiv.style.display = isVisibleInitial ? 'block' : 'none';
        zustimmungTeilweiseDetailsDiv.classList.toggle('sub-details-active', isVisibleInitial);
        if(document.getElementById('zustimmungBetrag')) document.getElementById('zustimmungBetrag').required = isVisibleInitial;

    }
    
    if(begruendungVermieterSelect && textBegruendungVermieterDiv){
        begruendungVermieterSelect.addEventListener('change', function(){
            const showDetails = ['Mietspiegel', 'Vergleichswohnungen', 'Sachverständigengutachten'].includes(this.value);
            textBegruendungVermieterDiv.style.display = showDetails ? 'block' : 'none';
            textBegruendungVermieterDiv.classList.toggle('sub-details-active', showDetails);
            document.getElementById('textBegruendungVermieter').required = showDetails;
        });
        // Initialer Check
        const showDetailsInitial = ['Mietspiegel', 'Vergleichswohnungen', 'Sachverständigengutachten'].includes(begruendungVermieterSelect.value);
        textBegruendungVermieterDiv.style.display = showDetailsInitial ? 'block' : 'none';
        textBegruendungVermieterDiv.classList.toggle('sub-details-active', showDetailsInitial);
         if(document.getElementById('textBegruendungVermieter')) document.getElementById('textBegruendungVermieter').required = showDetailsInitial;
    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "mieterName", "mieterAdresse", 
        "vermieterName", "vermieterAdresse",
        "datumMieterhoehungsschreiben", "aktuelleKaltmiete", "neueMieteAbDatum", "neueKaltmiete",
        "begruendungVermieter", "textBegruendungVermieter",
        "textFormelleFehler", "datumLetzteMieterhoehung", 
        "mieteVor3Jahren", "kappungsgrenzeProzent", "textVergleichsmiete", "textModernisierung",
        "ergaenzendeArgumenteMieterhoehung", 
        "entscheidungMieter", "zustimmungBetrag", "forderungMieterhoehung",
        "anlageSonstigesMieterhoehung"
    ];
    const widerspruchsgrundCheckboxName = "widerspruchsgrund";
    const anlagenCheckboxName = "anlagenMieterhoehung";

    function getElementValue(id, defaultValue = "") { /* ... (aus anderem Skript kopieren) ... */ }
    function getElementChecked(id, defaultValue = false) { /* ... (aus anderem Skript kopieren) ... */ }
    // Kopiere die getElementValue und getElementChecked Funktionen von einem anderen Skript hierher
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

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            data[id] = getElementValue(id);
        });
        
        data.widerspruchsgruende = [];
        document.querySelectorAll(`input[name="${widerspruchsgrundCheckboxName}"]:checked`).forEach(cb => data.widerspruchsgruende.push(cb.value));
        
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

        document.querySelectorAll(`input[name="${widerspruchsgrundCheckboxName}"]`).forEach(cb => {
            if(cb) cb.checked = !!(data.widerspruchsgruende && data.widerspruchsgruende.includes(cb.value));
            // Trigger change event to show/hide details
            if(cb.checked) {
                const event = new Event('change');
                cb.dispatchEvent(event);
            }
        });
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(cb => {
            if(cb) cb.checked = !!(data.anlagen && data.anlagen.includes(cb.value));
        });
        
        // Initial visibility for conditional selects
        if(entscheidungMieterSelect && zustimmungTeilweiseDetailsDiv) {
             const isVisibleInitialPop = entscheidungMieterSelect.value === 'zustimmung_teilweise';
             zustimmungTeilweiseDetailsDiv.style.display = isVisibleInitialPop ? 'block' : 'none';
             zustimmungTeilweiseDetailsDiv.classList.toggle('sub-details-active', isVisibleInitialPop);
             if(document.getElementById('zustimmungBetrag')) document.getElementById('zustimmungBetrag').required = isVisibleInitialPop;
        }
        if(begruendungVermieterSelect && textBegruendungVermieterDiv){
            const showDetailsInitialPop = ['Mietspiegel', 'Vergleichswohnungen', 'Sachverständigengutachten'].includes(begruendungVermieterSelect.value);
            textBegruendungVermieterDiv.style.display = showDetailsInitialPop ? 'block' : 'none';
            textBegruendungVermieterDiv.classList.toggle('sub-details-active', showDetailsInitialPop);
            if(document.getElementById('textBegruendungVermieter')) document.getElementById('textBegruendungVermieter').required = showDetailsInitialPop;
        }
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const data = getFormData();
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
        console.error("Fehler beim Laden der Daten für Mieterhöhungs-Widerspruch:", e);
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
            // Einfache Validierung, ob mindestens ein Widerspruchsgrund ausgewählt und erläutert wurde, 
            // oder eine ergänzende Begründung vorhanden ist.
            const widerspruchsgruendeChecked = document.querySelectorAll('input[name="widerspruchsgrund"]:checked').length > 0;
            let detailsAusgefuellt = false;
            if (widerspruchsgruendeChecked) {
                if (getElementCheckedValue('formell') && getElementValue("textFormelleFehler").trim() !== "") detailsAusgefuellt = true;
                if (getElementCheckedValue('jahressperrfrist') && getElementValue("datumLetzteMieterhoehung").trim() !== "") detailsAusgefuellt = true;
                if (getElementCheckedValue('kappungsgrenze') && getElementValue("mieteVor3Jahren").trim() !== "") detailsAusgefuellt = true;
                if (getElementCheckedValue('vergleichsmiete') && getElementValue("textVergleichsmiete").trim() !== "") detailsAusgefuellt = true;
                if (getElementCheckedValue('modernisierung') && getElementValue("textModernisierung").trim() !== "") detailsAusgefuellt = true;
            }
            
            if (!widerspruchsgruendeChecked && getElementValue("ergaenzendeArgumenteMieterhoehung").trim() === "") {
                 alert("Bitte wählen Sie mindestens einen Widerspruchsgrund aus und erläutern diesen, oder geben Sie eine ergänzende Begründung an.");
                 return;
            }
            if (widerspruchsgruendeChecked && !detailsAusgefuellt && getElementValue("ergaenzendeArgumenteMieterhoehung").trim() === "") {
                alert("Bitte erläutern Sie die ausgewählten Widerspruchsgründe oder geben Sie eine ergänzende Begründung an.");
                return;
            }

            generateMieterhoehungWiderspruchPDF(getFormData()); 
        });
    }
    // Hilfsfunktion für die Validierung
    function getElementCheckedValue(value){
        const el = document.querySelector(`input[name="widerspruchsgrund"][value="${value}"]`);
        return el ? el.checked : false;
    }

}); // Ende DOMContentLoaded

function generateMieterhoehungWiderspruchPDF(data) {
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

    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) { /* ... (aus anderem Skript kopieren) ... */ }
    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) { /* ... (aus anderem Skript kopieren) ... */ }
    // Kopiere die writeLine und writeParagraph Funktionen von einem anderen Skript hierher
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
        datumMieterhoehungsschreiben, aktuelleKaltmiete, neueMieteAbDatum, neueKaltmiete,
        begruendungVermieter, textBegruendungVermieter,
        widerspruchsgruende, // Array
        textFormelleFehler, datumLetzteMieterhoehung, 
        mieteVor3Jahren, kappungsgrenzeProzent, textVergleichsmiete, textModernisierung,
        ergaenzendeArgumenteMieterhoehung, 
        entscheidungMieter, zustimmungBetrag, forderungMieterhoehung,
        anlagen, 
        anlageSonstigesMieterhoehung
    } = data;

    const datumMieterhoehungFormatiert = getFormattedDateValue(datumMieterhoehungsschreiben);
    const neueMieteAbDatumFormatiert = getFormattedDateValue(neueMieteAbDatum);
    const datumLetzteMieterhoehungFormatiert = getFormattedDateValue(datumLetzteMieterhoehung, "");


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
    let betreffText = `Stellungnahme und Widerspruch zu Ihrem Mieterhöhungsverlangen vom ${datumMieterhoehungFormatiert}`;
    betreffText += `\nMietobjekt: ${mietobjektAdresseKurz}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
    // Alternativ: `Sehr geehrte/r Herr/Frau ${vermieterName.split(" ").pop() || 'Vermieter/in'},`

    // Einleitung und Bezugnahme
    writeParagraph(`zu Ihrem Schreiben vom ${datumMieterhoehungFormatiert}, mit dem Sie eine Erhöhung der monatlichen Kaltmiete für die oben genannte Wohnung von derzeit ${parseFloat(aktuelleKaltmiete || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} auf ${parseFloat(neueKaltmiete || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} ab dem ${neueMieteAbDatumFormatiert} verlangen, nehme ich wie folgt Stellung:`);
    
    let begruendungVermieterText = `Sie begründen Ihr Verlangen mit: ${begruendungVermieter}.`;
    if (textBegruendungVermieter && textBegruendungVermieter.trim() !== "") {
        begruendungVermieterText += ` Konkret führen Sie hierzu aus: "${textBegruendungVermieter}"`;
    }
    writeParagraph(begruendungVermieterText, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight *0.8});


    // Entscheidung des Mieters und Begründung der Widerspruchspunkte
     if (entscheidungMieter === "zustimmung_voll") {
        writeParagraph(`Nach sorgfältiger Prüfung stimme ich der von Ihnen geforderten Mieterhöhung auf ${parseFloat(neueKaltmiete || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} ab dem ${neueMieteAbDatumFormatiert} zu.`, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else if (entscheidungMieter === "zustimmung_teilweise") {
        writeParagraph(`Nach sorgfältiger Prüfung stimme ich/stimmen wir einer Mieterhöhung nur teilweise, nämlich auf einen Betrag von ${parseFloat(zustimmungBetrag || neueKaltmiete || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} ab dem ${neueMieteAbDatumFormatiert} zu. Der darüber hinausgehenden Erhöhung widerspreche ich/widersprechen wir aus folgenden Gründen:`, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else { // ablehnung_komplett
        writeParagraph(`Nach sorgfältiger Prüfung lehne ich die von Ihnen geforderte Mieterhöhung ab und stimme dieser nicht zu. Die Gründe hierfür sind im Einzelnen:`, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    }  
    // Auflistung der Widerspruchsgründe, wenn nicht voll zugestimmt wurde
    if (entscheidungMieter !== "zustimmung_voll") {
        let hatGruende = false;
        if (widerspruchsgruende.includes("formell") && textFormelleFehler && textFormelleFehler.trim() !== "") {
            writeLine("Formelle Fehler im Mieterhöhungsverlangen:", defaultLineHeight, "bold", textFontSize);
            writeParagraph(textFormelleFehler);
            hatGruende = true;
        }
        if (widerspruchsgruende.includes("jahressperrfrist") && datumLetzteMieterhoehungFormatiert && datumLetzteMieterhoehungFormatiert !== "N/A") {
            writeLine("Nichteinhaltung der Jahressperrfrist:", defaultLineHeight, "bold", textFontSize);
            writeParagraph(`Die letzte wirksame Mieterhöhung (bzw. der Mietbeginn) war am ${datumLetzteMieterhoehungFormatiert}. Die geforderte Erhöhung zum ${neueMieteAbDatumFormatiert} würde die gesetzliche Sperrfrist von 15 Monaten zwischen zwei Erhöhungen bzw. 12 Monaten für das Zugehen des Verlangens nicht einhalten.`);
            hatGruende = true;
        }
        if (widerspruchsgruende.includes("kappungsgrenze") && mieteVor3Jahren && mieteVor3Jahren.trim() !== "") {
            writeLine("Überschreitung der Kappungsgrenze:", defaultLineHeight, "bold", textFontSize);
            const mieteVor3JahrenNum = parseFloat(mieteVor3Jahren) || 0;
            const kappungsgrenzeFaktor = (kappungsgrenzeProzent === "15") ? 1.15 : 1.20;
            const maxErlaubteMiete = mieteVor3JahrenNum * kappungsgrenzeFaktor;
            writeParagraph(`Die Miete betrug vor drei Jahren ${mieteVor3JahrenNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}. Eine Erhöhung um mehr als ${kappungsgrenzeProzent}% auf über ${maxErlaubteMiete.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} innerhalb von drei Jahren ist nicht zulässig. Die geforderte neue Miete von ${parseFloat(neueKaltmiete || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} überschreitet diese Grenze.`);
            hatGruende = true;
        }
        if (widerspruchsgruende.includes("vergleichsmiete") && textVergleichsmiete && textVergleichsmiete.trim() !== "") {
            writeLine("Überschreitung der ortsüblichen Vergleichsmiete:", defaultLineHeight, "bold", textFontSize);
            writeParagraph(textVergleichsmiete);
            hatGruende = true;
        }
        if (widerspruchsgruende.includes("modernisierung") && textModernisierung && textModernisierung.trim() !== "") {
            writeLine("Unstimmigkeiten bei der Mieterhöhung nach Modernisierung:", defaultLineHeight, "bold", textFontSize);
            writeParagraph(textModernisierung);
            hatGruende = true;
        }
        if (ergaenzendeArgumenteMieterhoehung && ergaenzendeArgumenteMieterhoehung.trim() !== "") {
            writeLine("Weitere/ergänzende Argumente:", defaultLineHeight, "bold", textFontSize);
            writeParagraph(ergaenzendeArgumenteMieterhoehung);
            hatGruende = true;
        }
        if (!hatGruende && (entscheidungMieter === "ablehnung_komplett" || entscheidungMieter === "zustimmung_teilweise")) {
            writeParagraph("Die genauen Gründe für meine (teilweise) Ablehnung sind [Bitte hier Gründe ergänzen, falls oben nicht ausgewählt oder nicht ausreichend!]", defaultLineHeight, textFontSize, {fontStyle:"italic"});
        }
    }

    // Forderung / Weiteres Vorgehen
    if (forderungMieterhoehung && forderungMieterhoehung.trim() !== "") {
        writeParagraph(forderungMieterhoehung, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight});
    } else if (entscheidungMieter === "ablehnung_komplett" || entscheidungMieter === "zustimmung_teilweise") {
        writeParagraph("Ich bitte Sie daher, Ihr Mieterhöhungsverlangen unter Berücksichtigung meiner Einwände zu überprüfen und mir ein neues, korrektes Angebot zu unterbreiten oder das Erhöhungsverlangen zurückzuziehen.", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight});
    }
    
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

    doc.save("widerspruch_mieterhoehung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupMieterhoehung");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }

}