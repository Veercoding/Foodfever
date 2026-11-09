// Reads and updates the orders saved by JJ's ordering module (js/orders.js).
const ORDERS_KEY = "foodfever_orders";
const FLOW = ["Pending", "Preparing", "Ready"];           // must match STATUSES in orders.js
const NEXT_TEXT = { Pending: "Start preparing", Preparing: "Mark ready" };

const DEMO = [
  { id: "FF-1001", createdAt: "2026-11-09T09:12:00", location: "Hostels", status: "Pending",
    items: [{ name: "Chips & Chicken", qty: 2, price: 350 }] },
  { id: "FF-1002", createdAt: "2026-11-09T09:40:00", location: "Library", status: "Preparing",
    items: [{ name: "Beef Burger", qty: 1, price: 400 }, { name: "Fresh Juice", qty: 1, price: 150 }] },
  { id: "FF-1003", createdAt: "2026-11-09T10:05:00", location: "Lecture Halls", status: "Ready",
    items: [{ name: "Pilau", qty: 3, price: 250 }] }
];

let orders = [];
let usingDemo = false;
let filter = "all";

function readStored() {
  try {
    const data = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (e) { return []; }
}

function normalise(o) {
  const items = (Array.isArray(o.items) ? o.items : []).map(it => ({
    name: String(it.name || "Item"), qty: Number(it.qty || 1), price: Number(it.price || 0)
  }));
  return {
    id: String(o.id),
    items,
    location: String(o.location || "Not given"),
    createdAt: o.createdAt || "",
    total: items.reduce((s, it) => s + it.price * it.qty, 0),
    status: FLOW.includes(o.status) ? o.status : "Pending"
  };
}

function loadOrders() {
  const stored = readStored().filter(o => o && o.id);
  const notice = document.getElementById("notice");
  usingDemo = stored.length === 0;
  if (usingDemo) {
    notice.textContent = "No customer orders yet, so these are sample orders. Orders placed on the menu page will appear here.";
    notice.hidden = false;
  } else {
    notice.hidden = true;
  }
  orders = (usingDemo ? DEMO : stored).map(normalise);
  orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function setStatus(id, status) {
  const o = orders.find(x => x.id === id);
  if (o) o.status = status;
  if (!usingDemo) {
    // Update only this order in the shared list, so the customer's tracking page sees it
    // and every other order is left exactly as it was.
    const raw = readStored();
    const target = raw.find(x => x && x.id === id);
    if (target) target.status = status;
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(raw)); } catch (e) { alert("Could not save the change."); }
  }
  render();
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function formatTime(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function renderFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = "";
  ["all", ...FLOW].forEach(key => {
    const b = el("button", "", key === "all" ? "All" : key);
    b.setAttribute("aria-pressed", String(filter === key));
    b.onclick = () => { filter = key; render(); };
    box.appendChild(b);
  });
}

function renderFigures() {
  document.getElementById("f-count").textContent = orders.length;
  document.getElementById("f-open").textContent = orders.filter(o => o.status !== "Ready").length;
  document.getElementById("f-done").textContent = orders.filter(o => o.status === "Ready").length;
  document.getElementById("f-revenue").textContent = "KES " + orders.reduce((s, o) => s + o.total, 0).toLocaleString();
}

function renderRows() {
  const body = document.getElementById("rows");
  body.innerHTML = "";
  const list = orders.filter(o => filter === "all" || o.status === filter);
  document.getElementById("empty").hidden = list.length > 0;

  list.forEach(o => {
    const tr = document.createElement("tr");

    const idTd = el("td", "", o.id);
    const t = formatTime(o.createdAt);
    if (t) idTd.appendChild(el("div", "items", t));
    tr.appendChild(idTd);

    const itemsTd = el("td");
    o.items.forEach(it => itemsTd.appendChild(el("div", "", it.qty + " × " + it.name)));
    tr.appendChild(itemsTd);

    tr.appendChild(el("td", "", o.location));
    tr.appendChild(el("td", "num", "KES " + o.total.toLocaleString()));

    const stTd = el("td");
    stTd.appendChild(el("span", "badge s-" + o.status.toLowerCase(), o.status));
    tr.appendChild(stTd);

    const actTd = el("td");
    const act = el("div", "act");
    if (NEXT_TEXT[o.status]) {
      const next = FLOW[FLOW.indexOf(o.status) + 1];
      const b = el("button", "", NEXT_TEXT[o.status]);
      b.onclick = () => setStatus(o.id, next);
      act.appendChild(b);
    }
    actTd.appendChild(act);
    tr.appendChild(actTd);

    body.appendChild(tr);
  });
}

function render() { renderFilters(); renderFigures(); renderRows(); }

// Refresh if another tab (the customer's page) changes the orders
window.addEventListener("storage", e => { if (e.key === ORDERS_KEY) { loadOrders(); render(); } });

loadOrders();
render();