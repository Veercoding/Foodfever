const menu = [
  { id: 1, name: "Chips & Chicken", vendor: "Main Cafeteria", price: 350 },
  { id: 2, name: "Beef Burger", vendor: "Campus Grill", price: 400 },
  { id: 3, name: "Pilau", vendor: "Main Cafeteria", price: 250 },
  { id: 4, name: "Samosa (2)", vendor: "Snack Corner", price: 100 },
  { id: 5, name: "Fresh Juice", vendor: "Snack Corner", price: 150 },
  { id: 6, name: "Chapati & Beans", vendor: "Main Cafeteria", price: 180 }
];

let cart = [];

const menuEl = document.getElementById("menu");
const cartEl = document.getElementById("cart-items");
const totalEl = document.getElementById("total");
const messageEl = document.getElementById("message");

function renderMenu() {
  menuEl.innerHTML = "";
  menu.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.vendor}</p>
      <p>KES ${item.price}</p>
      <button onclick="addToCart(${item.id})">Add</button>
    `;
    menuEl.appendChild(card);
  });
}

function addToCart(id) {
  const item = menu.find(m => m.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...item, qty: 1 });
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
}

function renderCart() {
  cartEl.innerHTML = "";
  let total = 0;
  cart.forEach(c => {
    total += c.price * c.qty;
    const li = document.createElement("li");
    li.innerHTML = `${c.name} x${c.qty} - KES ${c.price * c.qty}
      <button onclick="removeFromCart(${c.id})">✕</button>`;
    cartEl.appendChild(li);
  });
  totalEl.textContent = total;
}

document.getElementById("order-btn").addEventListener("click", () => {
  if (cart.length === 0) {
    messageEl.textContent = "Your cart is empty.";
    return;
  }
  const location = document.getElementById("location").value;
  const order = { items: cart, location, time: new Date().toLocaleString() };
  localStorage.setItem("lastOrder", JSON.stringify(order));
  messageEl.textContent = `Order placed! Delivering to ${location}. 🚴`;
  cart = [];
  renderCart();
});

renderMenu();
renderCart();