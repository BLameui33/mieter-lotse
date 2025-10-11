document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('modernisierungForm');
    const storageKey = 'modernisierungFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    // --- Dynamische Felder ---
    const grundRadios = document.querySelectorAll('input[name="widerspruchsgrund"]');
    const details = {
        haertefall: document.getElementById('detailsHaertefall'),
        formfehler: document.getElementById('detailsFormfehler'),
        instandsetzung: document.getElementById('detailsInstandsetzung')
    };
    const textareas = {
        haertefall: document.getElementById('textHaertefall'),
        formfehler: document.getElementById('textFormfehler'),
        instandsetzung: document.getElementById('textInstandsetzung')
    };

    function toggleDetails() {
        const selected = document.querySelector('input[name="widerspruchsgrund"]:checked')?.value;
        for (const key in details) {
            if (details[key]) {
                const isSelected = key === selected;
                details[key].style.display = isSelected ? 'block' : 'none';
                if (textareas[key]) textareas[key].required = isSelected;
            }
        }
    }
    grundRadios.forEach(radio => radio.addEventListener('change', toggleDetails));
    toggleDetails();

    // --- Speichern & Laden ---
    function getFormData() {
        const data = {};
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "datumAnkuendigung", "angekuendigteMassnahmen", "angekuendigteMieterhoehung", "textHaertefall", "textFormfehler", "textInstandsetzung"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        data.widerspruchsgrund = document.querySelector('input[name="widerspruchsgrund"]:checked')?.value;
        return data;
    }

    function populateForm(data) {
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "datumAnkuendigung", "angekuendigteMassnahmen", "angekuendigteMieterhoehung", "textHaertefall", "textFormfehler", "textInstandsetzung"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
        if (data.widerspruchsgrund) document.querySelector(`input[name="widerspruchsgrund"][value="${data.widerspruchsgrund}"]`).checked = true;
        toggleDetails();
    }

    document.getElementById('saveBtnModernisierung').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnModernisierung').addEventListener('click', () => {
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
        generateModernisierungWiderspruchPDF(getFormData());
    });

    // --- PDF-Funktion ---
    function generateModernisierungWiderspruchPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        // Layout-Konstanten
        const margin = 25;
        const textFontSize = 11;
        const defaultLineHeight = 7;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        function writeParagraph(text, options = {}) { /* ... (Funktion aus anderem Skript kopieren) ... */
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
            datumAnkuendigung, angekuendigteMassnahmen, angekuendigteMieterhoehung,
            widerspruchsgrund, textHaertefall, textFormfehler, textInstandsetzung
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
        writeParagraph(`Widerspruch gegen die Modernisierungsankündigung vom ${new Date(datumAnkuendigung).toLocaleDateString('de-DE')}`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Mietobjekt: ${mieterAdresse.replace(/\n/g, ', ')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph(`hiermit nehme ich Bezug auf Ihre Modernisierungsankündigung vom ${new Date(datumAnkuendigung).toLocaleDateString('de-DE')} für die oben genannte Wohnung. Sie kündigen darin die Durchführung von Maßnahmen (${angekuendigteMassnahmen}) und eine daraus resultierende monatliche Mieterhöhung in Höhe von ${(parseFloat(angekuendigteMieterhoehung) || 0).toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})} an.`);
        
        let begruendungText = "";
        let widerspruchsGrundlage = "";
        switch(widerspruchsgrund) {
            case 'haertefall':
                widerspruchsGrundlage = "Ich widerspreche der Duldung der Modernisierungsmaßnahme und der angekündigten Mieterhöhung, da diese für mich eine unzumutbare finanzielle Härte im Sinne des § 555d Abs. 2 BGB darstellen würde.";
                begruendungText = textHaertefall;
                break;
            case 'formfehler':
                widerspruchsGrundlage = "Ich weise Ihre Modernisierungsankündigung wegen erheblicher formeller Fehler gemäß § 555c BGB zurück. Die Ankündigung ist in der vorliegenden Form unwirksam.";
                begruendungText = textFormfehler;
                break;
            case 'instandsetzung':
                widerspruchsGrundlage = "Ich widerspreche der angekündigten Mieterhöhung, da die von Ihnen geplanten Maßnahmen ganz oder teilweise keine Modernisierung, sondern eine umlagefähige Instandhaltung darstellen.";
                begruendungText = textInstandsetzung;
                break;
        }
        writeParagraph(widerspruchsGrundlage, { fontStyle: "bold" });
        writeParagraph("Meine Position begründe ich wie folgt:", { extraSpacingAfter: 2 });
        writeParagraph(begruendungText, { fontStyle: "italic" });
        
        // Forderung
        writeParagraph("Ich fordere Sie daher auf, die Ankündigung zurückzuziehen bzw. zu korrigieren und mir bis auf Weiteres keine Duldung der Maßnahmen abzuverlangen. Ich bitte um eine schriftliche Stellungnahme zu meinen Einwänden innerhalb von 14 Tagen.");

        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Widerspruch_Modernisierung.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});