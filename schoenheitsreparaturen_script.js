document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('schoenheitsreparaturenForm');
    const storageKey = 'schoenheitsreparaturenFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = [
            "mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse",
            "objektAdresse", "datumForderungsschreiben", "datumMietvertragsende", "weitereBegruendung"
        ];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        data.ablehnungsgrund = document.querySelector('input[name="ablehnungsgrund"]:checked')?.value;
        return data;
    }

    function populateForm(data) {
        const ids = [
            "mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse",
            "objektAdresse", "datumForderungsschreiben", "datumMietvertragsende", "weitereBegruendung"
        ];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
        if (data.ablehnungsgrund) {
            document.querySelector(`input[name="ablehnungsgrund"][value="${data.ablehnungsgrund}"]`).checked = true;
        }
    }

    document.getElementById('saveBtnReparatur').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnReparatur').addEventListener('click', () => {
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
        generateSchoenheitsreparaturenPDF(getFormData());
    });

    // Die PDF-Erstellungsfunktion ist Teil dieses Skripts
    function generateSchoenheitsreparaturenPDF(data) {
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
            objektAdresse, datumForderungsschreiben, datumMietvertragsende,
            ablehnungsgrund, weitereBegruendung
        } = data;

        const datumForderungFmt = new Date(datumForderungsschreiben).toLocaleDateString('de-DE');
        const datumMietendeFmt = new Date(datumMietvertragsende).toLocaleDateString('de-DE');

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
        writeParagraph(`Zurückweisung Ihrer Forderung zur Durchführung von Schönheitsreparaturen`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Ihr Schreiben vom ${datumForderungFmt}`);
        writeParagraph(`Ehemaliges Mietobjekt: ${objektAdresse.replace(/\n/g, ', ')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph(`ich nehme Bezug auf Ihr Schreiben vom ${datumForderungFmt}, in dem Sie mich zur Durchführung von Schönheitsreparaturen in der oben genannten, von mir bis zum ${datumMietendeFmt} gemieteten Wohnung auffordern.`);
        writeParagraph("Hiermit weise ich Ihre Forderung vollumfänglich als unbegründet zurück.", { fontStyle: "bold" });
        
        let begruendungText = "Meine Zurückweisung begründe ich wie folgt: ";
        switch(ablehnungsgrund) {
            case 'unwirksameKlausel':
                begruendungText += "Die in meinem Mietvertrag enthaltene Klausel zur Überwälzung der Schönheitsreparaturen ist nach gefestigter Rechtsprechung des BGH unwirksam. Eine Verpflichtung zur Renovierung besteht daher für mich nicht.";
                break;
            case 'unrenoviertUebernommen':
                begruendungText += "Ich habe die Wohnung bei Mietbeginn in einem unrenovierten Zustand übernommen. Gemäß BGH-Rechtsprechung bin ich in diesem Fall nicht zur Durchführung von Schönheitsreparaturen bei Auszug verpflichtet.";
                break;
            case 'keineSchoenheitsreparaturen':
                begruendungText += "Die von Ihnen geforderten Arbeiten (z.B. Abschleifen von Parkett, Erneuern von Teppichböden) fallen nicht unter den Begriff der Schönheitsreparaturen, sondern sind Instandhaltungsmaßnahmen, für die Sie als Vermieter zuständig sind.";
                break;
            case 'nichtUebermaessig':
                begruendungText += "Der Zustand der Wohnung weist lediglich Spuren einer normalen, vertragsgemäßen Abnutzung auf. Eine übermäßige Abnutzung, die eine Renovierungspflicht begründen würde, liegt nicht vor.";
                break;
        }
        writeParagraph(begruendungText);
        
        if (weitereBegruendung && weitereBegruendung.trim() !== "") {
            writeParagraph("Ergänzend führe ich aus:", { extraSpacingAfter: 2 });
            writeParagraph(weitereBegruendung, { fontStyle: "italic" });
        }
        
        // Forderung
        const fristDatum = new Date();
    fristDatum.setDate(fristDatum.getDate() + 14);
    const fristDatumFmt = fristDatum.toLocaleDateString('de-DE');
    
    writeParagraph(`Aus den genannten Gründen besteht für mich keine Verpflichtung zur Durchführung der von Ihnen geforderten Arbeiten. Ich fordere Sie daher auf, die vollständige Rückzahlung meiner Mietkaution bis spätestens zum ${fristDatumFmt} in die Wege zu leiten.`);

        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Zurueckweisung_Schoenheitsreparaturen.pdf");

        // Spenden-Popup nach dem Speichern anzeigen
        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});