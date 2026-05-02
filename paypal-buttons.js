document.addEventListener("DOMContentLoaded", function() {
    // Finde alle PayPal-Formulare auf der Seite
    const forms = document.querySelectorAll('form[action="https://www.paypal.com/donate"]');
    
    forms.forEach(form => {
        // Verhindern, dass Buttons doppelt eingefügt werden
        if (form.dataset.buttonsAdded) return; 
        
        const originalSubmit = form.querySelector('input[type="submit"]');
        if (!originalSubmit) return;

        // Container für die neuen Buttons erstellen
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display: flex; gap: 10px; justify-content: center; margin-bottom: 15px; margin-top: 15px;";

        // Die Beträge, die wir anbieten wollen
        const amounts = [3, 5, 10];

        amounts.forEach(amount => {
            const btn = document.createElement('button');
            btn.type = "submit";
            btn.name = "amount";
            btn.value = amount;
            btn.textContent = amount + " €";
            // Einheitliches Styling für die neuen Buttons
            btn.style.cssText = "background-color: #ffc439; border: none; padding: 0.7rem 1.2rem; font-weight: bold; border-radius: 5px; cursor: pointer; color: #333; flex: 1;";
            btnContainer.appendChild(btn);
        });

        // Den Text des originalen Buttons anpassen
        originalSubmit.value = "Individueller Betrag";

        // Die neuen Buttons vor dem originalen Submit-Button einfügen
        originalSubmit.parentNode.insertBefore(btnContainer, originalSubmit);
        
        // Formular markieren, damit es nicht nochmal bearbeitet wird
        form.dataset.buttonsAdded = "true";
    });
});
