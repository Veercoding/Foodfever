/* FoodFever - Ordering and Tracking */
/* Developer: JJ */

(() => {
  const STORAGE_KEY = "foodfever_orders";
  const STATUSES = ["Pending", "Preparing", "Ready"];

  const historyElement = document.getElementById("order-history");
  const messageElement = document.getElementById("message");

  // Validate and clean order items.
  function normaliseItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    const cleanItems = [];

    for (const item of items) {
      if (
        !item ||
        !Number.isInteger(item.id) ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        !Number.isInteger(item.qty) ||
        item.qty < 1
      ) {
        return null;
      }

      cleanItems.push({
        id: item.id,
        name: item.name.trim(),
        vendor: typeof item.vendor === "string"
          ? item.vendor.trim()
          : "",
        price: item.price,
        qty: item.qty
      });
    }

    return cleanItems;
  }

  // Calculate the order total from its items.
  function calculateOrderTotal(items) {
    return items.reduce(
      (total, item) => total + item.price * item.qty,
      0
    );
  }

  // Validate an order loaded from localStorage.
  function normaliseStoredOrder(order) {
    if (
      !order ||
      typeof order.id !== "string" ||
      typeof order.location !== "string" ||
      !order.location.trim() ||
      typeof order.createdAt !== "string" ||
      !Number.isFinite(Date.parse(order.createdAt)) ||
      !STATUSES.includes(order.status)
    ) {
      return null;
    }

    const items = normaliseItems(order.items);

    if (!items) {
      return null;
    }

    return {
      id: order.id,
      createdAt: new Date(order.createdAt).toISOString(),
      items,
      total: calculateOrderTotal(items),
      currency: "KES",
      location: order.location.trim(),
      status: order.status,
      payment: order.payment && typeof order.payment === "object" ? order.payment : null
    };
  }

  // Restore saved orders.
  function loadOrders() {
    try {
      const savedOrders = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      if (!Array.isArray(savedOrders)) {
        return [];
      }

      return savedOrders
        .map(normaliseStoredOrder)
        .filter(order => order !== null);

    } catch (error) {
      console.warn("Could not restore orders:", error);
      return [];
    }
  }

  let orders = loadOrders();

  // Save orders and report whether saving succeeded.
  function saveOrders(updatedOrders) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedOrders)
      );

      return true;
    } catch (error) {
      console.error("Could not save orders:", error);
      return false;
    }
  }

  // Display messages to the user.
  function showMessage(message) {
    if (messageElement) {
      messageElement.textContent = message;
    }
  }

  // Generate a unique order reference.
  function generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `FF-${timestamp}-${random}`;
  }

  // Format prices in Kenyan shillings.
  function formatMoney(amount) {
    return `KES ${amount.toLocaleString()}`;
  }

  // Render order history and tracking information.
  function renderOrders() {
    if (!historyElement) {
      return;
    }

    historyElement.innerHTML = "";

    if (orders.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "orders-empty";
      emptyMessage.textContent = "You haven't placed any orders yet.";

      historyElement.appendChild(emptyMessage);
      return;
    }

    orders.forEach(order => {
      const card = document.createElement("article");
      card.className = "order-card";

      // Order heading and status.
      const heading = document.createElement("div");
      heading.className = "order-card-header";

      const title = document.createElement("h3");
      title.textContent = `Order ${order.id}`;

      const status = document.createElement("span");
      status.className =
        `order-status status-${order.status.toLowerCase()}`;
      status.textContent = order.status;

      heading.append(title, status);

      // Order date and delivery location.
      const details = document.createElement("p");
      details.className = "order-details";

      details.textContent =
        `Placed: ${new Date(order.createdAt).toLocaleString()} | ` +
        `Delivery: ${order.location}`;

      // Items in this order.
      const itemList = document.createElement("ul");
      itemList.className = "order-items";

      order.items.forEach(item => {
        const listItem = document.createElement("li");

        const itemName = document.createElement("span");
        itemName.textContent = `${item.name} × ${item.qty}`;

        const itemPrice = document.createElement("span");
        itemPrice.textContent = formatMoney(
          item.price * item.qty
        );

        listItem.append(itemName, itemPrice);
        itemList.appendChild(listItem);
      });

      // Order total.
      const total = document.createElement("p");
      total.className = "order-total";
      total.textContent = `Total: ${formatMoney(order.total)}`;

      // Order progress timeline.
      const progress = document.createElement("ol");
      progress.className = "order-progress";

      const currentIndex = STATUSES.indexOf(order.status);

      STATUSES.forEach((step, index) => {
        const stepElement = document.createElement("li");
        stepElement.textContent = step;

        if (index < currentIndex) {
          stepElement.classList.add("is-complete");
        } else if (index === currentIndex) {
          stepElement.classList.add("is-current");
          stepElement.setAttribute("aria-current", "step");
        }

        progress.appendChild(stepElement);
      });

      card.append(
        heading,
        details,
        itemList,
        total,
        progress
      );

      // Demo-only status progression.
      if (order.status !== "Ready") {
        const nextStatus = STATUSES[currentIndex + 1];

        const updateButton = document.createElement("button");
        updateButton.type = "button";
        updateButton.className = "order-status-button";
        updateButton.textContent =
          `Simulate next status: ${nextStatus}`;

        updateButton.addEventListener("click", () => {
          updateOrderStatus(order.id, nextStatus);
        });

        card.appendChild(updateButton);
      } else {
        const readyMessage = document.createElement("p");
        readyMessage.className = "order-ready-message";
        readyMessage.textContent = "Your order is ready!";

        card.appendChild(readyMessage);
      }

      historyElement.appendChild(card);
    });
  }

  // Update an order to its next valid status.
  function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(item => item.id === orderId);

    if (!order) {
      return false;
    }

    const currentIndex = STATUSES.indexOf(order.status);
    const nextStatus = STATUSES[currentIndex + 1];

    if (newStatus !== nextStatus) {
      return false;
    }

    const updatedOrders = orders.map(item => {
      if (item.id === orderId) {
        return {
          ...item,
          status: newStatus
        };
      }

      return item;
    });

    if (!saveOrders(updatedOrders)) {
      showMessage("Could not update the order status.");
      return false;
    }

    orders = updatedOrders;

    renderOrders();

    showMessage(
      `Order ${orderId} status updated to ${newStatus}.`
    );

    return true;
  }

  // Receive checkout information from David's module.
  function handleCheckout(event) {
    const checkoutData = event.detail;

    if (!checkoutData || typeof checkoutData !== "object") {
      showMessage("Invalid checkout information.");
      return;
    }

    const items = normaliseItems(checkoutData.items);

    if (!items) {
      showMessage("Your order contains invalid items.");
      return;
    }

    if (
      typeof checkoutData.location !== "string" ||
      !checkoutData.location.trim()
    ) {
      showMessage("Please select a delivery location.");
      return;
    }

    const order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      items,
      total: calculateOrderTotal(items),
      currency: "KES",
      location: checkoutData.location.trim(),
      status: "Pending",
      payment: {
        method: "M-Pesa",
        receipt: String(checkoutData.transactionCode || ""),
        phone: String(checkoutData.phone || ""),
        paidAt: checkoutData.timestamp || null
      }
    };

    // Save the order before clearing the cart.
    const updatedOrders = [order, ...orders];

    if (!saveOrders(updatedOrders)) {
      showMessage(
        "Order could not be saved. Your cart has not been cleared."
      );
      return;
    }

    orders = updatedOrders;

    renderOrders();

    // Clear the cart only after successful order saving.
    let cartCleared = false;

    try {
      if (
        window.FoodFeverCart &&
        typeof window.FoodFeverCart.clearCart === "function"
      ) {
        window.FoodFeverCart.clearCart();
        cartCleared = true;
      }
    } catch (error) {
      console.warn("Could not clear cart:", error);
    }

    if (cartCleared) {
      showMessage(
        `Order ${order.id} placed successfully! Status: Pending.`
      );
    } else {
      showMessage(
        `Order ${order.id} was saved, but the cart could not be cleared.`
      );
    }

    console.log("FoodFever order created:", order);
  }

  // Listen for David's checkout event.
  window.addEventListener(
    "foodfever:payment-success",
    handleCheckout
  );

  // Make order functions available to other modules.
  window.FoodFeverOrders = {
    getOrders: () => orders.map(order => ({
      ...order,
      items: order.items.map(item => ({ ...item }))
    })),
    updateOrderStatus,
    renderOrders
  };

  // Show previously saved orders on page load.
  renderOrders();
})();
