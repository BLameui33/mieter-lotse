document.addEventListener("DOMContentLoaded", function() {
    
    // ==========================================
    // 1. EINHEITLICHES POPUP- UND BUTTON-CSS
    // ==========================================
    const style = document.createElement('style');
    style.innerHTML = `
        /* Das Design für den inneren weißen Kasten */
        .popup-overlay .popup-content,
        .popup-content {
            background: #ffffff !important; 
            padding: 40px 30px !important; 
            border-radius: 12px !important; 
            max-width: 500px !important; 
            margin: 0 auto !important;
            box-shadow: 0px 10px 30px rgba(0,0,0,0.2) !important;
            font-family: sans-serif !important;
            border: none !important;
        }
        
        /* Das Design für die neuen Spenden-Buttons */
        .spenden-btn-gruppe {
            display: flex; gap: 10px; justify-content: center; margin: 25px 0 15px 0 !important;
        }
        .spenden-summe-btn {
            background-color: #ffc439 !important; border: none !important; padding: 12px 20px !important; 
            font-weight: bold !important; border-radius: 5px !important; cursor: pointer !important; 
            color: #333 !important; flex: 1 !important; font-size: 16px !important; transition: 0.2s !important;
        }
        .spenden-summe-btn:hover { 
            background-color: #f2b627 !important; 
        }

        /* Den alten PayPal-Button unauffälliger machen (als Alternative) */
        .popup-overlay input[type="submit"],
        .popup-content input[type="submit"] {
            background: none !important; border: none !important; text-decoration: underline !important; 
            cursor: pointer !important; margin-bottom: 20px !important; font-size: 0.9em !important;
            color: #555 !important; padding: 0 !important; font-weight: normal !important;
        }

        /* Den Schließen-Button einheitlich machen */
        .popup-overlay .popup-close-button,
        .popup-content .popup-close-button {
            background: #f1f1f1 !important; border: 1px solid #ccc !important; padding: 10px 20px !important; 
            cursor: pointer !important; border-radius: 5px !important; font-size: 14px !important;
            width: 100% !important; transition: 0.2s !important; color: #333 !important; margin-top: 0 !important;
        }
        .popup-overlay .popup-close-button:hover,
        .popup-content .popup-close-button:hover { 
            background: #e0e0e0 !important; 
        }
    `;
    document.head.appendChild(style);


    // ==========================================
    // 2. PAYPAL DONATE BUTTONS BEREITSTELLEN
    // ==========================================
    const forms = document.querySelectorAll('form[action="https://www.paypal.com/donate"]');
    
    forms.forEach(form => {
        // Verhindern, dass Buttons doppelt eingefügt werden
        if (form.dataset.buttonsAdded) return; 
        
        const originalSubmit = form.querySelector('input[type="submit"]');
        if (!originalSubmit) return;

        // Container für die neuen Buttons erstellen
        const btnContainer = document.createElement('div');
        btnContainer.className = 'spenden-btn-gruppe';

        // Die Beträge (3 €, 5 €, 10 €)
        const amounts = [3, 5, 10];

        amounts.forEach(amount => {
            const btn = document.createElement('button');
            btn.type = "submit";
            btn.name = "amount";
            btn.value = amount;
            btn.textContent = amount + " €";
            btn.className = "spenden-summe-btn";
            btnContainer.appendChild(btn);
        });

        // Den Text des originalen Buttons anpassen
        originalSubmit.value = "Anderer Betrag";

        // Die neuen Buttons vor dem originalen Submit-Button einfügen
        originalSubmit.parentNode.insertBefore(btnContainer, originalSubmit);
        
        // Formular als bearbeitet markieren
        form.dataset.buttonsAdded = "true";
    });


    // ==========================================
    // 3. AUTOMATISCHE FORMULIERUNGSHILFE FÜR TEXTAREAS
    // ==========================================
    document.querySelectorAll("textarea[placeholder]").forEach(textarea => {
        // Doppelte Verarbeitung verhindern
        if (textarea.dataset.autofillAdded) return;

        const placeholderText = textarea.getAttribute("placeholder").trim();
        
        // Ignoriert sehr kurze Platzhalter (z. B. reines "Hier schreiben...")
        if (!placeholderText || placeholderText.length < 15) return;

        // Container direkt unter dem Textfeld
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display: flex; align-items: center; gap: 8px; margin-top: 4px; margin-bottom: 12px; flex-wrap: wrap;";

        // Kleiner, edler Button
        const btnCopy = document.createElement("button");
        btnCopy.type = "button";
        btnCopy.textContent = "Textbeispiel übernehmen";
        btnCopy.style.cssText = "font-size: 11px; padding: 3px 8px; background-color: #f8f9fa; border: 1px solid #cccccc; border-radius: 3px; color: #2c3e50; cursor: pointer; font-family: inherit; transition: background-color 0.2s, border-color 0.2s;";

        // Dezenter Hover-Effekt
        btnCopy.addEventListener("mouseover", () => {
            btnCopy.style.backgroundColor = "#e9ecef";
            btnCopy.style.borderColor = "#b0b0b0";
        });
        btnCopy.addEventListener("mouseout", () => {
            btnCopy.style.backgroundColor = "#f8f9fa";
            btnCopy.style.borderColor = "#cccccc";
        });

        // Kurzer Erklärtext in kleiner Schrift
        const hintText = document.createElement("span");
        hintText.textContent = "Fügt den Formulierungsvorschlag direkt als bearbeitbaren Text ein.";
        hintText.style.cssText = "font-size: 11px; color: #6c757d;";

        // Klick-Aktion: Placeholder-Text in das Feld kopieren
        btnCopy.addEventListener("click", () => {
            textarea.value = placeholderText;
            textarea.focus();
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        });

        wrapper.appendChild(btnCopy);
        wrapper.appendChild(hintText);

        // Zeile direkt unter der jeweiligen Textarea einfügen
        textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);
        textarea.dataset.autofillAdded = "true";
    });

});