document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kautionRueckzahlungForm');
    const saveBtn = document.getElementById('saveBtnKaution');
    const loadBtn = document.getElementById('loadBtnKaution');
    const closePopupBtn = document.getElementById('closePopupBtnKaution');
    const spendenPopup = document.getElementById('spendenPopupKaution');
    const storageKey = 'kautionRueckzahlungFormData';

    // Keine komplexen dynamischen Felder in diesem Formular, daher keine spezifischen Event-Listener hierfür nötig.

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "mieterName", "mieterAlteAdresse", "mieterNeueAdresse", "mieterTelefon",
        "vermieterName", "vermieterAdresse",
        "mietbeginnDatum", "mietendeDatum", "kautionshoehe", "kautionsart", "nebenkostenAbrechnungErhalten",
        "fristRueckzahlungKaution", "kontoinhaberKaution", "ibanKaution", "bicKaution", "bemerkungenKaution",
        "anlageSonstigesKaution"
    ];
    const anlagenCheckboxName = "anlagenKaution";

    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        if (element && typeof element.value !== 'undefined' && element.value !== null) {
            return String(element.value);
        }
        return defaultValue;
    }
    // getElementChecked ist hier nicht für formElementIds nötig, aber für Anlagen
    function getElementChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }
     function getFormattedDate(id, defaultValue = "N/A") {
        const dateInput = getElementValue(id);
        return dateInput ? new Date(dateInput).toLocaleDateString("de-DE") : defaultValue;
    }


    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            data[id] = getElementValue(id);
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
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(cb => {
            if (cb) {
                cb.checked = !!(data.anlagen && data.anlagen.includes(cb.value));
            }
        });
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
        console.error("Fehler beim Laden der Daten für Kautionsrückforderung:", e);
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
            // Einfache Validierung
            if (getElementValue("kautionshoehe").trim() === "" || getElementValue("mietendeDatum").trim() === "" || getElementValue("fristRueckzahlungKaution").trim() === "") {
                alert("Bitte füllen Sie mindestens die Felder zur Kautionshöhe, zum Mietende und zur Frist für die Rückzahlung aus.");
                return;
            }
            generateKautionRueckzahlungPDF(getFormData()); 
        });
    }
}); // Ende DOMContentLoaded

