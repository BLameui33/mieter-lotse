document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kuendigungMieterForm');
    const saveBtn = document.getElementById('saveBtnKuendigungMieter');
    const loadBtn = document.getElementById('loadBtnKuendigungMieter');
    const closePopupBtn = document.getElementById('closePopupBtnKuendigungMieter');
    const spendenPopup = document.getElementById('spendenPopupKuendigungMieter');
    const storageKey = 'kuendigungMieterFormData';

    // --- Steuerung der dynamischen Felder ---
    const kuendigungArtSelect = document.getElementById('kuendigungArt');
    const sonderkuendigungGrundDetailsDiv = document.getElementById('sonderkuendigungGrundDetails');
    const sonderkuendigungGrundTextTextarea = document.getElementById('sonderkuendigungGrundText');

    function updateSonderkuendigungDetailsVisibility() {
        if (!kuendigungArtSelect || !sonderkuendigungGrundDetailsDiv || !sonderkuendigungGrundTextTextarea) return;
        const isSonderkuendigung = kuendigungArtSelect.value === 'sonderkuendigung';
        sonderkuendigungGrundDetailsDiv.style.display = isSonderkuendigung ? 'block' : 'none';
        sonderkuendigungGrundDetailsDiv.classList.toggle('sub-details-active', isSonderkuendigung);
        sonderkuendigungGrundTextTextarea.required = isSonderkuendigung;
    }

    if (kuendigungArtSelect) {
        kuendigungArtSelect.addEventListener('change', updateSonderkuendigungDetailsVisibility);
        updateSonderkuendigungDetailsVisibility(); // Initial prüfen
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "mieterNamen", "mieterAdresse", 
        "vermieterName", "vermieterAdresse",
        "mietvertragDatum", "kuendigungsdatumWunsch", "kuendigungArt", 
        "sonderkuendigungGrundText", "kuendigungZusatzText"
    ];
    const checkboxIdsToSave = [ 
        "kenntnisFristen", "alleMieterUnterschreiben", "nachweisbarerVersand"
    ];

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
        checkboxIdsToSave.forEach(id => {
            data[id] = getElementChecked(id);
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
        checkboxIdsToSave.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.checked = data[id];
            }
        });
        if (kuendigungArtSelect) updateSonderkuendigungDetailsVisibility(); // Sichtbarkeit nach Laden aktualisieren
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (!getElementChecked('kenntnisFristen') || !getElementChecked('alleMieterUnterschreiben') || !getElementChecked('nachweisbarerVersand')) {
                alert("Bitte bestätigen Sie alle wichtigen Hinweise, bevor Sie speichern.");
                return;
            }
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
        console.error("Fehler beim Laden der Daten für Kündigung Mieter:", e);
        localStorage.removeItem(storageKey);
      }
    }

    // --- Pop-up Steuerung ---
    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', function() {
            spendenPopup.style.display = 'none';
        });
    }
    
    // --- PDF Generierung bei Formular-Submit ---
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!getElementChecked('kenntnisFristen') || !getElementChecked('alleMieterUnterschreiben') || !getElementChecked('nachweisbarerVersand')) {
                alert("Bitte bestätigen Sie alle wichtigen Hinweise (Fristen, Unterschriften, Versand), um das PDF zu erstellen.");
                return;
            }
            // Spezifische Validierung für Sonderkündigung
            if (getElementValue('kuendigungArt') === 'sonderkuendigung' && getElementValue('sonderkuendigungGrundText').trim() === '') {
                alert("Bitte geben Sie einen Grund für die Sonderkündigung an.");
                document.getElementById('sonderkuendigungGrundText').focus();
                return;
            }
            generateKuendigungMieterPDF(getFormData()); 
        });
    }
}); // Ende DOMContentLoaded

function generateKuendigungMieterPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7; // Angepasst für bessere Lesbarkeit bei Kündigungen
    const spaceAfterParagraph = 4; 
    const textFontSize = 11; // Etwas größere Schrift für Kündigungen   

    // Helper-Funktionen für PDF (kopiert und ggf. leicht angepasst)
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
        mieterNamen, mieterAdresse, 
        vermieterName, vermieterAdresse,
        mietvertragDatum, kuendigungsdatumWunsch, kuendigungArt, 
        sonderkuendigungGrundText, kuendigungZusatzText
        // Anlagen sind hier nicht primär vorgesehen, aber könnten ergänzt werden
    } = data;

    const mietvertragDatumFormatiert = getFormattedDateValue(mietvertragDatum, "");
    const kuendigungsdatumWunschFormatiert = getFormattedDateValue(kuendigungsdatumWunsch);


    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");

    // Absender (Mieter)
    mieterNamen.split("\n").forEach(line => writeLine(line.trim())); // Für mehrere Mieter untereinander
    mieterAdresse.split("\n").forEach(line => writeLine(line.trim()));
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger (Vermieter)
    writeLine(vermieterName);
    vermieterAdresse.split("\n").forEach(line => writeLine(line.trim()));
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
    let betreffText = `Kündigung des Mietvertrages für das Mietobjekt: ${mietobjektAdresseKurz}`;
    if (mieterAdresse.split("\n").length > 1 && (mieterAdresse.split("\n")[1] || '').trim() !== "") {
         betreffText += `, ${(mieterAdresse.split("\n")[1] || '').trim()}`;
    }
    if (mietvertragDatumFormatiert && mietvertragDatumFormatiert !== "N/A") {
        betreffText += `\nMietvertrag vom ${mietvertragDatumFormatiert}`;
    }
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
    // Alternativ, falls Vermietername eine Einzelperson ist:
    // writeParagraph(`Sehr geehrte/r Herr/Frau ${vermieterName.split(" ").pop() || 'Vermieter/in'},`, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Kündigungserklärung
    if (kuendigungArt === "sonderkuendigung" && sonderkuendigungGrundText && sonderkuendigungGrundText.trim() !== "") {
        writeParagraph(`hiermit kündige(n) ich/wir den oben genannten Mietvertrag unter Berufung auf mein/unser Sonderkündigungsrecht aus folgendem Grund fristgerecht zum ${kuendigungsdatumWunschFormatiert}:`);
        writeParagraph(sonderkuendigungGrundText, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
        writeParagraph(`Sollte diese Sonderkündigung nicht anerkannt werden, kündige(n) ich/wir hilfsweise ordentlich und fristgerecht zum nächstmöglichen Zeitpunkt. Bitte bestätigen Sie mir/uns diesen hilfsweisen Kündigungstermin schriftlich.`);

    } else { // Ordentliche Kündigung
        writeParagraph(`hiermit kündige(n) ich/wir den oben genannten Mietvertrag für die Wohnung in ${mietobjektAdresseKurz} ordentlich und fristgerecht zum **${kuendigungsdatumWunschFormatiert}**.`, defaultLineHeight, textFontSize); // Datum fett
        writeParagraph("Sollte dieser Termin aus von mir/uns nicht bekannten Gründen nicht der korrekten Frist entsprechen, kündige(n) ich/wir hilfsweise zum nächstmöglichen Termin. Bitte teilen Sie mir/uns diesen in Ihrer Kündigungsbestätigung mit.", defaultLineHeight, textFontSize);
    }
    
    // Zusatztext
    if (kuendigungZusatzText && kuendigungZusatzText.trim() !== "") {
        y += defaultLineHeight / 2;
        writeParagraph(kuendigungZusatzText);
    } else {
        y += defaultLineHeight / 2;
        writeParagraph("Ich/Wir bitten um eine schriftliche Bestätigung dieser Kündigung unter Nennung des Beendigungszeitpunktes des Mietverhältnisses. Für die Vereinbarung eines Termins zur Wohnungsübergabe stehe ich/stehen wir Ihnen gerne zur Verfügung.", defaultLineHeight, textFontSize);
    }
    
    // Grußformel und Unterschrift(en)
    writeParagraph("Mit freundlichen Grüßen", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 2}); 
    
    // Platz für Unterschriften (mehrere Zeilen, falls mehrere Mieter)
    const mieterArray = mieterNamen.split('\n').filter(name => name.trim() !== "");
    if (mieterArray.length > 0) {
        mieterArray.forEach(einzelMieter => {
            writeParagraph("_________________________");
            writeParagraph(einzelMieter.trim(), defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight});
        });
    } else { // Fallback, falls das Feld mieterNamen leer ist (sollte durch required nicht passieren)
        writeParagraph("_________________________");
        writeParagraph("(Unterschrift Mieter/in)");
    }


    doc.save("kuendigung_mietvertrag_mieter.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupKuendigungMieter");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}