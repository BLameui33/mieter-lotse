document.addEventListener("DOMContentLoaded", function() {
    // 1. Einheitliches CSS in die Seite einfügen (!important überschreibt deine alten Inline-Styles)
    const style = document.createElement('style');
    style.innerHTML = `
        /* Das Design für den inneren weißen Kasten */
        #spendenPopup .popup-content {
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
        #spendenPopup input[type="submit"] {
            background: none !important; border: none !important; text-decoration: underline !important; 
            cursor: pointer !important; margin-bottom: 20px !important; font-size: 0.9em !important;
            color: #555 !important; padding: 0 !important; font-weight: normal !important;
        }

        /* Den Schließen-Button einheitlich machen */
        #spendenPopup .popup-close-button {
            background: #f1f1f1 !important; border: 1px solid #ccc !important; padding: 10px 20px !important; 
            cursor: pointer !important; border-radius: 5px !important; font-size: 14px !important;
            width: 100% !important; transition: 0.2s !important; color: #333 !important; margin-top: 0 !important;
        }
        #spendenPopup .popup-close-button:hover { 
            background: #e0e0e0 !important; 
        }
    `;
    document.head.appendChild(style);

    // 2. PayPal-Formulare finden und Buttons einbauen (Texte bleiben unangetastet!)
    const forms = document.querySelectorAll('#spendenPopup form[action="https://www.paypal.com/donate"]');
    
    forms.forEach(form => {
        // Verhindern, dass Buttons doppelt eingefügt werden
        if (form.dataset.buttonsAdded) return; 
        
        const originalSubmit = form.querySelector('input[type="submit"]');
        if (!originalSubmit) return;

        // Container für die neuen Buttons erstellen
        const btnContainer = document.createElement('div');
        btnContainer.className = 'spenden-btn-gruppe'; // Hier greift unser CSS von oben

        // Die Beträge
        const amounts = [3, 5, 10];

        amounts.forEach(amount => {
            const btn = document.createElement('button');
            btn.type = "submit";
            btn.name = "amount";
            btn.value = amount;
            btn.textContent = amount + " €";
            btn.className = "spenden-summe-btn"; // Hier greift unser CSS von oben
            btnContainer.appendChild(btn);
        });

        // Den Text des originalen Buttons anpassen
        originalSubmit.value = "Anderer Betrag";

        // Die neuen Buttons vor dem originalen Submit-Button einfügen
        originalSubmit.parentNode.insertBefore(btnContainer, originalSubmit);
        
        // Formular markieren
        form.dataset.buttonsAdded = "true";
    });
});