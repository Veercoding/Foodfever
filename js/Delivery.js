/* FoodFever - Delivery animation popup */
/* Plays after a "Pay on delivery" order is placed:
   chef cooking -> rider heading to the delivery location -> order placed. */

(() => {
  const ICONS = {
    "Student Centre": "🏢",
    Hostels: "🏠",
    "Lecture Halls": "🏫",
    Library: "📚"
  };

  const COOK_MS = 3200;   // chef scene
  const RIDE_MS = 4200;   // rider scene

  const CHEF_SVG = `
    <svg class="ffd-chef" viewBox="0 0 220 170" aria-hidden="true">
      <rect x="120" y="140" width="92" height="24" rx="5" fill="#4a4a4a"/>
      <rect x="120" y="140" width="92" height="6" rx="3" fill="#5d5d5d"/>
      <g transform="translate(142 140)"><path class="ffd-flame" d="M0 0C-7-9-2-15 0-22C2-15 7-9 0 0Z" fill="#ff8a1f"/></g>
      <g transform="translate(166 140)"><path class="ffd-flame f2" d="M0 0C-7-9-2-15 0-22C2-15 7-9 0 0Z" fill="#ffb02e"/></g>
      <g transform="translate(190 140)"><path class="ffd-flame f3" d="M0 0C-7-9-2-15 0-22C2-15 7-9 0 0Z" fill="#ff8a1f"/></g>

      <g class="ffd-chefbody">
        <path d="M56 168 L60 102 Q88 90 116 102 L120 168Z" fill="#fff" stroke="#e4d9d0" stroke-width="2"/>
        <circle cx="88" cy="114" r="3.5" fill="#d62828"/>
        <circle cx="88" cy="130" r="3.5" fill="#d62828"/>
        <path d="M64 106 L52 140" stroke="#e4d9d0" stroke-width="15" stroke-linecap="round"/>
        <path d="M64 106 L52 140" stroke="#fff" stroke-width="11" stroke-linecap="round"/>
        <circle cx="88" cy="68" r="22" fill="#ffd9b3"/>
        <circle cx="80" cy="66" r="2.4" fill="#1f1a17"/>
        <circle cx="96" cy="66" r="2.4" fill="#1f1a17"/>
        <path d="M80 76 Q88 83 96 76" fill="none" stroke="#1f1a17" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="74" cy="74" r="3.5" fill="#ffb3a0" opacity=".7"/>
        <circle cx="102" cy="74" r="3.5" fill="#ffb3a0" opacity=".7"/>
        <g fill="#fff" stroke="#e4d9d0" stroke-width="2">
          <circle cx="70" cy="30" r="14"/>
          <circle cx="88" cy="22" r="16"/>
          <circle cx="106" cy="30" r="14"/>
          <rect x="64" y="38" width="50" height="14" rx="4"/>
        </g>
        <path d="M112 106 L146 122" stroke="#e4d9d0" stroke-width="15" stroke-linecap="round"/>
        <path d="M112 106 L146 122" stroke="#fff" stroke-width="11" stroke-linecap="round"/>
        <circle cx="148" cy="122" r="6" fill="#ffd9b3"/>
      </g>

      <g class="ffd-panwrap">
        <line x1="148" y1="122" x2="164" y2="122" stroke="#3b3b3b" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="184" cy="123" rx="26" ry="7" fill="#3b3b3b"/>
        <circle class="ffd-flip" cx="184" cy="113" r="9" fill="#f4a62a"/>
      </g>

      <circle class="ffd-puff" cx="172" cy="96" r="5" fill="#fff"/>
      <circle class="ffd-puff p2" cx="186" cy="96" r="7" fill="#fff"/>
      <circle class="ffd-puff p3" cx="198" cy="96" r="5" fill="#fff"/>
    </svg>`;

  const BIKE_SVG = `
    <svg viewBox="0 0 130 80" aria-hidden="true">
      <rect x="4" y="14" width="36" height="28" rx="5" fill="#d62828"/>
      <rect x="4" y="14" width="36" height="7" rx="3" fill="#b81f1f"/>
      <text x="22" y="36" font-size="12" font-weight="800" fill="#fff" text-anchor="middle" font-family="sans-serif">FF</text>
      <path d="M30 62 H60 L70 44 H90 L102 62" fill="none" stroke="#1f1a17" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M90 44 L94 28 H106" fill="none" stroke="#1f1a17" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="108" cy="29" r="3" fill="#ffd23f"/>
      <rect x="42" y="38" width="26" height="7" rx="3" fill="#2d2d2d"/>
      <path d="M52 38 L58 17" stroke="#ffb02e" stroke-width="11" stroke-linecap="round"/>
      <path d="M52 38 L66 49 L64 62" fill="none" stroke="#2f3a52" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M58 21 L82 31 L94 29" fill="none" stroke="#ffb02e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="60" cy="9" r="7" fill="#ffd9b3"/>
      <path d="M52 9 A8 8 0 0 1 68 9 Z" fill="#d62828"/>
      <g class="ffd-wheel" style="transform-origin:28px 62px">
        <circle cx="28" cy="62" r="13" fill="#fff" stroke="#1f1a17" stroke-width="5"/>
        <path d="M28 49V75M15 62H41" stroke="#1f1a17" stroke-width="2"/>
      </g>
      <g class="ffd-wheel" style="transform-origin:104px 62px">
        <circle cx="104" cy="62" r="13" fill="#fff" stroke="#1f1a17" stroke-width="5"/>
        <path d="M104 49V75M91 62H117" stroke="#1f1a17" stroke-width="2"/>
      </g>
    </svg>`;

  let dialog = null;
  let current = null;
  let timers = [];

  const $ = selector => dialog.querySelector(selector);
  const money = amount => "KES " + Number(amount).toLocaleString();

  const prefersReducedMotion = () =>
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function itemsText(order) {
    return order.items.map(item => item.qty + " × " + item.name).join(", ");
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.id = "ff-delivery";
    dialog.setAttribute("aria-labelledby", "ffd-title");

    dialog.innerHTML = `
      <div class="ffd-wrap">
        <div class="ffd-stage" aria-hidden="true">

          <div class="ffd-scene ffd-kitchen">
            ${CHEF_SVG}
          </div>

          <div class="ffd-scene ffd-ride">
            <span class="ffd-sun"></span>
            <span class="ffd-cloud c1"></span>
            <span class="ffd-cloud c2"></span>
            <div class="ffd-dest">
              <div class="ffd-destname" id="ffd-dest"></div>
              <div class="ffd-building" id="ffd-icon">📍</div>
            </div>
            <div class="ffd-bike">
              <i class="ffd-speed s1"></i><i class="ffd-speed s2"></i><i class="ffd-speed s3"></i>
              ${BIKE_SVG}
            </div>
            <div class="ffd-road"><i class="ffd-dash"></i></div>
          </div>

        </div>
        <button type="button" class="ffd-skip">Skip</button>
        <div class="ffd-bar"><i></i></div>
      </div>

      <div class="ffd-info">
        <h2 id="ffd-title" aria-live="polite"></h2>
        <p id="ffd-sub" class="ffd-sub"></p>
        <div class="ffd-actions" hidden>
          <button type="button" id="ffd-close" class="ffd-btn ffd-ghost">Close</button>
          <button type="button" id="ffd-track" class="ffd-btn ffd-primary">Track my order</button>
        </div>
      </div>`;

    document.body.appendChild(dialog);

    $(".ffd-skip").addEventListener("click", () => {
      clearTimers();
      setScene("done");
    });
    $("#ffd-close").addEventListener("click", () => dialog.close());
    $("#ffd-track").addEventListener("click", () => { window.location.href = "orders.html"; });
    dialog.addEventListener("close", clearTimers);
  }

  function setScene(name) {
    if (!dialog || !current) return;

    dialog.dataset.scene = name;

    const title = $("#ffd-title");
    const sub = $("#ffd-sub");

    if (name === "cook") {
      title.textContent = "Our chef is cooking your order…";
      sub.textContent = itemsText(current);
    } else if (name === "ride") {
      title.textContent = "Your rider is on the way!";
      sub.textContent = "Heading to " + current.location + ". Hot and fresh.";
    } else {
      title.textContent = "Order placed!";
      const email = current.customer && current.customer.email;
      sub.textContent =
        "Pay " + money(current.total) + " by M-Pesa when it arrives." +
        (email ? " We'll email " + email + " the moment it's here." : "");
    }

    $(".ffd-skip").hidden = name === "done";
    $(".ffd-actions").hidden = name !== "done";

    if (name === "done") {
      $("#ffd-track").focus();
    }
  }

  function play(order) {
    if (!order || !Array.isArray(order.items)) return;

    if (!dialog) build();
    clearTimers();
    current = order;

    $("#ffd-dest").textContent = order.location;
    $("#ffd-icon").textContent = ICONS[order.location] || "📍";

    // Restart the progress bar.
    dialog.style.setProperty("--ffd-ride", RIDE_MS + "ms");
    dialog.style.setProperty("--ffd-total", (COOK_MS + RIDE_MS) + "ms");
    const bar = $(".ffd-bar i");
    bar.style.animation = "none";
    void bar.offsetWidth;
    bar.style.animation = "";

    setScene("cook");
    if (!dialog.open) dialog.showModal();

    if (prefersReducedMotion()) {
      setScene("done");
      return;
    }

    timers.push(setTimeout(() => setScene("ride"), COOK_MS));
    timers.push(setTimeout(() => setScene("done"), COOK_MS + RIDE_MS));
  }

  // Play for pay-on-delivery orders.
  window.addEventListener("foodfever:order-created", event => {
    const order = event.detail && event.detail.order;

    if (order && order.payment && order.payment.method === "Pay on delivery") {
      play(order);
    }
  });

  // A small looping scene for an order card, based on the order's status.
  // Pending: order sent to the kitchen. Preparing: chef cooking. Ready: rider on the way.
  function liveScene(order) {
    if (!order) return null;

    const box = document.createElement("div");
    box.className = "order-live";

    const stage = document.createElement("div");
    stage.className = "ffd-live";
    stage.setAttribute("aria-hidden", "true");

    const caption = document.createElement("p");
    caption.className = "order-live-text";

    if (order.status === "Pending") {
      stage.classList.add("is-wait");
      stage.innerHTML =
        '<div class="ffd-wait"><span class="ffd-ticket">🧾</span>' +
        '<span class="ffd-dots"><i></i><i></i><i></i></span></div>';
      caption.textContent = "Order sent to the kitchen";
    } else if (order.status === "Preparing") {
      stage.classList.add("is-kitchen");
      stage.innerHTML = '<div class="ffd-scene ffd-kitchen">' + CHEF_SVG + '</div>';
      caption.textContent = "The chef is cooking your order…";
    } else if (order.status === "Ready") {
      stage.classList.add("is-ride");
      stage.innerHTML = `
        <div class="ffd-scene ffd-ride">
          <span class="ffd-sun"></span>
          <span class="ffd-cloud c1"></span>
          <span class="ffd-cloud c2"></span>
          <div class="ffd-dest">
            <div class="ffd-destname"></div>
            <div class="ffd-building">📍</div>
          </div>
          <div class="ffd-bike">
            <i class="ffd-speed s1"></i><i class="ffd-speed s2"></i><i class="ffd-speed s3"></i>
            ${BIKE_SVG}
          </div>
          <div class="ffd-road"><i class="ffd-dash"></i></div>
        </div>`;
      stage.querySelector(".ffd-destname").textContent = order.location;
      stage.querySelector(".ffd-building").textContent = ICONS[order.location] || "📍";
      caption.textContent = "Your rider is on the way to " + order.location;
    } else {
      return null;
    }

    box.append(stage, caption);
    return box;
  }

  window.FoodFeverDelivery = { play, liveScene };
})();