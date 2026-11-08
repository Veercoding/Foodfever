
/* FoodFever - Shopping Cart */
/* Developer: David */

window.FoodFeverCart = (() => {
  const STORAGE_KEY = "foodfever_cart";

  let cart = [];

  // Restore previously saved cart
  try {
    const savedCart = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (Array.isArray(savedCart)) {
      cart = savedCart.filter(item =>
        Number.isInteger(item.id) &&
        typeof item.name === "string" &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        Number.isInteger(item.qty) &&
        item.qty > 0
      );
    }
  } catch (error) {
    console.warn("Could not restore cart:", error);
  }

  // Save cart in browser storage
  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // Add food item
  function addItem(item) {
    if (
      !item ||
      !Number.isInteger(item.id) ||
      typeof item.name !== "string" ||
      !Number.isFinite(item.price) ||
      item.price < 0
    ) {
      return;
    }

    const existing = cart.find(c => c.id === item.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        vendor: item.vendor,
        price: item.price,
        qty: 1
      });
    }

    updateCart();
  }

  // Increase item quantity
  function increaseQuantity(id) {
    const item = cart.find(c => c.id === id);

    if (!item) return;

    item.qty += 1;
    updateCart();
  }

  // Decrease item quantity
  function decreaseQuantity(id) {
    const item = cart.find(c => c.id === id);

    if (!item) return;

    if (item.qty > 1) {
      item.qty -= 1;
    } else {
      cart = cart.filter(c => c.id !== id);
    }

    updateCart();
  }

  // Remove item completely
  function removeItem(id) {
    cart = cart.filter(c => c.id !== id);
    updateCart();
  }

  // Calculate cart total
  function calculateTotal() {
    return cart.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );
  }

  // Render shopping cart
  function renderCart() {
    const cartElement = document.getElementById("cart-items");
    const totalElement = document.getElementById("total");

    if (!cartElement || !totalElement) return;

    cartElement.innerHTML = "";

    if (cart.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.className = "cart-empty";
      emptyMessage.textContent = "Your cart is empty.";
      cartElement.appendChild(emptyMessage);
    }

    cart.forEach(item => {
      const li = document.createElement("li");
      li.className = "cart-item";

      const details = document.createElement("div");
      details.className = "cart-item-details";

      const name = document.createElement("strong");
      name.textContent = item.name;

      const price = document.createElement("span");
      price.textContent = `KES ${item.price * item.qty}`;

      details.append(name, price);

      const controls = document.createElement("div");
      controls.className = "cart-controls";

      function createButton(label, action, ariaLabel) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.setAttribute("aria-label", ariaLabel);
        button.addEventListener("click", action);
        return button;
      }

      const minusButton = createButton(
        "−",
        () => decreaseQuantity(item.id),
        `Decrease ${item.name} quantity`
      );

      const quantity = document.createElement("span");
      quantity.textContent = item.qty;

      const plusButton = createButton(
        "+",
        () => increaseQuantity(item.id),
        `Increase ${item.name} quantity`
      );

      const removeButton = createButton(
        "×",
        () => removeItem(item.id),
        `Remove ${item.name}`
      );

      removeButton.className = "cart-remove";

      controls.append(
        minusButton,
        quantity,
        plusButton,
        removeButton
      );

      li.append(details, controls);
      cartElement.appendChild(li);
    });

    totalElement.textContent = calculateTotal();
  }

  // Save and display latest cart
  function updateCart() {
    saveCart();
    renderCart();
  }

  // Clear cart after successful order
  function clearCart() {
    cart = [];
    updateCart();
  }

  // Return a copy of cart for ordering integration
  function getCart() {
    return cart.map(item => ({ ...item }));
  }

  // Provide a cart summary for ordering integration
  function getOrderSummary() {
    return {
      items: getCart(),
      total: calculateTotal(),
      currency: "KES"
    };
  }

  return {
    addItem,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    calculateTotal,
    renderCart,
    clearCart,
    getCart,
    getOrderSummary
  };
})();

window.FoodFeverCart.renderCart();
