document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('untervermietungAntragForm');
    const saveBtn = document.getElementById('saveBtnUntermiete');
    const loadBtn = document.getElementById('loadBtnUntermiete');
    const closePopupBtn = document.getElementById('closePopupBtnUntermiete');
    const spendenPopup = document.getElementById('spendenPopupUntermiete');
    const storageKey = 'untervermietungAntragFormData';

    // --- Steuerung der dynamischen Felder (z.B. für abweichenden Verfasser) ---
    const verfasserIdentischSelect = document.getElementById('verfasserIdentischZE'); // ID aus dem Zahnersatz-BS, muss hier angepasst werden.
                                                                                      // Im HTML für Untermiete war das Feld: "antragstellerIdentischBS"
                                                                                      // Ich nehme hier an, es gibt ein Feld, das steuert, ob der Hauptmieter selbst schreibt.
                                                                                      // Im aktuellen HTML "generator-antrag-erlaubnis-untervermietung.html"
                                                                                      // gibt es noch keinen abweichenden Antragsteller/Verfasser.
                                                                                      // Diese Logik ist daher aktuell nicht aktiv, aber vorbereitet.
    const verfasserDetailsDiv = document.getElementById('verfasserDetailsZE'); // ID anpassen

    function updateVerfasserDetailsVisibility() {
        if (!verfasserIdentischSelect || !verfasserDetailsDiv) return;
        const isNotIdentical = verfasserIdentischSelect.value === 'nein';
        verfasserDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        // Ggf. required-Attribute für Details setzen, falls Verfasser abweicht
        // document.getElementById('asNameBS').required = isNotIdentical; // Beispielhafte ID
    }
    if (verfasserIdentischSelect) { // Nur ausführen, wenn das Element existiert
        verfasserIdentischSelect.addEventListener('change', updateVerfasserDetailsVisibility);
        updateVerfasserDetailsVisibility(); 
    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "hmName", "hmAdresse", 
        "vermieterName", "vermieterAdresse",
        "untervermieteterTeil", "anzahlPersonenGesamt", "geplanterBeginnUntermiete", "geplanteDauerUntermiete",
        "umName", "umGeburtsdatum", "umBeruf", "umAnzahlPersonen", "umVerhaeltnis",
        "berechtigtesInteresseGrund", "berechtigtesInteresseEntstehung", "berechtigtesInteresseErlaeuterung",
        "zusatzTextUntermiete", "anlageSonstigesUntermiete"
        // Falls Verfasser-Details hinzukommen:
        // "verfasserIdentischZE", "asNameBS", "asVerhaeltnisBS" (IDs anpassen!)
    ];
    // Checkbox für Vollmacht, falls abweichender Verfasser (aktuell nicht im HTML des Untermietantrags)
    // const verfasserVollmachtCheckboxId = "asVollmachtBS"; // Beispielhafte ID
    const anlagenCheckboxName = "anlagenUntermiete";

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
        // Falls Verfasser-Vollmacht-Checkbox existiert:
        // data[verfasserVollmachtCheckboxId] = getElementChecked(verfasserVollmachtCheckboxId);
        
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
        // Falls Verfasser-Vollmacht-Checkbox existiert:
        // const vollmachenEl = document.getElementById(verfasserVollmachtCheckboxId);
        // if (vollmachenEl && data[verfasserVollmachtCheckboxId] !== undefined) vollmachenEl.checked = data[verfasserVollmachtCheckboxId];

        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(cb => {
            if (cb) cb.checked = !!(data.anlagen && data.anlagen.includes(cb.value));
        });
        if (verfasserIdentischSelect) updateVerfasserDetailsVisibility(); // Sichtbarkeit nach Laden aktualisieren
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
        console.error("Fehler beim Laden der Daten für Untermietantrag:", e);
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
            if (getElementValue("untervermieteterTeil").trim() === "" || 
                getElementValue("umName").trim() === "" ||
                getElementValue("berechtigtesInteresseErlaeuterung").trim() === "") {
                alert("Bitte füllen Sie mindestens die Felder zum untervermieteten Teil, zum Namen des Untermieters und zur Erläuterung Ihres berechtigten Interesses aus.");
                return;
            }
            generateUntermietungAntragPDF(getFormData()); 
        });
    }
}); // Ende DOMContentLoaded

