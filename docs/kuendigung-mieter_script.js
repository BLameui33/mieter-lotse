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

    // --- Ich/Wir-Auswahl (Anredeform) ---
    // Erwartet im HTML z.B.:
    // <select id="anredeForm">
    //   <option value="wir">Wir (mehrere Mieter)</option>
    //   <option value="ich">Ich (Einzelperson)</option>
    // </select>
    const anredeFormSelect = document.getElementById('anredeForm');
    const mieterNamenField = document.getElementById('mieterNamen');
    let anredeFormManuellGesetzt = false;

    function autoAnredeFormVorschlagen() {
        if (!anredeFormSelect || !mieterNamenField || anredeFormManuellGesetzt) return;
        const anzahlMieter = mieterNamenField.value
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean).length;
        anredeFormSelect.value = anzahlMieter > 1 ? 'wir' : 'ich';
    }

    if (anredeFormSelect) {
        anredeFormSelect.addEventListener('change', function() {
            anredeFormManuellGesetzt = true;
        });
    }
    if (mieterNamenField) {
        mieterNamenField.addEventListener('input', autoAnredeFormVorschlagen);
        autoAnredeFormVorschlagen(); // Initial vorschlagen
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "mieterNamen", "mieterAdresse", 
        "vermieterName", "vermieterAdresse",
        "mietvertragDatum", "kuendigungsdatumWunsch", "kuendigungArt", 
        "sonderkuendigungGrundText", "kuendigungZusatzText",
        "anredeForm"
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
        if (data['anredeForm']) anredeFormManuellGesetzt = true; // geladener Wert gilt als bewusst gesetzt
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
        sonderkuendigungGrundText, kuendigungZusatzText,
        anredeForm
    } = data;

    const mietvertragDatumFormatiert = getFormattedDateValue(mietvertragDatum, "");
    const kuendigungsdatumWunschFormatiert = getFormattedDateValue(kuendigungsdatumWunsch);

    // --- Ich/Wir-Logik ---
    // Fällt anredeForm nicht sauber auf "ich" oder "wir", wird anhand der Anzahl
    // eingetragener Mieternamen automatisch entschieden (>1 Zeile -> wir).
    const mieterNamenZeilenRoh = (mieterNamen || "").split("\n").map(s => s.trim()).filter(Boolean);
    let istWir;
    if (anredeForm === 'ich') istWir = false;
    else if (anredeForm === 'wir') istWir = true;
    else istWir = mieterNamenZeilenRoh.length > 1;

    function pick(ichVariante, wirVariante) {
        return istWir ? wirVariante : ichVariante;
    }

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");

    // ===== Hochwertigerer Briefkopf =====
    const mieterLines = mieterNamenZeilenRoh;
    const adresseLines = (mieterAdresse || "").split("\n").map(s => s.trim()).filter(Boolean);

    // Absender-Block oben rechts: Namen fett, Adresse normal (rechtsbündig, wie ein Briefkopf)
    function writeLineRight(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin / 2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle);
        doc.text(textToWrite, pageWidth - margin, y, { align: "right" });
        y += currentLineHeight;
    }

    mieterLines.forEach(line => writeLineRight(line, defaultLineHeight, "bold"));
    adresseLines.forEach(line => writeLineRight(line));

    // Dünne Trennlinie unter dem Absender für einen hochwertigeren Gesamteindruck
    y += 2;
    doc.setDrawColor(140, 140, 140);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setDrawColor(0, 0, 0);
    y += 8;

    // Rücksendeangabe: kleine, unterstrichene Absenderzeile über dem Empfänger (DIN 5008)
    const ruecksendeText = [mieterLines[0] || "", ...adresseLines].filter(Boolean).join(" · ");
    if (ruecksendeText) {
        const kleinSchriftgroesse = 8;
        if (y + 5 > usableHeight - (margin / 2)) { doc.addPage(); y = margin; }
        doc.setFontSize(kleinSchriftgroesse);
        doc.setFont("times", "normal");
        doc.text(ruecksendeText, margin, y);
        const ruecksendeBreite = doc.getStringUnitWidth(ruecksendeText) * kleinSchriftgroesse / doc.internal.scaleFactor;
        doc.setLineWidth(0.15);
        doc.line(margin, y + 1, margin + ruecksendeBreite, y + 1);
        y += 5 + 4;
    }

    // Empfänger (Vermieter)
    writeLine(vermieterName);
    adresseLines.length ? "" : null; // (keine Aktion, nur Lesbarkeit)
    (vermieterAdresse || "").split("\n").forEach(line => writeLine(line.trim()));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    doc.setFont("times", "normal");
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
        writeParagraph(
            `hiermit ${pick("kündige ich", "kündigen wir")} den oben genannten Mietvertrag unter Berufung auf ${pick("mein", "unser")} Sonderkündigungsrecht aus folgendem Grund fristgerecht zum ${kuendigungsdatumWunschFormatiert}:`
        );
        writeParagraph(sonderkuendigungGrundText, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
        writeParagraph(
            `Sollte diese Sonderkündigung nicht anerkannt werden, ${pick("kündige ich", "kündigen wir")} hilfsweise ordentlich und fristgerecht zum nächstmöglichen Zeitpunkt. Bitte bestätigen Sie ${pick("mir", "uns")} diesen hilfsweisen Kündigungstermin schriftlich.`
        );

    } else { // Ordentliche Kündigung
        writeParagraph(
            `hiermit ${pick("kündige ich", "kündigen wir")} den oben genannten Mietvertrag für die Wohnung in ${mietobjektAdresseKurz} ordentlich und fristgerecht zum **${kuendigungsdatumWunschFormatiert}**.`,
            defaultLineHeight, textFontSize
        ); // Datum fett
           
        writeParagraph(
            `Sollte dieser Termin aus ${pick("mir", "uns")} nicht bekannten Gründen nicht der korrekten Frist entsprechen, ${pick("kündige ich", "kündigen wir")} hilfsweise zum nächstmöglichen Termin. Bitte teilen Sie ${pick("mir", "uns")} diesen in Ihrer Kündigungsbestätigung mit.`,
            defaultLineHeight, textFontSize
        );
    }
    
    // Zusatztext
    if (kuendigungZusatzText && kuendigungZusatzText.trim() !== "") {
        y += defaultLineHeight / 2;
        writeParagraph(kuendigungZusatzText);
    } else {
        y += defaultLineHeight / 2;
        writeParagraph(
            `${pick("Ich bitte", "Wir bitten")} um eine schriftliche Bestätigung dieser Kündigung unter Nennung des Beendigungszeitpunktes des Mietverhältnisses. Für die Vereinbarung eines Termins zur Wohnungsübergabe ${pick("stehe ich", "stehen wir")} Ihnen gerne zur Verfügung.`,
            defaultLineHeight, textFontSize
        );
    }
    
    // Grußformel und Unterschrift(en)
    writeParagraph("Mit freundlichen Grüßen", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 2}); 
    
    // Platz für Unterschriften (mehrere Zeilen, falls mehrere Mieter)
    const mieterArray = mieterLines;
    if (mieterArray.length > 0) {
        mieterArray.forEach(einzelMieter => {
            writeParagraph("_________________________");
            writeParagraph(einzelMieter.trim(), defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight});
        });
    } else { // Fallback, falls das Feld mieterNamen leer ist (sollte durch required nicht passieren)
        writeParagraph("_________________________");
        writeParagraph(pick("(Unterschrift Mieter/in)", "(Unterschriften Mieter/innen)"));
    }


    doc.save("kuendigung_mietvertrag_mieter.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupKuendigungMieter");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}