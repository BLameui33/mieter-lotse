document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('belegeinsichtForm');
    const storageKey = 'belegeinsichtFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    // --- Dynamische Felder ---
    const kopienCheckbox = document.getElementById('anforderungKopien');
    const detailsKopien = document.getElementById('detailsKopien');
    const begruendungKopien = document.getElementById('begruendungKopien');

    function toggleKopienDetails() {
        const isChecked = kopienCheckbox.checked;
        detailsKopien.style.display = isChecked ? 'block' : 'none';
        begruendungKopien.required = isChecked;
    }
    kopienCheckbox.addEventListener('change', toggleKopienDetails);
    toggleKopienDetails();

    // --- Speichern & Laden ---
    function getFormData() {
        const data = {};
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "datumAbrechnung", "abrechnungszeitraum", "fristsetzung", "begruendungKopien"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        data.anforderungKopien = kopienCheckbox.checked;
        return data;
    }

    function populateForm(data) {
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "datumAbrechnung", "abrechnungszeitraum", "fristsetzung", "begruendungKopien"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
        if (data.anforderungKopien) kopienCheckbox.checked = data.anforderungKopien;
        toggleKopienDetails();
    }

    document.getElementById('saveBtnBelegeinsicht').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnBelegeinsicht').addEventListener('click', () => {
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
        generateBelegeinsichtPDF(getFormData());
    });

    // --- PDF-Funktion ---
    function generateBelegeinsichtPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

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
            datumAbrechnung, abrechnungszeitraum, fristsetzung,
            anforderungKopien, begruendungKopien
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
        writeParagraph(`Verlangen auf Belegeinsicht zur Nebenkostenabrechnung für ${abrechnungszeitraum}`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Ihre Abrechnung vom ${new Date(datumAbrechnung).toLocaleDateString('de-DE')}`);
        writeParagraph(`Mietobjekt: ${mieterAdresse.replace(/\n/g, ', ')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph(`hiermit nehme ich Bezug auf Ihre oben genannte Nebenkostenabrechnung. Um diese auf ihre sachliche und rechnerische Richtigkeit überprüfen zu können, mache ich von meinem Recht auf Belegeinsicht gemäß § 259 BGB Gebrauch.`);
        
        if (anforderungKopien) {
            writeParagraph("Aufgrund besonderer Umstände ist mir eine persönliche Einsichtnahme in Ihren Räumlichkeiten nicht zumutbar. Die Begründung lautet wie folgt:");
            writeParagraph(begruendungKopien, { fontStyle: "italic" });
            writeParagraph("Ich bitte Sie daher ausnahmsweise um die Zusendung von Kopien aller Abrechnungsbelege an meine oben genannte Adresse. Die anfallenden Kopierkosten in angemessener Höhe (0,25 € pro Kopie) werde ich selbstverständlich erstatten.");
            writeParagraph(`Ich bitte um die Zusendung der Kopien bis spätestens zum ${new Date(fristsetzung).toLocaleDateString('de-DE')}.`);
        } else {
            writeParagraph("Ich bitte Sie, mir sämtliche Originalbelege (Rechnungen, Verträge, Zahlungsnachweise etc.), die dieser Abrechnung zugrunde liegen, zur Einsichtnahme vorzulegen.");
            writeParagraph(`Ich fordere Sie auf, mir hierfür bis spätestens zum ${new Date(fristsetzung).toLocaleDateString('de-DE')} mehrere Terminvorschläge während der üblichen Geschäftszeiten zu unterbreiten.`);
        }
        
        // Zurückbehaltungsrecht
        writeParagraph("Ich weise Sie darauf hin, dass ich bis zur gewährten und vollständigen Belegeinsicht von meinem Zurückbehaltungsrecht bezüglich einer eventuellen Nachzahlung Gebrauch mache.", { fontStyle: "bold" });

        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Antrag_Belegeinsicht_Nebenkosten.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});