document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchKautionForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchKaution');
    const loadBtn = document.getElementById('loadBtnWiderspruchKaution');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchKaution');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchKaution');
    const storageKey = 'widerspruchKautionFormData_v2'; // Neuer Key zur Sicherheit

    // Hilfsfunktionen zum sicheren Auslesen der Werte
    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        if (element && typeof element.value !== 'undefined' && element.value !== null) {
            return String(element.value);
        }
        return defaultValue;
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "mieterName", "mieterAlteAdresse", "mieterNeueAdresse", "mieterTelefon",
        "vermieterName", "vermieterAdresse",
        "mietendeDatum", "kautionshoehe", "datumKautionsabrechnung", "einbehalteneSumme",
        "zustandBeiUebergabe", // KORREKTUR: Fehlendes Feld hinzugefügt
        "argumentGrundEinbehalt", "argumentHoeheEinbehalt", "ergaenzendeArgumenteKaution",
        "forderungKaution", "fristForderungKaution",
        "kontoinhaberWiderspruchKaution", "ibanWiderspruchKaution", "bicWiderspruchKaution",
        "anlageSonstigesKautionWiderspruch"
    ];
    const anlagenCheckboxName = "anlagenKautionWiderspruch";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        data[id] = getElementValue(id);
      });
      
      data.anlagen = [];
      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`);
      anlagenCheckboxes.forEach(checkbox => {
        data.anlagen.push(checkbox.value);
      });
      return data;
    }

    function populateForm(data) {
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element && data[id] !== undefined) {
          element.value = data[id];
        }
      });

      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
      anlagenCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.checked = !!(data.anlagen && data.anlagen.includes(checkbox.value));
        }
      });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const data = getFormData();
          if (getElementValue("argumentGrundEinbehalt").trim() === "" &&
              getElementValue("argumentHoeheEinbehalt").trim() === "" &&
              getElementValue("ergaenzendeArgumenteKaution").trim() === "") {
              alert("Bitte geben Sie zumindest in einem der Felder Ihre Begründung für den Widerspruch an.");
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
        console.error("Fehler beim Laden der Daten für Kautions-Widerspruch:", e);
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
            if (getElementValue("argumentGrundEinbehalt").trim() === "" &&
                getElementValue("argumentHoeheEinbehalt").trim() === "" &&
                getElementValue("ergaenzendeArgumenteKaution").trim() === "" ) {
                alert("Bitte geben Sie zumindest in einem der Felder Ihre Begründung für den Widerspruch an, bevor Sie das PDF erstellen.");
                return;
            }
             if (getElementValue("forderungKaution").trim() === "") {
                alert("Bitte formulieren Sie Ihre Forderung an den Vermieter.");
                document.getElementById("forderungKaution").focus();
                return;
            }
            generateKautionWiderspruchPDF(getFormData());
        });
    }
}); // Ende DOMContentLoaded

function generateKautionWiderspruchPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    // KORREKTUR: Die Seitenhöhe wird jetzt erst nach der Initialisierung abgefragt.
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 3;
    const subHeadingFontSize = 11;
    const textFontSize = 10;
    const smallTextFontSize = 8;

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
        // Stelle sicher, dass der Text nicht leer ist, bevor weitergemacht wird.
        if (textToWrite.trim() === "") return;
        
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
        y += extraSpacing;
    }
    
    // KORREKTUR: Sicherere Datumsformatierung
    function getFormattedDateValue(value, defaultValue = "N/A") {
        if (!value || typeof value !== 'string' || value.trim() === '') return defaultValue;
        try {
            const date = new Date(value);
            // Prüft, ob das Datum gültig ist. new Date('') oder new Date(null) erzeugt ein invalides Datum.
            if (isNaN(date.getTime())) return defaultValue;
            const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
            return date.toLocaleDateString("de-DE", options);
        } catch (e) {
            console.error("Datumsformatierungsfehler für Wert:", value, e);
            return defaultValue;
        }
    }
    
    const {
        mieterName, mieterAlteAdresse, mieterNeueAdresse,
        vermieterName, vermieterAdresse,
        mietendeDatum, kautionshoehe, zustandBeiUebergabe, datumKautionsabrechnung, einbehalteneSumme,
        argumentGrundEinbehalt, argumentHoeheEinbehalt, ergaenzendeArgumenteKaution,
        forderungKaution, fristForderungKaution,
        kontoinhaberWiderspruchKaution, ibanWiderspruchKaution, bicWiderspruchKaution,
        anlagen,
    } = data;

    const mietendeDatumFormatiert = getFormattedDateValue(mietendeDatum);
    const datumKautionsabrechnungFormatiert = getFormattedDateValue(datumKautionsabrechnung, "");
    const fristForderungKautionFormatiert = getFormattedDateValue(fristForderungKaution);
    const kautionshoeheNum = parseFloat(kautionshoehe) || 0;
    const einbehalteneSummeNum = parseFloat(einbehalteneSumme) || 0;

    doc.setFont("times", "normal");

    // Absender
    writeParagraph(mieterName, defaultLineHeight, textFontSize);
    mieterNeueAdresse.split("\n").forEach(line => writeParagraph(line.trim(), defaultLineHeight, textFontSize, { extraSpacingAfter: 0 }));
    y += defaultLineHeight;

    // Empfänger
    writeParagraph(vermieterName, defaultLineHeight, textFontSize);
    vermieterAdresse.split("\n").forEach(line => writeParagraph(line.trim(), defaultLineHeight, textFontSize, { extraSpacingAfter: 0 }));
    y += defaultLineHeight * 2;

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2;

    // Betreff
    let mietobjektAdresseKurz = (mieterAlteAdresse.split("\n")[0] || '[Alte Adresse der Wohnung]').trim();
    let betreffText = `Widerspruch gegen Ihre Kautionsabrechnung / den Einbehalt der Mietkaution vom ${datumKautionsabrechnungFormatiert || '[Datum Ihres Schreibens]'}`;
    betreffText += `\nMietobjekt: ${mietobjektAdresseKurz}`;
    betreffText += ` (Mietverhältnis beendet zum ${mietendeDatumFormatiert})`;
    betreffText += `\n- Aufforderung zur unverzüglichen Korrektur und vollständigen Rückzahlung -`;
    
    writeParagraph(betreffText, defaultLineHeight, 12, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight});

    // Einleitung
    if (datumKautionsabrechnungFormatiert && datumKautionsabrechnungFormatiert !== "N/A") {
        writeParagraph(`hiermit lege ich fristgerecht und mit allem Nachdruck Widerspruch gegen Ihre Kautionsabrechnung bzw. Ihr Schreiben vom ${datumKautionsabrechnungFormatiert} ein. Darin verrechnen Sie einen Betrag von ${einbehalteneSummeNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} mit der von mir für das oben genannte Mietobjekt geleisteten Kaution in Höhe von ${kautionshoeheNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`);
    } else {
        writeParagraph(`hiermit lege ich mit allem Nachdruck Widerspruch gegen den von Ihnen vorgenommenen Einbehalt bzw. die Verrechnung eines Betrages von ${einbehalteneSummeNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} von der für oben genanntes Mietobjekt geleisteten Kaution in Höhe von ${kautionshoeheNum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} ein.`);
        writeParagraph("Eine nachvollziehbare und korrekte Abrechnung über die Kaution, die einen solchen Einbehalt rechtfertigt, liegt mir bisher nicht vor. Dies stellt bereits einen Verstoß gegen Ihre Pflichten dar.", defaultLineHeight, textFontSize, {fontStyle: "italic"});
    }
   
    let uebergabeText = `Das Mietverhältnis für die Wohnung in ${mietobjektAdresseKurz} endete ordnungsgemäß zum ${mietendeDatumFormatiert}.`;
    // KORREKTUR: Zustand bei Übergabe wird nun korrekt eingefügt, wenn vorhanden.
    if (zustandBeiUebergabe && zustandBeiUebergabe.trim() !== "") {
        uebergabeText += ` Die Wohnung wurde in folgendem Zustand übergeben: ${zustandBeiUebergabe}.`;
    }
    writeParagraph(uebergabeText);
    writeParagraph(`Die von Ihnen geltend gemachten bzw. einbehaltenen Positionen sind aus meiner Sicht nicht oder nicht in der dargestellten Höhe gerechtfertigt und werden hiermit ausdrücklich bestritten.`);
    
    // Begründung des Widerspruchs
    writeLine("Begründung meines Widerspruchs im Einzelnen:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph;
    
    if (argumentGrundEinbehalt.trim() !== "") {
        writeLine("Zu den Gründen des Einbehalts:", defaultLineHeight, "bold", textFontSize + 0.5);
        writeParagraph(argumentGrundEinbehalt);
    }
    if (argumentHoeheEinbehalt.trim() !== "") {
        writeLine("Zur Höhe des Einbehalts / der verrechneten Kosten:", defaultLineHeight, "bold", textFontSize + 0.5);
        writeParagraph(argumentHoeheEinbehalt);
    }
    if (ergaenzendeArgumenteKaution.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, "bold", textFontSize + 0.5);
        writeParagraph(ergaenzendeArgumenteKaution);
    }
    
    writeParagraph("Ich weise erneut darauf hin, dass Sie als Vermieter für die Berechtigung der von Ihnen geltend gemachten Forderungen und Einbehalte die volle Darlegungs- und Beweislast tragen. Diese wurde bisher nicht erbracht.", defaultLineHeight, textFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight});
    
    // Forderung
    writeLine("Meine/Unsere Forderung:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph;
    writeParagraph(forderungKaution, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    
    let forderungsText = `Ich fordere Sie daher ultimativ auf, die von Ihnen vorgenommenen Einbehalte/Verrechnungen umgehend zu korrigieren und den unberechtigt einbehaltenen Kautionsbetrag nebst Zinsen spätestens bis zum`;
    writeParagraph(forderungsText, defaultLineHeight, textFontSize, {extraSpacingAfter: 1});

    writeLine(fristForderungKautionFormatiert, defaultLineHeight, "bold", textFontSize);
    writeParagraph(`auf folgendes Konto auszuzahlen und mir eine korrekte und nachvollziehbare Endabrechnung über die Kaution vorzulegen:`);

    const kontoinhaberText = data.kontoinhaberWiderspruchKaution || mieterName;
    const ibanText = data.ibanWiderspruchKaution;
    const bicText = data.bicWiderspruchKaution;

    if(ibanText && ibanText.trim() !== "") {
        y += defaultLineHeight / 2;
        writeLine(`Kontoinhaber:in: ${kontoinhaberText}`, defaultLineHeight, "normal", textFontSize-1);
        writeLine(`IBAN: ${ibanText}`, defaultLineHeight, "normal", textFontSize-1);
        if (bicText && bicText.trim() !== "") writeLine(`BIC: ${bicText}`, defaultLineHeight, "normal", textFontSize-1);
        y += defaultLineHeight;
    } else {
        writeParagraph("[Bitte Bankverbindung für die Rückzahlung im Formular ergänzen.]", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    
    writeParagraph("Sollte die vollständige und korrekte Abrechnung sowie die Auszahlung des mir zustehenden Betrages nicht bis zur oben genannten Frist erfolgen, werde ich ohne weitere Ankündigung gerichtliche Schritte (z.B. Mahnverfahren oder Klage) zur Durchsetzung meiner Ansprüche einleiten. Die dadurch entstehenden weiteren Kosten sowie Verzugszinsen gehen dann vollumfänglich zu Ihren Lasten.", defaultLineHeight, textFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight});

    if (anlagen && anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    writeParagraph("Mit freundlichen Grüßen", defaultLineHeight, textFontSize, { extraSpacingAfter: defaultLineHeight * 2});
    writeParagraph("_________________________");
    writeParagraph(mieterName);

    doc.save("widerspruch_kautionsabrechnung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchKaution");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}