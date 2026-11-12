/* FoodFever - Ordering and Tracking */
/* Developer: JJ */
/* Updated: pay on delivery, Delivered status, customer email */

(() => {
  const STORAGE_KEY = "foodfever_orders";
  // Must match FLOW in the dashboard script.
  const STATUSES = ["Pending", "Preparing", "Ready", "Delivered"];
  // Auto-simulation: on the My orders page each order moves Pending -> Preparing -> Ready by itself.
  // The vendor still marks Delivered on the dashboard (that is when payment is collected and the email goes out).
  const AUTO_SIMULATE = true;
  const STAGE_MS = { Pending: 6000, Preparing: 12000 };   // how long an order stays in each stage (ms)
  const PAY_ON_DELIVERY = "Pay on delivery";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Clean the customer details (name, email, phone). Returns null if there are none.
  function normaliseCustomer(customer) {
    if (!customer || typeof customer !== "object") {
      return null;
    }

    const name = typeof customer.name === "string" ? customer.name.trim() : "";
    const email = typeof customer.email === "string" ? customer.email.trim().toLowerCase() : "";
    const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";

    if (!name && !email && !phone) {
      return null;
    }

    return { name, email, phone };
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
      statusUpdatedAt: Number.isFinite(Date.parse(order.statusUpdatedAt))
        ? new Date(order.statusUpdatedAt).toISOString()
        : new Date(order.createdAt).toISOString(),
      customer: normaliseCustomer(order.customer),
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

  // Has this order been paid for?
  function isPaid(order) {
    return Boolean(
      order.payment &&
      (order.payment.status === "Paid" || order.payment.receipt)
    );
  }

  // One line describing how this order is paid for.
  function describePayment(order) {
    const payment = order.payment;

    if (!payment) {
      return "No payment record";
    }

    if (payment.method === PAY_ON_DELIVERY) {
      return isPaid(order)
        ? "Paid on delivery"
        : `Pay ${formatMoney(order.total)} by M-Pesa when your order arrives`;
    }

    return payment.receipt
      ? `Paid with M-Pesa · ${payment.receipt}`
      : "No payment record";
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

      // How this order is paid for.
      const paymentLine = document.createElement("p");
      paymentLine.className =
        "order-payment " + (isPaid(order) ? "is-paid" : "is-unpaid");
      paymentLine.textContent = describePayment(order);

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

      // Live animation for orders still in progress (waiting / chef cooking / rider on the way).
      const live =
        window.FoodFeverDelivery && typeof window.FoodFeverDelivery.liveScene === "function"
          ? window.FoodFeverDelivery.liveScene(order)
          : null;

      card.append(heading);
      if (live) {
        card.append(live);
      }
      card.append(
        details,
        paymentLine,
        itemList,
        total,
        progress
      );

      if (order.status === "Delivered") {
        const deliveredMessage = document.createElement("p");
        deliveredMessage.className = "order-ready-message is-delivered";
        deliveredMessage.textContent = "Delivered. Enjoy your meal!";

        card.appendChild(deliveredMessage);
      } else if (order.status === "Ready") {
        const readyMessage = document.createElement("p");
        readyMessage.className = "order-ready-message";
        readyMessage.textContent =
          order.payment && order.payment.method === PAY_ON_DELIVERY && !isPaid(order)
            ? `Your order is ready! Have ${formatMoney(order.total)} ready for M-Pesa.`
            : "Your order is ready!";

        card.appendChild(readyMessage);
      } else if (!AUTO_SIMULATE) {
        // Manual demo button (only used when AUTO_SIMULATE is turned off).
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
      }

      historyElement.appendChild(card);
    });

    scheduleAutoProgress();
  }

  // Auto-simulation: move each in-progress order to its next stage after a short wait.
  const autoTimers = new Map();

  function scheduleAutoProgress() {
    autoTimers.forEach(timer => clearTimeout(timer));
    autoTimers.clear();

    if (!AUTO_SIMULATE) {
      return;
    }

    orders.forEach(order => {
      const stageMs = STAGE_MS[order.status];

      if (!stageMs) {
        return;
      }

      const elapsed = Date.now() - Date.parse(order.statusUpdatedAt);
      const wait = Math.max(stageMs - elapsed, 1500);

      autoTimers.set(order.id, setTimeout(() => {
        autoTimers.delete(order.id);

        const latest = orders.find(item => item.id === order.id);

        // Only advance if the vendor hasn't already moved it.
        if (latest && latest.status === order.status) {
          updateOrderStatus(order.id, STATUSES[STATUSES.indexOf(order.status) + 1]);
        }
      }, wait));
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
          status: newStatus,
          statusUpdatedAt: new Date().toISOString()
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

  // Check the checkout data and return the clean items, or null.
  function validateCheckout(checkoutData) {
    if (!checkoutData || typeof checkoutData !== "object") {
      showMessage("Invalid checkout information.");
      return null;
    }

    const items = normaliseItems(checkoutData.items);

    if (!items) {
      showMessage("Your order contains invalid items.");
      return null;
    }

    if (
      typeof checkoutData.location !== "string" ||
      !checkoutData.location.trim()
    ) {
      showMessage("Please select a delivery location.");
      return null;
    }

    return items;
  }

  // Create, save and announce a new order.
  function saveNewOrder(checkoutData, items, payment, successMessage) {
    const order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      items,
      total: calculateOrderTotal(items),
      currency: "KES",
      location: checkoutData.location.trim(),
      status: "Pending",
      statusUpdatedAt: new Date().toISOString(),
      customer: normaliseCustomer(checkoutData.customer),
      payment
    };

    // Save the order before clearing the cart.
    const updatedOrders = [order, ...orders];

    if (!saveOrders(updatedOrders)) {
      showMessage(
        "Order could not be saved. Your cart has not been cleared."
      );
      return false;
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
      showMessage(successMessage(order));
    } else {
      showMessage(
        `Order ${order.id} was saved, but the cart could not be cleared.`
      );
    }

    // Other modules (like the delivery animation) listen for this.
    window.dispatchEvent(
      new CustomEvent("foodfever:order-created", {
        detail: {
          order: {
            ...order,
            items: order.items.map(item => ({ ...item }))
          }
        }
      })
    );

    console.log("FoodFever order created:", order);
    return true;
  }

  // Pay now: David's checkout + the M-Pesa dialog finished a payment.
  function handlePaidCheckout(event) {
    const checkoutData = event.detail;
    const items = validateCheckout(checkoutData);

    if (!items) {
      return;
    }

    const payment = {
      method: "M-Pesa",
      status: "Paid",
      receipt: String(checkoutData.transactionCode || ""),
      phone: String(checkoutData.phone || ""),
      paidAt: checkoutData.timestamp || null
    };

    saveNewOrder(
      checkoutData,
      items,
      payment,
      order => `Order ${order.id} placed successfully! Status: Pending.`
    );
  }

  // Pay on delivery: the order is placed now and paid when it arrives.
  function handlePlaceOrder(event) {
    const checkoutData = event.detail;
    const items = validateCheckout(checkoutData);

    if (!items) {
      return;
    }

    const customer = normaliseCustomer(checkoutData.customer);

    if (!customer || !EMAIL_RE.test(customer.email)) {
      showMessage("Enter your email so we can tell you when your order arrives.");
      return;
    }

    const payment = {
      method: PAY_ON_DELIVERY,
      status: "Unpaid",
      receipt: "",
      phone: customer.phone || "",
      paidAt: null
    };

    saveNewOrder(
      checkoutData,
      items,
      payment,
      order => `Order ${order.id} placed! Pay by M-Pesa when it arrives.`
    );
  }

  // Pay now: payment finished.
  window.addEventListener("foodfever:payment-success", handlePaidCheckout);

  // Pay on delivery: order placed without paying yet.
  window.addEventListener("foodfever:place-order", handlePlaceOrder);

  // Keep this page up to date when the vendor changes an order in another tab.
  window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) {
      orders = loadOrders();
      renderOrders();
    }
  });

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