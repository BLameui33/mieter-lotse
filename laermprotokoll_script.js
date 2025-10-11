document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('laermprotokollForm');
    const storageKey = 'laermprotokollFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["mieterName", "mieterAdresse", "laermquelle"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["mieterName", "mieterAdresse", "laermquelle"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnLaerm').addEventListener('click', () => {
        localStorage.setItem(storageKey, JSON.stringify(getFormData()));
        alert('Ihre Eingaben wurden gespeichert!');
    });

    document.getElementById('loadBtnLaerm').addEventListener('click', () => {
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
        generateLaermprotokollPDF(getFormData());
    });

    // --- PDF-Funktion ---
    function generateLaermprotokollPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 20;
        let y = margin;
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const rowHeight = 15; // Höhe für eine handschriftliche Zeile
        const headerHeight = 8;
        const col1 = margin;
        const col2 = col1 + 25;
        const col3 = col2 + 40;
        const col4 = col3 + 65;
        
        function drawTableHeader() {
            doc.setFontSize(10);
            doc.setFont("times", "bold");
            doc.text("Datum", col1, y);
            doc.text("Uhrzeit (von - bis)", col2, y);
            doc.text("Art der Störung / Auswirkungen", col3, y);
            doc.text("Zeuge/Zeugin (falls vorhanden)", col4, y);
            y += headerHeight;
            doc.setDrawColor(0);
            doc.setLineWidth(0.2);
            doc.line(margin, y - headerHeight + 2, pageWidth - margin, y - headerHeight + 2); // Top line
        }

        function drawTableRow() {
            if (y > pageHeight - margin - rowHeight) {
                doc.addPage();
                y = margin;
                drawTableHeader();
            }
            doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight); // Bottom line
            doc.line(col2 - 2, y, col2 - 2, y + rowHeight); // Vertical lines
            doc.line(col3 - 2, y, col3 - 2, y + rowHeight);
            doc.line(col4 - 2, y, col4 - 2, y + rowHeight);
            y += rowHeight;
        }

        // --- PDF-INHALT ---
        doc.setFontSize(18);
        doc.setFont("times", "bold");
        doc.text("Lärmprotokoll", pageWidth / 2, y, { align: "center" });
        y += 10;

        doc.setFontSize(11);
        doc.setFont("times", "normal");
        const kopfzeilen = [
            `Mietwohnung: ${data.mieterAdresse.replace(/\n/g, ', ')}`,
            `Protokollführer/in: ${data.mieterName}`,
            `Lärmquelle: ${data.laermquelle}`
        ];
        kopfzeilen.forEach(zeile => {
            doc.text(zeile, margin, y);
            y += 6;
        });
        y += 5;
        
        drawTableHeader();
        for(let i=0; i<15; i++) { // Erstellt 15 leere Zeilen
            drawTableRow();
        }
        
        // Unterschriftenfeld am Ende der letzten Seite
        if (y > pageHeight - 40) {
             doc.addPage();
             y = margin;
        }
        y = pageHeight - 40;
        doc.line(margin, y, margin + 70, y);
        doc.text("Datum, Unterschrift", margin, y + 5);


        doc.save("Laermprotokoll_Vorlage.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});