function generateKautionRueckzahlungPDF(data) {
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
    function getFormattedDateValue(value, defaultValue = "N/A") { // Für Datumsformatierung direkt aus Wert
        return value ? new Date(value).toLocaleDateString("de-DE") : defaultValue;
    }
    
    const {
        mieterName, mieterAlteAdresse, mieterNeueAdresse, mieterTelefon,
        vermieterName, vermieterAdresse,
        mietbeginnDatum, mietendeDatum, kautionshoehe, kautionsart, nebenkostenAbrechnungErhalten,
        fristRueckzahlungKaution, kontoinhaberKaution, ibanKaution, bicKaution, bemerkungenKaution,
        anlagen, 
        anlageSonstigesKaution // Dieser Wert ist bereits im 'anlagen' Array enthalten, falls ausgefüllt
    } = data;

    const mietendeDatumFormatiert = getFormattedDateValue(mietendeDatum);
    const fristRueckzahlungKautionFormatiert = getFormattedDateValue(fristRueckzahlungKaution);
    const kautionshoeheNum = parseFloat(kautionshoehe) || 0;

    doc.setFont("times", "normal");

    // Absender (Mieter - neue Adresse)
    writeLine(mieterName, defaultLineHeight, "normal", textFontSize);
    mieterNeueAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (mieterTelefon && mieterTelefon.trim() !== "") writeLine("Tel.: " + mieterTelefon, defaultLineHeight, "normal", textFontSize);
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
    let mietobjektAdresseKurz = (mieterAlteAdresse.split("\n")[0] || '[Alte Adresse der Wohnung]').trim();
    let betreffText = `Aufforderung zur Rückzahlung und Abrechnung der Mietkaution`;
    betreffText += `\nMietobjekt: ${mietobjektAdresseKurz}`;
    if (mietendeDatumFormatiert !== "N/A") {
      betreffText += ` (Mietverhältnis beendet zum ${mietendeDatumFormatiert})`;
    }
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
    // Alternativ: `Sehr geehrte/r Herr/Frau ${vermieterName.split(" ").pop() || 'Vermieter/in'},`

    // Haupttext
    writeParagraph(`das Mietverhältnis für die oben genannte Wohnung in ${mietobjektAdresseKurz} endete am ${mietendeDatumFormatiert}. Die Wohnungsübergabe ist erfolgt.`, defaultLineHeight, textFontSize);
    writeParagraph(`Zu Beginn des Mietverhältnisses am ${getFormattedDateValue(mietbeginnDatum)} wurde eine Mietkaution in Höhe von ${kautionshoeheNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} (${kautionsart}) geleistet.`, defaultLineHeight, textFontSize);

    let nebenkostenStatusText = "";
    if (nebenkostenAbrechnungErhalten === "ja") {
        nebenkostenStatusText = "Alle Nebenkostenabrechnungen für den gesamten Mietzeitraum liegen vor und sind ausgeglichen.";
    } else if (nebenkostenAbrechnungErhalten === "nein_ausstehend") {
        nebenkostenStatusText = "Die letzte Nebenkostenabrechnung für den Mietzeitraum steht noch aus. Ich bitte Sie, diese zeitnah zu erstellen.";
    } else if (nebenkostenAbrechnungErhalten === "nein_strittig") {
        nebenkostenStatusText = "Bezüglich der Nebenkostenabrechnung bestehen noch strittige Punkte, die einer Klärung bedürfen.";
    }
    if (nebenkostenStatusText) {
        writeParagraph(nebenkostenStatusText, defaultLineHeight, textFontSize);
    }

    writeParagraph(`Die gesetzliche Prüf- und Überlegungsfrist für die Abrechnung und Rückzahlung der Kaution ist nunmehr verstrichen bzw. ausreichend bemessen.`, defaultLineHeight, textFontSize);
    writeParagraph(`Ich fordere Sie hiermit höflich auf, die hinterlegte Mietkaution in Höhe von ${kautionshoeheNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} nebst der angefallenen Zinsen bis spätestens zum`, defaultLineHeight, textFontSize, {extraSpacingAfter:1});
    writeLine(fristRueckzahlungKautionFormatiert, defaultLineHeight, "bold", textFontSize);
    writeParagraph(`auf folgendes Konto zu überweisen und mir eine detaillierte Kautionsabrechnung zukommen zu lassen:`, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    writeLine("Kontoinhaber:in:", defaultLineHeight, "normal", textFontSize-1);
    writeLine(kontoinhaberKaution || mieterName, defaultLineHeight, "bold", textFontSize-1, {extraSpacingAfter:1});
    writeLine("IBAN:", defaultLineHeight, "normal", textFontSize-1);
    writeLine(ibanKaution, defaultLineHeight, "bold", textFontSize-1, {extraSpacingAfter:1});
    if (bicKaution.trim() !== "") {
        writeLine("BIC:", defaultLineHeight, "normal", textFontSize-1);
        writeLine(bicKaution, defaultLineHeight, "bold", textFontSize-1, {extraSpacingAfter:1});
    }
    y += defaultLineHeight * 0.5;

    if (bemerkungenKaution.trim() !== "") {
        writeParagraph(`Zusätzliche Bemerkungen:\n${bemerkungenKaution}`, defaultLineHeight, textFontSize);
    }

    writeParagraph("Sollte die Kaution nicht bis zur oben genannten Frist vollständig und nachvollziehbar abgerechnet und der Restbetrag ausgezahlt sein, sehe ich mich gezwungen, weitere rechtliche Schritte einzuleiten.", defaultLineHeight, textFontSize, {fontStyle: "italic"});
    
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
    writeParagraph(mieterName); // Unterschrift des/der Mieter

    doc.save("aufforderung_kautionsrueckzahlung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupKaution");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}