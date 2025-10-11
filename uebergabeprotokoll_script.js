document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uebergabeprotokollForm');
    const storageKey = 'uebergabeprotokollFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = [
            "objektAdresse", "etageLage", "datumUebergabe", "mieterName", "vermieterName",
            "zaehlernummerStrom", "zaehlernummerHeizung", "zaehlernummerWasser", "zaehlernummerWarmwasser",
            "anzahlWohnungsschluessel", "anzahlKellerschluessel", "anzahlBriefkastenschluessel", "weiteresZimmer1", "weiteresZimmer2", "weiteresZimmer3"

        ];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = [
            "objektAdresse", "etageLage", "datumUebergabe", "mieterName", "vermieterName",
            "zaehlernummerStrom", "zaehlernummerHeizung", "zaehlernummerWasser", "zaehlernummerWarmwasser",
            "anzahlWohnungsschluessel", "anzahlKellerschluessel", "anzahlBriefkastenschluessel", "weiteresZimmer1", "weiteresZimmer2", "weiteresZimmer3"

        ];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnProtokoll').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnProtokoll').addEventListener('click', () => {
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
        generateUebergabeprotokollPDF(getFormData());
    });

    // Die PDF-Erstellungsfunktion ist jetzt Teil dieses Skripts
    function generateUebergabeprotokollPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 15;
        let y = margin;
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const lineHeight = 7;
        const smallLineHeight = 5;

        // --- HILFSFUNKTIONEN ZUM ZEICHNEN ---
        function addSectionTitle(title) {
            if (y > pageHeight - 30) { doc.addPage(); y = margin; }
            y += lineHeight * 1.5;
            doc.setFontSize(14);
            doc.setFont("times", "bold");
            doc.text(title, margin, y);
            y += lineHeight + 2;
            doc.setFontSize(11);
            doc.setFont("times", "normal");
        }

        function addKeyValue(key, value) {
            if (y > pageHeight - 20) { doc.addPage(); y = margin; }
            doc.setFont("times", "bold");
            doc.text(key, margin, y);
            doc.setFont("times", "normal");
            doc.text(String(value || '________________'), margin + 40, y);
            y += lineHeight;
        }

        function drawTableRow(room, items) {
            if (y > pageHeight - 40) { doc.addPage(); y = margin; addSectionTitle("Zustand der Räume (Fortsetzung)"); }
            doc.setDrawColor(0);
            doc.setLineWidth(0.2);
            doc.setFont("times", "bold");
            doc.text(room, margin, y);
            y += smallLineHeight * 1.5;
            
            doc.setFont("times", "normal");
            items.forEach(item => {
                doc.text(item + ":", margin + 5, y);
                doc.line(margin + 30, y, pageWidth - margin, y); // Linie für Notizen
                y += lineHeight;
            });
            doc.line(margin, y - lineHeight, pageWidth - margin, y - lineHeight);
            y += smallLineHeight;
        }

        // --- PDF-INHALT ---
        doc.setFontSize(18);
        doc.setFont("times", "bold");
        doc.text("Wohnungsübergabeprotokoll", pageWidth / 2, y, { align: "center" });
        y += lineHeight * 2;

        addSectionTitle("1. Allgemeine Daten");
        addKeyValue("Anschrift:", data.objektAdresse.replace(/\n/g, ', '));
        addKeyValue("Lage:", data.etageLage);
        addKeyValue("Datum:", new Date(data.datumUebergabe).toLocaleDateString('de-DE'));
        addKeyValue("Mieter/in:", data.mieterName);
        addKeyValue("Vermieter/in:", data.vermieterName);

        addSectionTitle("2. Zustand der Räume");
        const raumItems = ["Wände/Decke (gestrichen?)", "Bodenbelag", "Fenster/Türen", "Heizkörper", "Elektrik (Licht, Steckdosen)"];
        drawTableRow("Flur / Diele", raumItems);
        drawTableRow("Küche", [...raumItems, "Einbauten (Spüle, Herd etc.)"]);
        drawTableRow("Badezimmer / WC", [...raumItems, "Sanitär (WC, Dusche, Wanne)", "Fliesen / Fugen"]);
        drawTableRow("Wohnzimmer", raumItems);
        drawTableRow("Schlafzimmer", raumItems);
        if (data.weiteresZimmer1 && data.weiteresZimmer1.trim() !== "") {
            drawTableRow(data.weiteresZimmer1.trim(), raumItems);
        }
        if (data.weiteresZimmer2 && data.weiteresZimmer2.trim() !== "") {
            drawTableRow(data.weiteresZimmer2.trim(), raumItems);
        }
        if (data.weiteresZimmer3 && data.weiteresZimmer3.trim() !== "") {
            drawTableRow(data.weiteresZimmer3.trim(), raumItems);
        }
        drawTableRow("Balkon / Terrasse", ["Bodenbelag", "Sichtschutz/Markise"]);
        drawTableRow("Keller / Dachboden", ["Zustand (trocken, leer?)"]);
        
        addSectionTitle("3. Zählerstände");
        y += smallLineHeight;
        const zeahlerData = [
            ["Strom", data.zaehlernummerStrom, ""],
            ["Heizung", data.zaehlernummerHeizung, ""],
            ["Kaltwasser", data.zaehlernummerWasser, ""],
            ["Warmwasser", data.zaehlernummerWarmwasser, ""]
        ];
        // Tabellenkopf
        doc.setFont("times", "bold");
        doc.text("Zählerart", margin, y);
        doc.text("Zählernummer", margin + 40, y);
        doc.text("Zählerstand bei Übergabe", margin + 90, y);
        y += lineHeight;
        // Tabellenzeilen
        doc.setFont("times", "normal");
        zeahlerData.forEach(row => {
            if (row[1]) { // Nur Zeilen mit Zählernummer anzeigen
                doc.text(row[0], margin, y);
                doc.text(row[1], margin + 40, y);
                doc.line(margin + 90, y, pageWidth - margin, y);
                y += lineHeight;
            }
        });

        addSectionTitle("4. Schlüsselübergabe");
        y += smallLineHeight;
        const schluesselData = [
            ["Wohnungs-/Haustürschlüssel", data.anzahlWohnungsschluessel],
            ["Kellerschlüssel", data.anzahlKellerschluessel],
            ["Briefkastenschlüssel", data.anzahlBriefkastenschluessel]
        ];
         doc.setFont("times", "bold");
        doc.text("Schlüsselart", margin, y);
        doc.text("Anzahl", margin + 70, y);
        y += lineHeight;
        doc.setFont("times", "normal");
        schluesselData.forEach(row => {
            if (parseInt(row[1]) > 0) {
                 doc.text(row[0], margin, y);
                 doc.text(row[1], margin + 70, y);
                 y += lineHeight;
            }
        });
        
        addSectionTitle("5. Sonstige Anmerkungen / Vereinbarungen");
        doc.line(margin, y, pageWidth - margin, y); y += lineHeight;
        doc.line(margin, y, pageWidth - margin, y); y += lineHeight;
        doc.line(margin, y, pageWidth - margin, y); y += lineHeight;

        addSectionTitle("6. Unterschriften");
        y += lineHeight;
        doc.line(margin, y + 15, margin + 70, y + 15);
        doc.text("Datum, Unterschrift Mieter/in", margin, y + 20);
        
        doc.line(pageWidth - margin - 70, y + 15, pageWidth - margin, y + 15);
        doc.text("Datum, Unterschrift Vermieter/in", pageWidth - margin - 70, y + 20);

        doc.save("Wohnungsuebergabeprotokoll.pdf");

        // Spenden-Popup nach dem Speichern anzeigen
        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});