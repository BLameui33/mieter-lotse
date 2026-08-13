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
        
       // Schriftart setzen wie vorgegeben
    doc.setFont("times", "normal");

    // Absender- & Empfängerdaten vorbereiten (Mieter/Vermieter-Variablen)
    let absenderName = mieterName;
    let absenderAdresse = mieterAdresse; // Enthält bereits die komplette Adresse
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
    doc.text(absenderName, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
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
    const cleanAddressInline = absenderAdresse ? absenderAdresse.replace(/\r?\n/g, " · ") : "";
    const ruecksendeZeile = `${absenderName} · ${cleanAddressInline}`;
    
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