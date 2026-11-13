/* FoodFever - Vendor menu panel */
/* Shown instead of the cart when a vendor (or admin) is logged in.
   Vendors add, edit and delete menu items. They cannot place orders. */

(() => {
  const CATEGORIES = ["Meals", "Fast Food", "Snacks", "Drinks"];

  let panel = null;
  let editingId = null;
  let messageTimer = null;
  let originalHeading = null;

  function currentUser() {
    try {
      return window.FoodFeverAuth ? window.FoodFeverAuth.getCurrentUser() : null;
    } catch (error) {
      return null;
    }
  }

  const isManager = user => !!user && (user.role === "vendor" || user.role === "admin");

  const field = id => panel.querySelector("#" + id);

  function buildPanel() {
    const main = document.querySelector("main");
    if (!main) return null;

    const aside = document.createElement("aside");
    aside.id = "vendor-panel";
    aside.setAttribute("aria-labelledby", "vp-title");

    aside.innerHTML = `
      <h2 id="vp-title">Add a menu item</h2>
      <p class="vp-note">Stall: <strong id="vp-stall"></strong>. Students place the orders, so here you only manage what's on the menu.</p>

      <form id="vp-form" novalidate>
        <div id="vp-vendor-wrap" hidden>
          <label for="vp-vendor">Stall name</label>
          <input id="vp-vendor" maxlength="40" placeholder="e.g. Campus Grill" autocomplete="off">
        </div>

        <label for="vp-name">Item name</label>
        <input id="vp-name" maxlength="40" placeholder="e.g. Chicken Wrap" autocomplete="off">

        <label for="vp-price">Price (KES)</label>
        <input id="vp-price" type="number" min="1" step="1" inputmode="numeric" placeholder="250">

        <label for="vp-category">Category</label>
        <select id="vp-category">
          ${CATEGORIES.map(category => `<option>${category}</option>`).join("")}
        </select>

        <p id="vp-error" class="vp-error" role="alert" hidden></p>

        <div class="vp-actions">
          <button type="submit" id="vp-save">Add item</button>
          <button type="button" id="vp-cancel" hidden>Cancel editing</button>
        </div>
      </form>

      <p id="vp-message" class="vp-message" role="status"></p>`;

    main.appendChild(aside);
    panel = aside;

    field("vp-form").addEventListener("submit", handleSubmit);
    field("vp-cancel").addEventListener("click", () => resetForm());

    return aside;
  }

  function showError(text) {
    const box = field("vp-error");
    box.textContent = text;
    box.hidden = !text;
  }

  function showMessage(text) {
    const box = field("vp-message");
    box.textContent = text;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => { box.textContent = ""; }, 3500);
  }

  // Back to "add a new item" mode.
  function resetForm() {
    editingId = null;
    field("vp-name").value = "";
    field("vp-price").value = "";
    field("vp-category").selectedIndex = 0;
    field("vp-title").textContent = "Add a menu item";
    field("vp-save").textContent = "Add item";
    field("vp-cancel").hidden = true;
    field("vp-vendor-wrap").hidden = !isAdminView();
    showError("");
  }

  const isAdminView = () => {
    const user = currentUser();
    return !!user && user.role === "admin";
  };

  function handleSubmit(event) {
    event.preventDefault();
    showError("");

    const menu = window.FoodFeverMenu;
    if (!menu) {
      showError("The menu isn't ready. Refresh the page.");
      return;
    }

    const fields = {
      name: field("vp-name").value,
      price: field("vp-price").value,
      category: field("vp-category").value
    };

    const wasEditing = editingId !== null;

    const result = wasEditing
      ? menu.updateItem(editingId, fields)
      : menu.addItem({ ...fields, vendor: field("vp-vendor").value });

    if (!result.ok) {
      showError(result.error);
      return;
    }

    resetForm();
    showMessage(
      wasEditing
        ? `Saved changes to ${result.item.name}.`
        : `${result.item.name} added to the menu.`
    );
  }

  // The Edit button on a card was pressed.
  window.addEventListener("foodfever:menu-edit", event => {
    if (!panel || !window.FoodFeverMenu) return;

    const item = window.FoodFeverMenu.getItem(event.detail && event.detail.id);
    if (!item) return;

    editingId = item.id;
    field("vp-name").value = item.name;
    field("vp-price").value = item.price;
    field("vp-category").value = item.category;
    field("vp-title").textContent = "Edit menu item";
    field("vp-save").textContent = "Save changes";
    field("vp-cancel").hidden = false;
    field("vp-vendor-wrap").hidden = true;
    showError("");

    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    field("vp-name").focus({ preventScroll: true });
  });

  // If the item being edited gets deleted (or changed in another tab), leave edit mode.
  window.addEventListener("foodfever:menu-changed", () => {
    if (panel && editingId !== null && window.FoodFeverMenu && !window.FoodFeverMenu.getItem(editingId)) {
      resetForm();
    }
  });

  // Show or hide the panel depending on who is logged in.
  function sync() {
    const user = currentUser();
    const heading = document.querySelector("main section h2");

    if (isManager(user)) {
      if (!panel && !buildPanel()) return;

      field("vp-stall").textContent = user.role === "admin" ? "All stalls (admin)" : (user.stallName || "Your stall");
      field("vp-vendor-wrap").hidden = !(user.role === "admin" && editingId === null);

      if (heading) {
        if (originalHeading === null) originalHeading = heading.textContent;
        heading.textContent = user.role === "admin" ? "All menus" : "Your menu";
      }
    } else if (panel) {
      panel.remove();
      panel = null;
      editingId = null;

      if (heading && originalHeading !== null) {
        heading.textContent = originalHeading;
        originalHeading = null;
      }
    }
  }

  window.addEventListener("foodfever:auth", sync);
  sync();
})();