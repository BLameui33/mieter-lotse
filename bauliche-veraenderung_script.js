document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('baulicheVeraenderungForm');
    const storageKey = 'baulicheVeraenderungFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "massnahmeBeschreibung", "zusicherungen"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "massnahmeBeschreibung", "zusicherungen"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnUmbau').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnUmbau').addEventListener('click', () => {
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
        generateBaulicheVeraenderungPDF(getFormData());
    });

    // --- PDF-Funktion ---
    function generateBaulicheVeraenderungPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 25;
        const textFontSize = 11;
        const defaultLineHeight = 7;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        function writeParagraph(text, options = {}) {
            const paragraphLineHeight = options.lineHeight || defaultLineHeight;
            const paragraphFontSize = options.fontSize || textFontSize;
            const fontStyle = options.fontStyle || "normal";
            const extraSpacing = options.extraSpacingAfter === undefined ? 4 : options.extraSpacingAfter;
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
            massnahmeBeschreibung, zusicherungen
        } = data;

        // KORREKTER Absender- und Empfängerblock für Fensterumschläge
        doc.setFontSize(9);
        const mieterAdresseEinzeilig = mieterAdresse.replace(/\n/g, ', ');
        const absenderZeile = `${mieterName} · ${mieterAdresseEinzeilig}`;
        doc.text(absenderZeile, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(vermieterName);
        vermieterAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        // Datum
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        // Betreff
        writeParagraph(`Antrag auf Genehmigung einer baulichen Veränderung`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Mietobjekt: ${mieterAdresse.replace(/\n/g, ', ')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph(`hiermit bitte ich als Mieter/in der oben genannten Wohnung um Ihre schriftliche Genehmigung für die Durchführung der folgenden baulichen Veränderung:`);
        
        writeParagraph(massnahmeBeschreibung, { fontStyle: "italic", extraSpacingAfter: defaultLineHeight });
        
        if (zusicherungen && zusicherungen.trim() !== "") {
            writeParagraph("Ihnen gegenüber möchte ich folgende Zusicherungen machen:", { fontStyle: "bold", extraSpacingAfter: 2 });
            writeParagraph(zusicherungen);
        }
        
        // Schlussteil
        writeParagraph("Die geplante Maßnahme dient der Verbesserung der Wohnqualität und wird selbstverständlich professionell und unter Beachtung aller Vorschriften ausgeführt. Ich bin zuversichtlich, dass die Maßnahme auch den Wert Ihrer Immobilie steigern wird.");
        writeParagraph("Ich bitte um eine baldige schriftliche Rückmeldung und Ihre Zustimmung. Für Rückfragen oder ein persönliches Gespräch stehe ich Ihnen jederzeit gerne zur Verfügung.");

        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Antrag_Bauliche_Veraenderung.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});