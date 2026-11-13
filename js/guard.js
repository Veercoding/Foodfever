/* FoodFever - Login guard */
/* Load this FIRST in the <head> of every page that needs a logged-in user.
   Logged out? Go to the login page. Logged in? Do nothing and show the page.
   It uses the same storage keys as auth.js (Keith's module). */

(function () {
  try {
    var session = JSON.parse(localStorage.getItem("foodfever_session"));
    var users = JSON.parse(localStorage.getItem("foodfever_users")) || [];

    var loggedIn = !!session && users.some(function (user) {
      return user.id === session.userId;
    });

    if (loggedIn) {
      return;
    }
  } catch (error) {
    // Unreadable storage counts as logged out.
  }

  // Hide the page so nothing flashes before the redirect.
  document.documentElement.style.visibility = "hidden";

  var page = location.pathname.split("/").pop() || "index.html";
  location.replace("login.html?next=" + encodeURIComponent(page));
})();