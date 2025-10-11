document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('allgemeineBeschwerdeForm');
    const storageKey = 'allgemeineBeschwerdeFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    const grundSelect = document.getElementById('beschwerdeGrund');
    const textTextarea = document.getElementById('beschwerdeText');

    // --- Vorlagen für die Textbox ---
    const textVorlagen = {
        ruhestoerung: "seit einiger Zeit kommt es wiederholt zu erheblichen Ruhestörungen durch [Name des Nachbarn/Wohnung über mir]. Konkret geht es um [Art des Lärms, z.B. laute Musik, Trampeln] zu folgenden Zeiten: [Beispiele mit Datum/Uhrzeit nennen].\n\nEin persönliches Gespräch hat leider zu keiner Besserung geführt. Da diese Ruhestörungen den Hausfrieden und meine Wohnqualität erheblich beeinträchtigen, fordere ich Sie auf, geeignete Maßnahmen zu ergreifen, um für Ruhe zu sorgen.",
        gemeinschaftseigentum: "ich möchte Sie auf einen Mangel im Gemeinschaftseigentum hinweisen. Seit [Datum/Zeitraum] ist [genaue Beschreibung des Mangels, z.B. der Aufzug defekt / die Beleuchtung im Treppenhaus zwischen dem 2. und 3. OG ausgefallen / die Haustür schließt nicht mehr richtig].\n\nDieser Zustand beeinträchtigt die Sicherheit und Nutzbarkeit des Hauses. Ich fordere Sie daher auf, den Mangel umgehend zu beheben.",
        reparatur: "ich beziehe mich auf meine Mängelanzeige vom [Datum der Mängelanzeige] bezüglich [kurze Beschreibung des Mangels, z.B. des tropfenden Wasserhahns im Bad]. Sie hatten mir zugesagt, die Reparatur bis zum [Datum der Zusage] durchführen zu lassen.\n\nLeider ist bis heute nichts geschehen und der Mangel besteht weiterhin. Ich fordere Sie hiermit erneut nachdrücklich auf, die Reparatur durchführen zu lassen.",
        sonstiges: ""
    };

    function updateTextarea() {
        const selectedValue = grundSelect.value;
        textTextarea.value = textVorlagen[selectedValue];
        if (selectedValue === 'sonstiges') {
            textTextarea.placeholder = "Beschreiben Sie hier Ihr Anliegen so detailliert wie möglich...";
        }
    }
    grundSelect.addEventListener('change', updateTextarea);
    updateTextarea(); // Initialer Aufruf

    // --- Speichern & Laden ---
    function getFormData() {
        const data = {};
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "beschwerdeGrund", "beschwerdeText", "fristsetzung"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "beschwerdeGrund", "beschwerdeText", "fristsetzung"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnBeschwerde').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnBeschwerde').addEventListener('click', () => {
        const data = localStorage.getItem(storageKey);
        if(data) populateForm(JSON.parse(data));
    });
    document.getElementById('closePopupBtn').addEventListener('click', () => spendenPopup.style.display = 'none');

    // --- PDF-Erstellung ---
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!form.checkValidity()) {
            alert("Bitte füllen Sie alle erforderlichen Felder aus.");
            form.reportValidity();
            return;
        }
        generateAllgemeineBeschwerdePDF(getFormData());
    });

    function generateAllgemeineBeschwerdePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 25;
        const textFontSize = 11;
        const defaultLineHeight = 7;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        function writeParagraph(text, options = {}) {
            const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
            // ... (restliche Funktion aus anderem Skript kopieren)
            const paragraphLineHeight = options.lineHeight || defaultLineHeight;
            const paragraphFontSize = options.fontSize || textFontSize;
            const fontStyle = options.fontStyle || "normal";
            const extraSpacing = options.extraSpacingAfter === undefined ? 4 : options.extraSpacingAfter;
            doc.setFontSize(paragraphFontSize);
            doc.setFont("times", fontStyle);
            lines.forEach(line => {
                if (y + paragraphLineHeight > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
                doc.text(line, margin, y);
                y += paragraphLineHeight;
            });
            if (lines.length > 0) y += extraSpacing;
        }
        
        const { mieterName, mieterAdresse, vermieterName, vermieterAdresse, beschwerdeText, fristsetzung } = data;

        // KORREKTER Absender- und Empfängerblock
        doc.setFontSize(9);
        doc.text(`${mieterName} · ${mieterAdresse.replace(/\n/g, ', ')}`, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(vermieterName);
        vermieterAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        writeParagraph(`Beschwerde und Aufforderung zur Mängelbeseitigung`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Mietobjekt: ${mieterAdresse.replace(/\n/g, ', ')}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph("hiermit möchte ich Sie auf folgenden Mangel bzw. die folgende Störung in Bezug auf das oben genannte Mietobjekt aufmerksam machen:");
        writeParagraph(beschwerdeText, { fontStyle: "italic", extraSpacingAfter: defaultLineHeight });
        
        const fristDatumFmt = new Date(fristsetzung).toLocaleDateString('de-DE');
        writeParagraph(`Ich fordere Sie auf, für die Beseitigung dieses vertragswidrigen Zustands Sorge zu tragen und mir bis spätestens zum ${fristDatumFmt} mitzuteilen, welche Maßnahmen Sie ergreifen werden.`);
        writeParagraph("Sollte ich bis zum Ablauf der Frist keine Rückmeldung von Ihnen erhalten oder der Mangel nicht beseitigt werden, behalte ich mir weitere rechtliche Schritte, wie z.B. eine Mietminderung, ausdrücklich vor.", { fontStyle: "italic" });

        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Beschwerde_Vermieter.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});