// Extras for the menu page. Reads what menu.js and cart.js draw; never changes their data.
(function () {
  var EMOJI = [[/burger/i, "🍔"], [/chip|fries/i, "🍟"], [/chicken/i, "🍗"], [/pilau|rice|biryani/i, "🍛"], [/samosa/i, "🥟"],
               [/juice/i, "🧃"], [/chapati|chapo/i, "🫓"], [/tea|coffee/i, "☕"], [/soda|water|drink/i, "🥤"], [/pizza/i, "🍕"], [/mandazi|donut/i, "🍩"]];

  function emojiFor(text) {
    for (var i = 0; i < EMOJI.length; i++) if (EMOJI[i][0].test(text)) return EMOJI[i][1];
    return "🍽️";
  }

  // 1) A food emoji on every menu card
  function decorateCards() {
    var menu = document.getElementById("menu");
    if (!menu) return;
    Array.prototype.forEach.call(menu.children, function (card) {
      if (card.dataset.emoji) return;
      var title = card.querySelector("h1,h2,h3,h4,strong") || card;
      var badge = document.createElement("div");
      badge.className = "food-emoji";
      badge.setAttribute("aria-hidden", "true");
      badge.textContent = emojiFor(title.textContent || "");
      card.insertBefore(badge, card.firstChild);
      card.dataset.emoji = "1";
    });
  }

  // 2) A live cart total in the navigation bar
  function addCartLink() {
    var nav = document.querySelector(".ff-nav");
    var total = document.getElementById("total");
    if (!nav || !total) return;
    var link = document.createElement("a");
    link.className = "ff-cartlink";
    link.href = "#cart";
    nav.insertBefore(link, document.getElementById("auth-nav"));
    function sync() { link.textContent = "🛒 KES " + (total.textContent || "0"); }
    sync();
    new MutationObserver(sync).observe(total, { childList: true, characterData: true, subtree: true });
  }

  function init() {
    var menu = document.getElementById("menu");
    if (menu) { decorateCards(); new MutationObserver(decorateCards).observe(menu, { childList: true, subtree: true }); }
    addCartLink();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();