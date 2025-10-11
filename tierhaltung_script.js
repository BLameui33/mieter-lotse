document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('tierhaltungForm');
    const storageKey = 'tierhaltungFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = [
            "mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse",
            "tierart", "tierrasse", "tieralter", "tiergroesseGewicht", "weitereInfos"
        ];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = [
            "mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse",
            "tierart", "tierrasse", "tieralter", "tiergroesseGewicht", "weitereInfos"
        ];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnTier').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnTier').addEventListener('click', () => {
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
        generateTierhaltungPDF(getFormData());
    });

    // Die PDF-Erstellungsfunktion ist Teil dieses Skripts
    function generateTierhaltungPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        // Layout-Konstanten
        const margin = 25;
        const textFontSize = 11;
        const defaultLineHeight = 7;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        function writeParagraph(text, options = {}) {
            // ... (Funktion aus anderem Skript kopieren)
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
            tierart, tierrasse, tieralter, tiergroesseGewicht, weitereInfos
        } = data;

        // KORREKTER Absender- und Empfängerblock für Fensterumschläge
        // =========================================================
        doc.setFontSize(9);
        const mieterAdresseEinzeilig = mieterAdresse.replace(/\n/g, ', ');
        const absenderZeile = `${mieterName} · ${mieterAdresseEinzeilig}`;
        doc.text(absenderZeile, margin, margin - 10);
        doc.setFontSize(textFontSize);

        y = margin + 15;
        writeParagraph(vermieterName);
        vermieterAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        // =========================================================

        // Datum
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        // Betreff
        writeParagraph(`Antrag auf Genehmigung zur Haltung eines Haustieres`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Mietobjekt: ${mieterAdresse.replace(/\n/g, ', ')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph("hiermit bitte ich Sie als Mieter/in der oben genannten Wohnung höflich um Ihre Zustimmung zur Haltung eines Haustieres.");
        
        writeParagraph("Es handelt sich um folgendes Tier:", { extraSpacingAfter: 2 });
        let tierDetails = `- Tierart: ${tierart || 'N/A'}\n- Rasse: ${tierrasse || 'N/A'}`;
        if (tieralter) tierDetails += `\n- Alter: ${tieralter}`;
        if (tiergroesseGewicht) tierDetails += `\n- Größe/Gewicht (erwachsen): ${tiergroesseGewicht}`;
        writeParagraph(tierDetails);
        
        if (weitereInfos && weitereInfos.trim() !== "") {
            writeParagraph("Zu meiner geplanten Tierhaltung möchte ich Ihnen gerne folgende ergänzende Informationen geben:", { extraSpacingAfter: 2 });
            writeParagraph(weitereInfos, { fontStyle: "italic" });
        }
        
        writeParagraph("Ich versichere Ihnen selbstverständlich, dass ich für eine artgerechte Haltung sorgen, Störungen der Nachbarn vermeiden und für die Beseitigung jeglicher Verunreinigungen (z.B. im Treppenhaus oder auf den Außenanlagen) Sorge tragen werde.");
        writeParagraph("Ich bin davon überzeugt, dass die Tierhaltung zu keinerlei Störungen oder Beeinträchtigungen des Hausfriedens oder der Mietsache führen wird.");
        
        // Schlussteil
        writeParagraph("Über eine positive Rückmeldung und Ihre schriftliche Genehmigung würde ich mich sehr freuen.");
        
        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Antrag_Tierhaltung.pdf");

        // Spenden-Popup nach dem Speichern anzeigen
        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});