// Contact form: validates, then saves the message in the browser (no backend yet).
(function () {
  var form = document.getElementById("contact-form");
  var box = document.getElementById("form-msg");
  var KEY = "foodfever_messages";

  function show(text, ok) {
    box.textContent = text;
    box.className = "form-msg " + (ok ? "ok" : "err");
    box.hidden = false;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim(), email = f.email.value.trim(), message = f.message.value.trim();

    if (!name || !message) return show("Please add your name and a message.", false);
    if (!/^\S+@\S+\.\S+$/.test(email)) return show("That email address doesn't look right.", false);

    var entry = { id: "MSG-" + Date.now(), name: name, email: email, topic: f.topic.value,
                  order: f.order.value.trim(), message: message, createdAt: new Date().toISOString() };
    try {
      var all = JSON.parse(localStorage.getItem(KEY) || "[]");
      all.push(entry);
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (err) {
      return show("We couldn't save your message. Please try again.", false);
    }

    if (window.FoodFever) FoodFever.showLoader("Sending your message…");
    setTimeout(function () {
      if (window.FoodFever) FoodFever.hideLoader();
      form.reset();
      show("Thanks, " + name + ". We'll reply to " + email + " within one working day.", true);
    }, 1100);
  });
})();