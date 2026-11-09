// ===== CONFIG: change these to match how your teammates save orders =====
const ORDER_KEYS = ["orders", "foodfever_orders", "lastOrder"]; // localStorage keys to look in
const STATUS_KEY = "ff_dashboard_status";                       // our own key, never touches teammates' data
// ========================================================================

const FLOW = ["pending", "preparing", "out", "delivered"];
const LABEL = { pending: "Pending", preparing: "Preparing", out: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
const NEXT_TEXT = { pending: "Start preparing", preparing: "Send out", out: "Mark delivered" };

const DEMO = [
  { id: "FF-1001", items: [{ name: "Chips & Chicken", qty: 2, price: 350 }], location: "Hostels", time: "09:12" },
  { id: "FF-1002", items: [{ name: "Beef Burger", qty: 1, price: 400 }, { name: "Fresh Juice", qty: 1, price: 150 }], location: "Library", time: "09:40" },
  { id: "FF-1003", items: [{ name: "Pilau", qty: 3, price: 250 }], location: "Lecture Halls", time: "10:05" },
  { id: "FF-1004", items: [{ name: "Samosa (2)", qty: 2, price: 100 }], location: "Student Centre", time: "10:31" }
];

let orders = [];
let statuses = read(STATUS_KEY, {});
let filter = "all";

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}

function normalise(o, i) {
  const items = Array.isArray(o.items) ? o.items : [];
  const total = o.total != null ? Number(o.total)
    : items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || it.quantity || 1), 0);
  return {
    id: String(o.id || o.orderId || "FF-" + (1001 + i)),
    items: items.map(it => ({ name: String(it.name || "Item"), qty: Number(it.qty || it.quantity || 1), price: Number(it.price || 0) })),
    location: String(o.location || o.deliveryLocation || "Not given"),
    time: String(o.time || o.createdAt || ""),
    total: total,
    status: o.status || "pending"
  };
}

function loadOrders() {
  let found = [];
  for (const key of ORDER_KEYS) {
    const data = read(key, null);
    if (Array.isArray(data)) found = found.concat(data);
    else if (data && typeof data === "object") found.push(data);
  }
  const notice = document.getElementById("notice");
  if (found.length === 0) {
    found = DEMO;
    notice.textContent = "No orders saved yet, so these are sample orders. Place an order on the menu page and it will appear here.";
    notice.hidden = false;
  } else {
    notice.hidden = true;
  }
  orders = found.map(normalise);
  orders.forEach(o => { if (statuses[o.id]) o.status = statuses[o.id]; });
}

function setStatus(id, status) {
  statuses[id] = status;
  try { localStorage.setItem(STATUS_KEY, JSON.stringify(statuses)); } catch (e) {}
  const o = orders.find(x => x.id === id);
  if (o) o.status = status;
  render();
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = "";
  [["all", "All"], ...Object.entries(LABEL)].forEach(([key, text]) => {
    const b = el("button", "", text);
    b.setAttribute("aria-pressed", String(filter === key));
    b.onclick = () => { filter = key; render(); };
    box.appendChild(b);
  });
}

function renderFigures() {
  const active = orders.filter(o => o.status !== "cancelled");
  document.getElementById("f-count").textContent = orders.length;
  document.getElementById("f-open").textContent = orders.filter(o => ["pending", "preparing", "out"].includes(o.status)).length;
  document.getElementById("f-done").textContent = orders.filter(o => o.status === "delivered").length;
  document.getElementById("f-revenue").textContent = "KES " + active.reduce((s, o) => s + o.total, 0).toLocaleString();
}

function renderRows() {
  const body = document.getElementById("rows");
  body.innerHTML = "";
  const list = orders.filter(o => filter === "all" || o.status === filter);
  document.getElementById("empty").hidden = list.length > 0;

  list.forEach(o => {
    const tr = document.createElement("tr");

    const idTd = el("td", "", o.id);
    if (o.time) idTd.appendChild(el("div", "items", o.time));
    tr.appendChild(idTd);

    const itemsTd = el("td");
    o.items.forEach(it => itemsTd.appendChild(el("div", "", it.qty + " × " + it.name)));
    tr.appendChild(itemsTd);

    tr.appendChild(el("td", "", o.location));
    tr.appendChild(el("td", "num", "KES " + o.total.toLocaleString()));

    const stTd = el("td");
    const badge = el("span", "badge s-" + o.status, LABEL[o.status] || o.status);
    stTd.appendChild(badge);
    tr.appendChild(stTd);

    const actTd = el("td");
    const act = el("div", "act");
    if (NEXT_TEXT[o.status]) {
      const next = FLOW[FLOW.indexOf(o.status) + 1];
      const b = el("button", "", NEXT_TEXT[o.status]);
      b.onclick = () => setStatus(o.id, next);
      act.appendChild(b);
      const c = el("button", "ghost", "Cancel");
      c.onclick = () => setStatus(o.id, "cancelled");
      act.appendChild(c);
    }
    actTd.appendChild(act);
    tr.appendChild(actTd);

    body.appendChild(tr);
  });
}

function render() { renderFilters(); renderFigures(); renderRows(); }

loadOrders();
render();