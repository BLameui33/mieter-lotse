// Globale Hilfsfunktionen zum sicheren Auslesen der Werte
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

function getFormattedDateValue(value, defaultValue = "N/A") { 
    return value ? new Date(value).toLocaleDateString("de-DE") : defaultValue;
}

// Globale Hilfsfunktionen für PDF-Erstellung (damit sie in generate...PDF bekannt sind)
const margin = 20; // Globale Konstante für PDF-Layout
const defaultLineHeight = 7;
const spaceAfterParagraph = 3;
const subHeadingFontSize = 11;
const textFontSize = 10;
const smallTextFontSize = 8;
let pageHeight, pageWidth, usableHeight, yGlobal; // Globale PDF-Layout Variablen

function initializePdfLayoutVars(docInstance) {
    pageHeight = docInstance.internal.pageSize.getHeight();
    pageWidth = docInstance.internal.pageSize.getWidth();
    usableHeight = pageHeight - margin;
    yGlobal = margin;
}

function writeLine(doc, text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
    const textToWrite = text === undefined || text === null ? "" : String(text);
    if (yGlobal + currentLineHeight > usableHeight - (margin / 2)) {
        doc.addPage();
        yGlobal = margin;
    }
    doc.setFontSize(fontSize);
    doc.setFont("times", fontStyle);
    doc.text(textToWrite, margin, yGlobal);
    yGlobal += currentLineHeight;
}

