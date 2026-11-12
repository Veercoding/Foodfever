// Behaviour for the navigation bar written in each page's HTML (nav.ff-nav).
(function () {
  var nav = document.querySelector("nav.ff-nav");
  if (!nav) return;
  var page = location.pathname.split("/").pop() || "index.html";

  // Highlight the page we are on
  nav.querySelectorAll(".ff-links a").forEach(function (a) {
    if ((a.getAttribute("href") || "").split("#")[0] === page) a.setAttribute("aria-current", "page");
  });

  // Menu button on phones
  var toggle = nav.querySelector(".ff-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    toggle.setAttribute("aria-expanded", String(nav.classList.toggle("open")));
  });

  // Links marked data-vendor-only appear only for vendors. The login area says "Name (vendor)".
  var auth = document.getElementById("auth-nav");
  var vendorLinks = nav.querySelectorAll("[data-vendor-only]");
  function sync() {
    var isVendor = !!auth && /vendor|admin/i.test(auth.textContent || "");
    vendorLinks.forEach(function (a) { a.hidden = !isVendor && (a.getAttribute("href") !== page); });
  }
  sync();
  if (auth) new MutationObserver(sync).observe(auth, { childList: true, subtree: true, characterData: true });
})();