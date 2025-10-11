document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchProtokollForm');
    const storageKey = 'widerspruchProtokollFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = [
            "mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse",
            "objektAdresse", "datumUebergabe", "widerspruchsText"
        ];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = [
            "mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse",
            "objektAdresse", "datumUebergabe", "widerspruchsText"
        ];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnWiderspruch').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnWiderspruch').addEventListener('click', () => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            populateForm(JSON.parse(savedData));
            alert('Gespeicherte Daten wurden geladen!');
        } else {
            alert('Keine Daten gefunden.');
        }
    });
    
    document.getElementById('closePopupBtn').addEventListener('click', () => {
        spendenPopup.style.display = 'none';
    });

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!form.checkValidity()) {
            alert("Bitte füllen Sie alle erforderlichen Felder aus.");
            form.reportValidity();
            return;
        }
        generateWiderspruchProtokollPDF(getFormData());
    });

    // Die PDF-Erstellungsfunktion ist Teil dieses Skripts
    function generateWiderspruchProtokollPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 25;
        const defaultLineHeight = 7;
        const spaceAfterParagraph = 4;
        const textFontSize = 11;
        const betreffFontSize = 13;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        function writeParagraph(text, options = {}) {
            const paragraphLineHeight = options.lineHeight || defaultLineHeight;
            const paragraphFontSize = options.fontSize || textFontSize;
            const fontStyle = options.fontStyle || "normal";
            const extraSpacing = options.extraSpacingAfter === undefined ? spaceAfterParagraph : options.extraSpacingAfter;
            doc.setFontSize(paragraphFontSize);
            doc.setFont("times", fontStyle);
            const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
            lines.forEach(line => {
                if (y + paragraphLineHeight > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
                doc.text(line, margin, y);
                y += paragraphLineHeight;
            });
            if (lines.length > 0) y += extraSpacing;
        }
        
        const {
            mieterName, mieterAdresse, vermieterName, vermieterAdresse,
            objektAdresse, datumUebergabe, widerspruchsText
        } = data;

        const datumUebergabeFmt = new Date(datumUebergabe).toLocaleDateString('de-DE');

        doc.setFontSize(9);
    // Nimmt die Mieteradresse, auch wenn sie mehrzeilig ist, und macht eine Zeile daraus
    const mieterAdresseEinzeilig = data.mieterAdresse.replace(/\n/g, ', ');
    const absenderZeile = `${data.mieterName} · ${mieterAdresseEinzeilig}`;
    doc.text(absenderZeile, margin, margin - 10);
    doc.setFontSize(textFontSize); // Wichtig: Schriftgröße für den Rest zurücksetzen

    // 2. Empfängerblock (im Fenster)
    y = margin + 15; // Setzt den Startpunkt für den Empfängerblock korrekt
    writeParagraph(data.vermieterName);
    data.vermieterAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
    y += defaultLineHeight * 2;

        // Datum
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        // Betreff
        writeParagraph(`Widerspruch gegen das Wohnungsübergabeprotokoll vom ${datumUebergabeFmt}`, { fontSize: betreffFontSize, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Ehemaliges Mietobjekt: ${objektAdresse.replace(/\n/g, ', ')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph(`ich nehme Bezug auf die gemeinsame Wohnungsübergabe am ${datumUebergabeFmt} für die oben genannte Wohnung und das in diesem Zuge erstellte Übergabeprotokoll.`);
        writeParagraph("Nach erneuter Prüfung muss ich hiermit fristgerecht und ausdrücklich den folgenden im Protokoll festgehaltenen Punkten widersprechen, da ich diese Mängel nicht zu vertreten habe:");
        
        // Die Begründung des Nutzers
        writeParagraph(widerspruchsText, { fontStyle: "italic", extraSpacingAfter: defaultLineHeight });
        
        // Forderung
        writeParagraph("Ich fordere Sie daher auf, die oben genannten strittigen Punkte nicht als Grundlage für eine Forderung gegen mich oder eine Minderung der Kautionsrückzahlung heranzuziehen.");
        writeParagraph("Ich betrachte die Wohnung, mit Ausnahme der unstrittigen und im Protokoll korrekt vermerkten Punkte, als ordnungsgemäß zurückgegeben.");
        writeParagraph("Ich erwarte die vollständige und unverzügliche Rückzahlung meiner hinterlegten Mietkaution auf mein Ihnen bekanntes Konto.");

        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Widerspruch_Uebergabeprotokoll.pdf");

        // Spenden-Popup nach dem Speichern anzeigen
        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});