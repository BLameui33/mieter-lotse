document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mietminderungForm');
    const saveBtn = document.getElementById('saveBtnMietminderung');
    const loadBtn = document.getElementById('loadBtnMietminderung');
    const closePopupBtn = document.getElementById('closePopupBtnMietminderung');
    const spendenPopup = document.getElementById('spendenPopupMietminderung');
    const storageKey = 'mietminderungSchreibenFormData';

    const bruttomieteInput = document.getElementById('bruttomieteAktuell');
    const minderungsquoteInput = document.getElementById('minderungsquoteProzent');
    const minderungsbetragMonatInput = document.getElementById('minderungsbetragMonat');

    function berechneMinderungsbetrag() {
        if (!bruttomieteInput || !minderungsquoteInput || !minderungsbetragMonatInput) return;
        const bruttomiete = parseFloat(bruttomieteInput.value);
        const minderungsquote = parseFloat(minderungsquoteInput.value);
        if (!isNaN(bruttomiete) && bruttomiete > 0 && !isNaN(minderungsquote) && minderungsquote >= 0 && minderungsquote <= 100) {
            const monatlicherMinderungsbetrag = (bruttomiete * (minderungsquote / 100));
            minderungsbetragMonatInput.value = monatlicherMinderungsbetrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            minderungsbetragMonatInput.value = '';
        }
    }

    if (bruttomieteInput) bruttomieteInput.addEventListener('input', berechneMinderungsbetrag);
    if (minderungsquoteInput) minderungsquoteInput.addEventListener('input', berechneMinderungsbetrag);

    const formElementIds = [
        "mieterName", "mieterAdresse", "mieterTelefon", "mieterEmail",
        "vermieterName", "vermieterAdresse",
        "datumMaengelanzeige", "fristsetzungMaengelanzeige", "kurzbeschreibungMaengel", "zustandMaengel",
        "bruttomieteAktuell", "minderungsquoteProzent", "minderungsbetragMonat", "minderungsbeginnDatum",
        "erneuteFristBeseitigungMM", // NEUES FELD HINZUGEFÜGT
        "anlageSonstigesMietminderung"
    ];
    const checkboxIdsToSave = [
        "zahlungUnterVorbehalt"
    ];
    const anlagenCheckboxName = "anlagenMietminderung";

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
    function getFormattedDate(id, defaultValue = "N/A") { // Für Datumsfelder
        const dateInput = getElementValue(id);
        return dateInput ? new Date(dateInput).toLocaleDateString("de-DE") : defaultValue;
    }

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            data[id] = getElementValue(id);
        });
        checkboxIdsToSave.forEach(id => {
            data[id] = getElementChecked(id);
        });
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
        checkboxIdsToSave.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.checked = data[id];
            }
        });
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(cb => {
            if (cb) cb.checked = !!(data.anlagen && data.anlagen.includes(cb.value));
        });
        berechneMinderungsbetrag();
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
        console.error("Fehler beim Laden der Daten für Mietminderungsschreiben:", e);
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
            if (getElementValue("kurzbeschreibungMaengel").trim() === "" || getElementValue("bruttomieteAktuell").trim() === "" || getElementValue("minderungsquoteProzent").trim() === "") {
                alert("Bitte füllen Sie mindestens die Felder zur Mangelbeschreibung, Bruttomiete und Minderungsquote aus.");
                return;
            }
            generateMietminderungPDF(getFormData());
        });
    }
}); // Ende DOMContentLoaded

