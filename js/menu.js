window.FoodFeverMenu = (() => {
  const MENU_KEY = "foodfever_menu";
  const CATEGORIES = ["Meals", "Fast Food", "Snacks", "Drinks"];

  // The starting menu. Once a vendor changes anything, the whole menu is saved in localStorage.
  const DEFAULT_MENU = [
    { id: 1, name: "Chips & Chicken", vendor: "Main Cafeteria", price: 350, category: "Meals" },
    { id: 2, name: "Beef Burger", vendor: "Campus Grill", price: 400, category: "Fast Food" },
    { id: 3, name: "Pilau", vendor: "Main Cafeteria", price: 250, category: "Meals" },
    { id: 4, name: "Samosa (2)", vendor: "Snack Corner", price: 100, category: "Snacks" },
    { id: 5, name: "Fresh Juice", vendor: "Snack Corner", price: 150, category: "Drinks" },
    { id: 6, name: "Chapati & Beans", vendor: "Main Cafeteria", price: 180, category: "Meals" }
  ];

  const menuElement = document.getElementById("menu");

  let selectedCategory = "All";
  let searchQuery = "";

  /* ---------- who is using the page ---------- */

  const norm = text => String(text || "").trim().toLowerCase();

  function currentUser() {
    try {
      return window.FoodFeverAuth ? window.FoodFeverAuth.getCurrentUser() : null;
    } catch (error) {
      return null;
    }
  }

  // Vendors and admins manage the menu. Everyone else (students, logged out) orders.
  function isManager(user = currentUser()) {
    return !!user && (user.role === "vendor" || user.role === "admin");
  }

  // Admins can change every item. Vendors can only change items from their own stall.
  function ownsItem(item, user = currentUser()) {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.role === "vendor" && norm(item.vendor) === norm(user.stallName);
  }

  function syncRoleClass() {
    document.body.classList.toggle("is-vendor", isManager());
  }

  /* ---------- saved menu ---------- */

  function cleanItem(raw) {
    if (!raw || typeof raw !== "object") return null;

    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const vendor = typeof raw.vendor === "string" ? raw.vendor.trim() : "";
    const price = Number(raw.price);

    if (
      !Number.isInteger(raw.id) ||
      !name ||
      !vendor ||
      !Number.isFinite(price) ||
      price < 0 ||
      !CATEGORIES.includes(raw.category)
    ) {
      return null;
    }

    return { id: raw.id, name, vendor, price, category: raw.category };
  }

  function loadMenu() {
    try {
      const saved = JSON.parse(localStorage.getItem(MENU_KEY));

      if (Array.isArray(saved)) {
        return saved.map(cleanItem).filter(Boolean);
      }
    } catch (error) {
      console.warn("Could not restore the menu:", error);
    }

    return DEFAULT_MENU.map(item => ({ ...item }));
  }

  let menu = loadMenu();

  function saveMenu() {
    try {
      localStorage.setItem(MENU_KEY, JSON.stringify(menu));
      return true;
    } catch (error) {
      console.error("Could not save the menu:", error);
      return false;
    }
  }

  // Replace the menu, save it, redraw it, and tell other modules. Undoes itself if saving fails.
  function commit(nextMenu) {
    const previous = menu;
    menu = nextMenu;

    if (!saveMenu()) {
      menu = previous;
      return false;
    }

    renderMenu();
    window.dispatchEvent(new CustomEvent("foodfever:menu-changed"));
    return true;
  }

  /* ---------- add, edit, delete ---------- */

  function validateFields({ name, price, category }) {
    const cleanName = String(name || "").trim();

    if (cleanName.length < 2 || cleanName.length > 40) {
      return { error: "Enter an item name (2 to 40 characters)." };
    }

    const cleanPrice = Number(price);

    if (!Number.isInteger(cleanPrice) || cleanPrice < 1 || cleanPrice > 100000) {
      return { error: "Enter a price in whole shillings, like 250." };
    }

    if (!CATEGORIES.includes(category)) {
      return { error: "Choose a category." };
    }

    return { name: cleanName, price: cleanPrice, category };
  }

  function isDuplicate(vendor, name, ignoreId) {
    return menu.some(item =>
      item.id !== ignoreId &&
      norm(item.vendor) === norm(vendor) &&
      norm(item.name) === norm(name)
    );
  }

  const nextId = () => menu.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;

  function addItem(fields) {
    const user = currentUser();

    if (!isManager(user)) {
      return { ok: false, error: "Only vendors can add menu items." };
    }

    const checked = validateFields(fields || {});
    if (checked.error) return { ok: false, error: checked.error };

    const vendor = user.role === "admin"
      ? String((fields && fields.vendor) || "").trim()
      : String(user.stallName || "").trim();

    if (vendor.length < 2) {
      return { ok: false, error: "Enter the stall name for this item." };
    }

    if (isDuplicate(vendor, checked.name, null)) {
      return { ok: false, error: "That stall already has an item with this name." };
    }

    const item = {
      id: nextId(),
      name: checked.name,
      vendor,
      price: checked.price,
      category: checked.category
    };

    if (!commit([...menu, item])) {
      return { ok: false, error: "Could not save the item. Try again." };
    }

    return { ok: true, item: { ...item } };
  }

  function updateItem(id, fields) {
    const existing = menu.find(item => item.id === id);

    if (!existing) return { ok: false, error: "That item no longer exists." };
    if (!ownsItem(existing)) return { ok: false, error: "You can only edit items from your own stall." };

    const checked = validateFields(fields || {});
    if (checked.error) return { ok: false, error: checked.error };

    if (isDuplicate(existing.vendor, checked.name, id)) {
      return { ok: false, error: "That stall already has an item with this name." };
    }

    const updated = { ...existing, name: checked.name, price: checked.price, category: checked.category };

    if (!commit(menu.map(item => (item.id === id ? updated : item)))) {
      return { ok: false, error: "Could not save the changes. Try again." };
    }

    return { ok: true, item: { ...updated } };
  }

  function deleteItem(id) {
    const existing = menu.find(item => item.id === id);

    if (!existing) return { ok: false, error: "That item no longer exists." };
    if (!ownsItem(existing)) return { ok: false, error: "You can only delete items from your own stall." };

    if (!commit(menu.filter(item => item.id !== id))) {
      return { ok: false, error: "Could not delete the item. Try again." };
    }

    return { ok: true };
  }

  function getItem(id) {
    const item = menu.find(entry => entry.id === id);
    return item ? { ...item } : null;
  }

  /* ---------- drawing the menu ---------- */

  function renderMenu() {
    if (!menuElement) return;

    menuElement.innerHTML = "";

    const user = currentUser();
    const manager = isManager(user);

    // Vendors only see their own stall's items. Admins see everything. Students see everything.
    const visibleMenu = manager ? menu.filter(item => ownsItem(item, user)) : menu;

    const filteredMenu = visibleMenu.filter(item => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery) ||
        item.vendor.toLowerCase().includes(searchQuery);

      return matchesCategory && matchesSearch;
    });

    if (filteredMenu.length === 0) {
      menuElement.textContent = manager && visibleMenu.length === 0
        ? "You haven't added any items yet. Use the form to add your first one."
        : "No food items found.";
      return;
    }

    filteredMenu.forEach(item => {
      const card = document.createElement("div");
      card.className = "card food-card";

      const name = document.createElement("h3");
      name.textContent = item.name;

      const vendor = document.createElement("p");
      vendor.textContent = item.vendor;

      const price = document.createElement("p");
      price.className = "food-price";
      price.textContent = `KES ${item.price}`;

      if (manager) {
        // Vendors manage items. They cannot order.
        const actions = document.createElement("div");
        actions.className = "food-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "food-edit";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => {
          window.dispatchEvent(
            new CustomEvent("foodfever:menu-edit", { detail: { id: item.id } })
          );
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "food-delete";
        remove.textContent = "Delete";
        remove.addEventListener("click", () => {
          if (window.confirm(`Delete "${item.name}" from the menu?`)) {
            const result = deleteItem(item.id);
            if (!result.ok) window.alert(result.error);
          }
        });

        actions.append(edit, remove);
        card.append(name, vendor, price, actions);
      } else {
        const button = document.createElement("button");
        button.textContent = "Add to Cart";

        button.addEventListener("click", () => {
          window.FoodFeverCart.addItem(item);
        });

        card.append(name, vendor, price, button);
      }

      menuElement.appendChild(card);
    });
  }

  function filterCategory(category) {
    selectedCategory = category;
    renderMenu();
  }

  function searchFood(query) {
    searchQuery = query.toLowerCase().trim();
    renderMenu();
  }

  /* ---------- keep everything in sync ---------- */

  // Another tab changed the menu.
  window.addEventListener("storage", event => {
    if (event.key === MENU_KEY) {
      menu = loadMenu();
      renderMenu();
      window.dispatchEvent(new CustomEvent("foodfever:menu-changed"));
    }
  });

  // Someone logged in or out.
  window.addEventListener("foodfever:auth", () => {
    syncRoleClass();
    renderMenu();
  });

  syncRoleClass();

  return {
    get menu() { return menu; },
    categories: CATEGORIES,
    renderMenu,
    filterCategory,
    searchFood,
    addItem,
    updateItem,
    deleteItem,
    getItem,
    isManager,
    ownsItem
  };
})();


window.FoodFeverMenu.renderMenu();


/* FoodFever - Menu Controls */

// Search food by name or vendor
const searchInput = document.getElementById("menu-search");

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    window.FoodFeverMenu.searchFood(event.target.value);
  });
}

// Filter menu by food category
const categoryButtons = document.querySelectorAll(
  ".menu-filters button"
);

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;

    window.FoodFeverMenu.filterCategory(category);

    // Highlight selected category
    categoryButtons.forEach(btn => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
  });
});