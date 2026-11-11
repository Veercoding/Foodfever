
/* FoodFever - Checkout Handoff */
/* Developer: David */
/* Integration point for JJ's ordering module */

(() => {
  const orderButton = document.getElementById("order-btn");
  const locationInput = document.getElementById("location");
  const messageElement = document.getElementById("message");

  if (!orderButton || !locationInput || !messageElement) {
    console.warn("Checkout elements are missing.");
    return;
  }

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

    const checkoutData = {
      ...summary,
      location
    };

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
