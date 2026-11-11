(() => {
  const dialog = document.getElementById("mpesa-dialog");
  const totalElement = document.getElementById("mpesa-total");
  const phoneForm = document.getElementById("mpesa-phone-form");
  const phoneStep = document.getElementById("mpesa-phone-step");
  const waitStep = document.getElementById("mpesa-wait-step");
  const pinStep = document.getElementById("mpesa-pin-step");
  const closeButton = document.getElementById("mpesa-close");
  const messageElement = document.getElementById("mpesa-message");
  const outcomeSelect = document.getElementById("mpesa-outcome");
  const confirmButton = document.getElementById("mpesa-confirm");
  const phoneInput = document.getElementById("mpesa-phone");

  if (
    !dialog ||
    !totalElement ||
    !phoneForm ||
    !phoneStep ||
    !waitStep ||
    !pinStep ||
    !closeButton ||
    !messageElement || 
    !outcomeSelect || 
    !confirmButton ||
    !phoneInput
  ) {
    console.error("M-Pesa dialog elements are missing.");
    return;
  }

  let pushTimer;
  let pendingCheckout = null;
  const TRANSACTIONS_KEY = "foodfever_mpesa_transactions";

  function resetPayment() {
    confirmButton.disabled = false;
    clearTimeout(pushTimer);
    phoneStep.hidden = false;
    waitStep.hidden = true;
    pinStep.hidden = true;
    messageElement.textContent = "";
    phoneForm.reset();
  }

  window.addEventListener("foodfever:checkout", event => {
    const checkout = event.detail;

    if (!checkout || !Number.isFinite(checkout.total)) {
      console.error("Checkout event has an invalid total.");
      return;
    }

    pendingCheckout = checkout;
    resetPayment();
    totalElement.textContent = checkout.total;
    dialog.showModal();
  });

  phoneForm.addEventListener("submit", event => {
    event.preventDefault();

    phoneStep.hidden = true;
    waitStep.hidden = false;

    pushTimer = setTimeout(() => {
      waitStep.hidden = true;
      pinStep.hidden = false;
    }, 1500);
  });

  confirmButton.addEventListener("click", () => {
    const outcomes = {
    success: "Simulated payment successful.",
    "insufficient-funds": "Payment failed: insufficient funds.",
    "invalid-pin": "Payment failed: invalid PIN.",
    timeout: "Payment failed: the request timed out."
    };

    const outcome = outcomeSelect.value;

         if (!Object.hasOwn(outcomes, outcome)) {
    messageElement.textContent = "Choose a valid demo outcome.";
    return;
        }

        if (outcome !== "success") {
    messageElement.textContent = outcomes[outcome];
    return;
        }

        if (!pendingCheckout) {
    messageElement.textContent = "No checkout is available to pay.";
    return;
        }

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const transactionCode = Array.from({ length: 10 }, () =>
    characters[Math.floor(Math.random() * characters.length)]
    ).join("");

    const transaction = {
    transactionCode,
    timestamp: new Date().toISOString(),
    phone: phoneInput.value,
    status: "paid",
    ...pendingCheckout
    };

    try {
        const saved = JSON.parse(
      localStorage.getItem(TRANSACTIONS_KEY) || "[]"
    );

        if (!Array.isArray(saved)) {
      throw new Error("Saved transactions are not in the expected format.");
        }

        saved.push(transaction);
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(saved));
    } catch (error) {
        console.error("Could not save simulated transaction:", error);
        messageElement.textContent =
        "Payment was simulated, but the receipt could not be saved.";
        return;
    }

    confirmButton.disabled = true;

    messageElement.textContent =
    `Simulated payment successful. Receipt: ${transactionCode}`;

    window.dispatchEvent(
        new CustomEvent("foodfever:payment-success", {
      detail: transaction
        })
    );
    });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("close", resetPayment);
})();