function generateUntermietungAntragPDF(data) {
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
    function getFormattedDateValue(value, defaultValue = "") { // Default leer, falls nicht vorhanden
        return value ? new Date(value).toLocaleDateString("de-DE") : defaultValue;
    }
    
    const {
        hmName, hmAdresse, 
        vermieterName, vermieterAdresse,
        untervermieteterTeil, anzahlPersonenGesamt, geplanterBeginnUntermiete, geplanteDauerUntermiete,
        umName, umGeburtsdatum, umBeruf, umAnzahlPersonen, umVerhaeltnis,
        berechtigtesInteresseGrund, berechtigtesInteresseEntstehung, berechtigtesInteresseErlaeuterung,
        zusatzTextUntermiete, 
        anlagen
    } = data;

    const geplanterBeginnUntermieteFormatiert = getFormattedDateValue(geplanterBeginnUntermiete);
    const umGeburtsdatumFormatiert = getFormattedDateValue(umGeburtsdatum);

    // Schriftart setzen wie vorgegeben
    doc.setFont("times", "normal");

    // Absender- & Empfängerdaten vorbereiten (Hauptmieter / Vermieter)
    let absenderName = hmName || "";
    let absenderAdresse = hmAdresse || "";
    let infoText = ""; // Dieser Block besitzt standardmäßig kein Aktenzeichen im Kopf

    let targetEmpfaengerName = vermieterName || "";
    let targetEmpfaengerAdresse = vermieterAdresse || "";
    
    // Dynamische Schriftgröße nutzen
    let fSize = textFontSize || 11;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF START ---
    // ==========================================
    
    // 1. RECHTER BLOCK: Haupt-Absenderblock (Oben rechts)
    const rightColumnX = pageWidth - margin - 60; // Startpunkt rechts (ca. 130mm)
    let rightY = margin;
    
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("Absender:", rightColumnX, rightY);
    rightY += 5;
    
    doc.setFont("times", "normal");
    doc.setFontSize(fSize);
    
    // Name(n) zeilenweise ausgeben (falls hmName Zeilenumbrüche enthält)
    if (absenderName) {
        absenderName.split("\n").forEach(line => {
            if (line.trim() !== "") {
                doc.text(line.trim(), rightColumnX, rightY);
                rightY += defaultLineHeight;
            }
        });
    }
    
    // Adresse zeilenweise ausgeben
    if (absenderAdresse) {
        absenderAdresse.split("\n").forEach(line => {
            if (line.trim() !== "") {
                doc.text(line.trim(), rightColumnX, rightY);
                rightY += defaultLineHeight;
            }
        });
    }

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Vermieter)
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanNameInline = absenderName ? absenderName.replace(/\r?\n/g, " · ") : "";
    const cleanAddressInline = absenderAdresse ? absenderAdresse.replace(/\r?\n/g, " · ") : "";
    const ruecksendeZeile = `${cleanNameInline} · ${cleanAddressInline}`;
    
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Dezentes Grau
    doc.text(ruecksendeZeile, margin, leftY);
    
    // Die feine Trennlinie unter dem Mini-Absender
    doc.setDrawColor(180, 180, 180); 
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
    
    // Empfänger platzieren (Name & Adresse)
    leftY += 6; 
    doc.setFontSize(fSize);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    
    if (targetEmpfaengerName !== "") {
        doc.text(targetEmpfaengerName, margin, leftY);
        leftY += defaultLineHeight;
    }
    
    if (targetEmpfaengerAdresse) {
        targetEmpfaengerAdresse.split("\n").forEach(line => {
            if (line.trim() !== "") {
                doc.text(line.trim(), margin, leftY);
                leftY += defaultLineHeight;
            }
        });
    }

    // 3. DATUM: Rechtsbündig unterhalb der Blöcke
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(fSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * fSize / doc.internal.scaleFactor;
    
    // Kollisionsschutz (gleicht asymmetrische Spaltenhöhen perfekt aus)
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Inhalt
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let mietobjektAdresseKurz = (hmAdresse.split("\n")[0] || '[Adresse der Wohnung]').trim();
    let betreffText = `Antrag auf Erlaubnis zur Untervermietung eines Teils der Wohnung`;
    betreffText += `\nMietobjekt: ${mietobjektAdresseKurz}`;
    if (hmAdresse.split("\n").length > 1 && (hmAdresse.split("\n")[1] || '').trim() !== "") {
         betreffText += `, ${(hmAdresse.split("\n")[1] || '').trim()}`;
    }
     if (hmAdresse.split("\n").length > 2 && (hmAdresse.split("\n")[2] || '').trim() !== "") {
        betreffText += `, ${(hmAdresse.split("\n")[2] || '').trim()}`;
    }
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
    // Alternativ: `Sehr geehrte/r Herr/Frau ${vermieterName.split(" ").pop() || 'Vermieter/in'},`

    // Haupttext
    writeParagraph(`hiermit bitte ich Sie höflich um Ihre Zustimmung zur Untervermietung eines Teils der oben genannten Wohnung gemäß § 553 Abs. 1 BGB.`);
    
    writeLine("1. Angaben zur geplanten Untervermietung:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Es ist beabsichtigt, folgenden Teil der Wohnung unterzuvermieten: ${untervermieteterTeil || '[Beschreibung des unterzuvermietenden Teils]'}.`);
    writeParagraph(`Nach der Untervermietung würden insgesamt ${anzahlPersonenGesamt || '[Anzahl]'} Personen in der Wohnung leben.`);
    writeParagraph(`Die Untervermietung soll beginnen am: ${geplanterBeginnUntermieteFormatiert || '[Datum]'}.`);
    if (geplanteDauerUntermiete && geplanteDauerUntermiete.trim() !== "") {
        writeParagraph(`Die geplante Dauer der Untervermietung beträgt: ${geplanteDauerUntermiete}.`);
    }

    writeLine("2. Angaben zur vorgesehenen Untermieterin / zum vorgesehenen Untermieter:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Name: ${umName || '[Name des Untermieters]'}`);
    if (umGeburtsdatumFormatiert && umGeburtsdatumFormatiert !== "") {
        writeParagraph(`Geburtsdatum: ${umGeburtsdatumFormatiert}`);
    }
    if (umBeruf && umBeruf.trim() !== "") {
        writeParagraph(`Beruf/Tätigkeit: ${umBeruf}`);
    }
    writeParagraph(`Anzahl der einziehenden Personen (inkl. Untermieter:in selbst): ${umAnzahlPersonen || '1'}`);
     if (umVerhaeltnis && umVerhaeltnis.trim() !== "") {
        writeParagraph(`Verhältnis zu mir: ${umVerhaeltnis}`);
    }

    writeLine("3. Mein berechtigtes Interesse an der Untervermietung:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Mein berechtigtes Interesse an der Untervermietung ist ${berechtigtesInteresseGrund ? ' (' + berechtigtesInteresseGrund + ')' : ''} und ist nach Abschluss des Hauptmietvertrages entstanden.`);
    if (berechtigtesInteresseEntstehung && berechtigtesInteresseEntstehung.trim() !== "") {
        writeParagraph(`Das Interesse ist konkret entstanden am/seit: ${berechtigtesInteresseEntstehung}.`);
    }
    if (berechtigtesInteresseErlaeuterung && berechtigtesInteresseErlaeuterung.trim() !== "") {
        writeParagraph(`Erläuterung meines berechtigten Interesses:\n${berechtigtesInteresseErlaeuterung}`);
    } else {
        writeParagraph("Die detaillierte Begründung meines berechtigten Interesses entnehmen Sie bitte [ggf. Hinweis auf Anlage oder mündliche Erläuterung anbieten].", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
     writeParagraph("Ich versichere, dass durch die Untervermietung keine Überbelegung der Wohnung eintritt und keine sonstigen wichtigen Gründe Ihrerseits einer Erlaubnis entgegenstehen.", defaultLineHeight, textFontSize, {fontStyle:"italic"});


    if (zusatzTextUntermiete && zusatzTextUntermiete.trim() !== "") {
        writeLine("4. Weitere Anmerkungen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph/2;
        writeParagraph(zusatzTextUntermiete);
    }
    
    // Anlagen
    if (anlagen && anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Abschluss
    writeParagraph("Ich bitte höflich um Ihre schriftliche Erlaubnis zur Untervermietung bis zum " + new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE") + ".", defaultLineHeight, textFontSize);
    writeParagraph("Für Rückfragen stehe ich Ihnen selbstverständlich gerne zur Verfügung.", defaultLineHeight, textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    // Platz für Unterschriften (mehrere Zeilen, falls mehrere Mieter)
    const mieterArray = hmName.split('\n').filter(name => name.trim() !== "");
    if (mieterArray.length > 0) {
        mieterArray.forEach(einzelMieter => {
            writeParagraph("\n_________________________"); 
            writeParagraph(einzelMieter.trim(), defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight*0.5});
        });
    } else { 
        writeParagraph("\n\n_________________________"); 
        writeParagraph("(Unterschrift Hauptmieter:in)");
    }


    doc.save("antrag_erlaubnis_untervermietung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupUntermiete");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}