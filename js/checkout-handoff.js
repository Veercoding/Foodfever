
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

    // Handoff event for JJ's ordering implementation.
    window.dispatchEvent(
      new CustomEvent("foodfever:checkout", {
        detail: checkoutData
      })
    );

    // Prototype only: no confirmed order has been created.
    messageElement.textContent =
      "Checkout details prepared. Ordering integration pending.";

    console.log("FoodFever checkout prepared:", checkoutData);
  });
})();
