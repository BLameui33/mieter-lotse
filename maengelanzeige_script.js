document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('maengelanzeigeForm');
    const saveBtn = document.getElementById('saveBtnMaengel');
    const loadBtn = document.getElementById('loadBtnMaengel');
    const closePopupBtn = document.getElementById('closePopupBtnMaengel');
    const spendenPopup = document.getElementById('spendenPopupMaengel');
    const storageKey = 'maengelanzeigeFormData';

    const maengelContainer = document.getElementById('maengelContainer');
    const addMangelBtn = document.getElementById('addMangelBtn');
    let mangelCounter = 1; // Zählt die Mängelblöcke

    // --- Dynamische Mängelblöcke hinzufügen ---
    if (addMangelBtn) {
        addMangelBtn.addEventListener('click', function() {
            mangelCounter++;
            const newMangelBlock = document.createElement('div');
            newMangelBlock.classList.add('maengel-block');
            newMangelBlock.innerHTML = `
                <h3 style="font-size:1.1em; margin-top:1rem; color:#555;">Mangel ${mangelCounter}</h3>
                <label for="mangel${mangelCounter}_beschreibung">Beschreibung des Mangels ${mangelCounter}:</label>
                <textarea id="mangel${mangelCounter}_beschreibung" name="mangel_beschreibung[]" rows="3" required></textarea>
                <label for="mangel${mangelCounter}_ort">Ort des Mangels ${mangelCounter} in der Wohnung:</label>
                <input type="text" id="mangel${mangelCounter}_ort" name="mangel_ort[]" required>
                <label for="mangel${mangelCounter}_bemerkt_seit">Mangel bemerkt seit (ca. Datum/Zeitraum) ${mangelCounter}:</label>
                <input type="text" id="mangel${mangelCounter}_bemerkt_seit" name="mangel_bemerkt_seit[]">
                <button type="button" class="removeMangelBtn button-secondary" style="font-size:0.8em; padding:5px 10px; background-color:#e74c3c;">Diesen Mangel entfernen</button>
            `;
            maengelContainer.appendChild(newMangelBlock);
            updateRemoveButtons();
        });
    }

    function updateRemoveButtons() {
        const removeButtons = maengelContainer.querySelectorAll('.removeMangelBtn');
        removeButtons.forEach(btn => {
            btn.onclick = function() { // Einfacher onclick Handler hier für dynamisch erzeugte Elemente
                btn.parentElement.remove();
                // Ggf. mangelCounter anpassen und IDs neu ordnen, wenn das wichtig für die Verarbeitung ist -
                // für die reine Datensammlung mit name="mangel_beschreibung[]" ist es aber nicht zwingend.
                // Um die sichtbare Nummerierung konsistent zu halten, wenn mittlere Elemente entfernt werden:
                const verbleibendeBloecke = maengelContainer.querySelectorAll('.maengel-block');
                mangelCounter = verbleibendeBloecke.length; // Zähler anpassen
                verbleibendeBloecke.forEach((block, index) => {
                    const newIndex = index + 1;
                    block.querySelector('h3').textContent = `Mangel ${newIndex}`;
                    block.querySelectorAll('label').forEach(label => {
                        if (label.htmlFor.includes('_beschreibung')) label.textContent = `Beschreibung des Mangels ${newIndex}:`;
                        if (label.htmlFor.includes('_ort')) label.textContent = `Ort des Mangels ${newIndex} in der Wohnung:`;
                        if (label.htmlFor.includes('_bemerkt_seit')) label.textContent = `Mangel bemerkt seit (ca. Datum/Zeitraum) ${newIndex}:`;
                    });
                });
            };
        });
    }
    updateRemoveButtons(); // Für den ersten, statisch im HTML erstellten Block

    // --- Speichern & Laden Logik ---
    function getElementValue(id, defaultValue = "") { /* ... (wie gehabt) ... */ }
    function getElementChecked(id, defaultValue = false) { /* ... (wie gehabt) ... */ }
    // Kopiere die getElementValue und getElementChecked Funktionen von einem anderen Skript hierher
    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        if (element && typeof element.value !== 'undefined' && element.value !== null) {
            return String(element.value);
        }
        return defaultValue;
    }
    function getElementChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }


    const formElementIds = [ // Ohne die dynamischen Mängelfelder erstmal
        "mieterName", "mieterAdresse", "mieterTelefon", "mieterEmail",
        "vermieterName", "vermieterAdresse",
        "fristBeseitigung", "anlageSonstigesMaengel"
    ];
    const weitereSchritteCheckboxName = "weitereSchritte";
    const anlagenCheckboxName = "anlagenMaengel";

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            data[id] = getElementValue(id);
        });
        
        data.maengel = [];
        const beschreibungen = document.querySelectorAll('textarea[name="mangel_beschreibung[]"]');
        const orte = document.querySelectorAll('input[name="mangel_ort[]"]');
        const bemerktSeits = document.querySelectorAll('input[name="mangel_bemerkt_seit[]"]');
        for (let i = 0; i < beschreibungen.length; i++) {
            if (beschreibungen[i].value.trim() !== "") { // Nur Mängel mit Beschreibung speichern
                data.maengel.push({
                    beschreibung: beschreibungen[i].value,
                    ort: orte[i] ? orte[i].value : '',
                    bemerkt_seit: bemerktSeits[i] ? bemerktSeits[i].value : ''
                });
            }
        }
        
        data.weitereSchritte = [];
        document.querySelectorAll(`input[name="${weitereSchritteCheckboxName}"]:checked`).forEach(cb => data.weitereSchritte.push(cb.value));
        data.anlagen = [];
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`).forEach(cb => data.anlagen.push(cb.value));
        return data;
    }

    function populateForm(data) {
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.value = data[id];
            }
        });

        // Mängelblöcke wiederherstellen
        maengelContainer.innerHTML = ''; // Bestehende leeren (außer ggf. einen Template-Block)
        mangelCounter = 0;
        if (data.maengel && data.maengel.length > 0) {
            data.maengel.forEach((mangel, index) => {
                mangelCounter++;
                const newMangelBlock = document.createElement('div');
                newMangelBlock.classList.add('maengel-block');
                // IDs müssen eindeutig sein, daher beim Wiederherstellen auch den Zähler nutzen
                newMangelBlock.innerHTML = `
                    <h3 style="font-size:1.1em; margin-top:${index > 0 ? '1.5rem' : '0'}; border-top:${index > 0 ? '1px dashed #ccc' : 'none'}; padding-top:${index > 0 ? '1rem' : '0'};">Mangel ${mangelCounter}</h3>
                    <label for="mangel${mangelCounter}_beschreibung">Beschreibung des Mangels ${mangelCounter}:</label>
                    <textarea id="mangel${mangelCounter}_beschreibung" name="mangel_beschreibung[]" rows="3" required>${mangel.beschreibung || ''}</textarea>
                    <label for="mangel${mangelCounter}_ort">Ort des Mangels ${mangelCounter} in der Wohnung:</label>
                    <input type="text" id="mangel${mangelCounter}_ort" name="mangel_ort[]" value="${mangel.ort || ''}" required>
                    <label for="mangel${mangelCounter}_bemerkt_seit">Mangel bemerkt seit (ca. Datum/Zeitraum) ${mangelCounter}:</label>
                    <input type="text" id="mangel${mangelCounter}_bemerkt_seit" name="mangel_bemerkt_seit[]" value="${mangel.bemerkt_seit || ''}">
                    ${mangelCounter > 1 ? '<button type="button" class="removeMangelBtn button-secondary" style="font-size:0.8em; padding:5px 10px; background-color:#e74c3c;">Diesen Mangel entfernen</button>' : ''}
                `;
                maengelContainer.appendChild(newMangelBlock);
            });
        } else { // Mindestens einen leeren Block erstellen, wenn keine Daten vorhanden
            addMangelBtn.click(); // Simuliert Klick, um ersten Block zu erstellen (oder direkt HTML einfügen)
            removeMangelBtn.click(); // Entfernt den zweiten Block, falls addMangelBtn einen zweiten erstellt
        }
        updateRemoveButtons();


        document.querySelectorAll(`input[name="${weitereSchritteCheckboxName}"]`).forEach(cb => {
            cb.checked = !!(data.weitereSchritte && data.weitereSchritte.includes(cb.value));
        });
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(cb => {
            cb.checked = !!(data.anlagen && data.anlagen.includes(cb.value));
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const data = getFormData();
          if(data.maengel.length === 0 || data.maengel[0].beschreibung.trim() === "") {
              alert("Bitte beschreiben Sie mindestens einen Mangel.");
              return;
          }
          localStorage.setItem(storageKey, JSON.stringify(data));
          alert('Ihre Eingaben wurden im Browser gespeichert!');
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                populateForm(JSON.parse(savedData));
                alert('Gespeicherte Eingaben wurden geladen!');
            } else {
                alert('Keine gespeicherten Daten gefunden.');
            }
        });
    }
    
    const autoLoadData = localStorage.getItem(storageKey);
    if (autoLoadData) {
      try {
        populateForm(JSON.parse(autoLoadData));
      } catch (e) {
        console.error("Fehler beim Laden der Daten für Mängelanzeige:", e);
        localStorage.removeItem(storageKey);
      }
    } else {
        // Sicherstellen, dass der erste Mängelblock beim ersten Laden da ist, falls er nicht im HTML ist
        if (maengelContainer.children.length === 0 && addMangelBtn) {
           // HTML hat schon einen Block, diese Logik ist für einen komplett leeren Container
        }
    }

    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', function() {
            spendenPopup.style.display = 'none';
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = getFormData();
            if(formData.maengel.length === 0 || formData.maengel[0].beschreibung.trim() === "") {
                alert("Bitte beschreiben Sie mindestens einen Mangel, bevor Sie das PDF erstellen.");
                document.getElementById('mangel1_beschreibung').focus();
                return;
            }
            generateMaengelanzeigePDF(formData);
        });
    }
}); // Ende DOMContentLoaded

function generateMaengelanzeigePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 3; 
    const subHeadingFontSize = 11;
    const textFontSize = 10;     

    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin/2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle); 
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        const fontStyle = options.fontStyle || "normal";
        const extraSpacing = options.extraSpacingAfter === undefined ? spaceAfterParagraph : options.extraSpacingAfter;
        doc.setFontSize(paragraphFontSize);
        doc.setFont("times", fontStyle);
        
        const lines = doc.splitTextToSize(textToWrite, pageWidth - (2 * margin));
        for (let i = 0; i < lines.length; i++) {
            if (y + paragraphLineHeight > usableHeight - (margin/2) ) { doc.addPage(); y = margin; }
            doc.text(lines[i], margin, y);
            y += paragraphLineHeight;
        }
        if (y + extraSpacing > usableHeight - (margin/2) && lines.length > 0) {
             doc.addPage(); y = margin;
        } else if (lines.length > 0) { 
            y += extraSpacing;
        }
    }
    
    // Formulardaten aus dem 'data' Objekt verwenden
    const {
        mieterName, mieterAdresse, mieterTelefon, mieterEmail,
        vermieterName, vermieterAdresse,
        maengel, // Array von Mängelobjekten
        fristBeseitigung,
        weitereSchritte, // Array von Checkbox-Values
        anlagen, // Array von Checkbox-Values
        anlageSonstigesMaengel
    } = data;

    const fristBeseitigungFormatiert = fristBeseitigung ? new Date(fristBeseitigung).toLocaleDateString("de-DE") : 'N/A';


    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");

    // Absender
    writeLine(mieterName, defaultLineHeight, "normal", textFontSize);
    mieterAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (mieterTelefon && mieterTelefon.trim() !== "") writeLine("Tel.: " + mieterTelefon, defaultLineHeight, "normal", textFontSize);
    if (mieterEmail && mieterEmail.trim() !== "") writeLine("E-Mail: " + mieterEmail, defaultLineHeight, "normal", textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger
    writeLine(vermieterName, defaultLineHeight, "normal", textFontSize);
    vermieterAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let betreffText = `Mängelanzeige und Aufforderung zur Mängelbeseitigung`;
    betreffText += `\nMietobjekt: ${mieterAdresse.split("\n")[0] || '[Adresse der Wohnung]'}, ${mieterAdresse.split("\n")[1] || '[PLZ Ort]'}`;
    if (mieterAdresse.split("\n").length > 2 && mieterAdresse.split("\n")[2].trim() !== "") { // Falls Etage/Wohnungsnr. angegeben
        betreffText += `, ${mieterAdresse.split("\n")[2].trim()}`;
    }
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
    // Alternativ, wenn Vermietername bekannt ist:
    // writeParagraph(`Sehr geehrte/r Herr/Frau ${vermieterName.split(" ").pop() || 'Vermieter/in'},`, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});


    // Einleitung
    writeParagraph(`hiermit zeige ich Ihnen für die oben genannte Mietwohnung folgende Mängel an:`, defaultLineHeight, textFontSize);
    
    // Auflistung der Mängel
    if (maengel && maengel.length > 0) {
        maengel.forEach((m, index) => {
            writeLine(`${index + 1}. Mangel:`, defaultLineHeight, "bold", textFontSize + 0.5);
            y += spaceAfterParagraph / 2;
            writeParagraph(`Beschreibung: ${m.beschreibung || 'Keine Beschreibung'}`, defaultLineHeight, textFontSize);
            if (m.ort && m.ort.trim() !== "") writeParagraph(`Ort in der Wohnung: ${m.ort}`, defaultLineHeight, textFontSize);
            if (m.bemerkt_seit && m.bemerkt_seit.trim() !== "") writeParagraph(`Bemerkt seit: ${m.bemerkt_seit}`, defaultLineHeight, textFontSize);
            y += spaceAfterParagraph / 2; // Kleiner Abstand zwischen Mängeln
        });
    } else {
        writeParagraph("Es wurden keine spezifischen Mängel im Formular detailliert. Bitte ergänzen Sie diese handschriftlich oder fügen eine separate Liste bei.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    
    // Aufforderung und Fristsetzung
    writeParagraph(`Ich fordere Sie hiermit höflich auf, die oben genannten Mängel fachgerecht zu beseitigen und den vertragsgemäßen Zustand der Wohnung wiederherzustellen.`, defaultLineHeight, textFontSize);
    writeParagraph(`Ich setze Ihnen hierfür eine Frist bis zum **${fristBeseitigungFormatiert}**.`, defaultLineHeight, textFontSize); // Fett für Datum

    // Ankündigung weiterer Schritte
    if (weitereSchritte && weitereSchritte.length > 0) {
        writeParagraph("Sollten Sie die Mängel nicht innerhalb der gesetzten Frist vollständig beseitigen, behalte ich mir folgende Schritte ausdrücklich vor:", defaultLineHeight, textFontSize);
        weitereSchritte.forEach(schritt => {
            if (schritt === "Mietminderung") writeParagraph("- eine angemessene Minderung der Miete gemäß § 536 BGB vorzunehmen.");
            if (schritt === "Zurueckbehaltungsrecht") writeParagraph("- einen Teil der Miete gemäß § 320 BGB zurückzuhalten.");
            if (schritt === "Selbstvornahme") writeParagraph("- die Mängel nach erneutem fruchtlosem Fristablauf ggf. selbst im Wege der Ersatzvornahme (§ 536a Abs. 2 BGB) beseitigen zu lassen und Ihnen die Kosten in Rechnung zu stellen.");
        });
    }
    writeParagraph("Ich bitte um eine kurze Bestätigung des Eingangs dieses Schreibens und um Information über die von Ihnen geplanten Maßnahmen zur Mängelbeseitigung.", defaultLineHeight, textFontSize);

    // Anlagen
    if (anlagen && anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    // Platz für Unterschrift (minimaler Abstand)
    writeParagraph("\n\n_________________________"); 
    writeParagraph(mieterName);

    doc.save("maengelanzeige.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupMaengel");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}