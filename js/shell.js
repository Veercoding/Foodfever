// FoodFever shell: navigation bar + burger loader, shared by every page.
// Add to the <head> of each page:  <script src="js/shell.js"></script>
// If a page already has <nav class="ff-nav"> in its HTML, that nav is used as it is.
// Pages without one get a nav built here.
(function () {
  var root = document.documentElement;
  root.classList.add("ff-loading");
  var started = Date.now(), MIN_MS = 900;
  var page = location.pathname.split("/").pop() || "index.html";

  function buildLoader() {
    var l = document.createElement("div");
    l.id = "ff-loader";
    l.setAttribute("role", "status");
    l.innerHTML = '<div class="ff-stack">' +
      '<i class="bt" style="--n:5"></i><i class="le" style="--n:4"></i><i class="to" style="--n:3"></i>' +
      '<i class="ch" style="--n:2"></i><i class="pa" style="--n:1"></i><i class="bb" style="--n:0"></i></div>' +
      '<div class="ff-plate"></div><div class="ff-loadtext">Firing up the grill…</div>';
    return l;
  }

  function showLoader(msg) {
    var l = document.getElementById("ff-loader");
    if (!l) { l = buildLoader(); document.body.appendChild(l); }
    l.querySelector(".ff-loadtext").textContent = msg || "Firing up the grill…";
    l.classList.remove("hide");
  }

  function hideLoader() {
    var l = document.getElementById("ff-loader");
    if (!l) return;
    l.classList.add("hide");
    setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, 500);
  }

  var dashLink = null;

  // Used when the page already has its own <nav class="ff-nav"> in the HTML:
  // just hook up the toggle, the current-page highlight and the vendor-only link.
  function wireExistingNav(nav) {
    var toggle = nav.querySelector(".ff-toggle");
    if (toggle) {
      toggle.onclick = function () {
        var open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      };
    }

    nav.querySelectorAll(".ff-links a").forEach(function (a) {
      if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
    });

    var auth = nav.querySelector("#auth-nav");
    var dash = nav.querySelector("[data-vendor-only]");
    if (auth && dash) {
      var sync = function () {
        dash.hidden = page !== "dashboard.html" && !/vendor|admin/i.test(auth.textContent || "");
      };
      sync();
      new MutationObserver(sync).observe(auth, { childList: true, subtree: true, characterData: true });
    }
  }

  function buildNav() {
    // If the page already has its own nav, use it instead of building another one
    var existing = document.querySelector("nav.ff-nav");
    if (existing) { wireExistingNav(existing); return; }

    var nav = document.createElement("nav");
    nav.className = "ff-nav";
    nav.setAttribute("aria-label", "Main");

    var brand = document.createElement("a");
    brand.className = "ff-brand";
    brand.href = "index.html";
    brand.innerHTML = '🍔 <span>Food<b>Fever</b></span>';
    nav.appendChild(brand);

    var toggle = document.createElement("button");
    toggle.className = "ff-toggle";
    toggle.setAttribute("aria-label", "Open menu");
    toggle.textContent = "☰";
    toggle.onclick = function () { nav.classList.toggle("open"); };
    nav.appendChild(toggle);

    var links = document.createElement("div");
    links.className = "ff-links";
    [["Menu", "index.html"], ["My orders", "orders.html"], ["Dashboard", "dashboard.html"], ["Contact", "contact.html"]].forEach(function (l) {
      var a = document.createElement("a");
      a.href = l[1];
      a.textContent = l[0];
      if (l[1] === page) a.setAttribute("aria-current", "page");
      if (l[0] === "Dashboard") { dashLink = a; if (page !== "dashboard.html") a.hidden = true; }
      links.appendChild(a);
    });
    nav.appendChild(links);

    // Keep Keith's login/logout area if the page has one, otherwise show a Log in button
    var auth = document.getElementById("auth-nav");
    if (auth) {
      nav.appendChild(auth);
    } else if (page !== "login.html") {
      var a = document.createElement("a");
      a.className = "ff-login";
      a.href = "login.html";
      a.textContent = "Log in";
      nav.appendChild(a);
    }

    document.body.insertBefore(nav, document.body.firstChild);

    // Only vendors see the Dashboard link. Keith's login area shows "Name (role)".
    if (auth && dashLink && page !== "dashboard.html") {
      var sync = function () { dashLink.hidden = !/vendor|admin/i.test(auth.textContent || ""); };
      sync();
      new MutationObserver(sync).observe(auth, { childList: true, subtree: true, characterData: true });
    }
  }

  function buildFooter() {
    var f = document.createElement("footer");
    f.className = "ff-footer";
    f.innerHTML = '<div class="ff-foot-brand"><strong>Food<b>Fever</b></strong>' +
      '<p>Campus food, delivered to your hostel, lecture hall or library.</p></div>' +
      '<div class="ff-foot-links"><a href="index.html">Menu</a><a href="contact.html">Contact us</a><a href="login.html">Log in</a></div>' +
      '<small>© 2026 FoodFever · A Strathmore University student project</small>';
    document.body.appendChild(f);
  }

  function decorateHero() {
    if (document.querySelector(".auth-main")) document.body.classList.add("page-auth");
    var header = document.querySelector("body > header");
    if (!header) return;
    if (document.getElementById("menu")) {
      var sub = document.createElement("div");
      sub.className = "ff-sub";
      sub.textContent = "Order from your campus cafeterias, pay once and track every order.";
      var cta = document.createElement("a");
      cta.className = "ff-cta";
      cta.href = "#menu";
      cta.textContent = "Browse the menu";
      header.appendChild(sub);
      header.appendChild(cta);
    } else {
      document.body.classList.add("ff-compact");
    }
  }

  function init() {
    document.body.appendChild(buildLoader());
    buildNav();
    decorateHero();
    buildFooter();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  function finish() {
    var wait = Math.max(0, MIN_MS - (Date.now() - started));
    setTimeout(function () { root.classList.remove("ff-loading"); hideLoader(); }, wait);
  }
  if (document.readyState === "complete") finish();
  else window.addEventListener("load", finish);
  setTimeout(function () { root.classList.remove("ff-loading"); hideLoader(); }, 5000); // safety net

  // Other pages can call these, e.g. FoodFever.showLoader("Placing your order…")
  window.FoodFever = { showLoader: showLoader, hideLoader: hideLoader };
})();