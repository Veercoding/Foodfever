/* FoodFever - Checkout Handoff */
/* Developer: David */
/* Integration point for JJ's ordering module */
/* Two payment choices: "mpesa" (pay now) and "delivery" (pay on delivery). */

(() => {
  const orderButton = document.getElementById("order-btn");
  const locationInput = document.getElementById("location");
  const messageElement = document.getElementById("message");
  const emailInput = document.getElementById("customer-email"); // optional: added in index.html
  const payHint = document.getElementById("pay-hint");          // optional: added in index.html

  if (!orderButton || !locationInput || !messageElement) {
    console.warn("Checkout elements are missing.");
    return;
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const HINTS = {
    mpesa: "You'll enter your M-Pesa number on the next step.",
    delivery: "Nothing to pay now. Pay by M-Pesa when your order arrives."
  };

  function getMethod() {
    const checked = document.querySelector('input[name="payment-method"]:checked');
    return checked ? checked.value : "mpesa";
  }

  // The logged-in account, if there is one (from Keith's auth.js).
  function getAccount() {
    try {
      return window.FoodFeverAuth ? window.FoodFeverAuth.getCurrentUser() : null;
    } catch (error) {
      return null;
    }
  }

  function prefillEmail() {
    const user = getAccount();

    if (emailInput && user && user.email && !emailInput.value) {
      emailInput.value = user.email;
    }
  }

  function updateHint() {
    if (payHint) {
      payHint.textContent = HINTS[getMethod()] || "";
    }
  }

  document
    .querySelectorAll('input[name="payment-method"]')
    .forEach(input => input.addEventListener("change", updateHint));

  window.addEventListener("foodfever:auth", prefillEmail);

  prefillEmail();
  updateHint();

  orderButton.addEventListener("click", () => {
    const summary = window.FoodFeverCart.getOrderSummary();

    if (summary.items.length === 0) {
      messageElement.textContent = "Your cart is empty.";
      return;
    }

    const location = locationInput.value;

    if (!location) {
      messageElement.textContent =
        "Please select a delivery location.";
      return;
    }

    const method = getMethod();
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";

    // Pay on delivery needs an email so we can say when the order arrives.
    if (method === "delivery" && !EMAIL_RE.test(email)) {
      messageElement.textContent =
        "Enter your email so we can tell you when your order arrives.";
      if (emailInput) emailInput.focus();
      return;
    }

    if (email && !EMAIL_RE.test(email)) {
      messageElement.textContent = "That email address doesn't look right.";
      if (emailInput) emailInput.focus();
      return;
    }

    const user = getAccount();

    const checkoutData = {
      ...summary,
      location,
      paymentMethod: method,
      customer: {
        name: user ? user.name : "",
        email,
        phone: user ? user.phone : ""
      }
    };

    if (method === "delivery") {
      // No payment now: JJ's module saves the order as unpaid.
      window.dispatchEvent(
        new CustomEvent("foodfever:place-order", {
          detail: checkoutData
        })
      );

      console.log("FoodFever pay-on-delivery order prepared:", checkoutData);
      return;
    }

    // Prototype only: no confirmed order has been created.
    messageElement.textContent =
      "Complete your M-Pesa payment to place the order.";

    // Handoff event for JJ's ordering implementation.
    window.dispatchEvent(
      new CustomEvent("foodfever:checkout", {
        detail: checkoutData
      })
    );

    console.log("FoodFever checkout prepared:", checkoutData);
  });

  window.addEventListener("foodfever:payment-success", event => {
    const transaction = event.detail;

    if (
      !transaction ||
      transaction.status !== "paid" ||
      typeof transaction.transactionCode !== "string"
    ) {
      console.error("Payment success event has invalid transaction data.");
      return;
    }

    messageElement.textContent =
      `Paid / Sent to Kitchen. Receipt: ${transaction.transactionCode}`;

    window.FoodFeverCart.clearCart();
  });
})();