document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kautionsabrechnungForm');
    const storageKey = 'kautionsabrechnungFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "objektAdresse", "datumMietvertragsende", "datumAbrechnung", "widerspruchsText"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["mieterName", "mieterAdresse", "vermieterName", "vermieterAdresse", "objektAdresse", "datumMietvertragsende", "datumAbrechnung", "widerspruchsText"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnKaution').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnKaution').addEventListener('click', () => {
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
        generateKautionsabrechnungPDF(getFormData());
    });

    // --- PDF-Funktion ---
    function generateKautionsabrechnungPDF(data) {
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
            objektAdresse, datumMietvertragsende, datumAbrechnung, widerspruchsText
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
    
    absenderAdresse.split("\n").forEach(line => {
        if (line.trim() !== "") {
            doc.text(line.trim(), rightColumnX, rightY);
            rightY += defaultLineHeight;
        }
    });

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Vermieter)
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = absenderAdresse.replace(/\r?\n/g, " · ");
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


        // Betreff
        writeParagraph(`Widerspruch gegen Ihre Kautionsabrechnung vom ${new Date(datumAbrechnung).toLocaleDateString('de-DE')}`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Ehemaliges Mietobjekt: ${objektAdresse.replace(/\n/g, ', ')}`);
        writeParagraph(`Mietvertragsende: ${new Date(datumMietvertragsende).toLocaleDateString('de-DE')}`);

        // Anrede
        writeParagraph("Sehr geehrte Damen und Herren,");

        // Haupttext
        writeParagraph(`hiermit widerspreche ich Ihrer oben genannten Abrechnung über meine Mietkaution. Die von Ihnen vorgenommenen Abzüge sind in den folgenden Punkten nicht berechtigt:`);
        
        // Die Begründung des Nutzers
        writeParagraph(widerspruchsText, { fontStyle: "italic", extraSpacingAfter: defaultLineHeight });
        
        // Forderung
        writeParagraph("Ich fordere Sie daher auf, die Abrechnung zu korrigieren und mir den unrechtmäßig einbehaltenen Kautionsanteil umgehend, spätestens jedoch innerhalb von 14 Tagen, auf mein Ihnen bekanntes Konto zu überweisen.");
        
        const fristDatum = new Date();
        fristDatum.setDate(fristDatum.getDate() + 14);
        const fristDatumFmt = fristDatum.toLocaleDateString('de-DE');
        writeParagraph(`Als letzte Frist für den Zahlungseingang notiere ich mir den ${fristDatumFmt}.`);
        writeParagraph("Sollte die Zahlung nicht fristgerecht erfolgen, werde ich ohne weitere Ankündigung rechtliche Schritte zur Einforderung meiner vollständigen Kaution einleiten.", { fontStyle: "italic" });

        // Grußformel
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${mieterName})`);

        doc.save("Widerspruch_Kautionsabrechnung.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});