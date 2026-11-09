window.FoodFeverMenu = (() => {


const menu = [
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

function renderMenu() {
  if (!menuElement) return;

  menuElement.innerHTML = "";

  const filteredMenu = menu.filter(item => {
    const matchesCategory =
      selectedCategory === "All" ||
      item.category === selectedCategory;

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery) ||
      item.vendor.toLowerCase().includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  if (filteredMenu.length === 0) {
    menuElement.textContent = "No food items found.";
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

    const button = document.createElement("button");
    button.textContent = "Add to Cart";

button.addEventListener("click", () => {
  window.FoodFeverCart.addItem(item);
});


    card.append(name, vendor, price, button);
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

  return {
    menu,
    renderMenu,
    filterCategory,
    searchFood
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