function writeParagraph(doc, text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) {
    const textToWrite = text === undefined || text === null ? "" : String(text);
    const fontStyle = options.fontStyle || "normal";
    const extraSpacing = options.extraSpacingAfter === undefined ? spaceAfterParagraph : options.extraSpacingAfter;
    doc.setFontSize(paragraphFontSize);
    doc.setFont("times", fontStyle);

    const lines = doc.splitTextToSize(textToWrite, pageWidth - (2 * margin));
    for (let i = 0; i < lines.length; i++) {
        if (yGlobal + paragraphLineHeight > usableHeight - (margin / 2)) {
            doc.addPage();
            yGlobal = margin;
        }
        doc.text(lines[i], margin, yGlobal);
        yGlobal += paragraphLineHeight;
    }
    if (yGlobal + extraSpacing > usableHeight - (margin / 2) && lines.length > 0) {
        doc.addPage();
        yGlobal = margin;
    } else if (lines.length > 0) {
        yGlobal += extraSpacing;
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchVermieterkuendigungForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchVK');
    const loadBtn = document.getElementById('loadBtnWiderspruchVK');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchVK');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchVK');
    const storageKey = 'widerspruchVermieterkuendigungFormData';

    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischSBA'); 
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsSBA'); 
    const wfVollmachtCheckbox = document.getElementById('wfVollmachtSBA'); 

    function updateWiderspruchfuehrerDetailsVisibility() {
        if (!widerspruchfuehrerIdentischSelect || !widerspruchfuehrerDetailsDiv) return;
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        
        const wfNameEl = document.getElementById('wfNameSBA'); 
        const wfAdresseEl = document.getElementById('wfAdresseSBA'); 
        const wfVerhaeltnisEl = document.getElementById('wfVerhaeltnisSBA');

        if(wfNameEl) wfNameEl.required = isNotIdentical;
        if(wfAdresseEl) wfAdresseEl.required = isNotIdentical;
        if(wfVerhaeltnisEl) wfVerhaeltnisEl.required = isNotIdentical;
        if (wfVollmachtCheckbox) wfVollmachtCheckbox.required = isNotIdentical;
    }

    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    const formElementIds = [
      "mieterName", "mieterAdresse", 
      "vermieterName", "vermieterAdresse",
      "datumKuendigungsschreiben", "aktenzeichenKuendigung", "kuendigungsfristZum", "kuendigungsgrundVermieter",
      "argumentFormelleFehlerKuendigung", "argumentKritikKuendigungsgrund", "argumentSozialeHaerte",
      "ergaenzendeArgumenteKuendigung", "forderungWiderspruchKuendigung",
      "widerspruchfuehrerIdentischSBA", 
      "wfNameSBA",                     
      "wfAdresseSBA",                  
      "wfVerhaeltnisSBA",              
      "anlageSonstigesVermieterKuendigung"
    ];
    const widerspruchfuehrerVollmachtCheckboxId = "wfVollmachtSBA"; 
    const bitteUmStellungnahmeCheckboxId = "bitteUmStellungnahme";
    const anlagenCheckboxName = "anlagenVermieterKuendigung";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'SELECT' && element.value === "") {
                data[id] = ""; 
            } else {
                data[id] = getElementValue(id);
            }
        } else {
            data[id] = ""; 
        }
      });
      data[widerspruchfuehrerVollmachtCheckboxId] = getElementChecked(widerspruchfuehrerVollmachtCheckboxId);
      data[bitteUmStellungnahmeCheckboxId] = getElementChecked(bitteUmStellungnahmeCheckboxId);
      
      data.anlagen = [];
      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`);
      anlagenCheckboxes.forEach(checkbox => {
        data.anlagen.push(checkbox.value);
      });
      return data;
    }

    function populateForm(data) {
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element && data[id] !== undefined) {
          element.value = data[id];
        }
      });
      const wfVollmachtEl = document.getElementById(widerspruchfuehrerVollmachtCheckboxId);
      if (wfVollmachtEl && data[widerspruchfuehrerVollmachtCheckboxId] !== undefined) {
          wfVollmachtEl.checked = data[widerspruchfuehrerVollmachtCheckboxId];
      }
      const stellungnahmeEl = document.getElementById(bitteUmStellungnahmeCheckboxId);
      if (stellungnahmeEl && data[bitteUmStellungnahmeCheckboxId] !== undefined) {
          stellungnahmeEl.checked = data[bitteUmStellungnahmeCheckboxId];
      }

      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
      anlagenCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.checked = !!(data.anlagen && data.anlagen.includes(checkbox.value));
        }
      });
      if (widerspruchfuehrerIdentischSelect) updateWiderspruchfuehrerDetailsVisibility();
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const data = getFormData();
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
        console.error("Fehler beim Laden der Daten für Widerspruch Vermieterkündigung:", e);
        localStorage.removeItem(storageKey); 
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
            if (getElementValue("argumentKritikKuendigungsgrund").trim() === "" &&
                getElementValue("argumentSozialeHaerte").trim() === "" &&
                getElementValue("ergaenzendeArgumenteKuendigung").trim() === "" &&
                getElementValue("argumentFormelleFehlerKuendigung").trim() === "") {
                alert("Bitte geben Sie zumindest in einem der Felder Ihre Begründung für den Widerspruch an.");
                return;
            }
            if (getElementValue("forderungWiderspruchKuendigung").trim() === "") {
                alert("Bitte formulieren Sie Ihre Forderung an den Vermieter.");
                document.getElementById("forderungWiderspruchKuendigung").focus();
                return;
            }
            generateVermieterKuendigungWiderspruchPDF(getFormData()); 
        });
    }
}); // Ende DOMContentLoaded

function generateVermieterKuendigungWiderspruchPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    initializePdfLayoutVars(doc); // Initialisiere yGlobal etc. für dieses PDF-Dokument

    // Schriftgrößen und Zeilenhöhen (können hier bei Bedarf noch angepasst werden)
    // const defaultLineHeight = 7; // Bereits global definiert
    // const subHeadingFontSize = 11; // Bereits global definiert
    // const textFontSize = 10;     // Bereits global definiert
    // const smallTextFontSize = 8; // Bereits global definiert

    const {
        mieterName, mieterAdresse, 
        vermieterName, vermieterAdresse,
        datumKuendigungsschreiben, aktenzeichenKuendigung, kuendigungsfristZum, kuendigungsgrundVermieter,
        argumentFormelleFehlerKuendigung, argumentKritikKuendigungsgrund, argumentSozialeHaerte,
        ergaenzendeArgumenteKuendigung, forderungWiderspruchKuendigung,
        bitteUmStellungnahme, 
        anlagen,
        widerspruchfuehrerIdentischSBA, 
        wfNameSBA, wfAdresseSBA, wfVerhaeltnisSBA, wfVollmachtSBA 
    } = data;

    // Datumsformatierung (aus globaler Funktion)
    const datumKuendigungFormatiert = getFormattedDateValue(datumKuendigungsschreiben);
    const kuendigungsfristZumFormatiert = getFormattedDateValue(kuendigungsfristZum);

    doc.setFont("times", "normal");

    // Absender
    let absenderName = mieterName;
    let absenderAdresse = mieterAdresse;
    if (widerspruchfuehrerIdentischSBA === 'nein' && wfNameSBA && wfNameSBA.trim() !== "") {
        absenderName = wfNameSBA;
        absenderAdresse = wfAdresseSBA;
    }
    writeLine(doc, absenderName, defaultLineHeight, "normal", textFontSize);
    absenderAdresse.split("\n").forEach(line => writeLine(doc, line.trim(), defaultLineHeight, "normal", textFontSize));
    if (widerspruchfuehrerIdentischSBA === 'nein' && wfNameSBA && wfNameSBA.trim() !== ""){
         writeParagraph(doc, `(handelnd für ${mieterName})`, defaultLineHeight, smallTextFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (yGlobal + defaultLineHeight <= usableHeight) yGlobal += defaultLineHeight; else {doc.addPage(); yGlobal = margin;}

    // Empfänger (Vermieter)
    writeLine(doc, vermieterName, defaultLineHeight, "normal", textFontSize);
    vermieterAdresse.split("\n").forEach(line => writeLine(doc, line.trim(), defaultLineHeight, "normal", textFontSize));
    if (yGlobal + defaultLineHeight * 2 <= usableHeight) yGlobal += defaultLineHeight * 2; else {doc.addPage(); yGlobal = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (yGlobal + defaultLineHeight > usableHeight) { doc.addPage(); yGlobal = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, yGlobal);
    yGlobal += defaultLineHeight * 2; 

    // Betreff (druckvoller)
    let mietobjektAdresseKurz = (mieterAdresse.split("\n")[0] || '[Adresse der Wohnung]').trim();
    let betreffText = `Widerspruch gegen Ihre Kündigung des Mietvertrages vom ${datumKuendigungFormatiert}`;
    if (aktenzeichenKuendigung && aktenzeichenKuendigung.trim() !== "") betreffText += `, Ihr Zeichen/Aktenzeichen: ${aktenzeichenKuendigung}`;
    betreffText += `\nMietobjekt: ${mietobjektAdresseKurz}`;
    betreffText += `\n- AUFFORDERUNG ZUR RÜCKNAHME DER KÜNDIGUNG -`; // Verstärkt
    
    const betreffFontSize = 12;
    writeParagraph(doc, betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight * 1.5}); // Mehr Abstand nach Betreff

    // Anrede
    writeParagraph(doc, "Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch (bestimmter)
    writeParagraph(doc, `hiermit lege ich/legen wir fristgerecht und mit allem gebotenen Nachdruck Widerspruch gegen Ihre Kündigung des Mietvertrages für die oben genannte Wohnung, datiert auf den ${datumKuendigungFormatiert}, ein. Mit dieser Kündigung beabsichtigen Sie, das langjährige Mietverhältnis zum ${kuendigungsfristZumFormatiert} zu beenden.`);
    if (widerspruchfuehrerIdentischSBA === 'nein' && wfNameSBA && wfNameSBA.trim() !== "") {
        writeParagraph(doc, `Ich, ${wfNameSBA}, lege diesen Widerspruch als ${wfVerhaeltnisSBA || 'bevollmächtigte Person'} für ${mieterName} ein.`);
        if (wfVollmachtSBA) writeParagraph(doc, "Eine entsprechende Vollmacht ist diesem Schreiben beigefügt und bestätigt meine Vertretungsbefugnis.", defaultLineHeight, smallTextFontSize, {fontStyle: "italic"});
    }
    writeParagraph(doc, `Die von Ihnen ausgesprochene Kündigung ist nach meiner/unserer Auffassung sowohl aus formellen als auch aus materiellen Gründen unwirksam und/oder stellt für mich/uns eine unzumutbare Härte im Sinne des § 574 BGB dar. Ich/Wir fordern Sie daher auf, die Kündigung umgehend zurückzunehmen und das Mietverhältnis zu den bestehenden Konditionen fortzusetzen.`);
    
    // Begründung des Widerspruchs
    writeLine(doc, "Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, "bold", subHeadingFontSize);
    yGlobal += spaceAfterParagraph / 2; 
    
    if (kuendigungsgrundVermieter && kuendigungsgrundVermieter.trim() !== "") {
        writeParagraph(doc, `Sie begründen Ihre Kündigung im Wesentlichen mit: "${kuendigungsgrundVermieter}". Diese Begründung ist aus nachfolgenden Gründen nicht stichhaltig bzw. nicht ausreichend:`, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    let hatBegruendung = false;
    if (argumentFormelleFehlerKuendigung && argumentFormelleFehlerKuendigung.trim() !== "") {
        writeLine(doc, "A. Formelle Unwirksamkeit der Kündigung:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(doc, argumentFormelleFehlerKuendigung);
        hatBegruendung = true;
    }
    if (argumentKritikKuendigungsgrund && argumentKritikKuendigungsgrund.trim() !== "") {
        writeLine(doc, "B. Materielle Unbegründetheit / Unwirksamkeit des Kündigungsgrundes:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(doc, argumentKritikKuendigungsgrund);
        hatBegruendung = true;
    }
    if (argumentSozialeHaerte && argumentSozialeHaerte.trim() !== "") {
        writeLine(doc, "C. Soziale Härtegründe gemäß § 574 BGB (Sozialklausel):", defaultLineHeight, "bold", textFontSize);
        writeParagraph(doc, argumentSozialeHaerte);
        hatBegruendung = true;
    }
    if (ergaenzendeArgumenteKuendigung && ergaenzendeArgumenteKuendigung.trim() !== "") {
        writeLine(doc, "D. Weitere ergänzende Ausführungen:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(doc, ergaenzendeArgumenteKuendigung);
        hatBegruendung = true;
    }
    
    if (!hatBegruendung) {
         writeParagraph(doc, "Die detaillierten Gründe für meinen/unseren Widerspruch sind [Bitte hier die zentralen Gründe einfügen! Ohne substantiierte Begründung ist ein Widerspruch meist aussichtslos.].", defaultLineHeight, textFontSize, {fontStyle:"bold"});
    }
    
    writeParagraph(doc, "Ich/Wir weisen darauf hin, dass eine Kündigung des Wohnraummietverhältnisses nur unter strengen gesetzlichen Voraussetzungen zulässig ist und eine sorgfältige Abwägung aller Umstände erfordert. Die von Ihnen angeführten Gründe rechtfertigen eine Beendigung des Mietverhältnisses nicht bzw. überwiegen die uns zustehenden schutzwürdigen Interessen an der Fortsetzung des Mietverhältnisses erheblich.", defaultLineHeight, textFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    
    // Forderung
    writeLine(doc, "Meine/Unsere Forderung:", defaultLineHeight, "bold", subHeadingFontSize);
    yGlobal += spaceAfterParagraph / 2;
    if (forderungWiderspruchKuendigung && forderungWiderspruchKuendigung.trim() !== "") {
        writeParagraph(doc, forderungWiderspruchKuendigung, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else {
        writeParagraph(doc, `Ich/Wir fordern Sie daher ultimativ auf, die Kündigung vom ${datumKuendigungFormatiert} vollumfänglich zurückzunehmen und das Mietverhältnis zu den bestehenden Bedingungen unbefristet fortzusetzen.`, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    }
    
    if (bitteUmStellungnahme) {
        const fristStellungnahmeText = new Date(Date.now() + 2 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); 
        writeParagraph(doc, `Wir erwarten Ihre schriftliche Bestätigung der Rücknahme der Kündigung und der Fortsetzung des Mietverhältnisses bis spätestens zum **${fristStellungnahmeText}**.`, defaultLineHeight, textFontSize);
    }

    writeParagraph(doc, "Sollten Sie diesen Widerspruch zurückweisen oder die Kündigung aufrechterhalten, behalten wir uns ausdrücklich alle weiteren rechtlichen Schritte, einschließlich der Anrufung des zuständigen Gerichts zur Klärung der Rechtslage, vor.", defaultLineHeight, textFontSize, {fontStyle:"italic"});


    // Anlagen
    if (anlagen && anlagen.length > 0) {
        writeLine(doc, "Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        yGlobal += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(doc, `- ${anlage}`);
        });
    }
    
    writeParagraph(doc, "Mit freundlichen Grüßen");
    writeParagraph(doc, "\n\n_________________________"); 
    
    const mieterNamenFuerUnterschrift = getElementValue("mieterName");
    const mieterArray = mieterNamenFuerUnterschrift.split('\n').filter(name => name.trim() !== "");
    if (mieterArray.length > 0) {
        mieterArray.forEach(einzelMieter => {
            writeParagraph(doc, einzelMieter.trim(), defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.2});
        });
    } else {
         writeParagraph(doc, absenderName); 
    }

    doc.save("widerspruch_vermieterkuendigung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchVK");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}