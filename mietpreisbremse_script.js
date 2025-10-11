document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mietpreisbremseForm');
    const storageKey = 'mietpreisbremseFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "datumMietvertrag", "mietbeginn", "aktuelleNettokaltmiete", "vergleichsmiete", "wohnflaeche", "begruendung"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "datumMietvertrag", "mietbeginn", "aktuelleNettokaltmiete", "vergleichsmiete", "wohnflaeche", "begruendung"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnBremse').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnBremse').addEventListener('click', () => {
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
        generateMietpreisbremsePDF(getFormData());
    });

    // --- PDF-Funktion ---
    function generateMietpreisbremsePDF(data) {
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
            datumMietvertrag, mietbeginn, aktuelleNettokaltmiete,
            vergleichsmiete, wohnflaeche, begruendung
        } = data;

        // Berechnungen
        const vergleichsmieteNum = parseFloat(vergleichsmiete) || 0;
        const wohnflaecheNum = parseFloat(wohnflaeche) || 0;
        const aktuelleMieteNum = parseFloat(aktuelleNettokaltmiete) || 0;
        
        const maxErlaubteMiete = (vergleichsmieteNum * wohnflaecheNum) * 1.10;
        const monatlicheDifferenz = aktuelleMieteNum - maxErlaubteMiete;
        const neueMiete = maxErlaubteMiete > 0 ? maxErlaubteMiete : aktuelleMieteNum;
        
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
        writeParagraph(`Rüge wegen Verstoßes gegen die Mietpreisbremse (§§ 556d ff. BGB)`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Mietobjekt: ${mieterAdresse.replace(/\n/g, ', ')}`);
        writeParagraph(`Mietvertrag vom: ${new Date(datumMietvertrag).toLocaleDateString('de-DE')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph(`hiermit rüge ich die Höhe der im oben genannten Mietvertrag vereinbarten Nettokaltmiete als Verstoß gegen die Vorschriften zur Begrenzung der Miethöhe (Mietpreisbremse) gemäß §§ 556d ff. BGB.`);

        writeParagraph("Begründung:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Die von mir zu zahlende Nettokaltmiete beträgt ${aktuelleMieteNum.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})}. Die ortsübliche Vergleichsmiete für die ${wohnflaecheNum} qm große Wohnung beträgt laut meinen Recherchen ${vergleichsmieteNum.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})} pro Quadratmeter.`);
        if (begruendung && begruendung.trim() !== "") {
            writeParagraph(begruendung, { fontStyle: "italic" });
        }
        writeParagraph(`Die maximal zulässige Miete bei Mietbeginn am ${new Date(mietbeginn).toLocaleDateString('de-DE')} hätte daher ${neueMiete.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})} (Vergleichsmiete zzgl. 10%) nicht übersteigen dürfen.`);
        
        // Forderung
        writeParagraph("Ich fordere Sie daher auf:", { fontStyle: "bold", extraSpacingAfter: 2 });
        const forderungen = [
            `1. die zukünftige monatliche Nettokaltmiete ab sofort auf den zulässigen Betrag von ${neueMiete.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})} zu senken.`,
            `2. die von mir seit Mietbeginn zu viel gezahlte Miete, die sich aus der Differenz zwischen der gezahlten und der zulässigen Miete ergibt, zu berechnen und an mich zurückzuzahlen.`
        ];
        forderungen.forEach(f => writeParagraph(f));
        
        const fristDatum = new Date();
        fristDatum.setDate(fristDatum.getDate() + 14);
        writeParagraph(`Ich bitte um Ihre schriftliche Stellungnahme und die Anerkennung meiner Forderungen bis zum ${fristDatum.toLocaleDateString('de-DE')}.`);
        writeParagraph("Sollte ich bis dahin keine zufriedenstellende Antwort erhalten, behalte ich mir weitere rechtliche Schritte ausdrücklich vor.", { fontStyle: "italic" });

        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Ruege_Mietpreisbremse.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});