function generateMietminderungPDF(data) {
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
        datumMaengelanzeige, fristsetzungMaengelanzeige, kurzbeschreibungMaengel, zustandMaengel,
        bruttomieteAktuell, minderungsquoteProzent, minderungsbeginnDatum,
        erneuteFristBeseitigungMM, 
        zahlungUnterVorbehalt, 
        anlagen, 
        anlageSonstigesMietminderung
    } = data;

    const datumMaengelanzeigeFormatiert = getFormattedDateValue(datumMaengelanzeige);
    const fristsetzungMaengelanzeigeFormatiert = getFormattedDateValue(fristsetzungMaengelanzeige);
    const minderungsbeginnDatumFormatiert = getFormattedDateValue(minderungsbeginnDatum);
    const erneuteFristBeseitigungMMFormatiert = getFormattedDateValue(erneuteFristBeseitigungMM, "");

    const bruttomieteNum = parseFloat(bruttomieteAktuell) || 0;
    const minderungsquoteNum = parseFloat(minderungsquoteProzent) || 0;
    const berechneterMinderungsbetrag = (bruttomieteNum * (minderungsquoteNum / 100));
    const neueMiete = bruttomieteNum - berechneterMinderungsbetrag;

    doc.setFont("times", "normal");

    writeLine(mieterName, defaultLineHeight, "normal", textFontSize);
    mieterAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    writeLine(vermieterName, defaultLineHeight, "normal", textFontSize);
    vermieterAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    let mietobjektAdresse = (mieterAdresse.split("\n")[0] || '[Adresse der Wohnung]').trim();
    if (mieterAdresse.split("\n").length > 1 && (mieterAdresse.split("\n")[1] || '').trim() !== "") {
         mietobjektAdresse += `, ${(mieterAdresse.split("\n")[1] || '').trim()}`;
    }
     let mietobjektZusatz = "";
    if (mieterAdresse.split("\n").length > 2 && (mieterAdresse.split("\n")[2] || '').trim() !== "") {
        mietobjektZusatz = `, ${(mieterAdresse.split("\n")[2] || '').trim()}`;
    }
    let betreffText = `Mietminderung für das Mietobjekt: ${mietobjektAdresse}${mietobjektZusatz}`;
    betreffText += `\nBezug: Unsere Mängelanzeige vom ${datumMaengelanzeigeFormatiert}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    // KORRIGIERTER TEXTBLOCK HIER:
    let maengelText = `bezugnehmend auf meine Mängelanzeige vom ${datumMaengelanzeigeFormatiert} betreffend die oben genannte Mietwohnung und die darin gesetzte Frist zur Mängelbeseitigung bis zum ${fristsetzungMaengelanzeigeFormatiert}, muss ich leider feststellen, dass die von mir gerügten Mängel`;
    if (kurzbeschreibungMaengel.trim() !== "") {
        maengelText += ` (kurz zusammengefasst: ${kurzbeschreibungMaengel})`;
    }
    if (zustandMaengel.trim() !== "") {
        maengelText += ` bis heute wie folgt fortbestehen bzw. nur unzureichend beseitigt wurden:\n${zustandMaengel}`;
    } else {
        maengelText += ` bis heute nicht oder nur unzureichend beseitigt wurden.`;
    }
    writeParagraph(maengelText);
    writeParagraph(`Die Gebrauchstauglichkeit der Wohnung ist dadurch weiterhin erheblich eingeschränkt.`);


    writeLine("Geltendmachung der Mietminderung:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Gemäß § 536 BGB mindere ich daher die Miete ab dem ${minderungsbeginnDatumFormatiert} um ${minderungsquoteProzent} %.`);
    writeParagraph(`Bei einer aktuellen Bruttomiete von ${bruttomieteNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} entspricht dies einem monatlichen Minderungsbetrag von ${berechneterMinderungsbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`);
    writeParagraph(`Die von nun an zu zahlende Restmiete beträgt somit monatlich ${neueMiete.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`);
    
    if (zahlungUnterVorbehalt) {
        writeParagraph("Die Zahlung der (gekürzten/vollen) Miete erfolgt/erfolgte unter dem ausdrücklichen Vorbehalt der Rückforderung zu viel gezahlter Beträge und ohne Anerkennung einer Rechtspflicht bezüglich der Mängel.", defaultLineHeight, textFontSize, {fontStyle: "italic"});
    }
    writeParagraph("Diese Mietminderung gilt solange, bis die Mängel vollständig und fachgerecht beseitigt sind.");

    // Erneute Fristsetzung basierend auf neuem Formularfeld
    if (erneuteFristBeseitigungMMFormatiert && erneuteFristBeseitigungMMFormatiert !== "N/A") {
        writeParagraph(`Ich fordere Sie hiermit erneut und letztmalig auf, die genannten Mängel unverzüglich, spätestens jedoch bis zum **${erneuteFristBeseitigungMMFormatiert}**, vollständig und fachgerecht zu beseitigen.`, defaultLineHeight, textFontSize);
    } else {
        // Standardtext, falls keine explizite erneute Frist gesetzt wurde
         writeParagraph("Ich/Wir fordern Sie hiermit erneut auf, die genannten Mängel unverzüglich und ohne weitere Verzögerung zu beseitigen.", defaultLineHeight, textFontSize);
    }

    if (data.weitereSchritte && data.weitereSchritte.length > 0) {
        writeParagraph("Sollten Sie die Mängel nicht innerhalb der (ggf. erneut) gesetzten Frist vollständig beseitigen, behalte ich mir folgende Schritte ausdrücklich vor:", defaultLineHeight, textFontSize);
        data.weitereSchritte.forEach(schritt => {
            if (schritt === "Mietminderung") writeParagraph("- die Fortsetzung der Mietminderung.");
            if (schritt === "Zurueckbehaltungsrecht") writeParagraph("- einen Teil der Miete gemäß § 320 BGB zurückzuhalten.");
            if (schritt === "Selbstvornahme") writeParagraph("- die Mängel nach erneutem fruchtlosem Fristablauf ggf. selbst im Wege der Ersatzvornahme (§ 536a Abs. 2 BGB) beseitigen zu lassen und Ihnen die Kosten in Rechnung zu stellen.");
        });
    }
    writeParagraph("Ich bitte um eine kurze Bestätigung des Eingangs dieses Schreibens.", defaultLineHeight, textFontSize);

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

    doc.save("mietminderungsschreiben.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupMietminderung");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}